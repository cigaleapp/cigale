/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;
// Models are cached independently of the version
const MODELS_CACHE = `cache-models`;
// Icon data from Iconfiy API can be cached indefinitely
const ICONS_CACHE = `cache-icons`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
].filter((u) =>
	// Prevent trying to cache app://-/ URLs when running with Electron
	/^https?:\/\//.test(u)
);

const sw = /** @type {ServiceWorkerGlobalScope} */ (self);

sw.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache().then(sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
	console.info(`Actinvating sw version ${version}`);
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (![CACHE, MODELS_CACHE].includes(key)) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches().then(sw.clients.claim()));
});

sw.addEventListener('fetch', (/** @type {FetchEvent} */ event) => {
	// ignore POST requests etc.
	if (event.request.method !== 'GET') return;

	async function respond() {
		let url = new URL(event.request.url);

		if (url.searchParams.get('x-cigale-cache-as') === 'model') {
			return tryCache(event.request, MODELS_CACHE);
		}

		if (url.hostname === 'api.iconify.design') {
			return tryCache(event.request, ICONS_CACHE);
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

			if (response.ok) {
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

/**
 *
 * @param {Request} request
 * @param {string} cacheName
 */
async function tryCache(request, cacheName) {
	const cache = await caches.open(cacheName);
	const match = await cache.match(request.url);

	if (match) {
		console.debug(`Serving ${request.url} from ${cacheName} cache`);
		return match;
	}

	console.warn(`${request.url} not found in ${cacheName} cache, fetching from network`);
	const response = await fetch(request);

	// if we're offline, fetch can return a value that is not a Response
	// instead of throwing - and we can't pass this non-Response to respondWith
	if (!(response instanceof Response)) {
		throw new Error('invalid response from fetch');
	}

	if (response.ok) {
		const cache = await caches.open(cacheName);
		cache.put(request, response.clone());
	}

	return response;
}
