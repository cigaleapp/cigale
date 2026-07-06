import type { PlaywrightTestId } from '$e2e/testids.js';

// Using data-* attributes doesn't work...
// See https://github.com/sveltejs/svelte/issues/14859

declare module 'svelte/elements' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	export interface HTMLAttributes<T> {
		'pw-testid'?: PlaywrightTestId | undefined;
	}
}

declare namespace svelteHTML {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	type HTMLAttributes<T> = {
		'pw-testid'?: PlaywrightTestId | undefined;
	};
}
