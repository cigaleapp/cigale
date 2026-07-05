import type { PlaywrightTestId } from '$e2e/testids.js';

// Using data-* attributes doesn't work...
// See https://github.com/sveltejs/svelte/issues/14859

declare module 'svelte/elements' {
	export interface HTMLAttributes<T> {
		'pw-testid'?: PlaywrightTestId | undefined;
	}
}

declare namespace svelteHTML {
	type HTMLAttributes<T> = {
		'pw-testid'?: PlaywrightTestId | undefined;
	};
}
