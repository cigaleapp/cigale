/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { openDB } from 'idb';
import * as Swarp from 'swarpc';
import { classify, infer, loadModel } from './lib/inference.js';
import { imload as imload } from './lib/inference_utils.js';
import { PROCEDURES } from './neural-worker-procedures.js';

const ww = /** @type {Worker} */ (/** @type {unknown} */ self);

/**
 * @type {import('idb').IDBPDatabase<import('./lib/idb.svelte.js').IDBDatabaseType> | undefined}
 */
let db;

async function openDatabase() {
	if (db) return db;
	db = await openDB('database', 3);
}

const swarp = Swarp.Server(PROCEDURES, { worker: ww });

/**
 * @type {Map<string, { onnx: import('onnxruntime-web').InferenceSession, id: string }>}
 */
let inferenceSessions = new Map();

/**$
 * @param {string} protocolId
 * @param {import('./lib/database.js').HTTPRequest} request
 * @returns {string}
 */
function inferenceModelId(protocolId, request) {
	if (typeof request === 'string') return request;

	return [
		protocolId,
		request.method,
		request.url,
		Object.entries(request.headers)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${k}:${v}`)
	].join('|');
}

swarp.loadModel(async ({ task, request, protocolId, webgpu }, onProgress) => {
	const id = inferenceModelId(protocolId, request);
	if (inferenceSessions.has(task) && inferenceSessions.get(task).id === id) {
		console.log(`Model ${task} already loaded with ID ${id}`);
		return true; // Model is already loaded
	}

	console.log(`Loading model for task ${task} with ID ${id}`);
	const session = await loadModel(request, onProgress, webgpu);
	console.log(`Model ${task} loaded successfully with ID ${id}`);
	inferenceSessions.set(task, { onnx: session, id });
	return true;
});

swarp.isModelLoaded((task) => inferenceSessions.has(task));

swarp.inferBoundingBoxes(async ({ fileId, taskSettings }) => {
	const session = inferenceSessions.get('detection')?.onnx;
	if (!session) {
		throw new Error('Modèle de détection non chargé');
	}

	await openDatabase();
	const file = await db.get('ImageFile', fileId);
	if (!file) {
		throw new Error(`Fichier avec l'ID ${fileId} non trouvé`);
	}

	const [[boxes], [scores]] = await infer(taskSettings, [file.bytes], session);

	return { boxes, scores };
});

swarp.classify(async ({ fileId, cropbox, taskSettings, returnImageUsed }) => {
	const session = inferenceSessions.get('classification')?.onnx;
	if (!session) {
		throw new Error('Modèle de classification non chargé');
	}

	await openDatabase();
	const file = await db.get('ImageFile', fileId);
	if (!file) {
		throw new Error(`Fichier avec l'ID ${fileId} non trouvé`);
	}

	console.log('Classifying file', fileId, 'with cropbox', cropbox);

	// We gotta normalize since this img will be used to set a cropped Preview URL -- classify() itself takes care of normalizing (or not) depending on the protocol
	const img = await imload([file.bytes], {
		...taskSettings.input,
		normalized: true,
		crop: cropbox
	}).catch((err) => {
		throw new Error(`Failed to load image for classification: ${err.message}`);
	});

	/**
	 * @type {ImageBitmap | undefined}
	 */
	let imageUsed;

	if (returnImageUsed) {
		console.log('Image after applying cropbox', img);
		imageUsed = await createImageBitmap(img.toImageData());
	}

	const [[scores]] = await classify(taskSettings, [[img]], session).catch((err) => {
		throw new Error(`Failed to classify image: ${err.message}`);
	});

	return imageUsed ? { scores, imageUsed } : { scores };
});

swarp.start(ww);
