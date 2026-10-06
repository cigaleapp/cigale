import { type } from 'arktype';

import { Dimensions, ID, MIMEType, References, URLString } from './common.js';
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
	boundingBoxesAnalyzed: 'boolean = false',
	'remoteUrl?': URLString.describe(
		"URL où le fichier de l'image est accessible, une fois que (par exemple) la session a été mise en ligne via un compte"
	),
});

export const Observation = type({
	id: ID,
	sessionId: ID.describe('ID de la session à laquelle cette observation appartient'),
	label: 'string',
	addedAt: 'string.date.iso.parse',
	metadataOverrides: MetadataValues,
	metadataErrors: MetadataErrors.default(() => ({})),
	images: References,
});

export const ImageFile = type({
	/** ID of the associated Image object */
	id: ID,
	/** @deprecated use $lib/storage/backend.ts:binaryStorage instead */
	bytes: 'ArrayBuffer | "migrated"',
	/** In bytes */
	size: 'number = 0',
	filename: 'string',
	contentType: MIMEType,
	dimensions: Dimensions,
	sessionId: ID,
	'remoteId?': 'string#RemoteImageFileID',
	'remoteUrl?': URLString,
});

export const ImagePreviewFile = type({
	/** ID of the associated Image object */
	id: ID,
	/** @deprecated use $lib/storage/backend.ts:binaryStorage instead */
	bytes: 'ArrayBuffer | "migrated"',
	/** In bytes */
	size: 'number = 0',
	filename: 'string',
	contentType: MIMEType,
	dimensions: Dimensions,
	sessionId: ID,
	'remoteId?': 'string#RemoteImageFileID',
	'remoteUrl?': URLString,
});
