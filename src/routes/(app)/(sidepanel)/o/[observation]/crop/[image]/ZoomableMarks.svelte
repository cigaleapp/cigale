<!-- @component absolute-position content with percentages, and bind the container to something's that's being zoomed: the container's dimensions and position will change to match the zoom & pan, without the content being stretched   -->

<script lang="ts">
	import type { Zoom } from './zoom.svelte.js';
	import type { Snippet } from 'svelte';

	import { fittedImageRect } from './DraggableBoundingBox.svelte.js';

	interface Props {
		source: HTMLElement;
		fit: 'contain' | 'cover' | 'fill';
		zoom: Zoom;
		children: Snippet;
		/** Bindable, read-only. Current position of cursor in normalized values. Null if cursor is not hovering over the area */
		cursor?: null | { x: number; y: number };
	}

	let { source, fit, zoom, children, cursor = $bindable(null) }: Props = $props();

	$inspect('cart', cursor?.x, cursor?.y);

	const sourceRect = $derived(fittedImageRect(fit, source, zoom));
</script>

<div
	class="zoomable-marks"
	style:left="{sourceRect.x}px"
	style:top="{sourceRect.y}px"
	style:width="{sourceRect.width}px"
	style:height="{sourceRect.height}px"
	onpointerleave={() => {
		cursor = null;
	}}
	onpointermove={(e) => {
		const rect = e.currentTarget.getBoundingClientRect();
		cursor = {
			x: (e.clientX - rect.left) / rect.width,
			y: (e.clientY - rect.top) / rect.height,
		};
	}}
>
	{@render children?.()}
</div>

<style>
	.zoomable-marks {
		position: absolute;
		touch-action: none;
	}
</style>
