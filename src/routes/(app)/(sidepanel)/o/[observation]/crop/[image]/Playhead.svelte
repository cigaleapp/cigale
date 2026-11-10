<script lang="ts">
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
		playhead.positionNormalized = normalized;
	}
</script>

{#if draggable}
	<div
		class="drag-area"
		onpointermove={(event) => {
			if (!playhead.seeking) return;
			seek(event);
		}}
		onpointerup={(event) => {
			if (!playhead.seeking) seek(event);
			playhead.seeking = false;
		}}
		onpointerleave={() => {
			playhead.seeking = false;
		}}
		onpointercancel={() => {
			playhead.seeking = false;
		}}
	></div>
{/if}

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

<style>
	.drag-area {
		position: absolute;
		inset: 0;
		z-index: 20;
	}

	.playhead {
		position: absolute;
		left: calc(var(--position-percentage) - 30px / 2);
		top: 0;
		bottom: 0;
		z-index: 30;

		width: 30px;
		background: rgba(0 0 0 / 75%);
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
