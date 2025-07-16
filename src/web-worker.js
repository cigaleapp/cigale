/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { openDB } from 'idb';
import * as Swarp from 'swarpc';
import { classify, infer, loadModel } from '$lib/inference.js';
import { loadToTensor } from '$lib/inference_utils.js';
import { PROCEDURES } from './web-worker-procedures.js';
import { importProtocol } from '$lib/protocols.js';

const ww = /** @type {Worker} */ (/** @type {unknown} */ self);

/**
 * @type {import('idb').IDBPDatabase<import('./lib/idb.svelte.js').IDBDatabaseType> | undefined}
 */
let db;

/** @type {undefined | { name: string , revision: number }} */
let databaseParams;

async function openDatabase() {
	if (!databaseParams) {
		throw new Error('Database parameters not set, call swarp.init() first');
	}
	if (db) return db;
	db = await openDB(databaseParams.name, databaseParams.revision);
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

swarp.init(async ({ databaseName, databaseRevision }) => {
	databaseParams = { name: databaseName, revision: databaseRevision };
});

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

swarp.classify(async ({ fileId, cropbox, taskSettings }) => {
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
	const img = await loadToTensor([file.bytes], {
		...taskSettings.input,
		normalized: true,
		crop: cropbox
	});

	const scores = await classify(taskSettings, img, session);

	return { scores };
});

swarp.importProtocol(async ({ contents, isJSON }, onProgress) => {
	const { id, name, version } = await importProtocol(contents, {
		json: isJSON,
		onLoadingState(phase, detail) {
			onProgress(detail ? { phase, detail } : { phase });
		},
		/** @type {typeof import('$lib/idb.svelte.js').openTransaction} */
		async openTransaction(tableNames, { mode = 'readwrite' }, actions) {
			await openDatabase();
			if (!db) throw new Error('Database not initialized');
			console.log('loading transaction', tableNames, mode);
			const tx = db.transaction(tableNames, mode);
			await actions(tx);
			tx.commit();
		}
	});

	return { id, name, version };
});

swarp.start(ww);
