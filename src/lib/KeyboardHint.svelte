<script module>
	const MODIFIERS = ['$mod', 'ctrl', 'shift', 'alt', 'win'];
	export const APPLE_GLYPHS = ['⌘', '⌥', '⌃', '⇧', '⌦'];

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
		const isMacOS = navigator.platform.toUpperCase().includes('MAC');

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
			.map((part) => part.toLowerCase()) // Remove potential uppercase letters
			.map((part, i, parts) => {
				// Touch up: prevent "modifier + arrow" from having a "+" between them: since it's a modifier, it can't be a chord anyways, and it looks kind of ugly with the + next to an arrow character.
				// On MacOS, don't show "+" between a modifier and any other key
				if (
					part === '+' &&
					(parts[i + 1]?.startsWith('arrow') || isMacOS) &&
					MODIFIERS.includes(parts[i - 1])
				) {
					return '';
				}

				return part;
			});

		return parts.map((part) => {
			/**
			 * @param {string} win windows representation of the key
			 * @param {string} mac macOS representation of the key
			 */
			const winmac = (win, mac) => (isMacOS ? mac : win);

			if (part === '$mod') return winmac('Ctrl', '⌘');
			if (part === 'shift') return winmac('Shift', '⇧');
			if (part === 'ctrl') return winmac('Ctrl', '⌃');
			if (part === 'alt') return winmac('Alt', '⌥');
			if (part === 'win') return winmac('Win', '⌘');
			if (part === 'delete') return winmac('Suppr', '⌦');
			if (part === 'space') return '␣';
			if (part === 'escape') return 'Esc';
			if (part === 'enter') return '⏎';

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

<script>
	import { tooltip } from './tooltips.js';

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
			<kbd class:apple-glyph={APPLE_GLYPHS.includes(part)}>
				{part}
			</kbd>
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

	:global(kbd.apple-glyph) {
		font-family: 'SF Mono Key Glyphs', var(--font-mono);
		font-size: 1.05rem;
		line-height: 0.6;
	}

	@font-face {
		font-family: 'SF Mono Key Glyphs';
		src: url('/fonts/AppleSymbols_Keyboard_Glyphs.woff2') format('woff2');
		unicode-range:
			U+2318 /* ⌘ */,
			U+2325 /* ⌥ */,
			U+2303 /* ⌃ */,
			U+21E7 /* ⇧ */,
			U+2326; /* ⌦ */
	}
</style>
