import { dev } from '$app/environment';
import { BUILTIN_METADATA, BUILTIN_METADATA_IDS } from '$lib/builtins.js';
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
			name: 'Transect',
			source: 'https://github.com/cigaleapp/cigale',
			authors: [],
			metadata: [
				BUILTIN_METADATA_IDS.species,
				BUILTIN_METADATA_IDS.kingdom,
				BUILTIN_METADATA_IDS.phylum,
				BUILTIN_METADATA_IDS.order,
				BUILTIN_METADATA_IDS.family,
				BUILTIN_METADATA_IDS.genus,
				BUILTIN_METADATA_IDS.shoot_date,
				BUILTIN_METADATA_IDS.shoot_location,
				BUILTIN_METADATA_IDS.crop,
				'kingdom',
				'phylum',
				'class',
				'order',
				'family',
				'genus'
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
			inference: {
				classification: {
					model: 'https://media.gwen.works/cigale/models/model_classif.onnx',
					classmapping: 'https://media.gwen.works/cigale/models/class_mapping.txt',
					metadata: BUILTIN_METADATA_IDS.species,
					taxonomic: {
						clade: 'species',
						taxonomy: 'https://raw.githubusercontent.com/cigaleapp/cigale/static/taxonomy.json',
						targets: {
							kingdoms: 'kingdom',
							phyla: 'phylum',
							classes: 'class',
							orders: 'order',
							families: 'family',
							genera: 'genus'
						}
					},
					input: {
						height: 640,
						width: 640,
						disposition: 'CHW',
						normalized: false
					}
				},
				detection: {
					model: 'https://media.gwen.works/cigale/models/arthropod_detector_yolo11n_conf0.437.onnx',
					input: {
						height: 224,
						width: 224,
						disposition: '1CHW',
						normalized: true
					},
					output: {
						normalized: true,
						shape: ['cx', 'cy', 'w', 'h', 'score', '_']
					}
				}
			},
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
			}
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
