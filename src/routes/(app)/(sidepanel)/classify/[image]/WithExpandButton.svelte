<script lang="ts">
	import type { Snippet } from 'svelte';

	import IconCollapse from '~icons/ri/fullscreen-exit-line';
	import IconExpand from '~icons/ri/fullscreen-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';

	interface Props {
		expand: boolean;
		corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
		children: Snippet;
		otherButtons?: Snippet;
		keyboard: string;
	}

	let { expand = $bindable(false), corner, children, otherButtons, keyboard }: Props = $props();

	// @ts-expect-error
	const corners: ['top' | 'bottom', 'left' | 'right'] = $derived(corner.split('-', 2));
</script>

<div class="with-expand-button">
	<div
		class="buttons"
		class:has-other-buttons={Boolean(otherButtons)}
		style:flex-direction={corners[1] === 'left' ? 'row' : 'row-reverse'}
		style={corners.map((corner) => `${corner}: var(--offset);`).join(' ')}
	>
		<ButtonIcon
			help={expand ? 'Réduire' : 'Agrandir'}
			{keyboard}
			onclick={() => {
				expand = !expand;
			}}
		>
			{#if expand}
				<IconCollapse />
			{:else}
				<IconExpand />
			{/if}
		</ButtonIcon>

		{#if otherButtons}
			{@render otherButtons()}
		{/if}
	</div>

	{@render children()}
</div>

<style>
	.with-expand-button {
		position: relative;
		height: 100%;
		width: 100%;

		&:not(:hover):not(:has(:focus-visible)) .buttons {
			opacity: 0;
			pointer-events: none;
		}
	}

	.buttons {
		--offset: 2em;
		position: absolute;
		z-index: 20;
		background-color: var(--bg-neutral);
		border-radius: var(--corner-radius);
		transition: opacity 0.2s;

		&.has-other-buttons {
			display: flex;
			align-items: center;
			gap: 0.25em;
			padding: 0.5em;
		}
	}
</style>
