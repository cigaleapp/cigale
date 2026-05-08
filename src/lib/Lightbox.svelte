<script lang="ts">
	import type { Snippet } from 'svelte';

	import IconClose from '~icons/ri/close-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';

	interface Props {
		/** Content shown normally */
		trigger: Snippet;
		/** Content shown when the trigger is clicked */
		content: Snippet;
	}

	const { trigger, content }: Props = $props();

	let close = $state<() => void>();
	let open = $state<() => void>();
</script>

<dialog
	onclick={() => close?.()}
	{@attach (node) => {
		close = () => node.close();
		open = () => node.showModal();
	}}
>
	<div class="close">
		<ButtonIcon help="Fermer" onclick={() => close?.()}>
			<IconClose />
		</ButtonIcon>
	</div>

	{@render content()}
</dialog>

<button onclick={() => open?.()}>
	{@render trigger()}
</button>

<style>
	dialog {
		width: 100vw;
		height: 100vh;
		background: transparent;
		padding: 3em;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		opacity: 0;
		transition: opacity 0.5s;

		&[open] {
			opacity: 1;
		}

		&::backdrop {
			background-color: rgb(0 0 0 / 0.75);
		}

		&:not([open]) {
			display: none;
		}
	}

	.close {
		position: fixed;
		top: 0.5em;
		right: 0.5em;
		--fg: white;
		font-size: 1.5em;
	}

	button {
		/* Make sure the button doesn't interfere with the dialog's layout */
		all: unset;
		cursor: zoom-in;
	}
</style>
