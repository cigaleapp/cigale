import { openDatabase } from '$lib/idb.svelte.js';

export async function load() {
	const db = await openDatabase();
	return { db };
}
