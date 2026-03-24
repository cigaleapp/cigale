import { list } from "$lib/idb.svelte.js";

export async function load() {
	return {
		accounts: await list("Account")
	}
}
