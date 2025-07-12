import { dev } from '$app/environment';
import { PROCEDURES } from '$lib/../neural-worker-procedures';
import NeuralWorker from '$lib/../neural-worker.js?worker';
import { openTransaction, tables } from '$lib/idb.svelte.js';
import { importProtocol } from '$lib/protocols';
import { toasts } from '$lib/toasts.svelte';
import { error } from '@sveltejs/kit';
import * as Swarpc from 'swarpc';

export async function load() {
	const swarpc = Swarpc.Client(PROCEDURES, {
		worker: new NeuralWorker()
	});

	try {
		await tables.initialize();
		await fillBuiltinData();
		await tables.initialize();
	} catch (e) {
		console.error(e);
		error(400, {
			message: e?.toString() ?? 'Erreur inattendue'
		});
	}

	return { swarpc };
}

async function fillBuiltinData() {
	await openTransaction(['Metadata', 'Protocol', 'Settings'], {}, async (tx) => {
		tx.objectStore('Settings').put({
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

	// TODO: remove this at some point
	await tables.Protocol.remove('io.github.cigaleapp.arthropods.transects');

	const builtinProtocol = await tables.Protocol.get('io.github.cigaleapp.arthropods.example');

	if (!builtinProtocol) {
		try {
			await fetch(
				'https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.json'
			)
				.then((res) => res.text())
				.then((txt) => importProtocol(txt, { json: true }));
		} catch (error) {
			console.error(error);
			toasts.error(
				'Impossible de charger le protocole par défaut. Vérifiez votre connexion Internet ou essayez de recharger la page.'
			);
		}
	}
}
