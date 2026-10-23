<script lang="ts">
	import WaveSurfer from 'wavesurfer.js';

	import { clamp, range } from '$lib/utils.js';

	import Spectrogram from './Spectrogram.svelte';
	import Waveform from './Waveform.svelte';
	import WaveformMinimap from './WaveformMinimap.svelte';

	interface Props {
		url: string | URL;
	}

	const { url }: Props = $props();

	let ws = $state<WaveSurfer>();

	$effect(() => {
		if (!ws) return;
		ws.load(url.toString());
	});
</script>

<div
	class="viewer"
	onwheel={(e) => {
		e.preventDefault();
		if (!ws) return;
		// zoom time, anchored on the cursor
		const rect = ws.getWrapper().getBoundingClientRect();
		const cursorX = e.clientX - rect.left; // px within visible area
		const oldPx = ws.options.minPxPerSec;
		const newPx = clamp(oldPx * (e.deltaY > 0 ? 0.85 : 1.15), 10, 5000);
		const tAtCursor = (ws.getScroll() + cursorX) / oldPx;
		ws.zoom(newPx);
		ws.setScroll(tAtCursor * newPx - cursorX);
	}}
>
	<section class="minimap">
		{#if ws}
			<WaveformMinimap {ws} />
		{/if}
	</section>

	<section class="waveform">
		<div class="scale volume-scale">
			<div class="unit">dB</div>

			{#each range(10).toReversed() as i (i)}
				{const db = $derived(-i * 10)}

				<div class="volume">
					{db.toFixed(0)}
				</div>
			{/each}
		</div>
		<Waveform bind:ws />
	</section>

	<section class="spectrogram">
		{let scale = $state<{ min: number; max: number }>({ min: 20, max: 20e3 })}

		<div class="scale frequency-scale">
			<div class="unit">Hz</div>

			{#each range(10).toReversed() as i (i)}
				{const freq = $derived(
					scale.min * Math.pow(10, (i * Math.log10(scale.max / scale.min)) / 9)
				)}

				{#if freq < 1e3}
					<div class="frequency">
						{freq.toFixed(0)}
					</div>
				{:else}
					<div class="frequency">
						{(freq / 1e3).toFixed(0)}k
					</div>
				{/if}
			{/each}
		</div>

		<div class="chart">
			{#if ws}
				<Spectrogram bind:scale {ws} />
			{/if}
		</div>
	</section>
</div>

<style>
	.viewer {
		display: flex;
		flex-direction: column;
		gap: calc(1rem + 1lh);
	}

	.spectrogram,
	.waveform {
		flex: 1;
		display: flex;
		flex-direction: row-reverse;
	}

	.scale {
		width: 2rem;
		display: flex;
		flex-direction: column;
		position: relative;

		.unit {
			color: var(--gray);
			position: absolute;
			top: -1lh;
		}
	}
</style>
