import { dev } from '$app/environment';
import { BUILTIN_METADATA, BUILTIN_METADATA_IDS } from '$lib/database.js';
import { error } from '@sveltejs/kit';
import { openTransaction, tables } from '$lib/idb.svelte.js';
import { defineSpeciesMetadata } from '$lib/species.svelte.js';

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
		tx.objectStore('Protocol').put({
			id: 'io.github.cigaleapp.transect',
			metadata: [
				BUILTIN_METADATA_IDS.species,
				BUILTIN_METADATA_IDS.shoot_date,
				BUILTIN_METADATA_IDS.shoot_location,
				BUILTIN_METADATA_IDS.crop
			],
			authors: [],
			exports: {
				images: {
					cropped:
						'Cropped/{{ default image.metadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}',
					original:
						'Original/{{ default image.metadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}'
				},
				metadata: {
					json: 'analysis.json',
					csv: 'metadata.csv'
				}
			},
			name: 'Transect',
			source: 'https://github.com/cigaleapp/cigale'
		});
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
