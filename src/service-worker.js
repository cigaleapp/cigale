/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';
import * as Swarp from 'swarpc';
import { classify, infer, loadModel } from './lib/inference.js';
import { applyBBOnTensor, imload } from './lib/inference_utils.js';
import { PROCEDURES } from './lib/service-worker-procedures.js';
import { openDB } from 'idb';

/**
 * @type {import('idb').IDBPDatabase<import('./lib/idb.svelte.js').IDBDatabaseType> | undefined}
 */
let db;

async function openDatabase() {
	if (db) return db;
	db = await openDB('database', 3);
}

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;
// Models are cached independently of the version
const MODELS_CACHE = `cache-models`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

const swarp = Swarp.Server(PROCEDURES);

/**
 * @type {Map<string, { onnx: import('onnxruntime-web').InferenceSession, id: string }>}
 */
let inferenceSessions = new Map();

/**$
 * @param {import('./lib/database.js').HTTPRequest} request
 * @returns {string}
 */
function inferenceModelId(request) {
	if (typeof request === 'string') return request;

	return [
		request.method,
		request.url,
		Object.entries(request.headers)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${k}:${v}`)
	].join('|');
}

swarp.loadModel(async ({ task, request, webgpu }, onProgress) => {
	const id = inferenceModelId(request);
	if (inferenceSessions.has(task) && inferenceSessions.get(task).id === id) {
		console.log(`Model ${task} already loaded with ID ${id}`);
		return true; // Model is already loaded
	}

	const session = await loadModel(request, onProgress, webgpu);
	inferenceSessions.set(task, { onnx: session, id });
	return true;
});

swarp.isModelLoaded((task) => inferenceSessions.has(task));

swarp.inferBoundingBoxes(async ({ fileId, cropbox, taskSettings }) => {
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

swarp.classify(async ({ fileId, cropbox: { x, y, width, height }, taskSettings }) => {
	const session = inferenceSessions.get('classification')?.onnx;
	if (!session) {
		throw new Error('Modèle de classification non chargé');
	}

	await openDatabase();
	const file = await db.get('ImageFile', fileId);
	if (!file) {
		throw new Error(`Fichier avec l'ID ${fileId} non trouvé`);
	}

	console.log('Classifying file', fileId, 'with cropbox', { x, y, width, height });

	// We gotta normalize since this img will be used to set a cropped Preview URL -- classify() itself takes care of normalizing (or not) depending on the protocol
	let img = await imload([file.bytes], {
		...taskSettings.input,
		normalized: true
	});

	console.log('Image loaded for classification', img);

	const nimg = await applyBBOnTensor([x, y, width, height], img);

	console.log('Image after applying cropbox', nimg);

	const [[scores]] = await classify(taskSettings, [[nimg]], session);

	return { scores };
});

swarp.start(self);

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	console.info(`Actinvating sw version ${version}`);
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (![CACHE, MODELS_CACHE].includes(key)) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (/** @type {FetchEvent} */ event) => {
	// ignore POST requests etc.
	if (event.request.method !== 'GET') return;

	async function respond() {
		let url = new URL(event.request.url);

		const cacheName = url.searchParams.get('x-cigale-cache-as') ? MODELS_CACHE : CACHE;

		if (cacheName === MODELS_CACHE) {
			const cache = await caches.open(MODELS_CACHE);
			console.log(`Serving ${url} from models cache`);
			const response = await cache.match(url.href);

			if (response) {
				return response;
			} else {
				console.warn(`Model ${url} not found in cache, fetching from network`);
			}
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200) {
				const cache = await caches.open(cacheName);
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const cache = await caches.open(CACHE);
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	}

	event.respondWith(respond());
});
