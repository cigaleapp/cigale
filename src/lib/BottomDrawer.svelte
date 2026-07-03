<!-- 
 @component

 CSS Variables:

- `--drawer-outer-padding`: Outer padding for the drawer content

-->

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BottomSheetSettings } from 'svelte-bottom-sheet';

	import { BottomSheet } from 'svelte-bottom-sheet';

	interface Props {
		open: boolean;
		children: Snippet;
		maxHeight?: number;
		title?: string;
		position: BottomSheetSettings['position'];
	}

	let {
		open = $bindable(false),
		title = '',
		children,
		maxHeight = 0.7,
		position = 'bottom',
	}: Props = $props();
</script>

<div data-bottomsheet-wrapper>
	<BottomSheet settings={{ maxHeight, position }} bind:isSheetOpen={open}>
		<BottomSheet.Overlay>
			<BottomSheet.Sheet>
				<BottomSheet.Handle>
					<div class="handle"></div>
					{#if title && position === 'bottom'}
						<p class="title bottom">
							{title}
						</p>
					{/if}
				</BottomSheet.Handle>
				<BottomSheet.Content>
					{#if title && position === 'top'}
						<p class="title top">
							{title}
						</p>
					{/if}
					{@render children()}
				</BottomSheet.Content>
			</BottomSheet.Sheet>
		</BottomSheet.Overlay>
	</BottomSheet>
</div>

<style>
	[data-bottomsheet-wrapper] {
		z-index: 1000;
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet) {
		transition: max-height 0.01s ease !important;
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet) {
		background-color: var(--bg-neutral);
	}

	[data-bottomsheet-wrapper] :global(.handle-container) {
		background-color: var(--bg-neutral);

		&:has(.title) {
			border-bottom: 1px solid rgb(from var(--gray) r g b / 50%);
		}
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet-grip) {
		background-color: var(--fg-neutral);
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet-content) {
		width: 100%;
		padding: var(--drawer-outer-padding, 0.75rem);
	}

	.title {
		font-size: 0.95rem;
		text-align: center;
		color: var(--gay);

		&.top {
			margin: 1rem 0;
		}
	}

	.handle {
		width: 2.5em;
		height: 0.25em;
		border-radius: 9999px;
		background-color: var(--gray);
		margin: 0.5em auto;
	}
</style>
