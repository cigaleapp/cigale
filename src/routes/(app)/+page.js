import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { hashPath } from '$lib/paths';

export async function load({ url }) {
	redirect(307, resolve(`/${url.search}#${hashPath('/import')}`));
}
