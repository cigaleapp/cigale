import '$locales/main.loader.svelte.js';

import { SplashScreen } from '@capacitor/splash-screen';
import { WebViewCrash } from '@capgo/capacitor-webview-crash';
import { loadIcons } from '@iconify/svelte';
import { error } from '@sveltejs/kit';
import * as dates from 'date-fns';
import * as dateFnsLocales from 'date-fns/locale';
import * as Swarpc from 'swarpc';
import { UAParser } from 'ua-parser-js';
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
import { getSetting, isDebugMode } from '$lib/settings.svelte';
import { toasts } from '$lib/toasts.svelte';
import { profiler, progressSplitter, switchValue } from '$lib/utils.js';
import { PROCEDURES } from '$worker/procedures.js';
import WebWorker from '$worker/start.js?worker';

import '@andy0130tw/es-arraybuffer-base64/auto';
import '@ungap/set-methods';

import { binaryStorage } from '$lib/storage/index.js';

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
	await WebViewCrash.addListener('webViewRestoredAfterCrash', () => {
		if (isDebugMode()) toasts.add('debug', 'App reloaded after webview crash');
	}).catch((e) => {
		console.error('Couldnt setup webview restore after crash listener', e);
	});

	const locale = await profile('Startup', 'Get language setting', async () =>
		getSetting('language', {
			fallback: localeFromNavigator(),
		})
	);

	// Hide at the start so the progress bar can be shown,
	// which is better UX than a static splash screen for long startups
	await SplashScreen.hide();

	// Ask for storage persistence
	let storageIsPersistent: boolean | undefined;
	try {
		storageIsPersistent = await navigator.storage?.persisted();
		if (!storageIsPersistent) {
			storageIsPersistent = await navigator.storage.persist();
		}
	} catch (e) {
		console.warn('Storage persistence not supported', e);
	}

	document.documentElement.lang = locale;
	setLoadingProgress('translations', 0);
	setLoadingMessage(
		// Translations not loaded yet
		// @wc-ignore
		switchValue(locale, { fr: 'Chargement des traductions…', en: 'Loading translations…' })
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
		localStorage: {
			databaseName,
			databaseRevision: databaseRevision.toString(),
			playwright_mock_opfs:
				localStorage.getItem('playwright_mock_opfs') ?? ('false' as const),
		} satisfies (typeof import('$worker/procedures').LOCAL_STORAGE)['inferIn'],
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
	// Too RAM hungry for mobile devices
	if (!Capacitor.isNativePlatform()) {
		void swarpc.wakeup(undefined);
	}

	console.timeEnd('background things');

	// Enabling persistent storage is almost impossible on non-firefox
	const firefox = new UAParser().getEngine().name === 'Gecko';

	if (!storageIsPersistent && firefox) {
		toasts.warn(
			"Le stockage de votre navigateur n'est pas persistant, les données pourraient être perdues en cas de manque d'espace de stockage.",
			{
				data: {},
				labels: { action: 'Activer' },
				async action() {
					await navigator.storage.persist?.();
				},
			}
		);
	}

	if (window) {
		window.binaryStorage = binaryStorage;
	}

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
			debugMode: dev,
			cropAutoNext: false,
			gallerySort: { key: 'date', direction: 'asc' },
		});
	});
}

function setLoadingMessage(message: string) {
	const setHTML = (id: string, html: string) => {
		const element = document.getElementById(id);
		if (element) element.innerHTML = html;
	};

	setHTML('loading-title', 'Chargement…');
	setHTML('loading-message', message);
}

function setLoadingProgress(phase: Parameters<typeof splitProgress>[0], progress: number) {
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
