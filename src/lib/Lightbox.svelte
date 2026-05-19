<script lang="ts">
	import type { Snippet } from 'svelte';

	import IconClose from '~icons/ri/close-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { Portal } from 'bits-ui';

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

<Portal to="#app-layout">
	<dialog
		onclick={(e) => {
			console.log('stop propagation', e);
			e.stopPropagation();
			close?.();
		}}
		closedby="any"
		{@attach (node) => {
			close = () => node.close();
			open = () => node.showModal();
		}}
	>
		<div class="close">
			<ButtonIcon
				help="Fermer"
				onclick={(e) => {
					e.stopPropagation();
					close?.();
				}}
			>
				<IconClose />
			</ButtonIcon>
		</div>

		<div class="contents">
			{@render content()}
		</div>
	</dialog>
</Portal>

<button
	onclick={(e) => {
		e.stopPropagation();
		open?.();
	}}
>
	{@render trigger()}
</button>

<style>
	dialog {
		position: fixed;
		inset: 0;
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
		transition: opacity 0.2s;

		.contents {
			transition: scale 0.2s;
		}

		&[open] {
			opacity: 1;
			pointer-events: auto;

			.contents {
				scale: 1;
			}
		}

		&:not([open]) {
			opacity: 0;
			pointer-events: none;
			.contents {
				scale: 0.95;
			}
		}
	}

	dialog::backdrop {
		background-color: rgb(0 0 0 / 0);
		transition: all 2s;
	}

	dialog[open]::backdrop {
		background-color: rgb(0 0 0 / 0.75);
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
