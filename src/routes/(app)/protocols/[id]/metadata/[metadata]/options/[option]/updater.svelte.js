import { invalidate } from '$app/navigation';
import { page } from '$app/state';
import { get, set } from '$lib/idb.svelte';
import { m } from '$lib/paraglide/messages';
import {
	ensureNamespacedMetadataId,
	metadataOptionId,
	namespacedMetadataId
} from '$lib/schemas/metadata';
import { toasts } from '$lib/toasts.svelte';
import { ArkErrors } from 'arktype';

/**
 * Update the metadata information, save it to the database.
 * @template T
 * @param {(p: typeof import('$lib/database').Tables.MetadataOption.inferIn, v: T) => void | Promise<void>} changes
 * @returns {(value: T) => Promise<void>} updater for InlineTextInput
 */
export function updater(changes) {
	return async (value) => {
		if (!page.params.metadata) return;
		if (!page.params.option) return;
		if (!page.params.id) return;

		const option = await get(
			'MetadataOption',
			metadataOptionId(
				ensureNamespacedMetadataId(page.params.metadata, page.params.id),
				page.params.option
			)
		);

		if (!option) return;

		try {
			await changes(option, value);
		} catch (err) {
			if (err instanceof ArkErrors) {
				toasts.error(m.invalid_value({ error: err.summary }));
			}
		}

		await set('MetadataOption', option).catch((err) => {
			toasts.error(m.unable_to_save_changes({ error: err.message }));
		});

		await invalidate(
			`idb://Metadata/${namespacedMetadataId(page.params.id, page.params.metadata)}/options`
		);
	};
}
