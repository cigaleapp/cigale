<script>
	// @ts-ignore
	import { tinykeys } from 'tinykeys';
	import Modal, { hasAnyModalOpen } from './Modal.svelte';
	import { onMount } from 'svelte';
	import KeyboardHint from './KeyboardHint.svelte';
	import { page } from '$app/state';
	import { m } from './paraglide/messages.js';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {import('$lib/state.svelte.js').Keymap} binds
	 * @property {boolean} [preventDefault=false] call e.preventDefault() before calling the handlers
	 * @property {(() => void) | undefined} [openHelp] open modal listing all keybindings
	 */

	/** @type {Props} */
	let { binds, openHelp = $bindable(), preventDefault = false } = $props();

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
								console.log(`a modal is open, ignoring keybinding ${pattern}`, page.state);
								return;
							}
							if (bind.when && !bind.when(e)) return;
							// Stick in a call to event.preventDefault()
							// before calling the handler function if "preventDefault" is true
							if (preventDefault) e.preventDefault();
							await bind.do(e);
						}
					])
			)
		)
	);

	onMount(() => {
		// "?" doesnt work with tinykeys, see https://github.com/jamiebuilds/tinykeys/issues/130
		window.addEventListener('keyup', (e) => {
			if (e.key === '?') {
				// Call the function that opens the keyboard shortcuts help modal
				openHelp?.();
			}
		});
	});
</script>

<Modal bind:open={openHelp} key="modal_keyboard_shortcuts_help" title={m.keyboard_shortcuts()}>
	<dl>
		<!-- Object.entries({a: 1, b: 2}) gives [["a", 1], ["b", 2]] -->
		<!-- Then we filter out keybindings that are marked as hidden -->
		{#each Object.entries(binds).filter(([_, { hidden }]) => !hidden) as [shortcut, { help }] (shortcut)}
			<dt>
				<KeyboardHint --size="1.2em" {shortcut} {help} />
			</dt>
			<dd>{help}</dd>
		{:else}
			<div class="empty">
				<div class="sad">¯\_(ツ)_/¯</div>
				<p>{m.no_keyboard_shortcuts_for_page()}</p>
			</div>
		{/each}
	</dl>
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
</style>
