import { dev } from '$app/environment';
import { BUILTIN_METADATA } from '$lib/builtins.js';
import { openTransaction, tables } from '$lib/idb.svelte.js';
import { defineSpeciesMetadata } from '$lib/species.svelte.js';
import { error } from '@sveltejs/kit';

export async function load() {
	try {
		await tables.initialize();
		await fillBuiltinData();
		await defineSpeciesMetadata('species');
		await tables.initialize();
	} catch (e) {
		console.error(e);
		error(400, {
			message: e?.toString() ?? 'Erreur inattendue'
		});
	}
}

async function fillBuiltinData() {
	await openTransaction(['Metadata', 'Protocol', 'Settings'], {}, (tx) => {
		for (const metadata of BUILTIN_METADATA) {
			tx.objectStore('Metadata').put(metadata);
		}
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
}
