import { redirect } from '@sveltejs/kit';

import { resolve } from '$app/paths';
import { href } from '$lib/paths';

export async function load({ url }) {
	const { origin, pathname, hash } = new URL(href('/'))
	redirect(307, `${origin}${pathname}${url.search}${hash}`);
}
