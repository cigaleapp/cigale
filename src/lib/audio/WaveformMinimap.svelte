<script lang="ts">
	import type WaveSurfer from 'wavesurfer.js';

	import MinimapPlugin from 'wavesurfer.js/dist/plugins/minimap.js';

	interface Props {
		ws: WaveSurfer;
	}

	const { ws }: Props = $props();

	let minimap = $state<ReturnType<typeof MinimapPlugin.create>>();

	$effect(() => {
		if (!minimap) return;
		ws.registerPlugin(minimap);
	});
</script>

<div
	class="minimap"
	{@attach (node) => {
		if (!ws) return;

		minimap = MinimapPlugin.create({
			container: node,
		});

		return () => {
			minimap?.destroy();
			minimap = undefined;
		};
	}}
></div>
