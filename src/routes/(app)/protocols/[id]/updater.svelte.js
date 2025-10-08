import { invalidate } from '$app/navigation';
import { page } from '$app/state';
import { errorMessage } from '$lib/i18n';
import { dependencyURI, tables } from '$lib/idb.svelte';
import { toasts } from '$lib/toasts.svelte';
import { ArkErrors } from 'arktype';

/**
 * Update the protocol information, save it to the database.
 * @template T
 * @param {(p: typeof import('$lib/database').Tables.Protocol.inferIn, v: T) => void | Promise<void>} changes
 * @returns {(value: T) => Promise<void>} updater for InlineTextInput
 */
export function updater(changes) {
	return async (value) => {
		if (!page.params.id) return;

		const protocol = await tables.Protocol.raw.get(page.params.id);
		if (!protocol) return;

		try {
			await changes(protocol, value);
		} catch (err) {
			if (err instanceof ArkErrors) {
				toasts.error(`Valeur invalide : ${err.summary}`);
				return;
			}

			throw err;
		}

		await tables.Protocol.set(protocol).catch((err) => {
			toasts.error(`Impossible de sauvegarder : ${errorMessage(err)}`);
		});

		await invalidate(dependencyURI('Protocol', page.params.id));
	};
}
