import type { AccountConstructor } from './types.js';
import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';

import KoboToolbox from '$lib/accounts/kobotoolbox.js';

type AccountProviders = {
	kobotoolbox: AccountConstructor<
		typeof KoboToolbox.auth,
		(typeof KoboToolbox.servers)[number]['domain']
	>;
};

class AccountRegistry<Providers extends Record<string, AccountConstructor>> {
	constructor(private providers: Providers) {}

	get<K extends keyof Providers>(key: K): Providers[K] {
		return this.providers[key];
	}

	list() {
		return Object.values(this.providers);
	}

	fromDatabase(db: DatabaseHandle, account: DB.Account) {
		return this.providers[account.type].fromDatabase(db, account);
	}
}

export const providers = new AccountRegistry<AccountProviders>({
	kobotoolbox: KoboToolbox,
});
