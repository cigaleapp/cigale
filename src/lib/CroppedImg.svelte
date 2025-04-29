<!-- @component A wrapped <img> tag that displays an image cropped to a given bounding box. -->

<script>
	import { toCorners } from './BoundingBoxes.svelte';

	/**
	 * @typedef {object} Props
	 * @property {string|undefined} src - The source URL of the image.
	 * @property {string} class - Additional classes to apply to the div wrapper.
	 * @property {import('./BoundingBoxes.svelte').Rect} box - The bounding box to crop the image to, in relative (0-1), top-left coordinates.
	 */

	/** @type {Props} */
	const { src, box, class: klass, ...rest } = $props();
	const corners = $derived(toCorners(box));
</script>

<picture class="cropped {klass}">
	<img
		style:clip-path="polygon({[
			corners.topleft,
			corners.topright,
			corners.bottomright,
			corners.bottomleft
		]
			.map(([x, y]) => `${x * 100}% ${y * 100}%`)
			.join(', ')})"
		style:translate={corners.topleft.map((c) => `${-c * 100}%`).join(' ')}
		style:transform-origin={corners.topleft.map((c) => c * 100 + '%').join(' ')}
		style:scale={box.height > box.width
			? `${(1 / box.height) * 100}% ${(1 / box.height) * 100}%`
			: `${(1 / box.width) * 100}% ${(1 / box.width) * 100}%`}
		{src}
		{...rest}
	/>
</picture>

<style>
	picture {
		background: var(--gray);
		overflow: hidden;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
