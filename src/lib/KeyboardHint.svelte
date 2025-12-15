<script module>
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
	export function displayPattern(pattern) {
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
			if (['shift', 'alt', 'win'].includes(part))
				return part[0].toUpperCase() + part.slice(1);
			if (part === 'delete') return 'Suppr';
			if (part === 'space') return '␣';
			if (part === 'escape') return 'Esc';

			// Single-letter parts most likely represent letter keys,
			// so uppercase them cuz its prettier
			if (part.length === 1) return part.toUpperCase();

			// Handle digits
			if (part.startsWith('digit')) {
				return part.replace(/^digit/, '');
			}

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

<script lang="ts">
	import { tooltip } from './tooltips';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {string} shortcut
	 * @property {string} [help]
	 */

	/** @type {Props} */
	const { shortcut, help = '' } = $props();
</script>

<kbd class="hint" use:tooltip={help}>
	<!-- .entries() gives us [[0, a], [1, b], ...] for [a, b, ...] -->
	{#each displayPattern(shortcut).entries() as [i, part] (i)}
		{#if i % 2 == 0}
			<!-- Every even part represents a key -->
			<kbd>{part}</kbd>
		{:else}
			<!-- Every odd part is either "+" or a space -->
			<span class="separator">{part}</span>
		{/if}
	{/each}
</kbd>

<style>
	/*  :global because tooltips also use this, see $lib/tooltips.js */
	:global(kbd.hint) {
		font-size: var(--size, 0.8em);
		display: inline-flex;
		border: 1px solid var(--gray);
		gap: 0.25em;
		border-radius: 5px;
		padding: 0.2em 0.3em;
		margin: 0 0.2em;
	}

	:global(kbd, kbd *) {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: normal;
	}

	kbd.hint kbd {
		color: var(--fg-primary);
	}
</style>
