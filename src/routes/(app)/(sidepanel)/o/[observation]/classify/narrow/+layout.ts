import { openDatabase } from '$lib/idb.svelte.js';

export async function load() {
	await openDatabase();
}
