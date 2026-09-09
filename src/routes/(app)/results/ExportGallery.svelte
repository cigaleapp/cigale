<script lang="ts">
	import type * as DB from '$lib/database.js';

	import { FULL_IMAGE_CROPBOX, toRelativeCoords } from '$lib/BoundingBoxes.svelte.js';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';

	import { exporter } from './files.svelte.js';

	function box(image: DB.Image) {
		const cropbox = uiState.cropMetadataValueOf(image)?.value ?? FULL_IMAGE_CROPBOX;

		return toRelativeCoords(image.dimensions)(
			exporter.cropPadding.apply(image.dimensions, cropbox)
		);
	}
</script>

<div class="gallery">
	{#each tables.Image.state.slice(0, 100) as image (image.id)}
		<div class="thumbnail" data-box={JSON.stringify(uiState.cropMetadataValueOf(image))}>
			<CroppedImg
				transitions
				blurfill
				src={uiState.getPreviewURL(image.fileId)}
				box={box(image)}
				dimensions={image.dimensions}
			/>
		</div>
	{/each}
</div>

<style>
	.gallery {
		align-self: flex-start;
		width: 100%;
		display: grid;
		grid-auto-flow: columns;
		grid-template-columns: repeat(auto-fill, var(--gallery-thumb));
		gap: 1em;
		max-height: calc(4 * (var(--gallery-thumb) + var(--gallery-gap)));
		overflow: hidden;

		.thumbnail {
			width: var(--gallery-thumb);
			height: var(--gallery-thumb);
			position: relative;

			:global(picture) {
				position: absolute;
				inset: 0;
			}
		}
	}
</style>
