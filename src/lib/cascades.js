import { Schemas } from './database.js';
import {
	metadataOptionId,
	namespacedMetadataId,
	parseMetadataOptionId
} from './schemas/metadata.js';
import { entries, groupBy, nonnull, pick, sum } from './utils.js';

/**
 * @import { RuntimeValue } from './metadata.js'
 * @import { DatabaseHandle } from './idb.svelte.js'
 * @import { MetadataEnumVariant } from './database.js'
 */

/**
 * Get all metadata the given MetadataValue cascades into
 * Confidence scores are the sum of confidences of all metadata options that cascade into a metadata
 *
 * For example, if we have the following cascades:
 *
 * - species:40 -> genus:1
 * - species:41 -> genus:1
 * - species:42 -> genus:2
 * - species:44 -> genus:3
 *
 * And make the following call
 *
 * ```js
 * computeCascades({
 *  metadataId: "species",
 *  confidence: 0.4,
 *  value: 40,
 *  alternatives: { "41": 0.3, "42": 0.2, "44": 0.1 }
 * })
 * ```
 *
 * We'll get the following cascades, ready for another round of `storeMetadataValue` calls:
 *
 * ```js
 * // Only one object in the array
 * // since we only have cascades for a single other metadata
 * [
 *  {
 *    metadataId: "genus",
 *    value: "1",
 *    confidence: 0.7, // 0.4 + 0.3, from species:40 and species:41
 *    alternatives: {
 *      "2": 0.2, // from species:42
 *      "3": 0.1  // from species:44
 *    }
 *  }
 * ]
 * ```
 *
 * @param {object} param0
 * @param {import('./idb.svelte.js').DatabaseHandle} param0.db
 * @param {string} param0.metadataId
 * @param {number} param0.confidence
 * @param {RuntimeValue} param0.value
 * @param { Array<{ value: RuntimeValue, confidence: number }> } param0.alternatives
 */
export async function computeCascades({ db, metadataId, confidence, value, alternatives }) {
	return await Promise.all(
		// List of { value, confidence }, that includes the main value as well as the alternatives
		[{ value, confidence }, ...alternatives].map(async ({ confidence, value }) => {
			// Get the cascades for the corresponding metadata option
			const option = await db.get('MetadataOption', metadataOptionId(metadataId, value));
			if (!option?.cascade) return undefined;
			const { cascade } = option;
			return { cascade, confidence };
		})
	).then((options) => {
		// Combine all cascades that lead to the same metadata option, and sum their confidences
		const groupedByOption = groupBy(
			// Get a list of { option id, confidence } for every cascaded value,
			// the confidence coming from the value that triggers it
			options.filter(nonnull).flatMap(({ cascade, confidence }) => {
				return entries(cascade).map(([metadataId, value]) => ({
					optionId: metadataOptionId(metadataId, value),
					confidence
				}));
			}),
			(c) => c.optionId,
			(c) => c.confidence
		);

		// Combine all options of a same metadataId into alternatives.
		// The confidence of every option is the sum of confidences of all
		// cascades that lead to that option
		const groupedByMetadata = groupBy(
			groupedByOption.entries(),
			([optionId]) => parseMetadataOptionId(optionId).metadataId,
			([optionId, confidences]) =>
				/** @type {const} */ ({
					value: parseMetadataOptionId(optionId).key,
					confidence: sum(confidences)
				})
		);

		// Return a list of data ready for storeMetadataValue() for every cascaded metadata
		return [...groupedByMetadata.entries()].map(([metadataId, options]) => {
			const [{ value, confidence }, ...alternatives] = options.toSorted(
				({ confidence: a }, { confidence: b }) => b - a
			);

			return {
				metadataId,
				value,
				confidence,
				alternatives
			};
		});
	});
}

/**
 * @typedef {Record<string, Record<string, { value: string; metadata: string; depth: number, color?: string, icon?: string }>>} CascadeLabelsCache
 */

/**
 * Resolve (recursively) cascades for the given metadata value, return labels to display
 *
 * @param {object} param0
 * @param {CascadeLabelsCache} param0.cache used to store resolved cascades and avoid recomputing them
 * @param {MetadataEnumVariant | undefined} param0.option the currently selected option
 * @param {DatabaseHandle} param0.db
 * @param {string | undefined} param0.protocolId
 */
export async function cascadeLabels({ cache, protocolId, option, db }) {
	if (!protocolId) return {};
	if (!option) return {};

	if (option.key in cache) {
		return cache[option.key];
	}

	/**
	 * Subfunction to recursively collect cascades.
	 * Base case: at some point all options will have no cascades
	 * @param {string} protocolId
	 * @param {Record<string, string>} cascade - The cascade we're collecting from
	 * @param {Set<string>} seen id of metadata already seen, to avoid cycles
	 * @param {number} [depth=0] - Current depth in the cascade
	 */
	async function collect(protocolId, cascade, seen, depth = 0) {
		/**
		 * @type {typeof cache[string]} labels
		 */
		const labels = {};
		for (const [metadataId, value] of Object.entries(cascade ?? {})) {
			if (seen.has(metadataId)) continue; // Avoid cycles
			seen.add(metadataId); // Mark this metadataId as seen
			const metadata = await db
				.get('Metadata', namespacedMetadataId(protocolId, metadataId))
				.then((d) => Schemas.Metadata.assert(d));
			if (!metadata) continue;

			// If the cascaded metadata value is from an enum, use label instead of the key,
			// and see if there are nested cascades further down
			if (metadata.type === 'enum') {
				const option = await db.get(
					'MetadataOption',
					metadataOptionId(namespacedMetadataId(protocolId, metadata.id), value)
				);
				if (!option) continue;
				labels[metadata.id] = {
					value: option.label,
					metadata: metadata.label,
					depth,
					...pick(option, 'color', 'icon')
				};

				if (Object.keys(option.cascade ?? {}).length > 0) {
					await collect(protocolId, option.cascade ?? {}, seen, depth + 1).then(
						(nested) => {
							Object.assign(labels, nested);
						}
					);
				}
			} else {
				// For other types, just show the value directly
				labels[metadata.id] = {
					value: value,
					metadata: metadata.label,
					depth
				};
			}
		}

		return labels;
	}

	cache[option.key] = await collect(protocolId, option.cascade ?? {}, new Set());

	// Halve cache when its size reaches 4000
	if (Object.keys(cache).length > 4000) {
		console.debug('Halving cascadeLabels cache');
		cache = Object.fromEntries(Object.entries(cache).slice(2000));
	}

	return cache[option.key];
}
