<script lang="ts">
	import type { DecodedAudioMono } from '$lib/audio/decode.js';

	import { renderWaveformSvg } from '$lib/audio/waveform.js';

	import { zoom } from './+page.svelte';
	import Playhead from './Playhead.svelte';
	import { playhead } from './playhead.svelte.js';
	import Ruler from './Ruler.svelte';
	import ZoomableMarks from './ZoomableMarks.svelte';

	interface Props {
		decoded: undefined | DecodedAudioMono;
		minimap?: boolean;
	}

	const { decoded, minimap = false }: Props = $props();

	// XXX: DONT MERGE
	// const zoom = {
	// 	scale: 7.43008,
	// 	origin: { x: -598.531 },
	// };

	// height: 150px; scale: 7.43008 1; translate: -598.531px;

	let totalWidth = $state<number>();

	let waveformElement = $state<HTMLElement>();
</script>

<div
	class="waveforms"
	bind:clientWidth={totalWidth}
	style:--total-width="{totalWidth}px"
	style:--zoom-scale={zoom.scale}
	style:--zoom-origin-x="{zoom.origin.x}px"
>
	{#if minimap}
		<Playhead />

		<div class="minimap" style:height="50px">
			<div
				class="window"
				// style:width="{(1 / zoom.scale) * 100}%"
				// style:left="{totalWidth
				// 	? (0.5 - 0.5 / zoom.scale - zoom.origin.x / totalWidth) * 100
				// 	: 0}%"
				// style:left="688.531px"
				// style:left="calc(598.531px + 90px)"
				// style:left="calc({-zoom.origin.x}px + 90px)"
			></div>

			{#if decoded}
				{const rendered = $derived(renderWaveformSvg(decoded, { height: 50 }))}

				<div class="full">
					<!-- eslint-ignore-next-line svelte/no-at-html -->
					{@html rendered}
				</div>
			{/if}
		</div>
	{:else}
		{#if waveformElement}
			<ZoomableMarks {zoom} fit="fill" source={waveformElement}>
				<Playhead />
			</ZoomableMarks>
		{/if}

		<div
			class="waveform"
			bind:this={waveformElement}
			// style:scale="{zoom.scale} 1"
			// style:translate="{zoom.origin.x * zoom.scale}px 0"
		>
			{#if decoded}
				{const rendered = $derived(
					renderWaveformSvg(decoded, {
						height: 150,
						columns: 5000,
						// columns: Math.round(zoom.scale * 1000),
					})
				)}
				<div class="full">
					<!-- eslint-ignore-next-line svelte/no-at-html -->
					{@html rendered}
				</div>
			{/if}
		</div>

		<!-- TODO -->
		<Ruler domain={[-Infinity, Infinity]} />
	{/if}
</div>

<style>
	.waveforms {
		display: flex;
		position: relative;
		justify-content: center;
		width: 100%;
		height: 100%;
		row-rule: 1px solid var(--faint);
	}

	.waveforms:has(.minimap) {
		padding: 1em 0;
	}

	.waveforms :global(svg) {
		width: var(--total-width);
	}

	.waveform,
	.minimap {
		width: 100%;
		position: relative;

		.full {
			position: absolute;
			inset: 0;
		}

		.full {
			--waveform-color: var(--fg-neutral);
			z-index: 1;
		}

		/* .elapsed {
			--waveform-color: var(--fg-neutral);
			z-index: 2;
			overflow: clip;
		} */
	}

	.waveform {
		scale: var(--zoom-scale) 1;
		translate: calc(var(--zoom-origin-x) * var(--zoom-scale)) 0;

		&,
		.full {
			height: 100%;
			display: flex;
			align-items: center;
		}
	}

	.minimap {
		.window {
			position: absolute;
			top: 0;
			bottom: 0;
			border: 1px solid white;

			width: calc(1 / var(--zoom-scale) * 100%);
			left: calc(
				50% - 50% / var(--zoom-scale) - (var(--zoom-origin-x) / var(--total-width)) * 100%
			);
		}
	}

	/* .waveform {
		overflow-x: scroll;
		overflow-y: clip;
	} */
</style>
