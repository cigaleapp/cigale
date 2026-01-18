import { scope, type } from 'arktype';

import { keys } from '$lib/utils.js';

import { ID } from './common.js';
import { MetadataValues } from './metadata.js';

export const SORT_FIELDS = /** @type {const} */ ({
	metadataValue: { label: 'Métadonnée…' },
	metadataConfidence: { label: 'Confiance en…' },
	id: { label: 'ID' },
	name: { label: 'Nom' }
});

export const GROUP_FIELDS = /** @type {const} */ ({
	metadataValue: { label: 'Métadonnée…' },
	metadataPresence: { label: 'Présence de…' },
	metadataConfidence: { label: 'Confiance en…' },
	none: { label: 'Aucun regroupement' }
});

/**
 *
 * @param {keyof typeof SORT_FIELDS | keyof typeof GROUP_FIELDS} field
 * @returns
 */
export function sortOrGroupFieldNeedsMetadata(field) {
	return field.startsWith('metadata');
}

export const SortSettings = type({
	field: type.enumerated(...keys(SORT_FIELDS)),
	'metadata?': ID,
	direction: type.enumerated('asc', 'desc')
});

export const GroupSettings = type({
	field: type.enumerated(...keys(GROUP_FIELDS)),
	'metadata?': ID
});

export const Session = type({
	id: ID,
	name: 'string',
	// Date is not compatible with JSON Schemas, use a datestring instead
	createdAt: 'string.date.iso',
	openedAt: 'string.date.iso',
	description: 'string',
	protocol: ID,
	metadata: MetadataValues,
	sort: type({
		global: SortSettings,
		// Per-tab
		'import?': SortSettings,
		'crop?': SortSettings,
		'classify?': SortSettings
	}).default(() => ({
		global: { field: 'id', direction: 'asc' }
	})),
	group: type({
		global: GroupSettings,
		// Per-tab
		'import?': GroupSettings,
		'crop?': GroupSettings,
		'classify?': GroupSettings
	}).default(() => ({
		global: { field: 'none' }
	})),
	inferenceModels: scope({ ID })
		.type({
			// -1 is for none selected
			'[ID]': 'number.integer >= -1'
		})
		.describe('Maps metadata IDs to selected model indices')
		.default(() => ({}))
});
