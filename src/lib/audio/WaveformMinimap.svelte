<script lang="ts">
	import type WaveSurfer from 'wavesurfer.js';

	import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom.js';
	import MinimapPlugin from 'wavesurfer.js/dist/plugins/minimap.js';

	interface Props {
		ws: WaveSurfer;
	}

	const { ws }: Props = $props();

	let minimap = $state.raw<ReturnType<typeof MinimapPlugin.create>>();
	let height = $state<number>();

	$effect(() => {
		if (!minimap) return;
		console.log("registering minimap")
		ws.registerPlugin(minimap);
	});
</script>

<div
	class="minimap"
	bind:clientHeight={height}
	{@attach (node) => {
		if (!ws) return;
		if (!height) return;
		console.log("creating minimap")

		minimap = MinimapPlugin.create({
			container: node,
			height: height,
		});

		return () => {
			minimap?.destroy();
			minimap = undefined;
		};
	}}
></div>

<style>
	.minimap {
		height: 100%;
		width: 100%;
	}
</style>
