import { type } from 'arktype';

import { ID } from './common.js';
import { MetadataValues } from './metadata.js';

export const Session = type({
	id: ID,
	name: 'string',
	// Date is not compatible with JSON Schemas, use a datestring instead
	createdAt: 'string.date.iso',
	updatedAt: 'string.date.iso',
	description: 'string',
	protocol: ID,
	metadata: MetadataValues
});
