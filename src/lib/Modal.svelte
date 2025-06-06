<!-- 
@component
Show a pop-up dialog, that can be closed via a close button provided by the component, or navigating back in the browser history.

-->
<script module>
	/**
	 * @param {typeof page} page
	 */
	export function hasAnyModalOpen(page) {
		return Object.entries(page.state).some(([key, value]) => {
			return key.startsWith('modal_') && value;
		});
	}
</script>

<script>
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import IconClose from '~icons/ph/x';
	import ButtonIcon from './ButtonIcon.svelte';
	import { getSettings } from './settings.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {`modal_${string}`} key a unique string, used to identify the modal in the page's state.
	 * @property {string} title the title used in the header
	 * @property {undefined | (() => void)} [open] a function you can bind to, to open the modal
	 * @property {undefined | (() => void)} [close] a function you can bind to, to close the modal. Note that the modal includes a close button in the header, you don't _have_ to use this.
	 * @property {import('svelte').Snippet<[{ close: undefined | (() => void) }]>} children the content of the modal
	 * @property {import('svelte').Snippet<[{ close: undefined | (() => void) }]>} [footer] the content of the footer
	 */

	/**  @type {Props} */
	let {
		key: stateKey,
		title,
		open = $bindable(undefined),
		close = $bindable(undefined),
		footer = undefined,
		children
	} = $props();

	// Initialize and update close/update functions when stateKey changes
	$effect(() => {
		console.log(`Binding functions to ${stateKey} `);
		open = () => {
			pushState('', { [stateKey]: true });
		};
		close = () => {
			pushState('', { [stateKey]: false });
		};
	});

	/** @type {HTMLDialogElement | undefined} */
	let modalElement;
	$effect(() => {
		if (!modalElement) return;
		console.log(page.state[stateKey]);
		if (page.state[stateKey]) modalElement.showModal();
		else modalElement.close();
	});

	const theme = $derived(getSettings().theme);
</script>

<dialog
	data-theme={theme}
	bind:this={modalElement}
	onclose={() => {
		// Update state when dialog is closed via browser-controlled means (e.g. Esc key)
		pushState('', { [stateKey]: false });
	}}
	onmousedown={({ target, currentTarget }) => {
		// Close on backdrop click
		if (target === currentTarget) close?.();
	}}
>
	<header>
		<h1>{title}</h1>
		<ButtonIcon
			help="Fermer"
			onclick={() => {
				close?.();
			}}
		>
			<IconClose />
		</ButtonIcon>
	</header>
	<main>
		{@render children({ close })}
	</main>
	{#if footer}
		<footer>
			{@render footer({ close })}
		</footer>
	{/if}
</dialog>

<style>
	dialog {
		margin: auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 1em;
		border-radius: var(--corner-radius);
		background: var(--bg-neutral);
		border: 3px solid var(--bg-primary);
		width: 75vw;
		min-height: max(50vh, 300px);
		min-width: min(100vw, 400px);
		max-width: 700px;
		transition:
			opacity,
			transform 0.2s;
	}

	dialog[open] {
		opacity: 1;
		pointer-events: auto;
		transform: scale(1);
	}

	dialog:not([open]) {
		opacity: 0;
		pointer-events: none;
		transform: scale(0.75);
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0);
		transition: all 2s;
	}

	dialog[open]::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex-grow: 1;
	}

	footer {
		margin-top: auto;
		display: flex;
		flex-direction: var(--footer-direction, row);
		justify-content: center;
		align-items: center;
		gap: 0.5em;
	}

	h1 {
		margin: 0;
	}
</style>
