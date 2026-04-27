<script lang="ts">
	import type { Snippet } from 'svelte';

	import { BottomSheet } from 'svelte-bottom-sheet';

	let {
		open = $bindable(false),
		children,
		maxHeight = 0.7,
	}: { open: boolean; children: Snippet; maxHeight?: number } = $props();
</script>

<div data-bottomsheet-wrapper>
	<BottomSheet settings={{ maxHeight }} bind:isSheetOpen={open}>
		<BottomSheet.Overlay>
			<BottomSheet.Sheet>
				<BottomSheet.Handle />
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

	[data-bottomsheet-wrapper] :global(:is(.bottom-sheet, .handle-container)) {
		background-color: var(--bg-neutral);
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet-grip) {
		background-color: var(--fg-neutral);
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet-content) {
		width: 100%;
	}
</style>
