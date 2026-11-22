import { type } from 'arktype';
import { addYears } from 'date-fns';

import { Datasource, Identifier, Option, TaxonomyProvider } from './modules';
import { logger } from './progress';

export class GBIFID implements Identifier {
	name = 'gbif-id' as const;
	gbif: GBIF;

	constructor() {
		this.gbif = new GBIF();
	}

	async init() {}

	async identify({ clade, name, id }: Option) {
		if (id) return id;
		const result = await this.gbif.one('id', { clade, name });
		return result.id;
	}
}

export class GBIFTaxonomy implements TaxonomyProvider {
	name = 'gbif-taxonomy' as const;
	gbif: GBIF;

	constructor() {
		this.gbif = new GBIF();
	}

	async init() {}

	async parents({ clade, provenance, id }: Option & { id: string }): Promise<Option[]> {
		if (clade === 'kingdom') return [];

		const parents = await this.gbif.one('parents', { id });

		return parents.map((parent) => ({
			provenance,
			...parent,
		}));
	}
}

type GbifParams = {
	parents: {
		id: string;
	};
	id: {
		clade: string;
		name: string;
	};
	info: { id: string };
};

type GbifResponses = {
	parents: Array<{
		clade: string;
		name: string;
		id: string;
	}>;
	id: { id: string | null };
	info: {};
};

export class GBIF extends Datasource<'parents' | 'id' | 'info', GbifParams, GbifResponses> {
	name = 'gbif' as const;

	// GBIF changed their main dataset, see https://techdocs.gbif.org/en/data-processing/taxonomy-interpretation#multiple-taxonomy-support
	datasets = {
		/** @deprecated GBIF Backbone Taxonomy (not updated anymore) */
		backbone: 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c',
		/** Catalogue Of Life eXtended Release (new main GBIF dataset from now on) */
		colxr: '7ddf754f-d193-4cc9-b351-99906754a03b',
	};

	baseURL = 'https://api.gbif.org/v2';

	expirations = {
		file: (now: Date) => addYears(now, 1),
		entry: (now: Date) => addYears(now, 1),
	};

	async init() {}

	requests = {
		id: async (params: GbifParams['id']) => {
			const response = await fetch(
				`${this.baseURL}/taxon/search/${this.datasets.colxr}?${new URLSearchParams({
					taxonRank: params.clade.toUpperCase(),
					nameType: 'SCIENTIFIC',
					searchType: 'EXACT',
					searchContent: 'SCIENTIFIC',
					q: params.name,
					limit: '1',
				})}`
			);

			if (!response.ok) throw new Error(await response.text());

			const Response = type({
				results: type({
					taxonID: 'string',
					scientificName: 'string',
					taxonRank: 'string',
				}).array(),
			});

			const data = Response.assert(await response.json());
			if (!data.results.length) {
				logger.error(
					`${params.clade} "${params.name}" not found in GBIF backbone taxonomy`
				);

				return { id: null };
			}

			const [{ taxonID }] = data.results;

			return { id: taxonID };
		},

		parents: async (params: GbifParams['parents']) => {
			const response = await fetch(
				`${this.baseURL}/taxon/tree/${this.datasets.colxr}/${params.id}`
			);

			if (!response.ok) throw new Error(await response.text());

			const Response = type({
				taxonID: 'string',
				scientificName: 'string',
				taxonRank: 'string',
				// label: 'string',
				taxonomicStatus: 'string',
				children: 'number.integer',
				species: 'number.integer',
			}).array();

			const data = Response.assert(await response.json());

			return data.map((taxon) => ({
				clade: taxon.taxonRank.toLowerCase(),
				name: taxon.scientificName,
				id: taxon.taxonID,
			}));
		},
		info: async (params: GbifParams['info']) => {
			const response = await fetch(
				`${this.baseURL}/taxon/${this.datasets.colxr}/${params.id}/info`
			);

			if (!response.ok) throw new Error(await response.text());

			const Response = type({
				taxonID: 'string',
				'scientificNameAuthorship?': 'string',
				taxonomicStatus: type.enumerated(
					'ACCEPTED',
					'PROVISIONALLY_ACCEPTED',
					'SYNONYM',
					'AMBIGUOUS_SYNONYM',
					'MISAPPLIED',
					'BARE_NAME'
				),
				environment: type(
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
						taxonRank: 'string',
					}).array(),
					/** Heterotypic (taxonomic) synonyms based on different type specimens, grouped by their common basionym. Each inner list represents a homotypic group of names considered synonymous for taxonomic reasons. */
					heterotypic: type({
						taxonID: 'string',
						scientificName: 'string',
						taxonRank: 'string',
					})
						.array()
						.array(),
					/** Names that have been misapplied to this taxon in literature, i.e. used for a different taxon than the one they were originally described for. */
					misapplied: type({
						taxonID: 'string',
						scientificName: 'string',
						taxonRank: 'string',
					}).array(),
				}).partial(),
				'vernacularNames?': type({
					vernacularName: 'string',
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
					'create?': "string.date.iso",
					'title?': 'string',
					'creator?': 'string',
					'license?': 'string',
					'source?': 'string',
					'remarks?': 'string',
				}).array(),
				'distributions?': type({
					/** The identifier for the dataset */
					datasetKey: 'string.uuid',
					/** The unique identifier for this taxon (dwc:taxonID) */
					taxonID: 'string',
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
		},
	};
}

const example = {
	taxonID: '65VFB',
	scientificName: 'Allacma (Allacma) fusca',
	scientificNameAuthorship: '(Linnæus, C, 1758)',
	taxonRank: 'SPECIES',
	label: '<i>Allacma (Allacma) fusca</i> (Linnæus, C, 1758)',
	datasetKey: '7ddf754f-d193-4cc9-b351-99906754a03b',
	parentNameUsageID: '8Z253',
	taxonomicStatus: 'ACCEPTED',
	nomenclaturalCode: 'ZOOLOGICAL',
	references: 'https://www.collembola.org/taxa/smi2inae.htm',
	namePublishedInID: '651833b1-3840-418d-a9ee-b09f53d79aba',
	nameType: 'SCIENTIFIC',
	genericName: 'Allacma',
	infragenericEpithet: 'Allacma',
	specificEpithet: 'fusca',
	environment: ['TERRESTRIAL'],
	taxonomicGroup: 'OtherArthropods',
	taxonRemarks: 'Species fusca (Linnæus, C, 1758:608) Börner, C, 1906:183, t.t., B',
	checklistbankURL: 'https://www.checklistbank.org/dataset/316691/taxon/65VFB',
	classification: [
		{
			taxonID: 'CS5HF',
			scientificName: 'Eukaryota',
			scientificNameAuthorship: '(Chatton, 1925) Whittaker & Margulis, 1978',
			taxonRank: 'DOMAIN',
			label: 'Eukaryota (Chatton, 1925) Whittaker &amp; Margulis, 1978',
		},
		{
			taxonID: 'N',
			scientificName: 'Animalia',
			taxonRank: 'KINGDOM',
			label: 'Animalia',
		},
		{
			taxonID: 'RT',
			scientificName: 'Arthropoda',
			taxonRank: 'PHYLUM',
			label: 'Arthropoda',
		},
		{
			taxonID: 'L2655',
			scientificName: 'Hexapoda',
			taxonRank: 'SUBPHYLUM',
			label: 'Hexapoda',
		},
		{
			taxonID: 'KZS5W',
			scientificName: 'Collembola',
			scientificNameAuthorship: 'Lubbock J, 1870',
			taxonRank: 'CLASS',
			label: 'Collembola Lubbock J, 1870',
		},
		{
			taxonID: '46N',
			scientificName: 'Symphypleona',
			scientificNameAuthorship: 'Börner C, 1901',
			taxonRank: 'ORDER',
			label: 'Symphypleona Börner C, 1901',
		},
		{
			taxonID: '8Z89L',
			scientificName: 'Appendiciphora',
			scientificNameAuthorship: 'Bretfeld, 1986',
			taxonRank: 'SUBORDER',
			label: 'Appendiciphora Bretfeld, 1986',
		},
		{
			taxonID: '8Z89P',
			scientificName: 'Sminthuriformia',
			scientificNameAuthorship: 'Bretfeld, 1986',
			taxonRank: 'INFRAORDER',
			label: 'Sminthuriformia Bretfeld, 1986',
		},
		{
			taxonID: '5NV',
			scientificName: 'Sminthuroidea',
			scientificNameAuthorship: 'Bretfeld, 1994',
			taxonRank: 'SUPERFAMILY',
			label: 'Sminthuroidea Bretfeld, 1994',
		},
		{
			taxonID: 'GCP',
			scientificName: 'Sminthuridae',
			scientificNameAuthorship: 'Lubbock, 1862',
			taxonRank: 'FAMILY',
			label: 'Sminthuridae Lubbock, 1862',
		},
		{
			taxonID: 'KC6',
			scientificName: 'Sminthurinae',
			scientificNameAuthorship: 'Lubbock, 1862',
			taxonRank: 'SUBFAMILY',
			label: 'Sminthurinae Lubbock, 1862',
		},
		{
			taxonID: '628Q6',
			scientificName: 'Allacma',
			scientificNameAuthorship: 'Börner, C, 1906',
			taxonRank: 'GENUS',
			label: '<i>Allacma</i> Börner, C, 1906',
		},
		{
			taxonID: '8Z253',
			scientificName: 'Allacma (Allacma)',
			scientificNameAuthorship: 'Börner C, 1906',
			taxonRank: 'SUBGENUS',
			label: '<i>Allacma (Allacma)</i> Börner C, 1906',
		},
	],
	synonyms: {
		homotypic: [
			{
				taxonID: 'T3KJ5',
				scientificName: 'Sminthurus (Eusminthurus) fuscus',
				scientificNameAuthorship: '(Linnæus, 1758)',
				taxonRank: 'SPECIES',
				label: '<i>Sminthurus (Eusminthurus) fuscus</i> (Linnæus, 1758)',
				taxonomicStatus: 'SYNONYM',
				nomenclaturalCode: 'ZOOLOGICAL',
			},
			{
				taxonID: 'VRPPH',
				scientificName: 'Smynthurus fuscus',
				scientificNameAuthorship: '(Linnæus, 1758)',
				taxonRank: 'SPECIES',
				label: '<i>Smynthurus fuscus</i> (Linnæus, 1758)',
				taxonomicStatus: 'SYNONYM',
				nomenclaturalCode: 'ZOOLOGICAL',
			},
		],
		heterotypic: [
			[
				{
					taxonID: 'LBDZB',
					scientificName: 'Allacma ater',
					scientificNameAuthorship: '(Gervais, 1844)',
					taxonRank: 'SPECIES',
					label: '<i>Allacma ater</i> (Gervais, 1844)',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: 'LBDZF',
					scientificName: 'Allacma buski',
					scientificNameAuthorship: '(Lubbock, 1862)',
					taxonRank: 'SPECIES',
					label: '<i>Allacma buski</i> (Lubbock, 1862)',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '5LVWD',
					scientificName: 'Allacma fusca ab. alba',
					scientificNameAuthorship: 'Stach, J, 1956',
					taxonRank: 'ABERRATION',
					label: '<i>Allacma fusca</i> ab. <i>alba</i> Stach, J, 1956',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '7KVHM',
					scientificName: 'Allacma fusca ab. u-signata',
					scientificNameAuthorship: 'Stach, J, 1956',
					taxonRank: 'ABERRATION',
					label: '<i>Allacma fusca</i> ab. <i>u-signata</i> Stach, J, 1956',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '5M54L',
					scientificName: 'Allacma fusca var. pardalina',
					scientificNameAuthorship: 'Latzel, R, 1917',
					taxonRank: 'VARIETY',
					label: '<i>Allacma fusca</i> var. <i>pardalina</i> Latzel, R, 1917',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '5M54M',
					scientificName: 'Allacma fusca var. picea',
					scientificNameAuthorship: 'Latzel, R, 1917',
					taxonRank: 'VARIETY',
					label: '<i>Allacma fusca</i> var. <i>picea</i> Latzel, R, 1917',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '35WBV',
					scientificName: 'Dicyrtoma fusca',
					scientificNameAuthorship: 'Parona, 1884',
					taxonRank: 'SPECIES',
					label: '<i>Dicyrtoma fusca</i> Parona, 1884',
					taxonomicStatus: 'AMBIGUOUS_SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: 'Q2KJJ',
					scientificName: 'Jeannenotia stachi',
					scientificNameAuthorship: '(Jeannenot, 1955)',
					taxonRank: 'SPECIES',
					label: '<i>Jeannenotia stachi</i> (Jeannenot, 1955)',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
				{
					taxonID: '4Z2TT',
					scientificName: 'Sphyrotheca stachi',
					scientificNameAuthorship: 'Jeannenot, 1957',
					taxonRank: 'SPECIES',
					label: '<i>Sphyrotheca stachi</i> Jeannenot, 1957',
					taxonomicStatus: 'AMBIGUOUS_SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: 'BC8L5',
					scientificName: 'Podura atra',
					scientificNameAuthorship: 'Bourlet, C, 1845',
					taxonRank: 'SPECIES',
					label: '<i>Podura atra</i> Bourlet, C, 1845',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: 'B8H2C',
					scientificName: 'Podura atra',
					scientificNameAuthorship: 'Fabricius, IC, 1775',
					taxonRank: 'SPECIES',
					label: '<i>Podura atra</i> Fabricius, IC, 1775',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '8Z6YT',
					scientificName: 'Podura fusco-nigra',
					scientificNameAuthorship: 'Guthrie, JE, 1903',
					taxonRank: 'SPECIES',
					label: '<i>Podura fusco-nigra</i> Guthrie, JE, 1903',
					taxonomicStatus: 'AMBIGUOUS_SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: 'B8H3K',
					scientificName: 'Podura fusco-nigra',
					scientificNameAuthorship: 'Salmon, JT, 1964',
					taxonRank: 'SPECIES',
					label: '<i>Podura fusco-nigra</i> Salmon, JT, 1964',
					taxonomicStatus: 'AMBIGUOUS_SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '8Z6YR',
					scientificName: 'Podura fusco-nigra',
					scientificNameAuthorship: 'Tullberg, T, 1872',
					taxonRank: 'SPECIES',
					label: '<i>Podura fusco-nigra</i> Tullberg, T, 1872',
					taxonomicStatus: 'AMBIGUOUS_SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: 'B8H3M',
					scientificName: 'Podura globosa',
					scientificNameAuthorship: 'Latreille, PA, 1802',
					taxonRank: 'SPECIES',
					label: '<i>Podura globosa</i> Latreille, PA, 1802',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '4KS3X',
					scientificName: 'Podura globosa',
					scientificNameAuthorship: 'Linnæus, C, 1746',
					taxonRank: 'SPECIES',
					label: '<i>Podura globosa</i> Linnæus, C, 1746',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '8ZNFL',
					scientificName: 'Sminthurus (Eusminthurus) fuscus var. albiceps',
					scientificNameAuthorship: 'Börner, C, 1901',
					taxonRank: 'VARIETY',
					label: '<i>Sminthurus (Eusminthurus) fuscus</i> var. <i>albiceps</i> Börner, C, 1901',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: 'T3KJ7',
					scientificName: 'Sminthurus fuscus',
					scientificNameAuthorship: 'Tullberg, 1871',
					taxonRank: 'SPECIES',
					label: '<i>Sminthurus fuscus</i> Tullberg, 1871',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '5L7L3',
					scientificName: 'Sminthurus fuscus pustulatea',
					scientificNameAuthorship: 'Salmon, JT, 1964',
					taxonRank: 'SUBSPECIES',
					label: '<i>Sminthurus fuscus pustulatea</i> Salmon, JT, 1964',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '5RJSN',
					scientificName: 'Sminthurus fuscus var. atra',
					scientificNameAuthorship: 'Scherbakov, AM, 1898',
					taxonRank: 'VARIETY',
					label: '<i>Sminthurus fuscus</i> var. <i>atra</i> Scherbakov, AM, 1898',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '5RJSR',
					scientificName: 'Sminthurus fuscus var. pustulatus',
					scientificNameAuthorship: 'Krausbauer, 1901',
					taxonRank: 'VARIETY',
					label: '<i>Sminthurus fuscus</i> var. <i>pustulatus</i> Krausbauer, 1901',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '8Z7GM',
					scientificName: 'Sminthurus plumbeus',
					scientificNameAuthorship: 'Claypole, AM, 1898',
					taxonRank: 'SPECIES',
					label: '<i>Sminthurus plumbeus</i> Claypole, AM, 1898',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '4XXD5',
					scientificName: 'Sminthurus purpurascens',
					scientificNameAuthorship: 'Reuter, 1891',
					taxonRank: 'SPECIES',
					label: '<i>Sminthurus purpurascens</i> Reuter, 1891',
					taxonomicStatus: 'AMBIGUOUS_SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '8Z5VK',
					scientificName: 'Smynthurus buskii',
					scientificNameAuthorship: 'Lubbock, J, 1862',
					taxonRank: 'SPECIES',
					label: '<i>Smynthurus buskii</i> Lubbock, J, 1862',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '8Z5VL',
					scientificName: 'Smynthurus buskii',
					scientificNameAuthorship: 'Lubbock, J, 1870',
					taxonRank: 'SPECIES',
					label: '<i>Smynthurus buskii</i> Lubbock, J, 1870',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
			[
				{
					taxonID: '8ZNML',
					scientificName: 'Smynthurus plumbeus',
					scientificNameAuthorship: 'Lemoine, 1882',
					taxonRank: 'SPECIES',
					label: '<i>Smynthurus plumbeus</i> Lemoine, 1882',
					taxonomicStatus: 'SYNONYM',
					nomenclaturalCode: 'ZOOLOGICAL',
				},
			],
		],
		misapplied: [],
	},
	vernacularNames: [
		{
			vernacularName: 'Brun bladkuglespringer',
			language: 'dan',
			countryCode: 'DK',
		},
	],
	media: [],
	distributions: [],
	bibliography: [
		{
			referenceID: '4a582bf4-2fe0-4b71-bbc6-5fd0b97ac013',
			citation:
				'Jeannenot, F. (1957). Contribution à l’étude des Collemboles Sphyrotheca stachi sp. In n.., Acta Zoologica Cracoviensia: Vol. Bd. 2.',
		},
		{
			referenceID: '467dce06-c1d9-4981-aa00-35697f5b4b9b',
			citation:
				'Stach, J. (1956). The Apterygotan Fauna of Poland in Relation to the World-Fauna of this Group of Insects Family. In Sminthuridae (p. 287).',
		},
		{
			referenceID: '651833b1-3840-418d-a9ee-b09f53d79aba',
			citation: 'Linnaeus, C., 1758, Syst. Nat. (10) 1: 608',
		},
		{
			referenceID: '97993425-3644-43a8-bc92-7f1649774c10',
			citation:
				'Guthrie, J. E. (1903). The Collembola of Minnesota., Geol. Nat. Hist. Surv. Minnesota. Zoologie., Bd, 4, 110.',
		},
		{
			referenceID: '718b79de-bd31-4867-b3c8-d583e7c3a206',
			citation:
				'Frenot, Y.; Chown, S. L.; Whinam, J.; Selkirk, P. M.; Convey, P.; Skotnicki, M.; Bergstrom, D. M. (2005). Biological invasions in the Antarctic: extent, impacts and implications. Biological Reviews. 80(1): 45-72.',
		},
		{
			referenceID: '941caff2-b9a1-48d3-a8d0-ee5aad9788a3',
			citation:
				'Latzel, R. (1917). Neue Kollembolen aus den Ostalpen und dem Karstgebiete., Verh. Zool.-Bot. Ges. Wien, Bd, 67.',
		},
		{
			referenceID: 'cd5c5a87-f235-4b79-97d2-daa2c0d26f71',
			citation:
				'Salmon, J. T. (1964). An Index to the Collembola 3 Bde.., Bull. Royal Soc. New Zealand, 7.',
		},
	],
	measurementOrFacts: [],
	identifiers: [
		{
			scope: 'worms',
			title: 'World Register of Marine Species',
			id: 'urn:lsid:marinespecies.org:taxname:1856695',
			url: 'https://www.marinespecies.org/aphia.php?p=taxdetails&id=urn:lsid:marinespecies.org:taxname:1856695',
		},
		{
			scope: 'taxref',
			title: 'TAXREF',
			id: '216415',
			url: 'https://inpn.mnhn.fr/espece/cd_nom/216415',
		},
		{
			scope: 'dyntaxa',
			title: 'Dyntaxa',
			id: 'urn:lsid:dyntaxa.se:Taxon:244956',
			url: 'https://www.dyntaxa.se/taxon/info/urn:lsid:dyntaxa.se:Taxon:244956',
		},
		{
			scope: 'wikidata',
			title: 'Wikidata Q-identifiers',
			id: 'Q4548336',
			url: 'https://www.wikidata.org/wiki/Q4548336',
		},
	],
};
