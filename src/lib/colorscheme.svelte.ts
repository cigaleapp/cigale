import { getSettings } from './settings.svelte.js';

export class Theme {
	system: 'dark' | 'light' = $state('dark');
	setting = $derived(getSettings().theme);
	effective = $derived(this.setting === 'auto' ? this.system : this.setting);

	constructor() {
		$effect(() => {
			if (!window) return;
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			this.system = mediaQuery.matches ? 'dark' : 'light';
			mediaQuery.addEventListener('change', (e) => {
				this.system = e.matches ? 'dark' : 'light';
			});
		});
	}
}
