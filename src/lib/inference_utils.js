import { match } from 'arktype';
import { Jimp } from 'jimp';
import * as ort from 'onnxruntime-web';

import { coordsScaler, toTopLeftCoords } from './BoundingBoxes.svelte.js';

/**
 * @satisfies {import('@jimp/js-jpeg').DecodeJpegOptions}
 */
export const imageLimits = /** @type {const} */ ({
	maxMemoryUsageInMB: 1024,
	maxResolutionInMP: 100
});

/**
 * @typedef {import('onnxruntime-web')} ort
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
 *
 * @param {import('$lib/schemas/neural.js').NeuralInference} settings
 * @param {ort.Tensor} tensor
 * @param {number[]} mean
 * @param {number[]} std
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<ort.Tensor>}
 */
export async function preprocessTensor(settings, tensor, mean, std, abortSignal) {
	const { width, height, normalized } = settings.input;
	let c = tensor;
	c = await normalizeTensor(c, mean, std, !normalized, abortSignal);
	c = await resizeTensor(c, width, height, abortSignal);

	return c;
}

/**
 * _If you need to get back the actual image the model ran on, see commit 682e3fb8849ac3f96005f71a486eefa3c932753a_
 * @param {ArrayBuffer[]} buffers
 * @param {object} settings
 * @param {number} settings.height
 * @param {number} settings.width
 * @param {import('./BoundingBoxes.svelte.js').CenteredBoundingBox} [settings.crop]
 * @param {boolean} [settings.normalized] normalize pixel channel values to [0, 1] instead of [0, 255]
 * @param {AbortSignal} [settings.abortSignal] signal to abort the operation
 * @returns {Promise<import('onnxruntime-web').TypedTensor<'float32'>>}
 */
export async function loadToTensor(
	buffers,
	{ width: targetWidth, height: targetHeight, crop, normalized, abortSignal }
) {
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
		abortSignal?.throwIfAborted();

		let buffer = buffers[f];

		const imageTensor = await Jimp.fromBuffer(buffer, {
			'image/jpeg': imageLimits
		});

		if (crop) {
			const scaler = coordsScaler({ x: imageTensor.width, y: imageTensor.height });
			const { x, y, height: h, width: w } = toTopLeftCoords(scaler(crop));
			abortSignal?.throwIfAborted();
			imageTensor.crop({ x, y, w, h });
		}

		abortSignal?.throwIfAborted();
		imageTensor.resize({ w: targetWidth, h: targetHeight });

		var imageBufferData = imageTensor.bitmap.data;

		const [redArray, greenArray, blueArray] = new Array(new Array(), new Array(), new Array());
		for (let i = 0; i < imageBufferData.length; i += 4) {
			abortSignal?.throwIfAborted();
			redArray.push(imageBufferData[i]);
			greenArray.push(imageBufferData[i + 1]);
			blueArray.push(imageBufferData[i + 2]);
		}

		const transposedData = redArray.concat(greenArray).concat(blueArray);
		let i,
			l = transposedData.length;

		if (normalized) {
			for (i = 0; i < l; i++) {
				abortSignal?.throwIfAborted();
				float32Data[f * l + i] = transposedData[i] / 255.0; // convert to float
			}
		}
	}

	abortSignal?.throwIfAborted();
	var tensor = new ort.Tensor('float32', float32Data, [
		buffers.length,
		3,
		targetHeight,
		targetWidth
	]);

	return tensor;
}
/**
 *
 * @param {ort.Tensor} tensor
 * @param {number[]} mean
 * @param {number[]} std
 * @param {boolean} [denormalize=false] denormalize the pixel values from [0, 1] to [0, 255]
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<ort.Tensor>}
 */
async function normalizeTensor(tensor, mean, std, denormalize = false, abortSignal) {
	abortSignal?.throwIfAborted();
	const data = await tensor.getData();
	const dims = tensor.dims;

	for (let x = 0; x < dims[2]; x++) {
		for (let y = 0; y < dims[3]; y++) {
			for (let c = 0; c < dims[1]; c++) {
				abortSignal?.throwIfAborted();
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

	abortSignal?.throwIfAborted();
	const newTensor = new ort.Tensor(tensor.type, data, dims);
	tensor.dispose();

	return newTensor;
}

/**
 *
 * @param {import('./database.js').ModelDetectionOutputShape} outputShape
 * @param {Float32Array} output
 * @param {number} numImages
 * @param {number} minConfidence
 * @param {AbortSignal} [abortSignal]
 * @returns {[import('./inference.js').BB[][], number[][]]}
 */
export function output2BB(outputShape, output, numImages, minConfidence, abortSignal) {
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
			abortSignal?.throwIfAborted();
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
 * @param {ort.Tensor} tensor
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<ort.Tensor>}
 */
async function resizeTensor(tensor, targetWidth, targetHeight, abortSignal) {
	// resize using nearest neighbor interpolation
	abortSignal?.throwIfAborted();
	const data = await tensor.getData();
	const dims = tensor.dims;

	const resizedData = new Float32Array(targetHeight * targetWidth * 3);
	const resizedDims = [1, 3, targetHeight, targetWidth];

	const widthRatio = dims[3] / targetWidth;
	const heightRatio = dims[2] / targetHeight;

	for (let x = 0; x < targetWidth; x++) {
		for (let y = 0; y < targetHeight; y++) {
			for (let c = 0; c < 3; c++) {
				abortSignal?.throwIfAborted();

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

	abortSignal?.throwIfAborted();
	const resizedTensor = new ort.Tensor(tensor.type, resizedData, resizedDims);
	return resizedTensor;
}
