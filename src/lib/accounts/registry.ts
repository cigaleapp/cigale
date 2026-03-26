import type { AccountConstructor, AuthenticationMethod } from './types.js';

import KoboToolbox from '$lib/accounts/kobotoolbox.js';

type AccountProviders = {
	kobotoolbox: AccountConstructor<typeof KoboToolbox.auth, (typeof KoboToolbox.servers)[number]>;
};

class AccountRegistry<Providers extends Record<string, AccountConstructor<AuthenticationMethod>>> {
	constructor(private providers: Providers) {}

	get<K extends keyof Providers>(key: K): Providers[K] {
		return this.providers[key];
	}
}

export const accounts = new AccountRegistry<AccountProviders>({
	kobotoolbox: KoboToolbox,
});
