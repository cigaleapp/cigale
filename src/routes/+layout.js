import { BUILTIN_METADATA } from '$lib/database';
import { tables } from '$lib/idb';
import { getSetting } from '$lib/settings';
import { defineSpeciesMetadata } from '$lib/species';

export async function load() {
	await fillBuiltinData();
	await defineSpeciesMetadata('species');
	return {
		showInputHints: await getSetting('showInputHints')
	};
}

async function fillBuiltinData() {
	await Promise.allSettled([
		...BUILTIN_METADATA.map(tables.Metadata.set),
		tables.Settings.set({
			layer: 'defaults',
			protocols: [],
			theme: 'auto',
			gridSize: 10,
			language: 'fr',
			showInputHints: true
		})
	]);
}
