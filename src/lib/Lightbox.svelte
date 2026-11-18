<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Portal } from 'bits-ui';

	import IconClose from '~icons/ri/close-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';

	interface Props {
		/**
		 * Content shown normally
		 * If your trigger captures click events,
		 * pass the onclick handler so that there's a way
		 * to open the lightbox.
		 */
		trigger: Snippet<[{ onclick: () => void }]>;
		/** Content shown when the trigger is clicked */
		content: Snippet;
		/** If content of lightbox has any interactive elements.
		 * Disables closing by clicking on the content. Closing works via:
		 * - the close button, or
		 * - a backdrop click, or
		 * - a click on an element that has [data-lightbox-close-on-click] */
		interactive?: boolean;
		/** Called when lightbox is closed */
		onclose?: () => void;
	}

	const { trigger, onclose, content, interactive = false }: Props = $props();

	let close = $state<() => void>();
	let open = $state<() => void>();

	/** Used to not render contents of lightbox when not opened */
	let opened = $state(false);

	const htmlid = $props.id();

	const htmlids = $derived({
		content: `${htmlid}-content`,
	});
</script>

<Portal to="#app-layout">
	<dialog
		onclick={(e) => {
			// Element and not HTMLElement since we can hit elements inside of an icon (inline SVGs)
			if (interactive && e.target instanceof Element) {
				console.log(e.target, e.target.dataset);
				// Three ways to close the modal by background click:
				// click on <dialog>,
				// or click on the content (but not anything INSIDE the content)
				// or click on anything with the data attribute (see interactive prop docs)
				const onDialog = e.target === e.currentTarget;
				const onContentBackground = e.target.id === htmlids.content;
				const onExplicitlyClosingElement =
					e.target instanceof HTMLElement && 'lightboxCloseOnClick' in e.target.dataset;

				// If not any of those 3 ways, cancel the close
				if (!onDialog && !onContentBackground && !onExplicitlyClosingElement) return;
			}

			e.stopPropagation();
			close?.();
		}}
		closedby={interactive ? 'closerequest' : 'any'}
		{@attach (node) => {
			open = () => {
				opened = true;
				node.showModal();
			};

			close = () => {
				onclose?.();
				node.close();
				opened = false;
			};
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

		<div class="contents" id={htmlids.content}>
			{#if opened}
				{@render content()}
			{/if}
		</div>
	</dialog>
</Portal>

<button
	onclick={(e) => {
		e.stopPropagation();
		open?.();
	}}
>
	{@render trigger({
		onclick() {
			open?.();
		},
	})}
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
			overflow: hidden;

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

	.contents {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	button {
		/* Make sure the button doesn't interfere with the dialog's layout */
		all: unset;
		cursor: zoom-in;
	}
</style>
