import { errorMessage } from '#lib/i18n.js';
import { dependencyURI, tables } from '#lib/idb.svelte.js';
import { toasts } from '#lib/toasts.svelte.js';
import { ArkErrors } from 'arktype';

import { invalidate } from '$app/navigation';
import { page } from '$app/state';

/**
 * Update the protocol information, save it to the database.
 * Return `false` from `changes` to skip saving to database and triggering load function reruns.
 * @template T
 * @param {(p: typeof import('#lib/database.js').Tables.Protocol.inferIn, ...v: T[]) => void | false | Promise<void | false>} changes
 * @returns {(...value: NoInfer<T[]>) => Promise<void>} updater for InlineTextInput
 */
export function updater(changes) {
	return async (...value) => {
		if (!page.params.id) return;

		const protocol = await tables.Protocol.raw.get(page.params.id);
		if (!protocol) return;

		/** @type {boolean} */
		let needsUpdate;

		try {
			const result = await changes(protocol, ...value);
			needsUpdate = result !== false;
		} catch (err) {
			if (err instanceof ArkErrors) {
				toasts.error(`Valeur invalide : ${err.summary}`);
				return;
			}

			throw err;
		}

		if (!needsUpdate) return;

		await tables.Protocol.set(protocol).catch((err) => {
			toasts.error(`Impossible de sauvegarder : ${errorMessage(err)}`);
		});

		await invalidate(dependencyURI('Protocol', page.params.id));
	};
}
