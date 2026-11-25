import { ArkErrors } from 'arktype';

import { errorMessage } from '#lib/i18n.js';
import { databaseHandle, dependencyURI, get, set } from '#lib/idb.svelte.js';
import { findMetadataOption, 

	metadataOptionId,
} from '#lib/metadata/options.ts';
import {
	ensureNamespacedMetadataId,
	namespacedMetadataId,
} from '#lib/schemas/metadata.js';
import { toasts } from '#lib/toasts.svelte.js';
import { invalidate } from '$app/navigation';
import { page } from '$app/state';

/**
 * Update the metadata information, save it to the database.
 * @template T
 * @param {(p: typeof import('#lib/database.js').Tables.MetadataOption.inferIn, v: T) => void | Promise<void>} changes
 * @returns {(value: T) => Promise<void>} updater for InlineTextInput
 */
export function updater(changes) {
	return async (value) => {
		if (!page.params.metadata) return;
		if (!page.params.option) return;
		if (!page.params.id) return;

		const option = await findMetadataOption(
			databaseHandle(),
			ensureNamespacedMetadataId(page.params.metadata, page.params.id),
			page.params.option
		);

		if (!option) return;

		try {
			await changes(option, value);
		} catch (err) {
			if (err instanceof ArkErrors) {
				toasts.error(null, `Valeur invalide : ${err.summary}`);
			}
		}

		await set('MetadataOption', option).catch((err) => {
			toasts.error(null, `Impossible de sauvegarder : ${errorMessage(err)}`);
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
