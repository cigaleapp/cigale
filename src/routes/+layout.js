import { BUILTIN_METADATA } from '$lib/database.js';
import { tables } from '$lib/idb.svelte.js';
import { getSetting } from '$lib/settings.svelte.js';
import { defineSpeciesMetadata } from '$lib/species.js';

export async function load() {
	await fillBuiltinData();
	await defineSpeciesMetadata('species');
	await tables.initialize();
	return {
		showInputHints: await getSetting('showInputHints')
	};
}

async function fillBuiltinData() {
	await Promise.allSettled([
		...BUILTIN_METADATA.map(tables.Metadata.set),
		tables.Settings.set({
			id: 'defaults',
			protocols: [],
			theme: 'auto',
			gridSize: 10,
			language: 'fr',
			showInputHints: true
		})
	]);
}
