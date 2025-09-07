/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;
// Models are cached independently of the version
const MODELS_CACHE = `cache-models`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
].filter((u) =>
	// Prevent trying to cache app://-/ URLs when running with Electron
	/^https?:\/\//.test(u)
);

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache().then(self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
	console.info(`Actinvating sw version ${version}`);
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (![CACHE, MODELS_CACHE].includes(key)) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches().then(self.clients.claim()));
});

self.addEventListener('fetch', (/** @type {FetchEvent} */ event) => {
	// ignore POST requests etc.
	if (event.request.method !== 'GET') return;

	async function respond() {
		let url = new URL(event.request.url);

		const cacheName = url.searchParams.get('x-cigale-cache-as') ? MODELS_CACHE : CACHE;

		if (cacheName === MODELS_CACHE) {
			const cache = await caches.open(MODELS_CACHE);
			console.debug(`Serving ${url} from models cache`);
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
