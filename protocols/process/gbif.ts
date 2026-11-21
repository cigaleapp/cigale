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
};

type GbifResponses = {
	parents: Array<{
		clade: string;
		name: string;
		id: string;
	}>;
	id: { id: string | null };
};

export class GBIF extends Datasource<'parents' | 'id', GbifParams, GbifResponses> {
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
	};
}
