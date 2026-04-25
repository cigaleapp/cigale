import '$locales/main.loader.svelte.js';

import { loadIcons } from '@iconify/svelte';
import { error } from '@sveltejs/kit';
import * as dates from 'date-fns';
import * as dateFnsLocales from 'date-fns/locale';
import * as Swarpc from 'swarpc';
import { loadLocale } from 'wuchale/load-utils';

import { dev } from '$app/environment';
// oxlint-disable-next-line import/default
import { localeFromNavigator } from '$lib/i18n.js';
import {
	databaseHandle,
	databaseName,
	databaseRevision,
	openTransaction,
	tables,
} from '$lib/idb.svelte.js';
import { autoUpdateProtocols } from '$lib/protocols';
import { getSetting } from '$lib/settings.svelte';
import { toasts } from '$lib/toasts.svelte';
import { clamp, fetchHttpRequest, profiler, progressSplitter } from '$lib/utils.js';
import { PROCEDURES } from '$worker/procedures.js';
import WebWorker from '$worker/start.js?worker';

export const ssr = false;

export const trailingSlash = 'always';

const profile = profiler('App');

const splitProgress = progressSplitter(
	'translations',
	0.1,
	'settings',
	0.1,
	'workers',
	0.1,
	'protocols',
	0.4,
	'database'
);

export async function load({ url }) {
	const locale = await profile('Startup', 'Get language setting', async () =>
		getSetting('language', {
			fallback: localeFromNavigator(),
		})
	);

	document.documentElement.lang = locale;
	setLoadingProgress('translations', 0);
	setLoadingMessage(
		// Translations not loaded yet
		// @wc-ignore
		{ fr: 'Chargement des traductions…', en: 'Loading translations…' }[locale]
	);

	await profile('Startup', 'Load locale', async () => loadLocale(locale));

	dates.setDefaultOptions({
		locale: {
			fr: dateFnsLocales.fr,
			en: dateFnsLocales.enUS,
		}[locale],
	});

	setLoadingProgress('translations', 1);

	await profile('Startup', 'Initialize settings', initializeSettings);

	let parallelism = await getSetting('parallelism', {
		fallback: 1,
	});

	if (url.searchParams.has('nodes')) {
		parallelism = Number.parseInt(url.searchParams.get('nodes') ?? '1');
	}

	setLoadingProgress('settings', 1);

	setLoadingMessage('Initialisation des workers…');
	setLoadingProgress('workers', 0);
	if (window && window.swarpc) {
		window.swarpc.destroy();
	}

	const swarpc = Swarpc.Client(PROCEDURES, {
		worker: WebWorker,
		nodes: parallelism,
		localStorage:
			/** @satisfies {typeof import('$worker/procedures').LOCAL_STORAGE['inferIn']} */ ({
				databaseName,
				databaseRevision: databaseRevision.toString(),
			}),
		hooks: {
			success({ procedure, data, duration }) {
				performance.measure(procedure, {
					start: performance.now() - duration,
					detail: {
						devtools: {
							dataType: 'track-entry',
							track: 'Workers',
							trackGroup: 'App',
						},
					},
				});

				if (procedure === 'importProtocol') {
					// We preload icons here instead of in the web worker
					// so that the service worker can pick up on the fetch call and cache it
					// > [...] when the **main app thread** makes a network request.
					// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/fetch_event
					loadIcons(data.iconsToPreload, (loaded, missing) => {
						console.info(
							`Preloaded ${loaded.length} icons, ${missing.length} missing:`,
							missing
						);
					});
				}
			},
		},
	});

	if (window) {
		window.swarpc = swarpc;
	}

	try {
		setLoadingMessage('Chargement des données intégrées…');
		await profile('Startup', 'Load built-in protocols', loadDefaultProtocol);

		setLoadingMessage('Initialisation de la base de données…');
		setLoadingProgress('database', 0);

		const sessionId = localStorage.getItem('currentSessionId');
		await profile('Startup', 'Initialize database', async () => {
			await tables.initialize(sessionId);
		});

		setLoadingProgress('database', 1);
	} catch (e) {
		console.error(e);
		error(400, {
			message: e?.toString() ?? 'Erreur inattendue',
		});
	}

	console.time('background things');

	void autoUpdateProtocols(databaseHandle(), swarpc).then((updates) => {
		if (updates.length === 0) return;
		toasts.info(
			updates.length === 1
				? `Protocole "${updates[0].name}" mis à jour à la v${updates[0].version}`
				: `${updates.length} protocoles ont été mis à jour: ${updates.map((u) => `"${u.name}"`).join(', ')}`
		);
	});

	// Start workers in the background so that we can have the UI shown etc but warm them up so that they're ready when needed
	void swarpc.wakeup(undefined);

	console.timeEnd('background things');

	return { swarpc, parallelism };
}

async function initializeSettings() {
	setLoadingMessage('Initialisation des réglages par défaut…');
	await openTransaction(['Metadata', 'Protocol', 'Settings'], {}, async (tx) => {
		await tx.objectStore('Settings').put({
			id: 'defaults',
			protocols: [],
			theme: 'auto',
			gridSize: 1,
			language: 'fr',
			showInputHints: true,
			showTechnicalMetadata: dev,
			cropAutoNext: false,
			gallerySort: { key: 'date', direction: 'asc' },
		});
	});
}

async function loadDefaultProtocol() {
	setLoadingMessage('Chargement du protocole intégré');
	setLoadingProgress('protocols', 0);

	// const protocolsCount = await tables.Protocol.count();
	const protocols = await tables.Protocol.list();
	const sources = protocols.map((p) => p.source);

	/** @type {string[]} */
	const builtins =
		JSON.parse(localStorage.getItem('builtinProtocols') ?? 'null') ??
		import.meta.env.builtinProtocols;

	const toImport = builtins.filter((source) => !sources.includes(source));

	if (toImport.length) {
		void window.swarpc?.wakeup.broadcast(undefined);
	}

	console.debug(`Importing built-in protocols`, toImport, 'since already have', sources);
	for (const [i, importUrl] of toImport.entries()) {
		const splitProgress = progressSplitter('download', 0.7, 'import');

		/**
		 * @param {Parameters<typeof splitProgress>[0]} phase
		 * @param {number} progress
		 */
		function setLoading(phase, progress) {
			progress = clamp(progress, 0, 1);

			setLoadingProgress('protocols', (i + splitProgress(phase, progress)) / toImport.length);
		}

		const filename = new URL(importUrl).pathname.split('/').at(-1);
		console.debug(`Importing ${filename} since ${importUrl} not in`, sources);
		try {
			const contents = await fetchHttpRequest(importUrl, {
				onProgress({ total, transferred }) {
					setLoading('download', transferred / total);
				},
			}).then((res) => res.text());

			setLoading('download', 1);

			const isJSON = Boolean(filename?.endsWith('.json'));
			await window.swarpc?.importProtocol(
				{ contents, isJSON },
				({ phase, detail, done, total }) => {
					let secondLine = '';
					switch (phase) {
						case 'parsing':
							secondLine = 'Analyse';
							break;

						case 'filtering-builtin-metadata':
							secondLine = 'Filtrage des métadonnées intégrées';
							break;

						case 'input-validation':
							secondLine = 'Validation';
							break;

						case 'write-protocol':
							secondLine = 'Écriture du protocole';
							break;

						case 'write-metadata':
							secondLine = `Écriture de la métadonnée<br>${detail}`;
							break;

						case 'write-metadata-options':
							secondLine = `Écriture des options de la métadonnée<br>${detail}`;
							break;

						case 'output-validation':
							secondLine = 'Post-validation';
							break;

						default:
							break;
					}

					setLoadingMessage(`${`Chargement du protocole ${filename}`}<br>${secondLine}`);
					setLoading('import', done / total);
				}
			);

			setLoading('import', 1);
		} catch (error) {
			console.error(error);
			toasts.error(
				`Impossible de charger le protocole ${filename}. Vérifiez votre connexion Internet ou essayez de recharger la page.`
			);
		}
	}

	setLoadingProgress('protocols', 1);
}

/**
 * @param {string} message
 */
function setLoadingMessage(message) {
	/**
	 * @param {string} id
	 * @param {string} html
	 */
	const setHTML = (id, html) => {
		const element = document.getElementById(id);
		if (element) element.innerHTML = html;
	};

	setHTML('loading-title', 'Chargement…');
	setHTML('loading-message', message);
}

/**
 *
 * @param {Parameters<typeof splitProgress>[0]} phase
 * @param {number} progress
 */
function setLoadingProgress(phase, progress) {
	const bar = document.querySelector('#loading')?.querySelector('progress');
	if (!bar) return;

	console.debug(
		`[startup] set loading progress @ ${phase}: ${splitProgress(phase, progress) * 100}% `
	);

	const granularity = 1000;

	bar.value = splitProgress(phase, progress) * granularity;
	bar.max = granularity;

	if (bar.value === 0) {
		bar.removeAttribute('value');
	}
}
