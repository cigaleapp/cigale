import type { IDBDatabaseType } from '$lib/idb.svelte';
import type { IDBPDatabase } from 'idb';

declare global {
	interface Window {
		DB: IDBPDatabase<IDBDatabaseType>;
		refreshDB: () => void;
		devalue: {
			serialize: (value: any) => string;
			deserialize: (value: string) => any;
		};
	}

	interface RegExpConstructor {
		// Available since Node 24
		// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape#browser_compatibility
		escape: (str: string) => string;
	}
}
