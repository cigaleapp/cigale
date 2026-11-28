import { GBIF } from '../datasources/gbif.js';
import { Enricher, IdentifierProvider, Option, TaxonomyProvider } from '../lib/modules.js';

export class CoLXR implements IdentifierProvider {
	name = 'colxr' as const;
	gbif: GBIF;

	constructor() {
		this.gbif = new GBIF();
	}

	async init() {}

	async identify({ clade, name, id }: Option) {
		if (id) return id;

		const { firstResult } = await this.gbif.one('search', {
			dataset: 'colxr',
			clade,
			name,
		});

		return firstResult?.id ?? null;
	}
}

export class GBIFTaxonomy implements TaxonomyProvider {
	name = 'gbif-taxonomy' as const;
	gbif: GBIF;

	constructor() {
		this.gbif = new GBIF();
	}

	async init() {}

	async parents({ clade, provenance, name }: Option & { id: string }): Promise<Option[]> {
		if (clade === 'kingdom') return [];

		// re-use search so that its cached
		// we could also use gbif.one("taxon") but this would mean
		// not making use of the cached search result
		// if we don't use the enricher (that does need gbif.one("taxon"))
		const { firstResult } = await this.gbif.one('search', {
			dataset: 'colxr',
			clade,
			name,
		});

		if (!firstResult) throw new Error('not in gbif');

		return firstResult.parents.map(({ clade, ...rest }) => ({
			provenance,
			clade: clade.toLowerCase(),
			...rest,
		}));
	}
}

export class GBIFTaxonInfo implements Enricher {
	name = 'gbif-taxon' as const;
	gbif: GBIF;

	constructor() {
		this.gbif = new GBIF();
	}

	async init() {}

	available(): boolean {
		return true;
	}

	async *enrich(options: Option[]) {
		for (const { id } of options) {
			if (!id) continue;

			const data = await this.gbif.one('taxon', {
				dataset: 'colxr',
				id,
			});
			if (!data) continue;

			yield {
				id,
				priority: 0,
				extra: {
					learnMore: `https://gbif.org/taxon/${data.taxonID}`,
					// TODO: use iNat API instead, see file://./main.ts
					// TODO: add license info (see #2315)
					images: data.images.slice(0, 5).map((m) => m.identifier),
					synonyms: [
						...data.vernacularNames
							.filter(
								(name) => name.language && ['eng', 'fra'].includes(name.language)
							)
							.map((name) => name.vernacularName),
						...data.homotypicSynonyms.map((syn) => syn.scientificName),
					],
				},
			};
		}
	}
}

export class GBIFOldBackboneIDs implements Enricher {
	name = 'gbif-old-id' as const;
	gbif: GBIF;

	constructor() {
		this.gbif = new GBIF();
	}

	async init() {}

	available(): boolean {
		return true;
	}

	async *enrich(options: Option[]) {
		for (const { id, clade, name } of options) {
			if (!id) continue;

			const { firstResult } = await this.gbif.one('search', {
				dataset: 'old-backbone',
				clade,
				name,
			});

			if (!firstResult) continue;

			yield {
				id,
				priority: 0,
				extra: {
					extraKeys: [firstResult.id],
				},
			};
		}
	}
}
