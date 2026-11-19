import { error, redirect } from '@sveltejs/kit';

import { providers } from '$lib/accounts/registry.js';

export async function load({ params, parent, url }) {
	const adding = providers.getMaybe(params.account);
	if (!adding) error(404, `Plateforme ${params.account} inconnue`);

	const code = new URL(url).searchParams.get('code');
	if (!code) error(400, `Code absent`);

	await parent();
	const account = await adding.login(databaseHandle(), {
		server: '',
		oauth: {
			phase: 'token',
			authorizationCode: code,
		},
	});

	await tables.Account.add({ ...account, addedAt: new Date().toISOString() });

	await goto('/(app)/accounts');
}
