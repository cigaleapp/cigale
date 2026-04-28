<script lang="ts">
	import type { Snippet } from 'svelte';

	import { BottomSheet } from 'svelte-bottom-sheet';

	let {
		open = $bindable(false),
		title = '',
		children,
		maxHeight = 0.7,
	}: { open: boolean; children: Snippet; maxHeight?: number; title?: string } = $props();
</script>

<div data-bottomsheet-wrapper>
	<BottomSheet settings={{ maxHeight }} bind:isSheetOpen={open}>
		<BottomSheet.Overlay>
			<BottomSheet.Sheet>
				<BottomSheet.Handle>
					<div class="handle"></div>
					{#if title}
						<p class="title">
							{title}
						</p>
					{/if}
				</BottomSheet.Handle>
				<BottomSheet.Content>
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
		&:has(.title) {
			border-bottom: 1px solid rgb(from var(--gray) r g b / 50%);
		}
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet-grip) {
		background-color: var(--fg-neutral);
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet-content) {
		width: 100%;
		padding: 0.75rem;
	}

	.title {
		font-size: 0.95rem;
		text-align: center;
		color: var(--gay);
	}

	.handle {
		width: 2.5em;
		height: 0.25em;
		border-radius: 9999px;
		background-color: var(--gray);
		margin: 0.5em auto;
	}
</style>
