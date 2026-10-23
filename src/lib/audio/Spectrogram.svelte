<script lang="ts">
	import type WaveSurfer from 'wavesurfer.js';

	import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.js';

	interface Props {
		ws: WaveSurfer;
		/** You can bind to it to get the info, it's read-only */
		scale?: { min: number; max: number };
	}

	let { ws, scale = $bindable({ min: 20, max: 20e3 }) }: Props = $props();

	let spectro = $state<SpectrogramPlugin>();
	let height = $state<number>();

	$effect(() => {
		if (!spectro) return;
		ws.registerPlugin(spectro);
	});

	$effect(() => {
		spectro?.setOptions({
			frequencyMin: scale.min,
			frequencyMax: scale.max,
		});
	});

	$effect(() => {
		if (!height) return;
		spectro?.setOptions({ height });
	});
</script>

<div class="with-scale">
	<div
		class="spectrogram"
		bind:clientHeight={height}
		onwheel={(e) => {
			if (!e.ctrlKey) return;
			if (!spectro) return;
			e.preventDefault();
			e.stopPropagation();

			// TODO: reproduce the way adobe audition zooms the scale
			scale.min *= e.deltaY > 0 ? 1.1 : 0.9;
			scale.max *= e.deltaY > 0 ? 1.1 : 0.9;
			scale.min = Math.max(20, scale.min);
			scale.max = Math.min(100e3, scale.max);
		}}
		{@attach (node) => {
			spectro = SpectrogramPlugin.create({
				container: node,
				fftSamples: 2048,
				rendering: 'windowed',
				// gainDB: TODO: see if media bunny gives us peak db for free?
				progressiveLoading: true,
				// scale: TODO: which one to use ?
				useWebWorker: true,
				splitChannels: false,
			});

			return () => {
				spectro?.destroy();
				spectro = undefined;
			};
		}}
	></div>
</div>

<style>
	.with-scale {
		display: flex;
		flex-direction: row;
		flex: 1;
	}

	.spectrogram {
		flex: 1;
	}
</style>
