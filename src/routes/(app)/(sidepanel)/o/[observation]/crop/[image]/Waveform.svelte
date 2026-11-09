<script lang="ts">
	import type { DecodedAudioMono } from '$lib/audio/decode.js';

	import { renderWaveformSvg } from '$lib/audio/waveform.js';

	import { zoom } from './+page.svelte';
	import { playhead } from './playhead.svelte.js';

	interface Props {
		decoded: DecodedAudioMono;
		minimap?: boolean
	}

	const { decoded , minimap=false }: Props = $props();

	// XXX: DONT MERGE
	// const zoom = {
	// 	scale: 7.43008,
	// 	origin: { x: -598.531 },
	// };

	// height: 150px; scale: 7.43008 1; translate: -598.531px;

	let totalWidth = $state<number>();

	$inspect('z', zoom.scale, 'x', zoom.origin.x);
</script>

<div class="waveforms" bind:clientWidth={totalWidth} style:--total-width="{totalWidth}px">
{#if minimap}
	<div class="minimap" style:height="50px">
		<div
			class="window"
			style:width="{(1 / zoom.scale) * 100}%"
			style:left="{totalWidth / 2 - zoom.origin.x / (zoom.scale * totalWidth)}px"
			// style:left="688.531px"
			// style:left="calc(598.531px + 90px)"
			// style:left="calc({-zoom.origin.x}px + 90px)"
		></div>

		<div class="full">
			<!-- eslint-ignore-next-line svelte/no-at-html -->
			{@html renderWaveformSvg(decoded, {
				height: 50,
			})}
		</div>

		<div class="elapsed" style:width="{playhead.positionNormalized * 100}%">
			<!-- eslint-ignore-next-line svelte/no-at-html -->
			{@html renderWaveformSvg(decoded, {
				height: 50,
			})}
		</div>
	</div>
	{:else}

	<div
		class="waveform"
		style:height="150px"
		style:scale="{zoom.scale} 1"
		style:translate="{zoom.origin.x}px 0"
	>
		<div class="full">
			<!-- eslint-ignore-next-line svelte/no-at-html -->
			{@html renderWaveformSvg(decoded, {
				height: 150,
			})}
		</div>

		<div class="elapsed" style:width="{playhead.positionNormalized * 100}%">
			<!-- eslint-ignore-next-line svelte/no-at-html -->
			{@html renderWaveformSvg(decoded, {
				height: 150,
			})}
		</div>
	</div>
	{/if}
</div>

<style>
	.waveforms {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 2em;
		row-rule: 1px solid var(--faint);
		padding: 1em 0;
	}

	.waveforms :global(svg) {
		width: var(--total-width);
	}

	.waveform,
	.minimap {
		width: 100%;
		position: relative;

		.full,
		.elapsed {
			position: absolute;
			inset: 0;
		}

		.full {
			--waveform-color: var(--faint);
			z-index: 1;
		}

		.elapsed {
			--waveform-color: var(--fg-neutral);
			z-index: 2;
			overflow: clip;
		}
	}

	.minimap {
		.window {
			position: absolute;
			top: 0;
			bottom: 0;
			border: 1px solid white;
		}
	}

	/* .waveform {
		overflow-x: scroll;
		overflow-y: clip;
	} */
</style>
