<script module>
	/**
	 * @typedef Keybind
	 * @type {object}
	 * @property {string} help
	 * @property {(e: MouseEvent|KeyboardEvent) => void} do
	 * @property {boolean} [hidden=false] hide the keybinding from help
	 */

	/**
	 * @typedef Keymap
	 * @type {Record<string, Keybind>}
	 */
</script>

<script>
	// @ts-ignore
	import { tinykeys } from 'tinykeys';
	import Modal from './Modal.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Keymap} binds
	 * @property {boolean} [preventDefault=false] call e.preventDefault() before calling the handlers
	 */

	/** @type {Props} */
	const { binds, preventDefault = false } = $props();

	$effect(() => {
		tinykeys(
			window,
			Object.fromEntries(
				Object.entries(binds).map(([pattern, bind]) => [
					pattern,
					preventDefault
						? /** @param {MouseEvent|KeyboardEvent} e */
							(e) => {
								e.preventDefault();
								bind.do(e);
							}
						: bind.do
				])
			)
		);

		// "?" doesnt work with tinykeys, see https://github.com/jamiebuilds/tinykeys/issues/130
		window.addEventListener('keyup', (e) => {
			if (e.key === '?') {
				openKeyboardShortcutsHelp?.();
			}
		});
	});

	/** @type {(() => void)|undefined} */
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
		const chords = pattern.split(' ');
		console.log(chords);
		const parts = chords
			.flatMap((chord) => [
				chord
					.split('+')
					.flatMap((key) => [key, '+'])
					.slice(0, -1),
				' '
			])
			.flat()
			.slice(0, -1)
			.map((part) => part.toLowerCase());

		console.log(parts);
		return parts.map((part) => {
			if (part === '$mod' && navigator.platform.startsWith('Mac')) return ' Cmd';
			if (part === '$mod') return 'Ctrl';
			if (part.length === 1) return part.toUpperCase();
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
		{#each Object.entries(binds).filter(([_, { hidden }]) => !hidden) as [pattern, { help }]}
			<dt>
				{#each displayPattern(pattern).entries() as [i, part]}
					{#if i % 2 == 0}
						<kbd>{part}</kbd>
					{:else}
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
