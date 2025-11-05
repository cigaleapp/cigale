import { redirect } from '@sveltejs/kit';

import { resolve } from '$lib/paths';

// Go to #/import but keep url search params
export async function load({ url }) {
	let destination = new URL(resolve('/import'), url.origin);
	destination.search = url.search;
	redirect(307, destination);
}
