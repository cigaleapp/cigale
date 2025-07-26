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
}
