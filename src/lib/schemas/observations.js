import { type } from 'arktype';

import { Dimensions, ID, References } from './common.js';
import { MetadataErrors, MetadataValues } from './metadata.js';

export const Image = type({
	id: /\d+(_\d+)*/,
	filename: 'string',
	addedAt: 'string.date.iso.parse',
	dimensions: Dimensions,
	metadata: MetadataValues,
	metadataErrors: MetadataErrors.default(() => ({})),
	contentType: /\w+\/\w+/,
	fileId: ID.or('null').describe("ID vers l'objet ImageFile associé"),
	sessionId: ID.describe('ID de la session à laquelle cette image appartient'),
	/** Si les boîtes englobantes ont été analysées. Pratique en particulier pour savoir s'il faut calculer les boîtes englobantes pour une image qui n'a aucune observation associée (chaque bounding box crée une image) */
	boundingBoxesAnalyzed: 'boolean = false'
});

export const Observation = type({
	id: ID,
	sessionId: ID.describe('ID de la session à laquelle cette observation appartient'),
	label: 'string',
	addedAt: 'string.date.iso.parse',
	metadataOverrides: MetadataValues,
	metadataErrors: MetadataErrors.default(() => ({})),
	images: References
});
