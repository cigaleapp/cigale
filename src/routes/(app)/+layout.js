import { dev } from '$app/environment';
import { BUILTIN_METADATA, BUILTIN_METADATA_IDS } from '$lib/database.js';
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
		tx.objectStore('Protocol').put({
			id: 'io.github.cigaleapp.transects.arthropods',
			metadata: [
				BUILTIN_METADATA_IDS.species,
				// BUILTIN_METADATA_IDS.kingdom,
				// BUILTIN_METADATA_IDS.phylum,
				BUILTIN_METADATA_IDS.order,
				BUILTIN_METADATA_IDS.family,
				BUILTIN_METADATA_IDS.genus,
				BUILTIN_METADATA_IDS.shoot_date,
				BUILTIN_METADATA_IDS.shoot_location,
				BUILTIN_METADATA_IDS.crop
			],
			metadataOrder: [
				BUILTIN_METADATA_IDS.crop,
				BUILTIN_METADATA_IDS.species,
				BUILTIN_METADATA_IDS.genus,
				BUILTIN_METADATA_IDS.family,
				BUILTIN_METADATA_IDS.order,
				BUILTIN_METADATA_IDS.shoot_date,
				BUILTIN_METADATA_IDS.shoot_location
			],
			authors: [],
			exports: {
				images: {
					cropped:
						'Cropped/{{ fallback image.metadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}',
					original:
						'Original/{{ fallback image.metadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}'
				},
				metadata: {
					json: 'analysis.json',
					csv: 'metadata.csv'
				}
			},
			name: "Transect d'arthropodes",
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
