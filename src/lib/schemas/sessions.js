import { type } from 'arktype';

import { ID } from './common.js';
import { MetadataValues } from './metadata.js';

export const Session = type({
	id: ID,
	name: 'string',
	createdAt: 'string.date.iso.parse',
	updatedAt: 'string.date.iso.parse',
	description: 'string',
	protocol: ID,
	metadata: MetadataValues.default(() => ({}))
});
