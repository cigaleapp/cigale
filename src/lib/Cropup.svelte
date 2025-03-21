<!-- 
@component
show a pop up to crop an image
-->

<script>
	import { toPixelCoords } from './BoundingBoxes.svelte';
	import DraggableBoundingBox from './DraggableBoundingBox.svelte';
	import { imageIdToFileId } from './images';
	import Logo from './Logo.svelte';
	import ModalConfirm from './ModalConfirm.svelte';
	import { uiState } from './state.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {string} key a unique string, used to identify the modal in the page's state.
	 * @property {() => void} [opener] a function you can bind to, to open the modal
	 * @property {{x: number, y: number, width: number, height: number}[]} boundingBoxes the bounding boxes to display
	 * @property {(boundingbox:{x: number, y: number, width: number, height: number}) => void} onconfirm a function to call when the user confirms the crop. the bounding box returned is in absolute pixel coordinates, not relative ones
	 * @property {string} id the id of the image
	 */

	/**  @type {Props} */
	let {
		key: StateKey,
		opener = $bindable(undefined),
		boundingBoxes = [],
		onconfirm,
		id
	} = $props();

	const image = $derived(uiState.previewURLs.get(imageIdToFileId(id)));

	/** @type {{x: number, y: number, width: number, height: number}[]} */
	let BBout = [];
	for (let i = 0; i < boundingBoxes.length; i++) {
		BBout.push({
			x: boundingBoxes[i].x,
			y: boundingBoxes[i].y,
			width: boundingBoxes[i].width,
			height: boundingBoxes[i].height
		});
	}

	let imageHeight = $state(0);
	let imageWidth = $state(0);
</script>

<ModalConfirm
	key={StateKey}
	title="Crop"
	onconfirm={() => onconfirm(BBout[0])}
	bind:open={opener}
	confirm="Crop"
	cancel="Cancel"
>
	{#if image}
		<div class="content">
			{#if boundingBoxes}
				{#each boundingBoxes as bb, index (index)}
					<DraggableBoundingBox
						bb={toPixelCoords(bb)}
						bind:bbout={BBout[index]}
						sizew={imageWidth}
						sizeh={imageHeight}
					></DraggableBoundingBox>
				{/each}
			{/if}
			<img
				src={image}
				alt="imagetocrop"
				style="width: 100%; height: 100%;"
				bind:clientHeight={imageHeight}
				bind:clientWidth={imageWidth}
			/>
		</div>
	{:else}
		<div class="errored">
			<Logo variant="error" />
			<h1>Ooops!!</h1>
			<p>Image introuvable.</p>
		</div>
	{/if}
</ModalConfirm>

<style>
	.content {
		position: relative;
		display: inline-block;
	}

	.errored {
		display: flex;
		height: 100%;
		flex-grow: 1;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		--size: 5rem;
	}
	.errored h1 {
		margin-top: 2rem;
	}
</style>
