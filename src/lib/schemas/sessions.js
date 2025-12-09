import { scope, type } from 'arktype';

import { ID } from './common.js';
import { MetadataValues } from './metadata.js';

export const Session = type({
	id: ID,
	name: 'string',
	// Date is not compatible with JSON Schemas, use a datestring instead
	createdAt: 'string.date.iso',
	openedAt: 'string.date.iso',
	description: 'string',
	protocol: ID,
	metadata: MetadataValues,
	inferenceModels: scope({ ID })
		.type({
			// -1 is for none selected
			'[ID]': 'number.integer >= -1'
		})
		.describe('Maps metadata IDs to selected model indices')
		.default(() => ({}))
});
