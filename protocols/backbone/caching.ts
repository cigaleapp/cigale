import { BunFile } from 'bun';

export class GBIFCache<
	Entries = Record<number, GbifSpecies> &
		Record<`${number}/synonyms`, string[]> &
		Record<'#updatedAt', string> &
		Record<`${number}/iucnRedListCategory`, GbifIucnRedListCategory>
> {
	#localFile: BunFile;
	#onlineUrl: URL;
	#entries = {} as Entries;
	#errors = {} as Record<keyof Entries & (string | number), string>;

	constructor({ local, online }: { local: BunFile; online: URL }) {
		this.#localFile = local;
		this.#onlineUrl = online;
	}

	async initialize() {
		this.#entries = (await this.#localFile.exists())
			? await this.#localFile.text().then((text) => JSON.parse(text))
			: await fetch(this.#onlineUrl).then((res) => res.json());

		void this.#localFile.write(JSON.stringify(this.#entries, null, 2));
	}

	get<Path extends keyof Entries & (string | number)>(path: Path): Entries[Path] | undefined {
		if (this.#entries[path]) {
			return this.#entries[path];
		}

		if (this.#errors[path]) {
			throw new Error(`GBIF API request failed: ${this.#errors[path]}`);
		}
	}

	async fetch<Path extends keyof Entries & (string | number)>(
		path: Path
	): Promise<Entries[Path]> {
		if (this.#entries[path]) {
			return this.#entries[path];
		}

		if (this.#errors[path]) {
			throw new Error(`GBIF API request failed: ${this.#errors[path]}`);
		}

		console.debug(`Cache miss for ${path}`);

		const response = await fetch(`https://api.gbif.org/v1/species/${path}`);
		if (!response.ok) {
			this.#errors[path] = response.status + ': ' + (await response.text());
			throw new Error(`GBIF API request failed: ${this.#errors[path]}`);
		}

		let data = await response.json();

		if (path.toString().endsWith('/synonyms')) {
			data = data.results.map((result: GbifSpecies) => result.canonicalName).filter(Boolean);
		}

		this.#entries[path] = data;
		return data;
	}
}

export interface GbifSpecies {
	key: number;
	nubKey: number;
	nameKey: number;
	taxonID: string;
	sourceTaxonKey: number;
	kingdom: string;
	phylum: string;
	order: string;
	family: string;
	genus: string;
	species: string;
	kingdomKey: number;
	phylumKey: number;
	classKey: number;
	orderKey: number;
	familyKey: number;
	genusKey: number;
	speciesKey: number;
	datasetKey: string;
	constituentKey: string;
	parentKey?: number;
	parent: string;
	basionymKey: number;
	basionym: string;
	scientificName: string;
	canonicalName: string;
	authorship: string;
	nameType: string;
	rank: string;
	origin: string;
	taxonomicStatus:
		| 'ACCEPTED'
		| 'DOUBTFUL'
		| 'SYNONYM'
		| 'HETEROTYPIC_SYNONYM'
		| 'HOMOTYPIC_SYNONYM'
		| 'PROPARTE_SYNONYM'
		| 'MISAPPLIED';
	nomenclaturalStatus: unknown;
	remarks: string;
	numDescendants: number;
	lastCrawled: string;
	lastInterpreted: string;
	issues: unknown;
	class: string;
}

export interface GbifIucnRedListCategory {
	/** The taxonomic threat status as given in our https://api.gbif.org/v1/enumeration/basic/ThreatStatus[ThreatStatus enum]. */
	category:
		| 'EXTINCT'
		| 'EXTINCT_IN_THE_WILD'
		| 'REGIONALLY_EXTINCT'
		| 'CRITICALLY_ENDANGERED'
		| 'ENDANGERED'
		| 'VULNERABLE'
		| 'NEAR_THREATENED'
		| 'LEAST_CONCERN'
		| 'DATA_DEFICIENT'
		| 'NOT_APPLICABLE'
		| 'NOT_EVALUATED';
	usageKey: number;
	/** The name usage “taxon“ key to which this Red List category applies. */
	scientificName: string;
	/** The taxonomic status of the name. */
	taxonomicStatus:
		| 'ACCEPTED'
		| 'DOUBTFUL'
		| 'SYNONYM'
		| 'HETEROTYPIC_SYNONYM'
		| 'HOMOTYPIC_SYNONYM'
		| 'PROPARTE_SYNONYM'
		| 'MISAPPLIED';
	/** The accepted name, if the name is a synonym. */
	acceptedName: string;
	/** The accepted name's usage key, if the name is a synonym. */
	acceptedUsageKey: number;
	/** The original IUCN identifier used for the name usage. */
	iucnTaxonID: string;
	/** The code for the taxonomic threat status as given in our https://api.gbif.org/v1/enumeration/basic/ThreatStatus[ThreatStatus enum]. */
	code: string;
}
