import type * as DB from '#lib/database.js';
import type { DatabaseHandle } from '#lib/idb.svelte.js';
import type { NamespacedMetadataID } from '#lib/schemas/common.js';
import type { RuntimeValue } from '#lib/schemas/metadata.js';

import { Tables } from '#lib/database.js';
import { resolveMetadataId } from '#lib/metadata/namespacing.js';
import { findMetadataOption, parseMetadataOptionId } from '#lib/metadata/options.js';
import { metadataOption } from '#lib/metadata/storage.js';
import { namespaceOfMetadataId } from '#lib/schemas/metadata.js';
import { ensureArray, entries, groupBy, nonnull, sum } from '#lib/utils.js';

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
 *  confidences: { "41": 0.3, "42": 0.2, "44": 0.1 }
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
 *    confidences: {
 *      "2": 0.2, // from species:42
 *      "3": 0.1  // from species:44
 *    }
 *  }
 * ]
 * ```
 *
 */
export async function computeCascades({
	db,
	metadataId,
	confidence,
	value,
	confidences: _confidences,
}: {
	db: DatabaseHandle;
	metadataId: NamespacedMetadataID;
	confidence: number;
	value: RuntimeValue;
	confidences:
		DB.MetadataValue['confidences'] | Array<{ value: RuntimeValue; confidence: number }>;
}): Promise<
	{
		metadataId: NamespacedMetadataID;
		value: string;
		confidence: number;
		confidences: { value: string; confidence: number }[];
	}[]
> {
	const protocolId = namespaceOfMetadataId(metadataId);
	if (!protocolId) {
		throw new Error(`Metadata ${metadataId} is not namespaced, cannot cascade`);
	}

	const protocol = await db.get('Protocol', protocolId);
	if (!protocol) {
		throw new Error(`Metadata ${metadataId} is namespaced to unknown protocol ${protocolId}`);
	}

	const confidences = !Array.isArray(_confidences)
		? Object.entries(_confidences).map(([value, confidence]) => ({
				value: /** @type {RuntimeValue} */ JSON.parse(value),
				confidence,
			}))
		: _confidences;

	return await Promise.all(
		// List of { value, confidence }, that includes the main value as well as the alternatives
		[{ value, confidence }, ...confidences].map(async ({ confidence, value }) => {
			// Get the cascades for the corresponding metadata option
			const option = await findMetadataOption(db, metadataId, value);
			if (!option?.cascade) return undefined;
			const { cascade } = option;
			return { cascade, confidence };
		})
	).then(async (options) => {
		// Combine all cascades that lead to the same metadata option, and sum their confidences
		const groupedByOption = groupBy(
			// Get a list of { option id, confidence } for every cascaded value,
			// the confidence coming from the value that triggers it
			await Promise.all(
				options.filter(nonnull).flatMap(({ cascade, confidence }) =>
					entries(cascade).flatMap(([metadataId, values]) =>
						ensureArray(values).map(async (value) => {
							const id = resolveMetadataId(protocol, metadataId);
							if (!id) return;
							const option = await findMetadataOption(db, id, value);
							if (!option) return;

							return {
								optionId: option.id,
								confidence,
							};
						})
					)
				)
			),
			(c) => c?.optionId,
			(c) => c?.confidence ?? 0
		);

		// Combine all options of a same metadataId into alternatives.
		// The confidence of every option is the sum of confidences of all
		// cascades that lead to that option
		const groupedByMetadata = groupBy(
			groupedByOption.entries(),
			([optionId]) => {
				if (!optionId) return;
				return resolveMetadataId(protocol, parseMetadataOptionId(optionId).metadataId);
			},
			([optionId, confidences]) => {
				if (!optionId) return;
				return {
					value: parseMetadataOptionId(optionId).key,
					confidence: sum(confidences),
				};
			}
		);

		// For cascades that aren't part of this protocol
		groupedByMetadata.delete(undefined);

		// Return a list of data ready for storeMetadataValue() for every cascaded metadata
		return [...groupedByMetadata.entries()].map(([metadataId, options]) => {
			const [{ value, confidence }, ...confidences] = options
				.filter(nonnull)
				.toSorted(({ confidence: a }, { confidence: b }) => b - a);

			return {
				metadataId: metadataId!,
				value,
				confidence,
				confidences,
			};
		});
	});
}

/**
 * Resolve (NOT recursively anymore, see #1571) cascades for the given metadata value, return labels to display
 */
export async function cascadeLabels({
	protocolId,
	/** The currently selected option */
	option,
	db,
}: {
	option: DB.MetadataEnumVariant | (typeof DB.Schemas.MetadataEnumVariant)['inferIn'] | undefined;
	db: DatabaseHandle;
	protocolId: string | undefined;
}) {
	if (!protocolId) return {};
	if (!option) return {};

	const protocol = await db.get('Protocol', protocolId);
	if (!protocol) return {};

	/** @type {Record<NamespacedMetadataID, DB.MetadataEnumVariant[]>} */
	const labels: Record<NamespacedMetadataID, DB.MetadataEnumVariant[]> = {};

	for (const [metadataId, values] of Object.entries(option.cascade ?? {})) {
		const id = resolveMetadataId(protocol, metadataId);
		if (!id) continue;

		const options = await Promise.all(
			ensureArray(values).map(async (key) => metadataOption(db, id, key))
		);

		labels[id] = options.filter(nonnull).map((option) => Tables.MetadataOption.assert(option));
	}

	return labels;
}
