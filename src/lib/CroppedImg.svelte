<!-- @component A wrapped <img> tag that displays an image cropped to a given bounding box. -->

<script lang="ts">
	import { toCorners, type Rect } from './BoundingBoxes.svelte';

	interface Props {
		src: string | undefined;
		class?: string;
		box: Rect;
		blurfill?: boolean;
		dimensions: { width: number; height: number };
		background?: boolean;
		/** Transition transformation changes */
		transitions?: boolean;
	}

	const {
		src,
		box,
		blurfill,
		background,
		dimensions: imageDimensions,
		class: klass = '',
		transitions = false,
		...rest
	}: Props & Record<string, unknown> = $props();

	const corners = $derived(toCorners(box));

	const aspectRatio = $derived(
		(box.width * imageDimensions.width) / (box.height * imageDimensions.height)
	);

	function percents(coords: undefined | [number, number]) {
		return coords?.map((c) => c * 100 + '%').join(' ');
	}

	let areaRect: undefined | DOMRectReadOnly = $state();
	const areaAspectRatio = $derived.by(() => {
		if (!areaRect) return undefined;
		const { width, height } = areaRect;
		return width / height;
	});

	const scale: undefined | [number, number] = $derived.by(() => {
		if (!areaAspectRatio) return undefined;

		const [w, h] = [
			(1 / box.width) * Math.min(aspectRatio, 1),
			(1 / box.height) * Math.min(1 / aspectRatio, 1)
		];

		if (areaAspectRatio > aspectRatio) {
			return [w / areaAspectRatio, h];
		} else {
			return [w, h * areaAspectRatio];
		}
	});

	const translate: undefined | [number, number] = $derived.by(() => {
		if (!scale) return undefined;

		const [originX, originY] = corners.topleft;
		const [scaleW, scaleH] = scale;
		const [finalW, finalH] = [scaleW * box.width, scaleH * box.height];

		if (aspectRatio > 1) {
			return [-originX + 1 / 2 - finalW / 2, -originY + 1 / 2 - finalH / 2];
		} else {
			return [-originX + 1 / 2 - finalW / 2, -originY];
		}
	});
</script>

<picture class="cropped {klass}" bind:contentRect={areaRect} class:transitions>
	{#if blurfill}
		<img data-is-blur="true" class="blur" {src} alt="" aria-hidden="true" />
	{/if}

	{#if background}
		<img
			style:transform-origin={percents(corners.topleft)}
			style:translate={percents(translate)}
			style:scale={percents(scale)}
			{src}
			alt=""
			aria-hidden="true"
			data-is-background="true"
			class="background"
		/>
	{/if}

	<img
		{src}
		{...rest}
		style:transform-origin={percents(corners.topleft)}
		style:translate={percents(translate)}
		style:scale={percents(scale)}
		style:clip-path="polygon({[
			corners.topleft,
			corners.topright,
			corners.bottomright,
			corners.bottomleft
		]
			.map(percents)
			.join(', ')})"
	/>
</picture>

<style>
	picture {
		overflow: hidden;
		position: relative;
		display: block;
	}

	picture.transitions img {
		transition: all 0.2s;
	}

	img {
		width: 100%;
		height: 100%;
	}

	img.blur {
		position: absolute;
		inset: 0;
		filter: blur(20px);
		scale: 1.5;
	}

	img.background {
		position: absolute;
		inset: 0;
		filter: brightness(0.25);
	}

	/**
	Hugely scaled-up image causes global body overflow even though <picture> is set to overflow: hidden.
	*/
	:global(body) {
		overflow: hidden;
	}
</style>
