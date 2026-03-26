import type { AccountConstructor } from './types.js';

import KoboToolbox from '$lib/accounts/kobotoolbox.js';

type AccountProviders = {
	kobotoolbox: AccountConstructor<typeof KoboToolbox.auth, (typeof KoboToolbox.servers)[number]>;
};

class AccountRegistry<Providers extends Record<string, AccountConstructor>> {
	constructor(private providers: Providers) {}

	get<K extends keyof Providers>(key: K): Providers[K] {
		return this.providers[key];
	}

	list() {
		return Object.values(this.providers);
	}
}

export const providers = new AccountRegistry<AccountProviders>({
	kobotoolbox: KoboToolbox,
});
