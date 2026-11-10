<script lang="ts">
	import { playhead } from './playhead.svelte.js';

	interface Props {
		headless?: boolean;
	}

	const { headless }: Props = $props();
</script>

<div
	class="playhead"
	style:--position-percentage="{playhead.positionNormalized * 100}%"
	style:opacity={playhead.position === 0 ? 0 : 1}
>
	{#if !headless}
		<div class="head" draggable></div>
	{/if}
</div>

<style>
	.playhead {
		position: absolute;
		left: var(--position-percentage);
		top: 0;
		bottom: 0;

		width: 2px;
		background: var(--fg-primary);
		z-index: 10;
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
