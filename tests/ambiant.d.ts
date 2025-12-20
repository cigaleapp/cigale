import type { IDBPDatabase } from 'idb';

import type { IDBDatabaseType } from '$lib/idb.svelte';

declare global {
	interface Window {
		DB: IDBPDatabase<IDBDatabaseType>;
		refreshDB: () => void;
		devalue: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			stringify: (value: any) => string;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			parse: (value: string) => any;
		};
	}

	interface RegExpConstructor {
		// Available since Node 24
		// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape#browser_compatibility
		escape: (str: string) => string;
	}
}
