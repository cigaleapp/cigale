import { ArkErrors } from 'arktype';

import { invalidate } from '$app/navigation';
import { page } from '$app/state';
import { errorMessage } from '$lib/i18n';
import { dependencyURI, tables } from '$lib/idb.svelte';
import { namespacedMetadataId } from '$lib/schemas/metadata';
import { toasts } from '$lib/toasts.svelte';

/**
 * Update the metadata information, save it to the database.
 * @template T
 * @param {(p: typeof import('$lib/database').Tables.Metadata.inferIn, v: T) => void | Promise<void>} changes
 * @returns {(value: T) => Promise<void>} updater for InlineTextInput
 */
export function updater(changes) {
	return async (value) => {
		if (!page.params.metadata) return;
		if (!page.params.id) return;

		const metadata = await tables.Metadata.raw.get(
			namespacedMetadataId(page.params.id, page.params.metadata)
		);
		if (!metadata) return;

		const metadataBefore = structuredClone(metadata);
		try {
			await changes(metadata, value);
		} catch (err) {
			toasts.error(
				`Valeur invalide : ${err instanceof ArkErrors ? err.summary : errorMessage(err)}`
			);
			return;
		}

		if (JSON.stringify(metadataBefore) === JSON.stringify(metadata)) {
			return;
		}

		await tables.Metadata.set(metadata).catch((err) => {
			toasts.error(`Impossible de sauvegarder : ${errorMessage(err)}`);
		});

		await invalidate(
			dependencyURI('Metadata', namespacedMetadataId(page.params.id, page.params.metadata))
		);
	};
}
