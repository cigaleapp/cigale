// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import 'unplugin-icons/types/svelte';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState extends Record<string, any> {}
		// interface Platform {}
	}

	interface ArkEnv {
		meta(): {
			// meta properties should always be optional
			table?: {
				keyPath: string | string[];
			};
		};
	}
}

export {};
