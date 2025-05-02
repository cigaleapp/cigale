<!-- @component A wrapped <img> tag that displays an image cropped to a given bounding box. -->

<script>
	import { toCorners } from './BoundingBoxes.svelte';

	/**
	 * @typedef {object} Props
	 * @property {string|undefined} src - The source URL of the image.
	 * @property {string} [class] - Additional classes to apply to the div wrapper.
	 * @property {import('./BoundingBoxes.svelte').Rect} box - The bounding box to crop the image to, in relative (0-1), top-left coordinates.
	 */

	/** @type {Props & Record<string, unknown>} */
	const { src, box, class: klass = '', ...rest } = $props();
	const corners = $derived(toCorners(box));

	const aspectRatio = $derived(box.width / box.height);

	/**
	 *
	 * @param {[number, number]} param0
	 */
	function percents([x, y]) {
		return [x * 100, y * 100].map((c) => c + '%').join(' ');
	}

	/**
	 * @type {number}
	 */
	const scale = $derived((1 / box.width) * Math.min(aspectRatio, 1));

	/**
	 * @type {[number, number]}
	 */
	const translate = $derived.by(() => {
		const [originX, originY] = corners.topleft;
		const [finalW, finalH] = [scale * box.width, scale * box.height];

		if (aspectRatio > 1) {
			return [-originX, -originY + 1 / 2 - finalH / 2];
		} else {
			return [-originX + 1 / 2 - finalW / 2, -originY];
		}
	});
</script>

<picture class="cropped {klass}">
	<img
		style:transform-origin={percents(corners.topleft)}
		style:translate={percents(translate)}
		style:scale="{scale * 100}%"
		style:clip-path="polygon({[
			corners.topleft,
			corners.topright,
			corners.bottomright,
			corners.bottomleft
		]
			.map(percents)
			.join(', ')})"
		{src}
		{...rest}
	/>
</picture>

<style>
	picture {
		overflow: hidden;
	}
	img {
		width: 100%;
		height: 100%;
	}

	/**
	Hugely scaled-up image causes global body overflow even though <picture> is set to overflow: hidden.
	*/
	:global(body) {
		overflow: hidden;
	}
</style>
