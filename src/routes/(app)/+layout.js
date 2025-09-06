import { dev } from '$app/environment';
import { databaseName, databaseRevision, openTransaction, tables } from '$lib/idb.svelte.js';
import { m } from '$lib/paraglide/messages.js';
import { getLocale } from '$lib/paraglide/runtime';
import { toasts } from '$lib/toasts.svelte';
import { error } from '@sveltejs/kit';
import * as dates from 'date-fns';
import * as dateFnsLocales from 'date-fns/locale';
import * as Swarpc from 'swarpc';
import { PROCEDURES } from '../../web-worker-procedures';
import WebWorker from '../../web-worker.js?worker';

export async function load() {
	document.documentElement.lang = getLocale();
	dates.setDefaultOptions({
		locale: {
			fr: dateFnsLocales.fr,
			en: dateFnsLocales.enUS,
			ja: dateFnsLocales.ja
		}[getLocale()]
	});

	setLoadingMessage(m.loading_neural_worker());
	const swarpc = Swarpc.Client(PROCEDURES, {
		worker: new WebWorker({ name: 'SWARPC Worker' })
	});

	setLoadingMessage(m.initializing_worker_db());
	await swarpc.init({
		locale: getLocale(),
		databaseName,
		databaseRevision
	});

	try {
		setLoadingMessage(m.initializing_database());
		await tables.initialize();
		setLoadingMessage(m.loading_builtin_data());
		await fillBuiltinData(swarpc);
		await tables.initialize();
	} catch (e) {
		console.error(e);
		error(400, {
			message: e?.toString() ?? m.unexpected_error()
		});
	}

	return { swarpc };
}

/**
 *
 * @param {import('swarpc').SwarpcClient<typeof PROCEDURES>} swarpc
 */
async function fillBuiltinData(swarpc) {
	setLoadingMessage(m.initializing_default_settings());
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

	setLoadingMessage(m.loading_builtin_protocol());

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
						secondLine = m.writing_protocol();
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

				setLoadingMessage(`${m.loading_builtin_protocol()}<br>${secondLine}`);
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

	setHTML('loading-title', m.loading_text());
	setHTML('loading-message', message);
}
