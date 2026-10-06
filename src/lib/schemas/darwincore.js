import { type } from 'arktype';

import { ID, NamespacedMetadataID, URLString } from './common.js';
import { JsonataExpression, TemplatedString } from './expressions.js';
import { MetadataRecord } from './metadata.js';
import { Image, ImageFile, Observation } from './observations.js';
import { AnalyzedImage, AnalyzedObservation } from './results.js';
import { Session } from './sessions.js';

// TODO: fill everything from https://rs.gbif.org/extensions.html# ?
export const BUILTIN_DARWINCORE_NAMESPACES = {
	dwc: 'http://rs.tdwg.org/dwc/terms/',
	dwciri: 'http://rs.tdwg.org/dwc/iri/',
	eco: 'http://rs.tdwg.org/eco/terms/',
	ac: 'http://rs.tdwg.org/ac/terms/',
	dc: 'http://purl.org/dc/terms/',
	dcterms: 'http://purl.org/dc/terms/',
};

export const BUILTIN_EXTRA_FIELDS = {
	'dcterms:type': 'http://purl.org/dc/dcmitype/StillImage',
	'dc:subtype': 'http://rs.tdwg.org/acsubtype/values/Photograph',
};

export const DarwinCoreProtocolConfig = type({
	'namespaces?': type({
		'[/\\w+/]': URLString,
	}).describe(
		`Correspondances entre une abbréviation de namespace et une URL d'identification. Par exemple, avec \`dwc: http://rs.tdwg.org/dwc/terms/\`, on peut utiliser \`dwc:eventID\` dans le protocole pour faire référence à http://rs.tdwg.org/dwc/terms/eventID. Les abbréviations suivantes sont pré-définies (il est possible de les redéfinir): ${Object.keys(BUILTIN_DARWINCORE_NAMESPACES).join(', ')} `
	),

	// TODO move some of these to Protocol itself if they arent too specific to dwc-a
	/**
	 * @see https://ipt.gbif.org/manual/en/ipt/latest/gbif-metadata-profile
	 */
	eml: {
		language: 'string',
		// TODO: markdown string, but that uses the following elements:
		// p -> para
		// a -> ulink
		// ? -> citetitle
		// … -> ?
		abstract: 'string = ""',
		title: 'string',
		funding: 'string = ""',
		studyAreaDescription: 'string = ""',
		designDescription: 'string = ""',
		/** keywordSet with keywordThesaurus set to "n/a" */
		keywords: ['string[]', '=', () => []],
		license: 'string',
		'beginsAt?': 'string.date.iso',
		'endsAt?': 'string.date.iso',
		// TODO: find other possible values
		'maintenance?': "'annually'",
		'gbif?': {
			// TODO: <keywordThesaurus>GBIF Dataset Type Vocabulary: http://rs.gbif.org/vocabulary/gbif/dataset_type_2015-07-10.xml</keywordThesaurus>
			type: 'string',
			// TODO: <keywordThesaurus>GBIF Dataset Subtype Vocabulary: http://rs.gbif.org/vocabulary/gbif/dataset_subtype.xml</keywordThesaurus>
			subtype: 'string',
		},
		'taxonomy?': {
			description: 'string = ""',
			'rank?': [
				'Record<string, string>',
				'@',
				'Sous la forme "rank: valeur", par exemple: "genus: Andrena". Une seule valeur.',
			],
		},
		'geography?': {
			description: 'string = ""',
			'coordinates?': {
				west: 'number',
				east: 'number',
				north: 'number',
				south: 'number',
			},
		},
	},

	'fields?': {
		'session?': type({
			'[/^\\w+:\\w+$/]': TemplatedString(
				type({
					session: Session.omit('metadata').and({
						metadata: MetadataRecord(NamespacedMetadataID),
						protocolMetadata: MetadataRecord(ID),
					}),
				})
				// type('boolean|number|string|null|undefined')
			),
		}),
		'observation?': type({
			'[/^\\w+:\\w+$/]': TemplatedString(
				type({
					session: Session.omit('metadata').and({
						metadata: MetadataRecord(NamespacedMetadataID),
						protocolMetadata: MetadataRecord(ID),
					}),
					observation: Observation.omit('metadataOverrides').and({
						metadataOverrides: MetadataRecord(NamespacedMetadataID),
					}),
					images: Image.omit('metadata')
						.and({
							metadata: MetadataRecord(NamespacedMetadataID),
							protocolMetadata: MetadataRecord(ID),
						})
						.array(),
					metadata: MetadataRecord(ID),
					allMetadata: MetadataRecord(NamespacedMetadataID),
				})
				// type('boolean|number|string|null|undefined')
			),
		}),
		'media?': type({
			'[/^\\w+:\\w+$/]': TemplatedString(
				type({
					session: Session.omit('metadata').and({
						metadata: MetadataRecord(NamespacedMetadataID),
						protocolMetadata: MetadataRecord(ID),
					}),
					file: ImageFile,
					image: Image.omit('metadata').and({
						metadata: MetadataRecord(NamespacedMetadataID),
						protocolMetadata: MetadataRecord(ID),
					}),
				})
				// type('boolean|number|string|null|undefined')
			),
		}).describe(
			`Champs à rajouter, avec un par fichier image. Les clés sont les abbréviations de champs (namespace:clé) et les valeurs sont des templates Handlebars, avec les mêmes données que exports.cropped/exports.original. Certains champs sont définis par défaut (${Object.keys(BUILTIN_EXTRA_FIELDS).join(', ')}) et sont re-définissables en les précisant ici.`
		),
	},

	files: type({
		core: [['boolean', '@', 'Ce fichier est le fichier core'], '=', false],
		scope: "'observation' | 'session' | 'media'",
		includes: type('/^\\w+:(\\*|\\w+)$/')
			.array()
			.describe(
				"Abbréviations de champs à inclure dans ce fichier. Utiliser namespace:* pour inclure tout les champs d'un namespace."
			),
		rowType: type
			.or(URLString, '/^\\w+:\\w+$/')
			.describe('Abbréviation de la classe ou URL entière'),
		path: ['string', '@', 'Chemin (ou simplement nom) du fichier dans le .zip'],
	})
		.describe(
			"Un fichier par namespace DarwinCore est créé, pour les métadonnées d'observation et de session. Par exemple, si une métadonnée d'observation \"Date de prise de vue\" défini un champ DarwinCore 'dwc:date', une métadonnée 'eco:example', et une métadonnée de session 'dwc:example', on aura 4 fichiers."
		)
		.array()
		.default(() => [
			{
				scope: 'observation',
				includes: ['dwc:*'],
				rowType: 'dwc:Occurence',
				path: 'occurences.txt',
			},
			{
				scope: 'observation',
				includes: ['eco:*'],
				rowType: 'eco:Event',
				path: 'occurences_humboldt.txt',
			},
			{
				core: true,
				scope: 'session',
				includes: ['dwc:*'],
				rowType: 'dwc:Event',
				path: 'events.txt',
			},
			{
				scope: 'session',
				includes: ['eco:*'],
				rowType: 'dwc:Event',
				path: 'events_humboldt.txt',
			},
			{
				scope: 'media',
				includes: ['ac:*', 'dc:*'],
				rowType: 'http://rs.gbif.org/terms/1.0/Multimedia',
				path: 'media.txt',
			},
		]),
});
