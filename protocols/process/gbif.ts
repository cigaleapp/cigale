import { type } from 'arktype';
import { addYears } from 'date-fns';

import { Datasource, Identifier, Option, Taxonomy } from './modules';

type GbifParams = {
	parents: {
		id: string;
	};
	id: {
		clade: string;
		name: string;
	};
	iucn: {
		id: string;
	};
};

type GbifResponses = {
	parents: Array<{
		clade: string;
		name: string;
		id: string;
	}>;
	id: { id: string };
	iucn: {};
};

export class GBIF extends Datasource<'parents' | 'id' | 'iucn', GbifParams, GbifResponses> {
	name = 'gbif' as const;

	datasets = {
		/** GBIF Backbone Taxonomy */
		backbone: 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c',
		/** IUCN Red List of Threatened Species */
		iucn: '19491596-35ae-4a91-9a98-85cf505f1bd3',
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
				`${this.baseURL}/taxon/search/${this.datasets.backbone}?${new URLSearchParams({
					taxonRank: params.clade.toUpperCase(),
					nameType: 'SCIENTIFIC',
					searchType: 'EXACT',
					searchCotent: 'SCIENTIFIC',
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
				throw new Error(
					`${params.clade} "${params.name}" not found in GBIF backbone taxonomy`
				);
			}

			const [{ taxonID }] = data.results;

			return { id: taxonID };
		},

		parents: async (params: GbifParams['parents']) => {
			const response = await fetch(
				`${this.baseURL}/taxon/tree/${this.datasets.backbone}/${params.id}`
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

		iucn: async ({id}: {id: string}) => {

		}
	};
}

export class GBIFID implements Identifier {
	name = 'gbif-id' as const;
	gbif: GBIF;

	constructor() {
		this.gbif = new GBIF();
	}

	async init() {}

	async identify(option: Option) {
		if (option.id) return option.id;
		const { id } = await this.gbif.request('id', option);
		return id;
	}
}

export class GBIFTaxonomy implements Taxonomy {
	name = 'gbif-taxonomy' as const;
	gbif: GBIF;

	constructor() {
		this.gbif = new GBIF();
	}

	async init() {}

	async parents(option: Option & { id: string }): Promise<Option[]> {
		if (option.clade === 'kingdom') return [];

		const parents = await this.gbif.request('parents', option);

		return parents.map((parent) => ({
			provenance: option.provenance,
			...parent,
		}));
	}
}
