import { onDestroy, onMount } from 'svelte';
import { uiState } from './state.svelte';
import { entries, keys } from './utils';

/**
 * Keyboard shortcuts to define while the component is mounted. These keyboards will be unset when the component is unmounted.
 *
 * To be called during a component initialization phase (so, not inside a $effect / $derived etc, but in the <script> tag).
 *
 * This function will _not_ override any keybind that already has an existing key shortcut defined.
 * @param {import("./state.svelte").Keymap} shortcuts
 */
export function defineKeyboardShortcuts(shortcuts) {
	onMount(() => {
		for (const [key, definition] of entries(shortcuts)) {
			if (key in uiState.keybinds) {
				console.warn(`Keybind ${key} already defined, not overriding.`);
				continue;
			}

			uiState.keybinds[key] = definition;
		}
	});
	onDestroy(() => {
		for (const key of keys(shortcuts)) {
			delete uiState.keybinds[key];
		}
	});
}
