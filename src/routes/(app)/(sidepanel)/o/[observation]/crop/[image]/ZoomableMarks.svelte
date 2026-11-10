<!-- @component absolute-position content with percentages, and bind the container to something's that's being zoomed: the container's dimensions and position will change to match the zoom & pan, without the content being stretched   -->

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fittedImageRect } from './DraggableBoundingBox.svelte.js';
	import type { Zoom } from './zoom.svelte.js';

	interface Props {
		source: HTMLElement;
		fit: 'contain' | 'cover' | 'fill';
		zoom: Zoom;
		children: Snippet;
	}

	const { source, fit, zoom, children }: Props = $props()

	$inspect("s", source.clientHeight)

	const sourceRect = $derived(fittedImageRect(fit, source, zoom));
</script>

<div
	class="zoomable-marks"
	style:left="{sourceRect.x}px"
	style:top="{sourceRect.y}px"
	style:width="{sourceRect.width}px"
	style:height="{sourceRect.height}px"
>
	{@render children()}
</div>

<style>
	.zoomable-marks {
		position: absolute;
		touch-action: none;

	}
</style>
