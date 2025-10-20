import { redirect } from '@sveltejs/kit';

import { hashPath } from '$lib/paths';

export async function load({ url }) {
	redirect(307, `/${url.search}#${hashPath('/import')}`);
}
