import { type } from 'arktype';
import { addYears } from 'date-fns';

import { Datasource } from '../lib/datasource.ts';
import { logger } from '../lib/progress.ts';

// GBIF changed their main dataset, see https://techdocs.gbif.org/en/data-processing/taxonomy-interpretation#multiple-taxonomy-support
const DATASET_KEYS = {
	/** @deprecated GBIF Backbone Taxonomy (not updated anymore) */
	'old-backbone': 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c',
	/** Catalogue Of Life eXtended Release (new main GBIF dataset from now on) */
	colxr: '7ddf754f-d193-4cc9-b351-99906754a03b',
} as const;

export type GbifDataset = keyof typeof DATASET_KEYS;

export type GbifParams = {
	search: {
		dataset: GbifDataset;
		clade: string;
		name: string;
	};
	taxon: {
		dataset: GbifDataset;
		id: string;
	};
};

export type GbifResponses = {
	search: {
		firstResult: null | {
			id: string;
			clade: string;
			parents: Array<{ id: string; clade: string; name: string }>;
		};
	};
	taxon: {
		images: Array<{
			identifier: string;
			type: 'StillImage';
			license?: string;
			created?: Date;
			title?: string;
			creator?: string;
			source?: string;
			remarks?: string;
		}>;
		vernacularNames: Array<{ language?: string; vernacularName: string }>;
		homotypicSynonyms: Array<{ scientificName: string }>;
		taxonID: string;
		identifiers: Array<{ scope?: string; title?: string; id?: string; url?: string }>;
	};
};

export class GBIF extends Datasource<'search' | 'taxon', GbifParams, GbifResponses> {
	name = 'gbif' as const;

	baseURL = 'https://api.gbif.org/v2';

	expirations = {
		file: (now: Date) => addYears(now, 1),
		entry: (now: Date) => addYears(now, 1),
	};

	async init() {}

	datasetKey(name: GbifDataset) {
		return DATASET_KEYS[name];
	}

	requests = {
		search: async (params: GbifParams['search']) => {
			const response = await fetch(
				`${this.baseURL}/taxon/search/${this.datasetKey(params.dataset)}?${new URLSearchParams(
					{
						taxonRank: params.clade.toUpperCase(),
						nameType: 'SCIENTIFIC',
						searchType: 'EXACT',
						searchContent: 'SCIENTIFIC',
						q: params.name,
						limit: '1',
					}
				)}`
			);

			if (!response.ok) throw new Error(await response.text());

			const Response = type({
				results: type({
					taxonID: 'string',
					scientificName: 'string',
					taxonRank: 'string.lower',
					classification: type({
						taxonID: 'string',
						scientificName: 'string',
						taxonRank: 'string',
					}).array(),
				}).array(),
			});

			const data = Response.assert(await response.json());
			if (!data.results.length) {
				logger.error(
					`${params.clade} "${params.name}" not found in GBIF backbone taxonomy`
				);

				return { firstResult: null };
			}

			const [result] = data.results;

			if (!result) return { firstResult: null };

			return {
				firstResult: {
					id: result.taxonID,
					clade: result.taxonRank.toLowerCase(),
					parents: result.classification.map((taxon) => ({
						id: taxon.taxonID,
						clade: taxon.taxonRank.toLowerCase(),
						name: taxon.scientificName,
					})),
				},
			} satisfies GbifResponses['search'];
		},

		taxon: async (params: GbifParams['taxon']) => {
			const response = await fetch(
				`${this.baseURL}/taxon/${this.datasetKey(params.dataset)}/${params.id}/info`
			);

			if (!response.ok) throw new Error(await response.text());

			const Response = type({
				taxonID: 'string',
				'scientificNameAuthorship?': 'string',
				taxonRank: 'string.lower',
				taxonomicStatus: type.enumerated(
					'ACCEPTED',
					'PROVISIONALLY_ACCEPTED',
					'SYNONYM',
					'AMBIGUOUS_SYNONYM',
					'MISAPPLIED',
					'BARE_NAME'
				),
				'environment?': type(
					'string' as type.cast<
						(string & {}) | 'marine' | 'freshwater' | 'terrestrial' | 'brackish'
					>
				).array(),
				'extinct?': 'boolean',
				'synonyms?': type({
					/** Homotypic (nomenclatural) synonyms that share the same type specimen as the accepted name. These names are synonyms purely due to nomenclatural rules. */
					homotypic: type({
						taxonID: 'string',
						scientificName: 'string',
						taxonRank: 'string.lower',
					}).array(),
					/** Heterotypic (taxonomic) synonyms based on different type specimens, grouped by their common basionym. Each inner list represents a homotypic group of names considered synonymous for taxonomic reasons. */
					heterotypic: type({
						taxonID: 'string',
						scientificName: 'string',
						taxonRank: 'string.lower',
					})
						.array()
						.array(),
					/** Names that have been misapplied to this taxon in literature, i.e. used for a different taxon than the one they were originally described for. */
					misapplied: type({
						taxonID: 'string',
						scientificName: 'string',
						taxonRank: 'string.lower',
					}).array(),
				}).partial(),
				'vernacularNames?': type({
					vernacularName: 'string',
					/** The language of the vernacular name (ISO 639-2 code) */
					'language?': 'string',
					'locality?': 'string',
					'remarks?': 'string',
				}).array(),
				'media?': type({
					identifier: 'string.url',
					'type?': 'string' as type.cast<
						| (string & {})
						| 'StillImage'
						| 'MovingImage'
						| 'Sound'
						| 'InteractiveResource'
						| 'Text'
					>,
					'created?': 'string.date.iso.parse',
					'title?': 'string',
					'creator?': 'string',
					'license?': 'string',
					'source?': 'string',
					'remarks?': 'string',
				}).array(),
				'distributions?': type({
					/** The identifier for the dataset */
					'datasetKey?': 'string.uuid',
					/** The unique identifier for this taxon (dwc:taxonID) */
					'taxonID?': 'string',
					/** A CURIE identifier (scope:id) for the named area (dwc:locationID), where the scope indicates the gazetteer. Supported gazetteers: ISO (2-letter country codes), TDWG (World Geographical Scheme for Recording Plant Distributions), TEOW (Terrestrial Ecoregions of the World), LONGHURST (Longhurst biogeographical provinces), FAO (FAO fishing areas), WGSRPD (TDWG regions). See https://github.com/CatalogueOfLife/coldp/blob/master/README.md#areaid */
					'locationID?': 'string',
					/** The specific description of the place (dwc:locality). The verbatim name of the area as used in the source. */
					'locality?': 'string',
					/** ISO 3166-1 alpha-2 country code (dwc:countryCode) */
					'countryCode?': 'string',
					/** The age class or life stage of the organisms to which this distribution applies (dwc:lifeStage) */
					'lifeStage?': 'string',
					/** The process by which the organism became established at the location (dwc:establishmentMeans). Recommended values: native, introduced, naturalised, invasive, managed, uncertain. */
					'establishmentMeans?': 'string',
					/** The degree to which an organism survives, reproduces, and expands its range at the given place (dwc:degreeOfEstablishment). Recommended values from the IUCN Invasive Species framework. */
					'degreeOfEstablishment?': 'string',
					/** The process by which an organism came to be in a given place at a given time (dwc:pathway). Recommended best practice is to use a controlled vocabulary such as the CBD pathway vocabulary. */
					'pathway?': 'string',
					/** Flag to indicate that the introduced taxon is considered to be invasive in the given area */
					'isInvasive?': 'boolean',
					/** The IUCN Red List or equivalent threat/conservation status for the taxon in this location. Recommended values: EX, EW, CR, EN, VU, NT, LC, DD, NE. */
					'threatStatus?': 'string',
					/** The date or date range during which this distribution record is valid (dwc:eventDate). Recommended best practice is to use an encoding scheme such as ISO 8601. */
					'eventDate?': 'string',
					/** Identifier for the bibliographic reference which is the source of this distribution record */
					'referenceID?': 'string',
					/** Additional remarks or notes about this distribution record (dwc:occurrenceRemarks) */
					'remarks?': 'string',
				}).array(),

				'measurementOrFacts?': type({
					/** The nature of the measurement, fact, characteristic, or assertion (dwc:measurementType). Recommended best practice is to use a controlled vocabulary. */
					measurementType: 'string',
					/** The value of the measurement, fact, characteristic, or assertion (dwc:measurementValue). */
					measurementValue: 'string',
					/** Comments or notes accompanying the MeasurementOrFact (dwc:measurementRemarks). */
					'measurementRemarks?': 'string',
				}).array(),

				'identifiers?': type({
					'scope?': 'string' as type.cast<(string & {}) | 'wikidata' | 'inat'>,
					'title?': 'string',
					'id?': 'string',
					'url?': 'string.url',
				}).array(),
			});

			const data = Response.assert(await response.json());

			const { vernacularNames = [], synonyms = {}, media = [], identifiers = [] } = data;

			type Image = GbifResponses['taxon']['images'][number];
			return {
				taxonID: data.taxonID,
				identifiers,
				vernacularNames: vernacularNames.map((vn) => ({
					vernacularName: vn.vernacularName,
					language: vn.language,
				})),
				images: media.filter((m): m is Image => m.type === 'StillImage'),
				homotypicSynonyms: (synonyms.homotypic ?? [])
					.filter((s) => s.taxonRank === data.taxonRank)
					.map(({ scientificName }) => ({ scientificName })),
			} satisfies GbifResponses['taxon'];
		},
	};
}
