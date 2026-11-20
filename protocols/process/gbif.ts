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
};

type GbifResponses = {
	parents: Array<{
		clade: string;
		name: string;
		id: string;
	}>;
	id: { id: string };
};

export class GBIF extends Datasource<'parents' | 'id', GbifParams, GbifResponses> {
	name = 'gbif' as const;

	datasets = {
		/** GBIF Backbone Taxonomy */
		backbone: 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c',
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
	};
}

export class GBIFID implements Identifier {
	name = 'gbif-id' as const;
	gbif: GBIF;

	constructor() {
		this.gbif = new GBIF();
	}

	async init() {}

	async identify({ clade, name, id }: Option) {
		if (id) return id;
		const result = await this.gbif.request('id', { clade, name });
		return result.id;
	}
}

export class GBIFTaxonomy implements Taxonomy {
	name = 'gbif-taxonomy' as const;
	gbif: GBIF;

	constructor() {
		this.gbif = new GBIF();
	}

	async init() {}

	async parents({ clade, provenance, id }: Option & { id: string }): Promise<Option[]> {
		if (clade === 'kingdom') return [];

		const parents = await this.gbif.request('parents', { id });

		return parents.map((parent) => ({
			provenance,
			...parent,
		}));
	}
}
