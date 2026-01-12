import { onDestroy, onMount } from 'svelte';

import { uiState } from './state.svelte.js';
import { entries, keys } from './utils.js';

const GROUPS = {
	general: 'Général',
	observations: 'Observations',
	navigation: 'Navigation',
	cropping: 'Recadrage',
	debugmode: 'Debug mode',
	classification: 'Classification'
};

/**
 * Keyboard shortcuts to define while the component is mounted. These keyboards will be unset when the component is unmounted.
 *
 * To be called during a component initialization phase (so, not inside a $effect / $derived etc, but in the <script> tag).
 *
 * This function will _not_ override any keybind that already has an existing key shortcut defined.
 * @param {keyof typeof GROUPS} group used to group keybinds together in help dialogs, applied to all keybinds defined here, unless they override it themselves
 * @param {import("./state.svelte").Keymap<keyof typeof GROUPS>} shortcuts
 * WARNING: If you rename this function, update `heuristic` in `wuchale.config.js`
 */
export function defineKeyboardShortcuts(group, shortcuts) {
	onMount(() => {
		for (const [key, definition] of entries(shortcuts)) {
			if (key in uiState.keybinds) {
				console.warn(`Keybind ${key} already defined, not overriding.`);
				continue;
			}

			uiState.keybinds[key] = {
				group: GROUPS[definition.debug ? 'debugmode' : group],
				...definition
			};
		}
	});
	onDestroy(() => {
		for (const key of keys(shortcuts)) {
			delete uiState.keybinds[key];
		}
	});
}
