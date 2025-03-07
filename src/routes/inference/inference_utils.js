import * as ort from 'onnxruntime-web';
import * as Jimp from 'jimp';
import * as tf from '@tensorflow/tfjs';

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
 * @returns {Promise<ort.Tensor>}
 */
async function applyBBOnTensor(BB, tensor, marge = 10) {
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
	let x = BB[0];
	let y = BB[1];
	let w = BB[2];
	let h = BB[3];

	let tsrwidth = tensor.dims[3];
	let tsrheight = tensor.dims[2];

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
 *
 * @param {number[][]} BBs
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
 *
 * @param {number[][][]} BBs
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
 *
 * @param {number[][][]} boundingboxes
 * @param {number} numfiles
 * @returns {number[][][]}
 */
export function postprocess_BB(boundingboxes, numfiles) {
	/*supprime les bounding boxes qui ont un IoU > 0.5
    -------input------- :
        boundingboxes : liste de bounding boxes
            forme : [each img [each box [x, y, w, h]]]
        numfiles : nombre d'images sur lesquelles on a fait l'inférence
    
    -------output------- :
        boundingboxes : liste de bounding boxes après suppression des doublons
            forme : [each img [each box [x, y, w, h]]]

    */

	for (let k = 0; k < numfiles; k++) {
		for (let i = 0; i < boundingboxes[k].length - 1; i++) {
			let x1 = boundingboxes[k][i][0];
			let y1 = boundingboxes[k][i][1];
			let w = boundingboxes[k][i][2];
			let h = boundingboxes[k][i][3];

			for (let j = i + 1; j < boundingboxes[k].length; j++) {
				if (i != j) {
					let x2 = boundingboxes[k][j][0];
					let y2 = boundingboxes[k][j][1];
					let w2 = boundingboxes[k][j][2];
					let h2 = boundingboxes[k][j][3];

					if (IoU([x1, y1, w, h], [x2, y2, w2, h2]) > 0.5) {
						boundingboxes[k].splice(j, 1);
						j--;
					}
				}
			}
		}
	}
	return boundingboxes;
}

/**
 *
 * @param {ort.Tensor[]} tensor
 * @param {number[]} mean
 * @param {number[]} std
 * @returns {Promise<ort.Tensor[]>}
 */
async function map_preprocess_for_classification(tensor, mean, std) {
	let c = tensor;
	c = await normalizeTensors(c, mean, std);
	c = await resizeTensors(c, 224, 224);

	return c;
}
/**
 *
 * @param {ort.Tensor} tensors
 * @param {number[]} mean
 * @param {number[]} std
 * @returns {Promise<ort.Tensor[]>}
 */
export async function preprocess_for_classification(tensors, mean, std) {
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
		map_preprocess_for_classification(tensor, mean, std)
	);
	let new_ctensors = await Promise.all(new_ctensorsPromise);

	return new_ctensors;
}
/**
 *
 * @param {string} classmapping
 * @returns {Promise<string[]>}
 */
export async function loadClassMapping(classmapping) {
	// charge le fichier de mapping des classes (nom des classes)
	const response = await fetch(classmapping);
	const text = await response.text();
	let classmap = text.split('\n');
	return classmap;
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
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @returns {Promise<ort.Tensor>}
 */
export async function imload(buffers, targetWidth, targetHeight) {
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

		for (i = 0; i < l; i++) {
			float32Data[f * l + i] = transposedData[i] / 255.0; // convert to float
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
 * @returns {Promise<ort.Tensor>}
 */
export async function normalizeTensor(tensor, mean, std) {
	const data = await tensor.getData();
	const dims = tensor.dims;

	for (let x = 0; x < dims[2]; x++) {
		for (let y = 0; y < dims[3]; y++) {
			for (let c = 0; c < dims[1]; c++) {
				let i = c * dims[2] * dims[3] + x * dims[3] + y;
				// @ts-ignore
				data[i] = (data[i] - mean[c]) / std[c];
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
 * @returns {Promise<ort.Tensor[]>}
 */
export async function normalizeTensors(tensors, mean, std) {
	let newTensors = [];
	for (let i = 0; i < tensors.length; i++) {
		let newtsr = await normalizeTensor(tensors[i], mean, std);
		newTensors.push(newtsr);
	}

	for (let i = 0; i < tensors.length; i++) {
		tensors[i].dispose();
	}

	return newTensors;
}

/**
 *
 * @param {ort.Tensor} output
 * @param {number} numImages
 * @param {number} minConfidence
 * @param {boolean} nms
 * @returns {[number[][][], number[][]]}
 */
export function output2BB(output, numImages, minConfidence, nms = false) {
	/*reshape les bounding boxes obtenues par le modèle d'inférence
    -------input------- :
        output : liste de bounding boxes obtenues par le modèle d'inférence
            forme : [xxxx,yyyyy,wwww,hhhh,confconfconf,etc...] (se répète pr chaque img) si nms = False
            forme : [xywhconf,iou,xywhconf,iou,...] si nms = True
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
	if (nms) {
		let bestBoxes = [];
		let bestScores = [];
		// @ts-ignore
		let numbb = output.length / 6;
		let bestPerImageBoxes = [];
		let bestScorePerImage = 0;
		let suboutput = null;

		console.log('num images : ', numImages);

		for (let k = 0; k < numImages; k++) {
			bestPerImageBoxes = [];
			bestScorePerImage = 0;
			/** @type {number[]} */
			let bbScores = [];
			// @ts-ignore
			suboutput = output.slice(k * numbb * 6, (k + 1) * numbb * 6);

			for (let i = 0; i < suboutput.length; i += 6) {
				let score = suboutput[i + 4];
				let x = suboutput[i];
				let y = suboutput[i + 1];
				let w = suboutput[i + 2];
				let h = suboutput[i + 3];

				w = Math.abs(x - w);
				h = Math.abs(y - h);

				if (x == 0 && y == 0 && w == 0 && h == 0) {
					break;
				}
				// if (score > bestScorePerImage) {
				// 	bestScorePerImage = score;
				// }
				if (score > minConfidence) {
					bestPerImageBoxes.push([x, y, w, h]);
					bbScores.push(score);
				}
			}

			bestBoxes.push(bestPerImageBoxes);
			bestScores.push(bbScores);
		}
		return [bestBoxes, bestScores];
	} else {
		console.log('output : ', output);
		let bestBoxes = [];
		let bestPerImageBoxes = [];
		let bestScore = [];
		let bestScorePerImage = 0;
		let suboutput = null;
		// @ts-ignore
		let numbb = output.length / numImages / 5;

		for (let k = 0; k < numImages; k++) {
			bestPerImageBoxes = [];
			/** @type {number[]} */
			let bbScores = [];
			// @ts-ignore
			suboutput = output.slice(k * numbb * 5, (k + 1) * numbb * 5);

			for (let i = 0; i < suboutput.length / 5; i++) {
				let score = suboutput[i + 4 * numbb];
				if (score > bestScorePerImage) {
					bestScorePerImage = score;
				}

				if (score > minConfidence) {
					let x = suboutput[i];
					let y = suboutput[i + numbb];
					let w = suboutput[i + 2 * numbb];
					let h = suboutput[i + 3 * numbb];

					x = x - w / 2;
					y = y - h / 2;

					bestPerImageBoxes.push([x, y, w, h]);
					bbScores.push(score);
				}
			}
			bestBoxes.push(bestPerImageBoxes);
			bestScore.push(bbScores);
		}
		return [bestBoxes, bestScore];
	}
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

/**
 *
 * @param {number[][]} BBs
 * @param {Image} image
 * @param {number} marge
 * @returns {Promise<[string[], Image[]]>}
 */
async function applyBBsOnImage(BBs, image, marge = 10) {
	/*Même chose que applyBBsOnTensor mais pour une image, en vrai c'est deprecated, on l'utilise plus*/

	console.warn('applyBBsOnImage is deprecated, use applyBBsOnTensors instead');

	let subimages = [];
	let subimageMIMES = [];
	for (let i = 0; i < BBs.length; i++) {
		let x = BBs[i][0];
		let y = BBs[i][1];
		let w = BBs[i][2];
		let h = BBs[i][3];

		// relative bbs*
		/** @type {{width: number, height: number}} */
		// @ts-ignore
		const { width, height } = image.bitmap;
		x = (x / 640) * width;
		y = (y / 640) * height;
		w = (w / 640) * width;
		h = (h / 640) * height;
		x = x - marge;
		y = y - marge;
		w = w + 2 * marge;
		h = h + 2 * marge;

		x = Math.round(Math.max(0, x));
		y = Math.round(Math.max(0, y));
		w = Math.round(Math.min(width - x, w));
		h = Math.round(Math.min(height - y, h));

		// @ts-ignore
		let subimage = image.clone();
		subimage = subimage.crop({ x, y, w, h });
		let subimageMIME = await subimage.getBase64(Jimp.JimpMime.png);
		subimages.push(subimage);
		subimageMIMES.push(subimageMIME);
	}
	return [subimageMIMES, subimages];
}

/**
 *
 * @param {number[][][]} BBs
 * @param {Image[]} images
 * @returns {Promise<[string[], Image[]]>}
 */
export async function applyBBsOnImages(BBs, images) {
	let croppedImages = [];
	let croppedImagesMIME = [];
	let subImages = [];

	for (let i = 0; i < images.length; i++) {
		subImages = await applyBBsOnImage(BBs[i], images[i]);
		croppedImages.push(subImages[1]);
		croppedImagesMIME.push(subImages[0]);
	}
	//return [croppedImagesMIME,croppedImages];
	// @ts-ignore
	return [croppedImagesMIME];
}
