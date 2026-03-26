import type { AccountConstructor } from './types.js';

import * as KoboToolbox from '$lib/accounts/kobotoolbox.js';

type AccountProviders = {
	kobotoolbox: AccountConstructor<KoboToolbox.LoginData>;
};

class AccountRegistry<Providers extends Record<string, AccountConstructor<any>>> {
	constructor(private providers: Providers) {}

	get<K extends keyof Providers>(key: K): Providers[K] {
		return this.providers[key];
	}
}

export const accounts = new AccountRegistry<AccountProviders>({
	kobotoolbox: KoboToolbox.Provider,
});
