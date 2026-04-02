import { redirect } from '@sveltejs/kit';

import { resolve } from '$app/paths';

export async function load({ url }) {
	const destination = new URL(resolve('/sessions/'), url.origin);
	destination.search = url.search;
	redirect(307, destination);
}
