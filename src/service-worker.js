/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

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
	'https://media.gwen.works/cigale/models/arthropod_detector_yolo11n_conf0.437.onnx',
	'https://media.gwen.works/cigale/models/model_classif.onnx',
	'https://media.gwen.works/cigale/models/class_mapping.txt'
];

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

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const cache = await caches.open(CACHE);
			console.log(`Serving ${url} from cache`);
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		if (MODELS.includes(url.href)) {
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
