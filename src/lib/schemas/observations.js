import { type } from 'arktype';
import { Dimensions, ID, SHA1Hash, References } from './common.js';
import { MetadataValues } from './metadata.js';

export const Image = type({
	id: /\d+(_\d+)*/,
	filename: 'string',
	addedAt: 'string.date.iso.parse',
	dimensions: Dimensions,
	metadata: MetadataValues,
	contentType: /\w+\/\w+/,
	fileId: ID.or('null').describe("ID vers l'objet ImageFile associé"),
	/** Si les boîtes englobantes ont été analysées. Pratique en particulier pour savoir s'il faut calculer les boîtes englobantes pour une image qui n'a aucune observation associée (chaque bounding box crée une image) */
	boundingBoxesAnalyzed: 'boolean = false',
	sha1: SHA1Hash.or('null').default(null)
});

export const Observation = type({
	id: ID,
	label: 'string',
	addedAt: 'string.date.iso.parse',
	metadataOverrides: MetadataValues,
	images: References
});
