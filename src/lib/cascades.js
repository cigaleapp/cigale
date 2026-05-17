import { Tables } from './database.js';
import { metadataOption } from './metadata/storage.js';
import {
	metadataOptionId,
	namespacedMetadataId,
	parseMetadataOptionId,
} from './schemas/metadata.js';
import { ensureArray, entries, groupBy, nonnull, sum } from './utils.js';

/**
 * @import * as DB from './database.js'
 * @import { RuntimeValue } from './metadata/index.js'
 * @import { DatabaseHandle } from './idb.svelte.js'
 * @import { MetadataEnumVariant } from './database.js'
 * @import { NamespacedMetadataID } from './schemas/common.js';
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
 * @param { DB.MetadataValue["alternatives"] | Array<{ value: RuntimeValue, confidence: number }> } param0.alternatives
 */
export async function computeCascades({
	db,
	metadataId,
	confidence,
	value,
	alternatives: _alternatives,
}) {
	const alternatives = !Array.isArray(_alternatives)
		? Object.entries(_alternatives).map(([value, confidence]) => ({
				value: /** @type {RuntimeValue} */ (JSON.parse(value)),
				confidence,
			}))
		: _alternatives;

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
				return entries(cascade).flatMap(([metadataId, values]) =>
					ensureArray(values).map((value) => ({
						optionId: metadataOptionId(metadataId, value),
						confidence,
					}))
				);
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
					confidence: sum(confidences),
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
				alternatives,
			};
		});
	});
}

/**
 * @typedef {Record<string, Record<string, { value: string; metadata: string; depth: number, color?: string, icon?: string }>>} CascadeLabelsCache
 */

/**
 * Resolve (NOT recursively anymore, see #1571) cascades for the given metadata value, return labels to display
 *
 * @param {object} param0
 * @param {DB.MetadataEnumVariant | typeof DB.Schemas.MetadataEnumVariant['inferIn'] | undefined} param0.option the currently selected option
 * @param {DatabaseHandle} param0.db
 * @param {string | undefined} param0.protocolId
 */
export async function cascadeLabels({ protocolId, option, db }) {
	if (!protocolId) return {};
	if (!option) return {};

	/** @type {Record<NamespacedMetadataID, DB.MetadataEnumVariant[]>} */
	const labels = {};

	for (const [metadataId, values] of Object.entries(option.cascade ?? {})) {
		const id = namespacedMetadataId(protocolId, metadataId);
		const options = await Promise.all(
			ensureArray(values).map(async (key) => metadataOption(db, id, key))
		);

		labels[id] = options.filter(nonnull).map((option) => Tables.MetadataOption.assert(option));
	}

	return labels;
}
