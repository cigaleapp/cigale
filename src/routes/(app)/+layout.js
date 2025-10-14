import '$locales/loader.svelte.js';

import { dev } from '$app/environment';
import { databaseName, databaseRevision, openTransaction, tables } from '$lib/idb.svelte.js';
import { getSetting } from '$lib/settings.svelte';
import { toasts } from '$lib/toasts.svelte';
import { PROCEDURES } from '$worker/procedures.js';
import { error } from '@sveltejs/kit';
import * as dates from 'date-fns';
import * as dateFnsLocales from 'date-fns/locale';
import * as Swarpc from 'swarpc';
import { loadLocale } from 'wuchale/load-utils';
// oxlint-disable-next-line import/default
import { localeFromNavigator } from '$lib/i18n.js';
import WebWorker from '$worker/start.js?worker';

export async function load() {
	const locale = await getSetting('language', {
		fallback: localeFromNavigator()
	});

	document.documentElement.lang = locale;
	setLoadingMessage(
		// Translations not loaded yet
		// @wc-ignore
		{ fr: 'Chargement des traductions…', en: 'Loading translations…' }[locale]
	);

	await loadLocale(locale);

	dates.setDefaultOptions({
		locale: {
			fr: dateFnsLocales.fr,
			en: dateFnsLocales.enUS,
			ja: dateFnsLocales.ja
		}[locale]
	});

	await initializeSettings();

	const parallelism = await getSetting('parallelism', {
		fallback: 1
	});

	setLoadingMessage('Chargement du worker neuronal…');
	const swarpc = Swarpc.Client(PROCEDURES, {
		worker: WebWorker,
		nodes: parallelism
	});

	setLoadingMessage('Initialisation DB du worker neuronal…');
	await swarpc.init.broadcast({ databaseName, databaseRevision });

	try {
		setLoadingMessage('Initialisation de la base de données…');
		await tables.initialize();
		setLoadingMessage('Chargement des données intégrées…');
		await loadDefaultProtocol(swarpc);
		await tables.initialize();
	} catch (e) {
		console.error(e);
		error(400, {
			message: e?.toString() ?? 'Erreur inattendue'
		});
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
			showTechnicalMetadata: dev,
			protocolModelSelections: {},
			cropAutoNext: false,
			gallerySort: { key: 'date', direction: 'asc' }
		});
	});
}

/**
 *
 * @param {import('swarpc').SwarpcClient<typeof PROCEDURES>} swarpc
 */
async function loadDefaultProtocol(swarpc) {
	setLoadingMessage('Chargement du protocole intégré');

	const protocolsCount = await tables.Protocol.count();
	if (protocolsCount === 0) {
		try {
			const contents = await fetch(
				'https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.json'
			).then((res) => res.text());
			await swarpc.importProtocol({ contents, isJSON: true }, ({ phase, detail }) => {
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

				setLoadingMessage(`${'Chargement du protocole intégré'}<br>${secondLine}`);
			});
		} catch (error) {
			console.error(error);
			toasts.error(
				'Impossible de charger le protocole par défaut. Vérifiez votre connexion Internet ou essayez de recharger la page.'
			);
		}
	}
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
