/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';
import { loadModel } from './lib/inference.js';
import { Schemas } from './lib/database.js';
import { type } from 'arktype';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;
// Models are cached independently of the version
const MODELS_CACHE = `cache-models`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];
const MODELS = [
	// Neural network models
	'https://cigaleapp.github.io/models/arthropod_detector_yolo11n_conf0.437.onnx',
	'https://cigaleapp.github.io/models/model_classif.onnx',
	'https://cigaleapp.github.io/models/class_mapping.txt'
];

/**
 * @type {Map<string, import('onnxruntime-web').InferenceSession>}
 */
let inferenceSessions = new Map();

const MessageData = type.or(
	{
		action: '"loadModel"',
		request: Schemas.HTTPRequest,
		webgpu: 'boolean = false',
		task: '"classification" | "detection"'
	},
	{
		action: '"ping"'
	},
	{
		action: '"infer"',
		protocol: Schemas.Protocol,
		modelIndex: 'number >= 0',
		webgpu: 'boolean = true',
		task: '"classification" | "detection"',
		buffers: 'ArrayBuffer[]',
		sequence: 'boolean = false'
	}
);

self.addEventListener('message', async (/** @type {MessageEvent} */ event) => {
	const payload = MessageData.assert(event.data);
	console.info(`Received message from client:`, payload);
	const postMessage = async (data) => {
		await self.clients
			.matchAll()
			.then((clients) => clients.forEach((client) => client.postMessage(data)));
	};

	switch (payload.action) {
		case 'loadModel': {
			inferenceSessions.set(
				payload.task,
				await loadModel(
					payload.request,
					async (progress) => {
						console.info(`Model loading progress:`, progress);
						await postMessage({
							action: 'loadModel',
							task: payload.task,
							progress,
							done: false
						});
					},
					payload.webgpu
				)
			);
			await postMessage({
				action: 'loadModel',
				task: payload.task,
				progress: undefined,
				done: true
			});
			console.log({ inferenceSessions });
			break;
		}
		case 'ping': {
			console.info(`Received ping from client`);
			await postMessage({
				action: 'ping',
				answer: 'pong'
			});
			break;
		}
		case 'infer': {
			break;
		}
	}
});

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
		const modelsCache = await caches.open(MODELS_CACHE);
		await modelsCache.addAll(MODELS);
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

		if (MODELS.includes(url.href) || url.searchParams.get('x-cigale-cache-as') === 'model') {
			url.searchParams.delete('x-cigale-cache-as');
			const cache = await caches.open(MODELS_CACHE);
			console.log(`Serving ${url} from models cache`);
			const response = await cache.match(url.href);

			if (response) {
				return response;
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
				const cache = await caches.open(CACHE);
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
