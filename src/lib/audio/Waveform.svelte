<script lang="ts">
	import WaveSurfer from 'wavesurfer.js';
	import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';

	interface Props {
		ws: WaveSurfer | undefined;
	}

	let { ws = $bindable() }: Props = $props();
</script>

<div
	class="waveform"
	{@attach (node) => {
		ws = WaveSurfer.create({
			container: node,
			waveColor: 'var(--faint)',
			progressColor: 'var(--bg2-neutral)',
			dragToSeek: false,
			plugins: [RegionsPlugin.create()],
		});

		return () => {
			ws?.destroy();
			ws = undefined;
		};
	}}
></div>
