<!-- 
 @component

 CSS Variables:

- `--drawer-outer-padding`: Outer padding for the drawer content

-->

<script lang="ts" module>
	export interface Props {
		open?: boolean;
		children: Snippet;
		maxHeight?: number;
		title?: string;
		position?: BottomSheetSettings['position'];
		trigger?: Snippet;
		footer: Snippet<[{ close: () => void }]>;
		/**
		 * The trigger will be the bottom bar. The value of this prop is the text shown.
		 * Also sets the title (if it hasnt been manually set)
		 */
		'trigger-from-bottombar'?: string;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BottomSheetSettings } from 'svelte-bottom-sheet';

	import { BottomSheet } from 'svelte-bottom-sheet';

	import IconShowPanel from '~icons/ri/arrow-up-s-line';
	import BottombarContent from '$routes/(app)/BottombarContent.svelte';

	import { mutationobserver } from './mutations.js';
	import { onswipe } from './touch/swipes.js';

	let {
		open = $bindable(false),
		children,
		maxHeight = 0.7,
		position = 'bottom',
		trigger,
		'trigger-from-bottombar': triggerFromBottombar,
		title = triggerFromBottombar ?? '',
		footer,
	}: Props = $props();

	let disableGestures = $state(false);
</script>

{#if triggerFromBottombar}
	<BottombarContent>
		<button
			class="open-drawer"
			{@attach onswipe('up', () => {
				open = true;
			})}
			onclick={() => {
				open = true;
			}}
		>
			{triggerFromBottombar}
			<IconShowPanel />
		</button>
	</BottombarContent>
{/if}

<div
	data-bottomsheet-wrapper
	use:mutationobserver={{
		subtree: true,
		attributes: true,
		attributeFilter: ['open'],
		onattributes(event) {
			if (!(event.target instanceof HTMLDialogElement)) return;
			disableGestures = event.target.open;
		},
	}}
>
	<BottomSheet
		settings={{
			maxHeight,
			position,
			disableClosing: disableGestures,
			disableDragging: disableGestures,
		}}
		bind:isSheetOpen={open}
	>
		{#if trigger}
			<BottomSheet.Trigger>
				{@render trigger()}
			</BottomSheet.Trigger>
		{/if}
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
					{#if footer}
						{let footerHeight = $state(0)}
						<footer bind:clientHeight={footerHeight}>
							{@render footer({
								close() {
									open = false;
								},
							})}
						</footer>

						<div class="footer-spacer" style:height="{footerHeight}px"></div>
					{/if}
				</BottomSheet.Content>
			</BottomSheet.Sheet>
		</BottomSheet.Overlay>
	</BottomSheet>
</div>

<style>
	[data-bottomsheet-wrapper] {
		z-index: 998;
		display: contents;
		--content-border-color: rgba(from var(--gray) r g b / 50%);
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet-overlay) {
		z-index: 999;
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet) {
		transition: max-height 0.01s ease !important;
		z-index: 1000;
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet) {
		background-color: var(--bg-neutral);
	}

	[data-bottomsheet-wrapper] :global(.handle-container) {
		background-color: var(--bg-neutral);
		z-index: 200;

		&:has(.title) {
			border-bottom: 1px solid var(--content-border-color);
		}
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet-grip) {
		background-color: var(--fg-neutral);
	}

	[data-bottomsheet-wrapper] :global(.bottom-sheet-content) {
		width: 100%;
		padding: var(--drawer-outer-padding, 0.75rem);
		position: relative;

		footer {
			position: fixed;
			bottom: 0;
			inset-inline: 0;
		}
	}

	footer {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		z-index: 10;
		gap: 1em;
		padding: 1em;
		background: var(--bg-neutral);
		border-top: 1px solid var(--content-border-color);
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

	button.open-drawer {
		display: flex;
		align-items: center;
		gap: 0.5em;
		justify-content: space-between;
		width: 100%;
		font-size: 1rem;
	}
</style>
