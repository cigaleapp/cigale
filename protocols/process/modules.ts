import type * as DB from '#lib/database.js';

export type ModuleName =
	// species names
	| 'idmybee-species'
	| 'birdnet'
	| 'irit'
	| 'gdrive'
	// identifiers
	| 'colxr'
	// taxonomizers
	| 'gbif-taxonomy'
	// enrichers
	| 'jj'
	| 'gslides'
	| 'idmybee'
	| 'iucn'
	| 'gbif-taxon'
	// specializers
	| 'birds'
	| 'insects'
	| 'collembola'
	| 'bees'
	// debug stuff
	| `debug-${string}`;

export interface Module {
	name: ModuleName;
}

export type OptionExtra = Omit<(typeof DB.Schemas.MetadataEnumVariant)['inferIn'], 'label' | 'key'>;

export type Option = {
	name: string;
	provenance: string;
	clade: string;
	id?: string;
	/** IDs of parent options in the taxonomy sense */
	parents?: Array<{ clade: string; name: string; id: string }>;
	extras?: Array<{
		priority: number;
		extra: OptionExtra;
	}>;
};

/** Used as starting points to know what species (& higher taxa) to process */
export interface NameProvider extends Module {
	scan(): AsyncIterable<Omit<Option, 'provenance'>>;
}

/** Used to put a stable, unambiguous and unique identifier in front of each option (species & higher taxa) */
export interface IdentifierProvider extends Module {
	identify(option: Option): Promise<string | null>;
}

/** Used to get higher taxa from lower taxa, starting at species and going all the way to kingdoms */
export interface TaxonomyProvider extends Module {
	parents(option: Option & { id: string }): Promise<Option[]>;
}

/** Used to register additional info to Option.extras (description, images, learn more links, etc.) */
export interface Enricher extends Module {
	/** Initialize */
	init(): Promise<void>;

	/** Check if the enricher can enrich this option or not (before sending it to enrich()) */
	available(option: Option): boolean;

	/** A very large chunk is given, to allow the module to do its own chunking */
	enrich(options: Option[]): AsyncIterable<{
		id: string;
		extra: OptionExtra;
		/** Used to determine which Enrich wins if multiple Enrich provided the same property on this Option */
		priority: number;
	}>;
}

/** Used to create subsets of options tailored to a specific use case (insects, birds, etc.) */
export interface Specializer extends Module {
	/** The associated protocol ID. Used to namespace the clade metadatas */
	protocolId: string;

	init(): Promise<void>;

	include(option: Option): boolean;
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
