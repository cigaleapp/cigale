<script>
	// @ts-ignore
	import { tinykeys } from 'tinykeys';
	import Modal from './Modal.svelte';
	import { onMount } from 'svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {import('$lib/state.svelte.js').Keymap} binds
	 * @property {boolean} [preventDefault=false] call e.preventDefault() before calling the handlers
	 */

	/** @type {Props} */
	const { binds, preventDefault = false } = $props();

	$effect(() =>
		// Use the tinykeys package to bind the keybindings
		// The library expect an object of the form {pattern: handler function}
		// We need to construct the object, since the component asks for a
		// { pattern: { help: "...", do: handler function } } object instead
		tinykeys(
			window,
			// Iterate through the "binds" object we were given...
			Object.fromEntries(
				// Associating every pattern to its handler function...
				Object.entries(binds).map(([pattern, bind]) => [
					pattern,
					// But stick in a call to event.preventDefault()
					// before calling the handler function if "preventDefault" is true
					preventDefault
						? /** @param {MouseEvent|KeyboardEvent} e */
							async (e) => {
								e.preventDefault();
								bind.do(e);
							}
						: bind.do
				])
			)
		)
	);

	onMount(() => {
		// "?" doesnt work with tinykeys, see https://github.com/jamiebuilds/tinykeys/issues/130
		window.addEventListener('keyup', (e) => {
			if (e.key === '?') {
				// Call the function that opens the keyboard shortcuts help modal
				openKeyboardShortcutsHelp?.();
			}
		});
	});

	/**
	 * Function that opens the keyboard shortcuts help modal.
	 * Provided by the `<Modal>` component through `bind:open={...}`
	 * @type {(() => void)|undefined}
	 */
	let openKeyboardShortcutsHelp = $state();

	/**
	 * Returns an array of `[key, separator, key, separator...]` strings, to be shown as for example
	 * ```html
	 * <kbd>key</kbd>separator<kbd>key</kbd>separator...
	 * ```
	 *
	 * Also handles showing nicer characters for stuff like arrows, the $mod (Cmd or Ctrl), etc.
	 *
	 * @param {string} pattern the raw pattern as given to Tinykeys
	 * @returns {string[]}
	 */
	function displayPattern(pattern) {
		// Split by spaces: "ctrl+c arrowup" -> ["ctrl+c", "arrowup"]
		const chords = pattern.split(' ');
		const parts = chords
			// Add spaces between each chord
			// ["ctrl+c", "arrowup"] -> [["ctrl", "+", "c", " "], ["arrowup", " "]]
			.flatMap((chord) => [
				// Split by "+" every space-separated part, adding back the "+" as separate elements
				// "ctrl+c" -> ["ctrl", "+", "c"]
				chord
					.split('+') // ["ctrl", "c"]
					.flatMap((key) => [key, '+']) // ["ctrl", "+", "c", "+"]
					.slice(0, -1), // Remove the last "+", as it's not needed
				' '
			])
			.flat() // ["ctrl", "+", "c", " ", "arrowup", " "]
			.slice(0, -1) // Remove the last space
			.map((part) => part.toLowerCase()); // Remove potential uppercase letters

		return parts.map((part) => {
			// Handle $mod: it represents Cmd on Mac and Ctrl on Windows/Linux
			if (part === '$mod' && navigator.platform.startsWith('Mac')) return ' Cmd';
			if (part === '$mod') return 'Ctrl';

			// Single-letter parts most likely represent letter keys,
			// so uppercase them cuz its prettier
			if (part.length === 1) return part.toUpperCase();

			// Handle arrows, using characters instead of ugly arrowup, arrowdown, etc.
			if (part.startsWith('arrow')) {
				switch (part.replace(/^arrow/, '').toLowerCase()) {
					case 'up':
						return '↑';
					case 'down':
						return '↓';
					case 'left':
						return '←';
					case 'right':
						return '→';
				}
			}

			return part;
		});
	}
</script>

<Modal
	bind:open={openKeyboardShortcutsHelp}
	key="observations-keyboard-shortcuts-help"
	title="Raccourcis clavier"
>
	<dl>
		<!-- Object.entries({a: 1, b: 2}) gives [["a", 1], ["b", 2]] -->
		<!-- Then we filter out keybindings that are marked as hidden -->
		{#each Object.entries(binds).filter(([_, { hidden }]) => !hidden) as [pattern, { help }] (pattern)}
			<dt>
				<!-- .entries() gives us [[0, a], [1, b], ...] for [a, b, ...] -->
				{#each displayPattern(pattern).entries() as [i, part] (i)}
					{#if i % 2 == 0}
						<!-- Every even part represents a key -->
						<kbd>{part}</kbd>
					{:else}
						<!-- Every odd part is either "+" or a space -->
						<span class="separator">{part}</span>
					{/if}
				{/each}
			</dt>
			<dd>{help}</dd>
		{/each}
	</dl>
</Modal>

<style>
	kbd {
		padding: 0.1em 0.3em;
		background: var(--bg-primary-translucent);
		border-radius: var(--corner-radius);
	}

	dt {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.25em;
		color: var(--fg-primary);
	}

	dd {
		margin-left: 0;
	}

	dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 1em 1.5em;
		align-items: center;
	}
</style>
