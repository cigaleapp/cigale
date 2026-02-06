<script lang="ts">
	import IconZoomIn from '~icons/ri/zoom-in-line';
	import IconZoomOut from '~icons/ri/zoom-out-line';
	import { FULL_IMAGE_CROPBOX, toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import Carousel, { type Props as CarouselProps } from '$lib/Carousel.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import type { Image } from '$lib/database';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { uiState } from '$lib/state.svelte';

	import type { Expandable } from './+page.svelte';
	import WithExpandButton from './WithExpandButton.svelte';

	interface Props {
		images: Image[];
		currentImage: Image;
		expand: Expandable;
	}

	let { images, currentImage = $bindable(), expand = $bindable() }: Props = $props();

	const layout = $derived(uiState.currentSession?.fullscreenClassifier.layout ?? 'top-bottom');

	let zoomed = $state(true);
	let transitionCrop = $state(false);
	let carouselScrollers: CarouselProps['scrollers'] = $state();

	defineKeyboardShortcuts('classification', {
		ArrowRight: {
			help: 'Image suivante',
			do: () => carouselScrollers?.next()
		},
		ArrowLeft: {
			help: 'Image précédente',
			do: () => carouselScrollers?.prev()
		},
		O: {
			help: "Agrandir/Réduire l'image",
			do() {
				transitionCrop = false;
				expand = expand === 'subject' ? 'none' : 'subject';
			}
		},
		Z: {
			help: "Voir l'image entière/recadrée",
			do() {
				transitionCrop = true;
				zoomed = !zoomed;
				setTimeout(() => {
					transitionCrop = false;
				}, /* XXX: Duration of crop transition as set in CroppedImg component */ 200);
			}
		}
	});
</script>

<WithExpandButton
	corner={layout === 'top-bottom' ? 'top-left' : 'top-right'}
	keyboard="O"
	bind:expand={
		() => expand === 'subject',
		(v) => {
			expand = v ? 'subject' : 'none';
		}
	}
>
	{#snippet otherButtons()}
		<ButtonIcon
			help={zoomed ? "Voir l'image entière" : "Voir l'image recadrée"}
			keyboard="Z"
			onclick={() => {
				zoomed = !zoomed;
			}}
		>
			{#if zoomed}
				<IconZoomOut />
			{:else}
				<IconZoomIn />
			{/if}
		</ButtonIcon>
	{/snippet}

	<Carousel
		items={images}
		bind:scrollers={carouselScrollers}
		bind:currentItem={currentImage}
		keyboard-prev="ArrowLeft"
		keyboard-next="ArrowRight"
	>
		{#snippet item(image)}
			{@const box = zoomed ? uiState.cropMetadataValueOf(image)?.value : FULL_IMAGE_CROPBOX}
			{#if box}
				<CroppedImg
					dimensions={image.dimensions}
					src={uiState.getPreviewURL(image.fileId)}
					box={toTopLeftCoords(box)}
					transitions={transitionCrop}
					background
				/>
			{:else}
				<picture><img src={uiState.getPreviewURL(image.fileId)} alt="" /></picture>
			{/if}
		{/snippet}
	</Carousel>
</WithExpandButton>

<style>
	:global(picture) {
		height: 100%;
	}
</style>
