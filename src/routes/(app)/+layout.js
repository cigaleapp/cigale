import { dev } from '$app/environment';
import { databaseName, databaseRevision, openTransaction, tables } from '$lib/idb.svelte.js';
import { toasts } from '$lib/toasts.svelte';
import { error } from '@sveltejs/kit';
import * as Swarpc from 'swarpc';
import { PROCEDURES } from '../../web-worker-procedures';
import WebWorker from '../../web-worker.js?worker';

export async function load() {
	setLoadingMessage('Chargement du worker neuronal…');
	const swarpc = Swarpc.Client(PROCEDURES, {
		worker: new WebWorker({ name: 'SWARPC Worker' })
	});

	setLoadingMessage('Initialisation DB du worker neuronal…');
	await swarpc.init({
		databaseName,
		databaseRevision
	});

	try {
		setLoadingMessage('Initialisation de la base de données…');
		await tables.initialize();
		setLoadingMessage('Chargement des données intégrées…');
		await fillBuiltinData(swarpc);
		await tables.initialize();
	} catch (e) {
		console.error(e);
		error(400, {
			message: e?.toString() ?? 'Erreur inattendue'
		});
	}

	return { swarpc };
}

/**
 *
 * @param {import('swarpc').SwarpcClient<typeof PROCEDURES>} swarpc
 */
async function fillBuiltinData(swarpc) {
	setLoadingMessage('Initialisation des réglages par défaut…');
	await openTransaction(['Metadata', 'Protocol', 'Settings'], {}, async (tx) => {
		await tx.objectStore('Settings').put({
			id: 'defaults',
			protocols: [],
			theme: 'auto',
			gridSize: 10,
			language: 'fr',
			showInputHints: true,
			showTechnicalMetadata: dev,
			protocolModelSelections: {}
		});
	});

	setLoadingMessage('Chargement du protocole intégré');
	// TODO: remove this at some point
	await tables.Protocol.remove('io.github.cigaleapp.arthropods.transects');

	const builtinProtocol = await tables.Protocol.get('io.github.cigaleapp.arthropods.example');

	if (!builtinProtocol) {
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

				setLoadingMessage(`Chargement du protocole intégré<br>${secondLine}`);
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
	const loadingMessage = document.getElementById('loading-message');
	if (loadingMessage) loadingMessage.innerHTML = message;
}
