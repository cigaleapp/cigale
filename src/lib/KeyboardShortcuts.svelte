<script>
	// @ts-ignore
	import { tinykeys } from 'tinykeys';

	import { page } from '$app/state';

	import KeyboardHint from './KeyboardHint.svelte';
	import Modal, { hasAnyModalOpen } from './Modal.svelte';
	import { isDebugMode } from './settings.svelte.js';
	import { entries } from './utils.js';

	/**
	 * @import { Keybind, Keymap } from '$lib/state.svelte.js'
	 */

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Keymap} binds
	 * @property {boolean} [preventDefault=false] call e.preventDefault() before calling the handlers
	 * @property {(() => void) | undefined} [openHelp] open modal listing all keybindings
	 */

	/** @type {Props} */
	let { binds, openHelp = $bindable(), preventDefault = false } = $props();

	/**
	 *
	 * @param {Event} e
	 */
	const isTextEntryEvent = (e) =>
		(e instanceof KeyboardEvent || e instanceof MouseEvent) &&
		(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement);

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
				Object.entries(binds)
					.flatMap(([pattern, bind]) => {
						// Handle shift-number keybindings too
						if (pattern.startsWith('Digit') && !pattern.includes(' ')) {
							const number = pattern.replace('Digit', '');
							return /** @type {const} */ ([
								[pattern, bind],
								[number, bind],
								[`Shift+${number}`, bind]
							]);
						}

						return /** @type {const} */ ([[pattern, bind]]);
					})
					.map(([pattern, bind]) => [
						pattern,
						/** @param {MouseEvent|KeyboardEvent} e */
						async (e) => {
							if (!bind?.allowInModals && hasAnyModalOpen(page)) {
								console.warn(
									`a modal is open, ignoring keybinding ${pattern}`,
									page.state
								);
								return;
							}
							// Prevent non-$mod-prefixed shortcuts from working while in a input or textarea
							if (isTextEntryEvent(e) && !pattern.startsWith('$mod+')) {
								console.warn(`in input, ignoring keybinding ${pattern}`, e.target);
								return;
							}
							if (bind.when && !bind.when(e)) return;
							if (bind.debug && !isDebugMode()) return;
							// Stick in a call to event.preventDefault()
							// before calling the handler function if "preventDefault" is true
							if (preventDefault) e.preventDefault();
							await bind.do(e);
						}
					])
			)
		)
	);

	const GROUPS_ORDER = ['Recadrage', 'Observations', 'Général', 'Navigation', 'Debug mode'];

	const bindsByGroup = $derived(
		entries(
			entries(binds).reduce((acc, [key, bind]) => {
				if (bind.hidden) return acc;
				if (bind.debug && !isDebugMode()) return acc;
				const group = bind.group ?? 'Général';
				if (!acc[group]) acc[group] = [];
				acc[group].push([key, bind]);
				return acc;
			}, /** @type {Record<string, Array<[string, Keybind]>>} */ ({}))
		).toSorted(([a], [b]) => GROUPS_ORDER.indexOf(a) - GROUPS_ORDER.indexOf(b))
	);

	$effect(() => {
		// "?" doesnt work with tinykeys, see https://github.com/jamiebuilds/tinykeys/issues/130
		const handler = (/** @type {KeyboardEvent} */ e) => {
			if (e.key === '?' && !isTextEntryEvent(e) && !hasAnyModalOpen(page)) {
				// Call the function that opens the keyboard shortcuts help modal
				openHelp?.();
			}
		};

		window.addEventListener('keyup', handler);
		return () => window.removeEventListener('keyup', handler);
	});
</script>

<Modal bind:open={openHelp} key="modal_keyboard_shortcuts_help" title="Raccourcis clavier">
	{#each bindsByGroup as [group, binds] (group)}
		{#if bindsByGroup.length >= 2}
			<h2>{group}</h2>
		{/if}
		<dl>
			{#each binds as [shortcut, { help }] (shortcut)}
				<dt>
					<KeyboardHint --size="1.2em" {shortcut} {help} />
				</dt>
				<dd>{help}</dd>
			{/each}
		</dl>
	{:else}
		<dl>
			<div class="empty">
				<div class="sad">¯\_(ツ)_/¯</div>
				<p>Aucun raccouci clavier pour cette page</p>
			</div>
		</dl>
	{/each}
</Modal>

<style>
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
		flex-grow: 1;
	}

	.empty {
		grid-column: 1 / -1;
		text-align: center;
		color: var(--fg-secondary);
	}

	.sad {
		font-size: 2em;
		margin-bottom: 0.5em;
		font-weight: bold;
		color: var(--gray);
	}

	h2 {
		font-size: 1.2rem;
		font-weight: normal;
		color: var(--gray);
	}

	h2:not(:first-child) {
		margin-top: 0.5em;
	}
</style>
