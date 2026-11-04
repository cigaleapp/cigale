import type { AccountConstructor } from './types.js';
import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';

import EcoSignal from '$lib/accounts/ecosignal.js';
import INaturalist from '$lib/accounts/inaturalist.js';
import KoboToolbox from '$lib/accounts/kobotoolbox.js';

type AccountProviders = {
	kobotoolbox: AccountConstructor<
		typeof KoboToolbox.auth,
		(typeof KoboToolbox._servers)[number]['domain']
	>;
	ecosignal: AccountConstructor<typeof EcoSignal.auth, string>;
	inaturalist: AccountConstructor<typeof INaturalist.auth, string>;
};

class AccountRegistry<Providers extends Record<string, AccountConstructor>> {
	constructor(private providers: Providers) {}

	get<K extends 'local' | keyof Providers>(key: K): K extends 'local' ? undefined : Providers[K] {
		if (key === 'local') return undefined;
		return this.providers[key];
	}

	getMaybe(key: string): Providers[keyof Providers] | undefined {
		if (key in this.providers) {
			return this.providers[key];
		}

		return undefined;
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
	ecosignal: EcoSignal,
	inaturalist: INaturalist,
});
