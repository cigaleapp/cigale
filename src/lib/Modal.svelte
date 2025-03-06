<!-- 
@component
Show a pop-up dialog, that can be closed via a close button provided by the component, or navigating back in the browser history.

-->

<script>
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import IconClose from '~icons/ph/x';
	import ButtonIcon from './ButtonIcon.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {string} key a unique string, used to identify the modal in the page's state.
	 * @property {string} title the title used in the header
	 * @property {() => void} [open] a function you can bind to, to open the modal
	 * @property {() => void} [close] a function you can bind to, to close the modal. Note that the modal includes a close button in the header, you don't _have_ to use this.
	 * @property {import('svelte').Snippet} children the content of the modal
	 * @property {import('svelte').Snippet} [footer] the content of the footer
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
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={modalElement}
	onmousedown={({ target, currentTarget }) => {
		// Close on backdrop click
		if (target === currentTarget) close?.();
	}}
>
	<header>
		<h1>{title}</h1>
		<ButtonIcon
			onclick={() => {
				close?.();
			}}
		>
			<IconClose />
		</ButtonIcon>
	</header>
	<main>
		{@render children()}
	</main>
	{#if footer}
		<footer>
			{@render footer()}
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
		border: none;
		width: 75vw;
		min-height: max(75vh, 300px);
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
		transition: background-color 2s;
	}

	dialog[open]::backdrop {
		background: rgba(0, 0, 0, 0.5);
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
	}

	h1 {
		margin: 0;
	}
</style>
