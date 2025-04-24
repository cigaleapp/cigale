import { dev } from '$app/environment';
import { openTransaction, tables } from '$lib/idb.svelte.js';
import { importProtocol } from '$lib/protocols';
import { toasts } from '$lib/toasts.svelte';
import { error } from '@sveltejs/kit';

export async function load() {
	try {
		await tables.initialize();
		await fillBuiltinData();
		await tables.initialize();
		await preloadAudio();
	} catch (e) {
		console.error(e);
		error(400, {
			message: e?.toString() ?? 'Erreur inattendue'
		});
	}
}

async function preloadAudio() {
	const files = ['flintandsteel.mp3', 'vineboom.mp3'];
	for (const file of files) {
		new Audio(file);
	}
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
			showTechnicalMetadata: dev
		});
	});

	const builtinProtocol = await tables.Protocol.get('io.github.cigaleapp.arthropods.transects');

	if (!builtinProtocol) {
		try {
			await fetch(
				'https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.json'
			)
				.then((res) => res.text())
				.then(importProtocol);
		} catch (error) {
			console.error(error);
			toasts.error(
				'Impossible de charger le protocole par défaut. Vérifiez votre connexion Internet ou essayez de recharger la page.'
			);
		}
	}
}
