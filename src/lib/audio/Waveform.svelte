<script lang="ts">
	import WaveSurfer from 'wavesurfer.js';
	import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
	import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom.js';

	interface Props {
		ws: WaveSurfer | undefined;
	}

	let { ws = $bindable() }: Props = $props();

	let zoomlvl = $state<number>(1);
	$effect(() => {
		ws?.on('zoom', lvl => {
			zoomlvl = lvl;
		})
	})

	$inspect("zoom",  zoomlvl)
</script>

<div
	class="waveform"
	{@attach (node) => {
		console.log('creating wavesurfer');
		ws = WaveSurfer.create({
			container: node,
			waveColor: 'currentColor',
			progressColor: 'var(--bg2-neutral)',
			dragToSeek: false,
			interact: true,
			height: node.clientHeight,
			mediaControls: true,
			plugins: [
				RegionsPlugin.create(),
				ZoomPlugin.create({
					exponentialZooming: true,
					// scale: 0.15,
					maxZoom: 1000,

				}),
			],
		});

		return () => {
			ws?.destroy();
			ws = undefined;
		};
	}}
></div>

<style>
	.waveform {
		width: 100%;
		height: 100%;
	}
</style>
