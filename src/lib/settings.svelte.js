import { tables } from './idb.svelte.js';

/** @type {import('./database.js').Settings}  */
// @ts-expect-error could be undefined too, but not useful for us
const _settings = $derived(
	tables.Settings.state.find((s) => s.id === 'user') ??
		tables.Settings.state.find((s) => s.id === 'defaults')
);

/**
 * Usage:
 * ```svelte
 * <script>
 *   // $derived is important, otherwise the value will not update
 *   const settings = $derived(getSettings());
 * </script>
 * ```
 * @returns {import('./database.js').Settings} a reactive object that will update when the database changes. Read-only. Use `setSetting` to change values.
 */
export function getSettings() {
	return _settings;
}

/**
 *
 * @param {Key} key
 * @param {import("./database.js").Settings[Key]} value
 * @template {keyof import("./database.js").Settings} Key
 */
export async function setSetting(key, value) {
	console.log('setSetting', key, value);
	const current = (await tables.Settings.get('user')) ?? (await tables.Settings.get('defaults'));

	if (!current) {
		throw new Error("Les réglages par défaut n'ont pas été initialisés. Rechargez la page.");
	}

	return tables.Settings.set({
		...current,
		id: 'user',
		[key]: value
	});
}

/**
 * @typedef {import('./database.js').Settings} Settings
 */

/**
 * Toggle a boolean setting
 * @param {Key} key
 * @template {keyof { [ K in keyof Settings as Settings[K] extends boolean ? K : never ]: Settings[K] } } Key
 */
export async function toggleSetting(key) {
	const current = (await tables.Settings.get('user')) ?? (await tables.Settings.get('defaults'));

	if (!current) {
		throw new Error("Les réglages par défaut n'ont pas été initialisés. Rechargez la page.");
	}

	return tables.Settings.set({
		...current,
		id: 'user',
		[key]: !current[key]
	});
}
