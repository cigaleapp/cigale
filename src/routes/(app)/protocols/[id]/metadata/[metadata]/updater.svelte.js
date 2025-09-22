import { invalidate } from '$app/navigation';
import { page } from '$app/state';
import { tables } from '$lib/idb.svelte';
import { m } from '$lib/paraglide/messages';
import { toasts } from '$lib/toasts.svelte';
import { ArkErrors } from 'arktype';

/**
 * Update the metadata information, save it to the database.
 * @template T
 * @param {(p: typeof import('$lib/database').Tables.Metadata.inferIn, v: T) => void | Promise<void>} changes
 * @returns {(value: T) => Promise<void>} updater for InlineTextInput
 */
export function updater(changes) {
	return async (value) => {
		if (!page.params.metadata) return;

		const metadata = await tables.Metadata.raw.get(page.params.metadata);
		if (!metadata) return;

		try {
			await changes(metadata, value);
		} catch (err) {
			if (err instanceof ArkErrors) {
				toasts.error(m.invalid_value({ error: err.summary }));
			}
		}

		await tables.Metadata.set(metadata).catch((err) => {
			toasts.error(m.unable_to_save_changes({ error: err.message }));
		});

		await invalidate((url) => {
			return url.pathname.includes(`/protocols/${page.params.id}`);
		});
	};
}
