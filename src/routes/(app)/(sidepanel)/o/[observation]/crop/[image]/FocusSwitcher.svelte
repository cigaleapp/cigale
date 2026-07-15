<script lang="ts">
	import type { SelectedBox } from './+page.svelte';

	import { fade, fly } from 'svelte/transition';

	import IconAdd from '~icons/ri/add-line';
	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import { tables } from '$lib/idb.svelte';
	import { uiState } from '$lib/uistate.svelte';

	import {
		boundingBoxes,
		currentImages,
		focusedImage,
		getHideAll,
		setFocusedImage,
		setHideAll,
		zoom,
	} from './+page.svelte';
	import { getInitialCrops } from './actions.svelte';
	import { switchTool } from './Toolbar.svelte';

	interface Props {
		selectedBox: SelectedBox;
		imageIsLoading: boolean;
	}

	const firstImage = $derived(currentImages().at(0));
	const fileId = $derived(firstImage?.fileId);
	const focusedImageId = $derived(focusedImage()?.id);
	const boxesCount = $derived(Object.keys(boundingBoxes()).length);

	let { selectedBox = $bindable(), imageIsLoading }: Props = $props();

	let scrollable = $state(false);

	let element = $state<HTMLElement>();

	// No way to listen to scrollWidth changes: https://stackoverflow.com/q/1835219/9943464
	$effect(() => {
		boundingBoxes();
		if (!element) return;

		scrollable = element.scrollWidth > element.clientWidth;
	});
</script>

{#if !imageIsLoading && zoom.scale <= 1.2 && !zoom.panning}
	<nav class="focus-switcher" class:scrollable bind:this={element} out:fade={{ duration: 100 }}>
		{#each Object.entries(boundingBoxes()) as [imageId, box], i (imageId)}
			{const image = $derived(tables.Image.getFromState(imageId))}
			{const focused = $derived(focusedImageId === image?.id)}
			{const confidence = $derived(getInitialCrops()[imageId]?.confidence)}

			{#if image?.fileId && firstImage}
				<div class="with-indicator">
					<button
						in:fly|global={{
							duration: 200,
							delay: (i * 100) / Math.max(boxesCount, 4),
							y: 30,
						}}
						class="show-one"
						aria-pressed={focused}
						onclick={() => {
							if (focused) {
								setFocusedImage(null);
								switchTool('Main');
							} else {
								setFocusedImage(image.id);
								switchTool('Glisser-recadrer');
							}
						}}
					>
						<CroppedImg
							dimensions={firstImage.dimensions}
							box={toTopLeftCoords(box)}
							src={uiState.getPreviewURL(image.fileId)}
						/>
					</button>

					<div class="confidence">
						{#if confidence && confidence < 1}
							<ConfidencePercentage
								tooltip={() => ''}
								compact
								value={confidence}
								no-fallback
							/>
						{/if}
					</div>
				</div>
			{/if}
		{/each}

		{#key fileId}
			<div
				class="with-indicator"
				in:fly|global={{
					duration: 200,
					delay: (boxesCount * 100) / Math.max(boxesCount, 4),
					y: 30,
				}}
				onclick={() => {
					if (getHideAll()) {
						setHideAll(false);
						switchTool('Main');
					} else {
						setHideAll(true);
						switchTool('Glisser-recadrer');
					}
				}}
			>
				<button class="show-one new" aria-pressed={getHideAll()}>
					<IconAdd />
				</button>
				<div class="confidence"></div>
			</div>
		{/key}
	</nav>
{/if}

<style>
	nav {
		color: white;
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0 2em;
		color-scheme: dark;

		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: none;
		justify-content: center;

		&.scrollable {
			justify-content: start;
		}
	}

	button {
		--thumbsize: 2.5rem;
		color: currentColor;
		display: flex;
		justify-content: center;
		align-items: center;

		background-color: transparent;
		width: var(--thumbsize);
		height: var(--thumbsize);
		padding: 0;
		margin: 0;
		border-radius: var(--corner-radius);
		overflow: hidden;
		border: 1px solid white;
		background: black;

		transition: opacity 200ms;
	}

	nav:has([aria-pressed='true']) [aria-pressed='false'] {
		opacity: 0.6;
	}

	button :global(picture) {
		width: var(--thumbsize);
		height: var(--thumbsize);
	}

	.with-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5em;

		.confidence {
			height: 1lh;
			font-size: 0.7rem;
			text-align: center;
			position: relative;

			&::after {
				position: absolute;
				content: '';
				top: 0;
				left: 50%;
				translate: -50% 0;
				display: block;
				width: 0.33rem;
				height: 0.33rem;
				background: white;
				border-radius: 9999px;
				transition: opacity 200ms;
				margin-top: 0.25rem;
			}

			> :global(span) {
				transition: opacity 200ms;
			}
		}

		&:has([aria-pressed='false'], .new) .confidence::after {
			opacity: 0;
		}

		&:has([aria-pressed='true']) .confidence > :global(span) {
			opacity: 0;
		}
	}

	button.new {
		/*background: transparent;*/
		border-style: dashed;
	}
</style>
