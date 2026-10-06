import { type } from 'arktype';

import { URLString } from './common.js';

// TODO: fill everything from https://rs.gbif.org/extensions.html# ?
export const BUILTIN_DARWINCORE_NAMESPACES = {
	dwc: 'http://rs.tdwg.org/dwc/terms/',
	eco: 'http://rs.tdwg.org/eco/terms/',
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
		taxonomy: {
			description: 'string = ""',
			'rank?': [
				'Record<string, string>',
				'@',
				'Sous la forme "rank: valeur", par exemple: "genus: Andrena". Une seule valeur.',
			],
		},
		geography: {
			description: 'string = ""',
			'coordinates?': {
				west: 'number',
				east: 'number',
				north: 'number',
				south: 'number',
			},
		},
	},

	files: type({
		core: [['boolean', '@', 'Ce fichier est le fichier core'], '=', false],
		scope: "'observation' | 'session'",
		namespace: '/^\\w+$/',
		rowType: [
			'string',
			'@',
			"Dernière partie de l'URL, après ce qui est défini par le namespace",
		],
		path: ['string', '@', 'Chemin (ou simplement nom) du fichier dans le .zip'],
	})
		.describe(
			"Un fichier par namespace DarwinCore est créé, pour les métadonnées d'observation et de session. Par exemple, si une métadonnée d'observation \"Date de prise de vue\" défini un champ DarwinCore 'dwc:date', une métadonnée 'eco:example', et une métadonnée de session 'dwc:example', on aura 4 fichiers."
		)
		.array()
		.default(() => [
			{
				scope: 'observation',
				namespace: 'dwc',
				rowType: 'Occurence',
				path: 'occurences.txt',
			},
			{
				scope: 'observation',
				namespace: 'eco',
				rowType: 'Event',
				path: 'occurences_humboldt.txt',
			},
			{
				core: true,
				scope: 'session',
				namespace: 'dwc',
				rowType: 'Event',
				path: 'events.txt',
			},
			{
				scope: 'session',
				namespace: 'eco',
				rowType: 'Event',
				path: 'events_humboldt.txt',
			},
		]),
});
