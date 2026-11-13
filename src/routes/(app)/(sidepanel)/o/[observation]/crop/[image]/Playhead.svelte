<script lang="ts">
	import { zoom } from './+page.svelte';
	import { playhead } from './playhead.svelte.js';

	interface Props {
		headless?: boolean;
	}

	const { headless = false }: Props = $props();

	const draggable = $derived(!headless);

	function seek(event: PointerEvent) {
		if (!(event.currentTarget instanceof HTMLElement)) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const normalized = x / rect.width;
		playhead.seek(normalized);
	}
</script>

<div
	class="playhead"
	class:draggable
	style:--position-percentage="{playhead.positionNormalized * 100}%"
	style:opacity={playhead.position === 0 ? 0 : 1}
	onpointerdown={() => {
		if (!draggable) return;
		console.log('seeking');
		playhead.seeking = true;
	}}
>
	{#if !headless}
		<div class="head"></div>
	{/if}

	<div class="neck"></div>
</div>

{#if draggable}
	<div
		class="drag-area"
		onpointerup={(event) => {
			if (zoom.panning) return;
			if (!playhead.seeking) seek(event);
			playhead.seeking = false;
		}}
	></div>
{/if}

<style>
	.drag-area {
		position: absolute;
		inset: 0;
		z-index: var(--playhead-drag-area-z-index, 20);
	}

	.playhead {
		position: absolute;
		left: calc(var(--position-percentage) - 30px / 2);
		top: 0;
		bottom: 0;
		z-index: 30;

		width: 30px;
		/* background: rgba(0 0 0 / 75%); */
		z-index: 10;

		&.draggable {
			cursor: ew-resize;
		}

		&:not(.draggable) {
			pointer-events: none;
		}
	}

	.neck {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 2px;
		background: var(--fg-primary);
	}

	/* Triangle at top of playhead bar */
	.head {
		--width: 8px;
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: var(--width) solid transparent;
		border-right: var(--width) solid transparent;
		border-top: calc(var(--width) * 1.5) solid var(--fg-primary);

		cursor: hand;
	}
</style>
