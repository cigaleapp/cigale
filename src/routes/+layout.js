import { openDatabase } from '$lib/idb';

export async function load() {
	const db = await openDatabase();
	return {
		db,
		showInputHints: await db.get('Settings', '_').then((settings) => settings?.showInputHints)
	};
}
