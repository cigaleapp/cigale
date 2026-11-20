import type * as DB from '#lib/database.js';

export type DatasourceName = 'gbif' | 'jj' | 'gslides' | 'idmybee';

export type ModuleName =
	// species names
	| 'idmybee-species'
	| 'birdnet'
	| 'collembola-model'
	| 'arthropoda-model'
	// identifiers
	| 'gbif-id'
	// taxonomizers
	| 'gbif-taxonomy'
	// enrichers
	| 'jj'
	| 'gslides'
	| 'idmybee'
	// specializers
	| 'birds'
	| 'insects'
	| 'collembola'
	| 'bees';

/** Contents of a datasource's cache */
export type DatasourceCache<
	Query extends string = string,
	Params extends Record<Query, unknown> = Record<Query, unknown>,
	Responses extends Record<Query, unknown> = Record<Query, unknown>,
> = {
	/** Entire cache needs to be wiped after that date */
	expiresAt: Date;
	entries: {
		[query in Query]: Array<{
			/** This entry needs to be wiped after that date */
			expiresAt: Date;
			params: Params[query];
			response: Responses[query];
		}>;
	};
};

/**
 * Defines caching for a single external source, that could be used multiple times by different modules.
 * For example, the GBIF Datasource is both used as a Identifier (GBIF IDs) and as a Taxonomy (we use their taxonomic tree)
 */
export interface Datasource<
	Query extends string = string,
	Params extends Record<Query, unknown> = Record<Query, unknown>,
	Responses extends Record<Query, unknown> = Record<Query, unknown>,
> {
	/** Name of the datasource. Used to construct the path to the cache file. */
	name: DatasourceName;

	/** Initial loading when the data source is first instantiated. Needs to be idempotent. */
	init?(): Promise<void>;

	/** Handling a request from a module, by first trying to hit the cache, and if it fails, hitting the network/whatever. Response, if it was a cache miss, is saved to cache. */
	request<Q extends Query>(query: Q, params: Params[Q]): Promise<Responses[Q]>;
}

export type Datasources = Record<DatasourceName, Datasource>;

export interface Module {
	name: ModuleName;
	/** Datasources that need to be loaded before using this module (this means calling their .init()) */
	needs: readonly DatasourceName[];
}

export type OptionExtra = Omit<(typeof DB.Schemas.MetadataEnumVariant)['inferIn'], 'label' | 'key'>;

export type Option = {
	name: string;
	provenance: string;
	clade: string;
	id?: string;
	extras?: Array<{
		priority: number;
		extra: OptionExtra;
	}>;
};

/** Used as starting points to know what species (& higher taxa) to process */
export interface Names extends Module {
	scan(data: Datasources): AsyncIterable<Option>;
}

/** Used to put a stable, unambiguous and unique identifier in front of each option (species & higher taxa) */
export interface Identifier extends Module {
	identify(data: Datasources, option: Option): string;
}

/** Used to get higher taxa from lower taxa, starting at species and going all the way to kingdoms */
export interface Taxonomy extends Module {
	parent(data: Datasources, option: Option): Promise<Option[]>;
}

/** Used to register additional info to Option.extras (description, images, learn more links, etc.) */
export interface Enrich extends Module {
	priority: number;
	enrich(
		data: Datasources,
		option: Option
	): Promise<{
		extra: OptionExtra;
		/** Used to determine which Enrich wins if multiple Enrich provided the same property on this Option */
		priority: number;
	}>;
}

/** Used to create subsets of options tailored to a specific use case (insects, birds, etc.) */
export interface Specialize extends Module {
	include(data: Datasources, option: Option): Promise<boolean>;
}

/*

process is:

1. gather all names
2. identify all gathered names
3. gather new names from taxonomies
4. identify all newly gathered names
5. enrich gathered names
6. specialize them
7. enrich specialized options 

in practice:

1. from classmappings of all models & xper3-listed (IDmyBee) 
[name, provenance, clade]
2. via GBIF search
[id, name, provenance, clade]
3. via GBIF taxonomy
[id, name, provenance, clade]
4. noop (GBIF taxonomy already provides the ID, so passthrough here)
5. via JJ, GSlides, IDmyBee, GBIF (& more to come!)
[id, name, provenance, clade, description, learnMore, images, etc.]
6. from classmappings of models: collembola (-> collembola), arthropoda (-> insects), birdnet (-> birds), and xper3-listed: idmybee (-> bees)
7. special case for idmybee: we need to add additional cascades

theres a blind spot here, idmybee also needs a ton of metadata (each criteria is one) so we need sth outside of just option list generation


*/
