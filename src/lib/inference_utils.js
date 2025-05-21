import * as tf from '@tensorflow/tfjs';
import { match } from 'arktype';
import * as Jimp from 'jimp';
import * as ort from 'onnxruntime-web';

/**
 * @typedef {import('onnxruntime-web')} ort
 * @import { BB } from './inference.js';
 * @import { MetadataNeuralInference } from './database.js';
 */

/**
 *
 * @param {number[]} bb1
 * @param {number[]} bb2
 * @returns
 */
function IoU(bb1, bb2) {
	// Intersection over Union
	// bb1 et bb2 sont des bounding boxes de la forme : [x, y, w, h]
	let x1 = Math.max(bb1[0], bb2[0]);
	let y1 = Math.max(bb1[1], bb2[1]);
	let x2 = Math.min(bb1[0] + bb1[2], bb2[0] + bb2[2]);
	let y2 = Math.min(bb1[1] + bb1[3], bb2[1] + bb2[3]);

	let intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
	let union = bb1[2] * bb1[3] + bb2[2] * bb2[3] - intersection;

	return intersection / union;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test('IoU', () => {
		expect(IoU([0, 0, 10, 10], [5, 5, 10, 10])).toBe(0.14285714285714285);
		expect(IoU([0, 0, 10, 10], [15, 15, 10, 10])).toBe(0);
		expect(IoU([0, 0, 10, 10], [5, 5, 5, 5])).toBe(0.25);
	});
}

/**
 * @param {ort.Tensor} tensor
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {Promise<ort.Tensor>}
 */
export async function cropTensorUsingTFJS(tensor, x1, y1, x2, y2) {
	// Convert ONNX tensor to tf.Tensor
	// @ts-ignore
	const tfTensor = tf.tensor(tensor.data, tensor.dims);
	let w = Math.abs(x1 - x2);
	let h = Math.abs(y1 - y2);
	// Slice: [batch, channel, row, col]
	const croppedTfTensor = tf.slice(tfTensor, [0, 0, y1, x1], [1, 3, h, w]);
	const croppedData = croppedTfTensor.dataSync();
	// Create new ONNX tensor
	const croppedOnnxTensor = new ort.Tensor(tensor.type, croppedData, [1, 3, h, w]);
	tfTensor.dispose();
	croppedTfTensor.dispose();

	return croppedOnnxTensor;
}

/**
 * @param {ort.Tensor} tensor
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {Promise<ort.Tensor>}
 */
export async function cropTensor(tensor, x1, y1, x2, y2) {
	/*Crop tensor : 
    -------input------- :
        tensor : tensor à cropper 
            forme : [1, C, H, W]
        x1, y1, x2, y2 : coordonnées de la bounding box

    -------output------- :
        croppedTensor : tensor croppé
            forme : [1, C, y2-y1, x2-x1]
    */
	let data = await tensor.getData();
	let dims = tensor.dims;

	let newDims = [1, dims[1], y2 - y1, x2 - x1]; // NCHW
	let newData = new Float32Array(1 * newDims[1] * newDims[2] * newDims[3]);

	for (let x = x1; x < x2; x++) {
		for (let y = y1; y < y2; y++) {
			for (let c = 0; c < dims[1]; c++) {
				//   --- /!\ si ça marche pas, faut ptet inverser x et y---
				let i = c * dims[2] * dims[3] + y * dims[3] + x;
				let newI = c * newDims[2] * newDims[3] + (y - y1) * newDims[3] + (x - x1);
				// @ts-ignore
				newData[newI] = data[i];
			}
		}
	}
	tensor.dispose();
	return new ort.Tensor(tensor.type, newData, newDims);
}
/**
 *
 * @param {number[]} BB
 * @param {ort.Tensor} tensor
 * @param {number} marge
 * @returns {Promise<import('onnxruntime-web').Tensor>}
 */
export async function applyBBOnTensor(BB, tensor, marge = 10) {
	/*Applique une bounding box sur UN tenseur :
    -------input------- :
        BB : bounding box
            forme : [x, y, w, h]
        tensor : tensor à cropper
            forme : [1, C, H, W]
        marge : marge à ajouter autour de la bounding box
    
    -------output------- :
        croppedTensor : tenseur croppé
            forme : [1, C, h+2*marge, w+2*marge]
    */
	let [x, y, w, h] = BB;
	const [, , tsrheight, tsrwidth] = tensor.dims;

	x = x - marge;
	y = y - marge;
	w = w + 2 * marge;
	h = h + 2 * marge;

	x = Math.max(0, x);
	y = Math.max(0, y);
	w = Math.min(tsrwidth - x, w);
	h = Math.min(tsrheight - y, h);

	x = Math.round(x);
	y = Math.round(y);
	w = Math.round(w);
	h = Math.round(h);

	let croppedTensor = await cropTensorUsingTFJS(tensor, x, y, x + w, y + h);
	return croppedTensor;
}

/**
 * Apply bounding boxes on an image's tensor
 * @param {BB[]} BBs
 * @param {ort.Tensor} tensor
 * @param {number} marge
 * @returns {Promise<ort.Tensor[]>}
 */
export async function applyBBsOnTensor(BBs, tensor, marge = 10) {
	/*Applique les bounding boxes sur UN tenseur :
    -------input------- :
        BBs : liste de bounding boxes
            forme : [each bounding boxes : [x, y, w, h]]
        tensor : tensor à cropper
            forme : [1, C, H, W]
        marge : marge à ajouter autour de la bounding box
    
    -------output------- :
        croppedTensors : liste de tenseurs croppés
            forme : [1, C, h+2*marge, w+2*marge]
    */
	let croppedTensors = [];
	for (let i = 0; i < BBs.length; i++) {
		let croppedTensor = await applyBBOnTensor(BBs[i], tensor, marge);
		croppedTensors.push(croppedTensor);
	}
	return croppedTensors;
}

/**
 * Apply bounding boxes to a list of images' tensors
 * @param {BB[][]} BBs
 * @param {ort.Tensor[][]} tensors
 * @returns {Promise<ort.Tensor[][]>}
 */
export async function applyBBsOnTensors(BBs, tensors) {
	// Create an array of promises using map
	// @ts-ignore
	const croppedTensorPromises = tensors.map((tensor, i) => applyBBsOnTensor(BBs[i], tensor));

	// Wait for all promises to resolve concurrently
	let tobereturned = await Promise.all(croppedTensorPromises);
	return tobereturned;
}

/**
 * Supprime les bounding boxes qui ont un IoU > 0.5. Modifie l'entrée en place!
 * @param {number[][][]} boundingboxes - [each image [each box [x, y, w, h]]]
 * @param {number} numfiles
 * @returns {number[][][]}
 */
export function dedupeBoundingBoxes(boundingboxes, numfiles) {
	for (let fileIndex = 0; fileIndex < numfiles; fileIndex++) {
		const boxes = boundingboxes[fileIndex];

		for (let i = 0; i < boundingboxes[fileIndex].length - 1; i++) {
			for (let j = i + 1; j < boundingboxes[fileIndex].length; j++) {
				if (i != j) {
					if (IoU(boxes[i], boxes[j]) > 0.5) {
						boundingboxes[fileIndex].splice(j, 1);
						j--;
					}
				}
			}
		}
	}
	return boundingboxes;
}

if (import.meta.vitest) {
	const { test } = import.meta.vitest;
	test.todo('dedupeBoundingBoxes');
}

/**
 * Preprocesses a list of tensors for classification
 * @param {MetadataNeuralInference|undefined} params
 * @param {ort.Tensor[]} tensor
 * @param {number[]} mean
 * @param {number[]} std
 * @returns {Promise<ort.Tensor[]>}
 */
async function map_preprocess_for_classification(params, tensor, mean, std) {
	const { width, height, normalized } = params?.input ?? {
		width: 224,
		height: 224,
		normalized: true
	};

	let c = tensor;
	c = await normalizeTensors(c, mean, std, !normalized);
	c = await resizeTensors(c, width, height);

	return c;
}
/**
 *
 * @param {MetadataNeuralInference|undefined} params
 * @param {ort.Tensor} tensors
 * @param {number[]} mean
 * @param {number[]} std
 * @returns {Promise<ort.Tensor[]>}
 */
export async function preprocess_for_classification(params, tensors, mean, std) {
	/*preprocess les tenseurs pour la classification
    -------input------- :
        tensors : liste de tenseurs à prétraiter
            forme : [each img [1, C, H, W]]
        mean : liste des moyennes pour chaque canal
        std : liste des écarts-types pour chaque canal

    -------output------- :
        new_ctensors : liste de tenseurs prétraités
            forme : [each img [1, C, 224, 224]]

    les tenseurs sont resized au format [3,224,224] et normalisés
    */
	// @ts-ignore
	let new_ctensorsPromise = tensors.map((tensor) =>
		map_preprocess_for_classification(params, tensor, mean, std)
	);
	let new_ctensors = await Promise.all(new_ctensorsPromise);

	return new_ctensors;
}

/**
 *
 * @param {number[][][]} output
 * @param {string[]} classmap
 * @returns {[string[][], number[][]]}
 */
export function labelize(output, classmap) {
	// à partir de la sortie du inference/classif, renvoie les labels des classes
	let labels_inter = [];
	console.log('output : ', output);
	for (let i = 0; i < output[0].length; i++) {
		let l = [];
		for (let j = 0; j < output[0][i].length; j++) {
			let index = output[0][i][j];
			console.log('index : ', index);
			l.push(classmap[index]);
		}
		labels_inter.push(l);
	}
	return [labels_inter, output[1]];
}
/**
 *
 * @param {ArrayBuffer[]} buffers
 * @param {object} settings
 * @param {number} settings.height
 * @param {number} settings.width
 * @param {boolean} [settings.normalized] normalize pixel channel values to [0, 1] instead of [0, 255]
 * @returns {Promise<import('onnxruntime-web').TypedTensor<'float32'>>}
 */
export async function imload(buffers, { width: targetWidth, height: targetHeight, normalized }) {
	/*
    charge les images et les resize
    -------input------- :
        files : liste de fichiers
        targetWidth : largeur cible
        targetHeight : hauteur cible
    
    -------output------- :
        tensor : tenseur contenant les images
            forme : [files.length, 3, targetHeight, targetWidth]
    */

	var float32Data = new Float32Array(targetHeight * targetWidth * 3 * buffers.length);
	for (let f = 0; f < buffers.length; f++) {
		let buffer = buffers[f];

		var img_tensor = await Jimp.Jimp.read(buffer);
		img_tensor.resize({ w: targetWidth, h: targetHeight });

		var imageBufferData = img_tensor.bitmap.data;

		const [redArray, greenArray, blueArray] = new Array(new Array(), new Array(), new Array());
		for (let i = 0; i < imageBufferData.length; i += 4) {
			redArray.push(imageBufferData[i]);
			greenArray.push(imageBufferData[i + 1]);
			blueArray.push(imageBufferData[i + 2]);
		}

		const transposedData = redArray.concat(greenArray).concat(blueArray);
		let i,
			l = transposedData.length;

		if (normalized) {
			for (i = 0; i < l; i++) {
				float32Data[f * l + i] = transposedData[i] / 255.0; // convert to float
			}
		}
	}

	console.log('done !');
	var tensor = new ort.Tensor('float32', float32Data, [
		buffers.length,
		3,
		targetHeight,
		targetWidth
	]);
	float32Data = new Float32Array(0);
	return tensor;
}
/**
 *
 * @param {ort.Tensor} tensor
 * @param {number[]} mean
 * @param {number[]} std
 * @param {boolean} [denormalize=false] denormalize the pixel values from [0, 1] to [0, 255]
 * @returns {Promise<ort.Tensor>}
 */
export async function normalizeTensor(tensor, mean, std, denormalize = false) {
	const data = await tensor.getData();
	const dims = tensor.dims;

	for (let x = 0; x < dims[2]; x++) {
		for (let y = 0; y < dims[3]; y++) {
			for (let c = 0; c < dims[1]; c++) {
				let i = c * dims[2] * dims[3] + x * dims[3] + y;
				// @ts-ignore
				data[i] = (data[i] - mean[c]) / std[c];
				if (denormalize) {
					// @ts-ignore
					data[i] = Math.min(data[i] * 255, 255);
				}
			}
		}
	}
	const newTensor = new ort.Tensor(tensor.type, data, dims);
	tensor.dispose();
	return newTensor;
}
/**
 *
 * @param {ort.Tensor[]} tensors
 * @param {number[]} mean
 * @param {number[]} std
 * @param {boolean} [denormalize=false] denormalize the pixel values from [0, 1] to [0, 255]
 * @returns {Promise<ort.Tensor[]>}
 */
export async function normalizeTensors(tensors, mean, std, denormalize = false) {
	let newTensors = [];
	for (let i = 0; i < tensors.length; i++) {
		let newtsr = await normalizeTensor(tensors[i], mean, std, denormalize);
		newTensors.push(newtsr);
	}

	for (let i = 0; i < tensors.length; i++) {
		tensors[i].dispose();
	}

	return newTensors;
}

/**
 *
 * @param {import('./database.js').Protocol} protocol
 * @param {Float32Array} output
 * @param {number} numImages
 * @param {number} minConfidence
 * @returns {[import('./inference.js').BB[][], number[][]]}
 */
export function output2BB(protocol, output, numImages, minConfidence) {
	/*reshape les bounding boxes obtenues par le modèle d'inférence
    -------input------- :
        output : liste de bounding boxes obtenues par le modèle d'inférence
        numfiles : nombre d'images sur lesquelles on a fait l'inférence*
        minConfidence : seuil de confiance minimum pour considérer une bounding box
        nms : booléen, si True, alors on applique le fait que la sortie d'un modèle 
            ultralytics avec des nms est différente que quand yen a pas
            

    -------output------- :
        bestBoxes : liste de bounding boxes après suppression des doublons
            forme : [each img [each box [x, y, w, h]]]
        bestScore : liste des meilleurs scores pour chaque image
            forme : [each img [each box score]]
    */
	/** @type {import('./inference.js').BB[][]}  */
	let bestBoxes = [];
	/** @type {number[][]}  */
	let bestScores = [];

	console.log(output);

	const outputShape = protocol.crop?.infer.output?.shape ?? ['sx', 'sy', 'w', 'h', 'score', '_'];

	const suboutputSize = outputShape.length;
	let boundingBoxesCount = output.length / suboutputSize;

	for (let k = 0; k < numImages; k++) {
		/** @type {import('./inference.js').BB[]}  */
		let bestPerImageBoxes = [];
		/** @type {number[]} */
		let bbScores = [];

		let suboutput = output.slice(
			k * boundingBoxesCount * suboutputSize,
			(k + 1) * boundingBoxesCount * suboutputSize
		);

		for (let i = 0; i < suboutput.length; i += suboutputSize) {
			/**
			 * Get a data point ("atom") for this bounding box for this model.
			 * If the protocol's inference detection output shape does not include the atom, return undefined.
			 * Otherwise, grab the data point from the suboutput using the index of the atom in the output shape.
			 * For example, if the output shape is `['sx', '_', '_', 'sy']`, we can get the 'sy' atom using `suboutput[i + 3]`.
			 * @param {import('./database').ModelDetectionOutputShape[number]} atom
			 */
			const atom = (atom) =>
				outputShape.includes(atom) ? suboutput[i + outputShape.indexOf(atom)] : undefined;

			// All possible data points ("atoms") for this bounding box
			const atoms = {
				sx: atom('sx'),
				sy: atom('sy'),
				ex: atom('ex'),
				ey: atom('ey'),
				cx: atom('cx'),
				cy: atom('cy'),
				w: atom('w'),
				h: atom('h'),
				score: atom('score')
			};

			// Get center point x coord and width
			const [x, w] = match
				.case({ cx: 'number', ex: 'number' }, ({ cx, ex }) => [cx, 2 * (ex - cx)])
				.case({ cx: 'number', sx: 'number' }, ({ sx, cx }) => [cx, 2 * (cx - sx)])
				.case({ cx: 'number', w: 'number' }, ({ cx, w }) => [cx, w])
				.case({ ex: 'number', sx: 'number' }, ({ sx, ex }) => [(sx + ex) / 2, ex - sx])
				.case({ ex: 'number', w: 'number' }, ({ ex, w }) => [ex - w / 2, w])
				.case({ sx: 'number', w: 'number' }, ({ sx, w }) => [sx + w / 2, w])
				.default(() => {
					throw new Error(
						`Could not get center point x coord and width. Check your protocol's inference.detection.output.shape. Available atoms: ${JSON.stringify(atoms)}`
					);
				})(atoms);

			const [y, h] = match
				.case({ cy: 'number', ey: 'number' }, ({ cy, ey }) => [cy, 2 * (ey - cy)])
				.case({ cy: 'number', sy: 'number' }, ({ sy, cy }) => [cy, 2 * (cy - sy)])
				.case({ cy: 'number', h: 'number' }, ({ cy, h }) => [cy, h])
				.case({ ey: 'number', sy: 'number' }, ({ sy, ey }) => [(sy + ey) / 2, ey - sy])
				.case({ ey: 'number', h: 'number' }, ({ ey, h }) => [ey - h / 2, h])
				.case({ sy: 'number', h: 'number' }, ({ sy, h }) => [sy + h / 2, h])
				.default(() => {
					throw new Error(
						`Could not get center point y coord and height. Check your protocol's inference.detection.output.shape. Available atoms: ${JSON.stringify(atoms)}`
					);
				})(atoms);

			if (x == 0 && y == 0 && w == 0 && h == 0) {
				break;
			}

			if (atoms.score === undefined) {
				throw new Error(
					"Could not get score. Check your protocol's inference.detection.output.shape."
				);
			}

			if (atoms.score > minConfidence) {
				bestPerImageBoxes.push([x, y, w, h]);
				bbScores.push(atoms.score);
			}
		}

		bestBoxes.push(bestPerImageBoxes);
		bestScores.push(bbScores);
	}
	return [bestBoxes, bestScores];
}
/**
 *
 * @param {ort.Tensor[]} tensors
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @returns {Promise<ort.Tensor[]>}
 */
export async function resizeTensors(tensors, targetWidth, targetHeight) {
	let resizedTensors = [];
	for (let i = 0; i < tensors.length; i++) {
		let resizedTensor = await resizeTensor(tensors[i], targetWidth, targetHeight);
		resizedTensors.push(resizedTensor);
	}

	return resizedTensors;
}
/**
 *
 * @param {ort.Tensor} tensor
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @returns {Promise<ort.Tensor>}
 */
async function resizeTensor(tensor, targetWidth, targetHeight) {
	// resize using nearest neighbor interpolation
	const data = await tensor.getData();
	const dims = tensor.dims;

	const resizedData = new Float32Array(targetHeight * targetWidth * 3);
	const resizedDims = [1, 3, targetHeight, targetWidth];

	const widthRatio = dims[3] / targetWidth;
	const heightRatio = dims[2] / targetHeight;

	for (let x = 0; x < targetWidth; x++) {
		for (let y = 0; y < targetHeight; y++) {
			for (let c = 0; c < 3; c++) {
				const i = c * targetHeight * targetWidth + y * targetWidth + x;

				const j =
					c * dims[2] * dims[3] +
					Math.floor(y * heightRatio) * dims[3] +
					Math.floor(x * widthRatio);
				// @ts-ignore
				resizedData[i] = data[j];
			}
		}
	}

	const resizedTensor = new ort.Tensor(tensor.type, resizedData, resizedDims);
	return resizedTensor;
}
