<script lang="ts">
	import type { DecodedAudioMono } from '$lib/audio/decode.js';

	import { renderWaveformSvg } from '$lib/audio/waveform.js';
	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte.js';

	import { boundingBoxes, zoom } from './+page.svelte';
	import Playhead from './Playhead.svelte';
	import Ruler from './Ruler.svelte';
	import ZoomableMarks from './ZoomableMarks.svelte';

	interface Props {
		decoded: undefined | DecodedAudioMono;
		minimap?: boolean;
	}

	const boxes = $derived(Object.values(boundingBoxes()).map((box) => toTopLeftCoords(box)));

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
	style:--zoom-x="{zoom.origin.x}px"
>
	{#if minimap}
		<div class="minimap-window"></div>

		<div class="minimap">
			<Playhead />

			{#if decoded}
				{const rendered = $derived(renderWaveformSvg(decoded, { height: 50 }))}

				<div class="base">
					<!-- eslint-ignore-next-line svelte/no-at-html -->
					{@html rendered}
				</div>

				<div class="visible">
					<!-- eslint-ignore-next-line svelte/no-at-html -->
					{@html rendered}
				</div>
			{/if}
		</div>

		<div class="ruler-space"></div>
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
				<div class="base">
					<!-- eslint-ignore-next-line svelte/no-at-html -->
					{@html rendered}
				</div>

				{#each boxes as box}
					<div
						class="box"
						style:clip-path={`xywh(${box.x * 100}% 0% ${box.width * 100}% 100%)`}
					>
						<!-- eslint-ignore-next-line svelte/no-at-html -->
						{@html rendered}
					</div>
				{/each}
			{/if}
		</div>

		<!-- TODO -->
		<Ruler domain={[-1, 1]} label={() => ''} />
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
		height: 75px;
	}

	.ruler-space {
		width: 4rem;
	}

	.waveforms :global(svg) {
		width: var(--total-width);
	}

	.waveform,
	.minimap {
		width: 100%;
		position: relative;
		--waveform-color: var(--fg-neutral);

		& > * {
			position: absolute;
			inset: 0;
			display: flex;
			align-items: center;
		}
	}

	.waveform {
		scale: var(--zoom-scale) 1;
		translate: calc(var(--zoom-x) * var(--zoom-scale)) 0;

		.box {
			--waveform-color: var(--fg-primary);
			background: var(--bg-primary-translucent);
		}
	}

	.waveforms:has(.minimap) {
		--left: calc(50% - 50% / var(--zoom-scale) - (var(--zoom-x) / var(--total-width)) * 100%);
		--width: calc(1 / var(--zoom-scale) * 100%);
	}

	.minimap {
		.base {
			--waveform-color: var(--gray);
		}

		.visible {
			clip-path: xywh(var(--left) 0 var(--width) 100%);
		}
	}

	.minimap-window {
		position: absolute;
		top: 0;
		bottom: 0;
		border: 1px solid var(--fg-neutral);
		z-index: 2;

		transition: opacity 250ms ease;
		opacity: calc(round(up, var(--zoom-scale) - 1));
		width: var(--width);
		left: var(--left);

		/* background: rgb(from var(--bg-primary) r g b / 25%); */
		backdrop-filter: contrast(500%);
	}

	/* .waveform {
		overflow-x: scroll;
		overflow-y: clip;
	} */
</style>
