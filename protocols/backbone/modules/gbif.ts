import { type } from 'arktype';

import { GBIFCache, GbifIucnRedListCategory, GbifSpecies } from '../caching.ts';
import { Module } from '../module.ts';
import { entries } from '../utils.ts';

const IUCN_CODES = {
	EXTINCT: 'ex',
	EXTINCT_IN_THE_WILD: 'ew',
	REGIONALLY_EXTINCT: 're',
	CRITICALLY_ENDANGERED: 'cr',
	ENDANGERED: 'en',
	VULNERABLE: 'vu',
	NEAR_THREATENED: 'nt',
	LEAST_CONCERN: 'lc',
	DATA_DEFICIENT: 'dd',
	NOT_APPLICABLE: 'na',
	NOT_EVALUATED: 'ne'
} as const satisfies Record<GbifIucnRedListCategory['category'], string>;

const GBIF_RANKS = {
	KINGDOM: 'kingdom',
	PHYLUM: 'phylum',
	ORDER: 'order',
	CLASS: 'class',
	FAMILY: 'family',
	GENUS: 'genus',
	SPECIES: 'species'
} as const;

const GBIFRank = type.enumerated(...entries(GBIF_RANKS).map(([key]) => key));

export const module: Module<{
	cache: GBIFCache;
	species: Map<
		number,
		null | {
			clade: (typeof GBIF_RANKS)[keyof typeof GBIF_RANKS];
			species: GbifSpecies;
			iucn?: Pick<GbifIucnRedListCategory, 'category'>;
			synonyms: string[];
			parent: number | undefined;
		}
	>;
}> = {
	name: 'GBIF',
	data: {
		species: new Map(),
		cache: new GBIFCache({
			local: Bun.file('gbif.json'),
			online: new URL('https://github.com/cigaleapp/models/raw/refs/heads/main/gbif.json')
		})
	},
	async totalSteps(protocol) {
		return protocol.metadata.species.options!.length;
	},
	async prepare(protocol) {
		await this.data.cache.initialize();
		if (protocol.metadata.species.type !== 'enum') throw 'metadata.species is not an enum';

		this.data.species = new Map(
			protocol.metadata.species.options!.map((o) => [Number.parseInt(o.key), null])
		);
	},
	async *run() {
		const { cache, species } = this.data;

		const keys = structuredClone([...species.keys()]);

		let done = 0;
		for (const initialId of keys) {
			done++;

			let id: number | undefined = initialId;
			while (id !== undefined) {
				const data = await cache.fetch(id);
				if (!data) {
					console.warn(`No species found for GBIF ID ${initialId}`);
					break;
				}

				species.set(id, {
					clade: GBIF_RANKS[GBIFRank.assert(data.rank)],
					species: data,
					parent: data.parentKey,
					synonyms: cache.get(`${id}/synonyms`) ?? [],
					iucn: cache.get(`${id}/iucnRedListCategory`) ?? { category: 'NOT_EVALUATED' }
					// .then((res) => res ?? { category: 'NOT_EVALUATED' })
				});

				id = species.get(id)?.parent;
			}

			if (done % 1_000 === 0) yield done;
		}
	},
	apply(protocol) {
		for (const [id, sp] of this.data.species) {
			if (!sp) continue;

			const { clade, species, iucn, parent } = sp;

			const metadata = protocol.metadata[clade];
			if (metadata.type !== 'enum') throw `${clade} is not enum`;

			let idx = metadata.options!.findIndex((o) => o.key === id.toString());
			if (idx === -1) {
				idx =
					metadata.options!.push({
						key: id.toString(),
						label: ''
					}) - 1;
			}

			const option = metadata.options![idx];

			if (!option) throw 'crashout';

			option.label = species[clade];
			option.learnMore = `https://gbif.org/species/${id}`;

			option.cascade ??= {};

			if (iucn && iucn.category !== 'NOT_EVALUATED') {
				option.cascade.conservation_status = IUCN_CODES[iucn.category] ?? 'ne';
			}

			if (parent !== undefined) {
				const p = this.data.species.get(parent);
				if (!p) throw `unknown parent ${parent}`;

				option.cascade[p.clade] = parent.toString();
			}
		}
	}
};

export default module;
