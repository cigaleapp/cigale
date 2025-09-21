import { tables } from '$lib/idb.svelte.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const protocol = await tables.Protocol.get(params.id);
	console.info('Loaded protocol from load function', protocol);
	if (!protocol) error(404, `Protocole ${params.id} introuvable`);
	return protocol;
}
