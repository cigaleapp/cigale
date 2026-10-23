<script lang="ts">
	import type WaveSurfer from 'wavesurfer.js';

	import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.js';

	interface Props {
		ws: WaveSurfer;
		/** You can bind to it to get the info, it's read-only */
		scale: { min: number; max: number };
	}

	let { ws, scale = $bindable() }: Props = $props();

	let spectro = $state.raw<SpectrogramPlugin>();
	let height = $state<number>();

	$effect(() => {
		if (!spectro) return;
		console.log('registering spectro');
		ws.registerPlugin(spectro);
	});

	$effect(() => {
		console.log('setting spectro scale');
		spectro?.setOptions({
			frequencyMin: scale.min,
			frequencyMax: scale.max,
		});
	});

	$effect(() => {
		if (!height) return;
		console.log('setting spectro height', height);
		spectro?.setOptions({ height });
	});
</script>

<div
	class="spectrogram"
	bind:clientHeight={height}
	onwheel={(e) => {
		if (!e.ctrlKey) return;
		if (!spectro) return;
		e.preventDefault();
		e.stopPropagation();

		// Get frequency at cursor
		const rect = e.currentTarget.getBoundingClientRect();
		const cursorY = e.clientY - rect.top; // px within visible area
		const oldMin = scale.min;
		const oldMax = scale.max;
		const oldRange = oldMax - oldMin;
		const freqAtCursor = oldMax - (cursorY / rect.height) * oldRange;

		// Zoom in/out
		const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
		const newRange = oldRange * zoomFactor;
		const newMin = freqAtCursor - (freqAtCursor - oldMin) * zoomFactor;
		const newMax = newMin + newRange;

		scale.min = Math.max(1, newMin);
		scale.max = Math.min(4e3, newMax);
	}}
	{@attach (node) => {
		console.log('creating spectro');
		spectro = SpectrogramPlugin.create({
			container: node,
			fftSamples: 1024,
			// gainDB: TODO: see if media bunny gives us peak db for free?
			// progressiveLoading: true,
			// scale: TODO: which one to use ?
			// FIXME
			// useWebWorker: true,
			// height: 300,
			splitChannels: false,
			height: node.clientHeight,
		});

		return () => {
			spectro?.destroy();
			spectro = undefined;
		};
	}}
></div>

<style>
	.spectrogram {
		flex: 1;
		background: black;
	}
</style>
