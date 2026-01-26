import { scope, type } from 'arktype';

// schemas are imported by scripts that are run by Bun directly, so dont use $lib here
import { keys } from '../utils.js';
import { ID } from './common.js';
import { MetadataValues } from './metadata.js';

/**
 * @import * as DB from '$lib/database.js';
 */

export const SORT_FIELDS = /** @type {const} */ ({
	metadataValue: { label: 'Métadonnée…', needsMetadata: true },
	metadataConfidence: { label: 'Confiance en…', needsMetadata: true },
	id: { label: 'ID', needsMetadata: false },
	name: { label: 'Nom', needsMetadata: false }
});

export const GROUP_FIELDS = /** @type {const} */ ({
	metadataValue: { label: 'Métadonnée…', needsMetadata: true, needsTolerance: true },
	metadataPresence: { label: 'Présence de…', needsMetadata: true, needsTolerance: false },
	metadataConfidence: { label: 'Confiance en…', needsMetadata: true, needsTolerance: false },
	none: { label: 'Aucun regroupement', needsMetadata: false, needsTolerance: false }
});

export const GROUPING_TOLERANCES = /** @type {const} */ ({
	dates: {
		label: 'Dates',
		help: 'Précision des dates',
		affectedTypes: /** @type {DB.MetadataType[]} */ (['date']),
		options: {
			year: { scientific: '', casual: 'Par année' },
			month: { scientific: '', casual: 'Par mois' },
			day: { scientific: '', casual: 'Par jour' },
			hour: { scientific: '', casual: 'Par heure' },
			minute: { scientific: '', casual: 'Par minute' }
		}
	},
	decimal: {
		label: 'Nombres',
		help: 'Précision des nombres',
		affectedTypes: /** @type {DB.MetadataType[]} */ ([
			'integer',
			'float',
			'boundingbox',
			'location'
		]),
		options: {
			giga: { scientific: 'G', casual: 'Au milliard' },
			mega: { scientific: 'M', casual: 'Au million' },
			kilo: { scientific: 'k', casual: 'Au millier' },
			hecto: { scientific: '100', casual: 'À la centaine' },
			deca: { scientific: '10', casual: 'À la dizaine' },
			unit: { scientific: '1', casual: "À l'entier" },
			deci: { scientific: '0.1', casual: 'Au dixième' },
			centi: { scientific: '0.01', casual: 'Au centième' },
			milli: { scientific: 'm', casual: 'Au millième' },
			micro: { scientific: 'µ', casual: 'Au millionième' },
			nano: { scientific: 'n', casual: 'Au milliardième' }
		}
	}
});

export const FULLSCREEN_CLASSIFY_LAYOUTS = /** @type {const} */ (['top-bottom', 'left-right']);

/**
 * @param {['sort', keyof typeof SORT_FIELDS] | ['group', keyof typeof GROUP_FIELDS]} param0 [task, field]
 * @returns {boolean}
 */
export function sortOrGroupFieldNeedsMetadata(...[task, field]) {
	switch (task) {
		case 'sort':
			return SORT_FIELDS[field].needsMetadata;
		case 'group':
			return GROUP_FIELDS[field].needsMetadata;
	}
}

export const SortSettings = type({
	field: type.enumerated(...keys(SORT_FIELDS)),
	'metadata?': ID,
	direction: type.enumerated('asc', 'desc')
});

export const GroupSettings = type({
	field: type.enumerated(...keys(GROUP_FIELDS)),
	'metadata?': ID,
	tolerances: type({
		dates: type.enumerated(...keys(GROUPING_TOLERANCES.dates.options)),
		decimal: type.enumerated(...keys(GROUPING_TOLERANCES.decimal.options))
	}).default(() => ({
		dates: 'day',
		decimal: 'unit'
	}))
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
	fullscreenClassifier: type({
		layout: type.enumerated(...FULLSCREEN_CLASSIFY_LAYOUTS),
		'focusedMetadata?': ID
	}).default(() => ({
		layout: 'top-bottom'
	})),
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
