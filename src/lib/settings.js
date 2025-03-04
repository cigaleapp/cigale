import { tables } from './idb';

/**
 *
 * @param {Key} key
 * @param {import("./database").Settings[Key]} value
 * @template {keyof import("./database").Settings} Key
 */
export async function setSetting(key, value) {
	const current = (await tables.Settings.get('user')) ?? (await tables.Settings.get('defaults'));

	if (!current) {
		throw new Error("Les réglages par défaut n'ont pas été initialisés. Rechargez la page.");
	}

	return tables.Settings.set({
		...current,
		layer: 'user',
		[key]: value
	});
}

/**
 *
 * @param {Key} key
 * @template {keyof import("./database").Settings} Key
 */
export async function getSetting(key) {
	const settings = (await tables.Settings.get('user')) ?? (await tables.Settings.get('defaults'));

	if (!settings) {
		throw new Error("Les réglages par défaut n'ont pas été initialisés. Rechargez la page.");
	}

	return settings[key];
}
