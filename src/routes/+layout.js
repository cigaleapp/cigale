import { dev } from '$app/environment';
import { BUILTIN_METADATA } from '$lib/database.js';
import { tables } from '$lib/idb.svelte.js';
import { defineSpeciesMetadata } from '$lib/species.js';

export async function load() {
	await tables.initialize();
	await fillBuiltinData();
	await defineSpeciesMetadata('species');
	await tables.initialize();
}

async function fillBuiltinData() {
	await Promise.all([
		...BUILTIN_METADATA.map(tables.Metadata.set),
		tables.Settings.set({
			id: 'defaults',
			protocols: [],
			theme: 'auto',
			gridSize: 10,
			language: 'fr',
			showInputHints: true,
			showTechnicalMetadata: dev
		})
	]);
}
