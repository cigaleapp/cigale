import { ArkErrors } from 'arktype';

import { invalidate } from '$app/navigation';
import { page } from '$app/state';
import { errorMessage } from '$lib/i18n';
import { dependencyURI, get, set } from '$lib/idb.svelte';
import {
	ensureNamespacedMetadataId,
	metadataOptionId,
	namespacedMetadataId
} from '$lib/schemas/metadata';
import { toasts } from '$lib/toasts.svelte';

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
				toasts.error(`Valeur invalide : ${err.summary}`);
			}
		}

		await set('MetadataOption', option).catch((err) => {
			toasts.error(`Impossible de sauvegarder : ${errorMessage(err)}`);
		});

		await invalidate(
			dependencyURI(
				'Metadata',
				namespacedMetadataId(page.params.id, page.params.metadata),
				'options'
			)
		);
	};
}
