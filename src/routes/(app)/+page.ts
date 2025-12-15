import { redirect } from '@sveltejs/kit';

// We use $app/paths' resolve, so that the base path is included in the URL
import { resolve } from '$app/paths';

// Go to #/sessions but keep url search params
export async function load({ url }) {
	let destination = new URL(resolve('/sessions'), url.origin);
	destination.search = url.search;
	redirect(307, destination);
}
