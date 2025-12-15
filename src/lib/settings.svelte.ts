import { tables } from './idb.svelte.js';

/**
 * @import {Settings} from './database.js';
 */

/** @type {Settings}  */
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
 * @returns {Settings} a reactive object that will update when the database changes. Read-only. Use `setSetting` to change values.
 */
export function getSettings() {
	return _settings;
}

export function getColorScheme() {
	return _settings.theme === 'auto' ? 'light dark' : _settings.theme;
}

/**
 *
 * @param {Key} key
 * @param {Settings[Key]} value
 * @template {keyof Settings} Key
 */
export async function setSetting(key, value) {
	console.debug('setSetting', key, value);
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
 * @template {keyof Settings} Key
 * @param {Key} key
 * @param {object} [options]
 * @param {Settings[Key]} [options.fallback] optional fallback value if we can't get settings, instead of throwing
 * @returns {Promise<Settings[Key]>} the current value of the setting
 */
export async function getSetting(key, { fallback } = {}) {
	const current = (await tables.Settings.get('user')) ?? (await tables.Settings.get('defaults'));

	if (!current) {
		if (fallback !== undefined) return fallback;
		throw new Error("Les réglages par défaut n'ont pas été initialisés. Rechargez la page.");
	}

	return current[key];
}

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

export function isDebugMode() {
	return getSettings().showTechnicalMetadata;
}
