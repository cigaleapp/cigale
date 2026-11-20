/** 
 * Defines caching for a single external source, that could be used multiple times by different modules.
 * For example, the GBIF Datasource is both used as a Identifier (GBIF IDs) and as a Taxonomy (we use their taxonomic tree)
 */
export class Datasource {}

export class Module {}

/** Used as starting points to know what species (& higher taxa) to process */
export class Names extends Module {}

/** Used to put a stable, unambiguous and unique identifier in front of each option (species & higher taxa) */
export class Identifier extends Module {}

/** Used to get higher taxa from lower taxa, starting at species and going all the way to kingdoms */
export class Taxonomy extends Module {}

/** Used to add additional info to options (description, images, learn more links, etc.) */
export class Enrich extends Module {}

/** Used to create subsets of options tailored to a specific use case (insects, birds, etc.) */
export class Specialize extends Module {}

/*

process is:

1. gather all names
2. identify all gathered names
3. gather new names from taxonomies
4. identify all newly gathered names
5. enrich gathered names
6. specialize them 

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

theres a blind spot here, idmybee also needs a ton of metadata (each criteria is one) so we need sth outside of just option list generation


*/
