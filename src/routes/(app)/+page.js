import { hashPath } from '$lib/paths';
import { redirect } from '@sveltejs/kit';

export async function load({ url }) {
	redirect(307, `/${url.search}#${hashPath('/import')}`);
}
