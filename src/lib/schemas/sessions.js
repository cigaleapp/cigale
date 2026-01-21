import { scope, type } from 'arktype';

// schemas are imported by scripts that are run by Bun directly, so dont use $lib here
import { keys } from '../utils.js';
import { ID } from './common.js';
import { MetadataValues } from './metadata.js';

export const SORT_FIELDS = /** @type {const} */ ({
	metadataValue: { label: 'Métadonnée…', needsMetadata: true },
	metadataConfidence: { label: 'Confiance en…', needsMetadata: true },
	id: { label: 'ID', needsMetadata: false },
	name: { label: 'Nom', needsMetadata: false }
});

export const GROUP_FIELDS = /** @type {const} */ ({
	metadataValue: { label: 'Métadonnée…', needsMetadata: true },
	metadataPresence: { label: 'Présence de…', needsMetadata: true },
	metadataConfidence: { label: 'Confiance en…', needsMetadata: true },
	none: { label: 'Aucun regroupement', needsMetadata: false }
});

/**
 *
 * @param {"sort" | "group"} task
 * @param {keyof ( typeof SORT_FIELDS & typeof GROUP_FIELDS)} field
 * @returns
 */
export function sortOrGroupFieldNeedsMetadata(task, field) {
	switch (task) {
		// @ts-expect-error
		case 'sort': return SORT_FIELDS[field].needsMetadata
		// @ts-expect-error
		case 'group': return GROUP_FIELDS[field].needsMetadata
	}
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
