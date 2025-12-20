// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { SwarpcClient } from 'swarpc';

import type { PROCEDURES } from '$worker/procedures.js';

import 'unplugin-icons/types/svelte';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			swarpc: SwarpcClient<typeof PROCEDURES>;
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any,  @typescript-eslint/no-empty-object-type
		interface PageState extends Record<string, any> {}
		// interface Platform {}
	}

	interface ArkEnv {
		meta(): {
			// meta properties should always be optional
			table?: {
				indexes: string[];
			};
		};
	}
}

export {};
