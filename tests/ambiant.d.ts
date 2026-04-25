import type { IDBDatabaseType } from '$lib/idb.svelte.js';
import type { UIState } from '$lib/state.svelte.js';
import type { PROCEDURES } from '$worker/procedures.js';
import type { IDBPDatabase } from 'idb';
import type { SwarpcClient } from 'swarpc';

declare global {
	interface Window {
		DB: IDBPDatabase<IDBDatabaseType>;
		uiState: undefined | UIState;
		swarpc: undefined | SwarpcClient<typeof PROCEDURES>;
		refreshDB: () => void;
		devalue: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			stringify: (value: any) => string;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			parse: (value: string) => any;
		};
		profiler?: Profiler;
	}

	interface RegExpConstructor {
		// Available since Node 24
		// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape#browser_compatibility
		escape: (str: string) => string;
	}

	/**
	 * Chrome-only API.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Profiler
	 */
	class Profiler {
		constructor(options?: { sampleInterval?: number; maxBufferSize?: number });
		stop(): Promise<unknown>;
	}
}
