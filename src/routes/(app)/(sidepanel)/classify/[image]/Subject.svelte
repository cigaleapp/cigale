<script lang="ts">
	import IconZoomIn from '~icons/ri/zoom-in-line';
	import IconZoomOut from '~icons/ri/zoom-out-line';
	import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import type { Image } from '$lib/database';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { uiState } from '$lib/state.svelte';

	import type { Expandable } from './+page@(app).svelte';
	import type { Layout } from './LayoutSwitcher.svelte';
	import WithExpandButton from './WithExpandButton.svelte';

	interface Props {
		image: Image;
		expand: Expandable;
		layout: Layout;
	}

	let { image, expand = $bindable(), layout }: Props = $props();

	let zoomed = $state(true);

	const box = $derived(
		zoomed
			? uiState.cropMetadataValueOf(image)?.value
			: {
					w: 1,
					h: 1,
					x: 0.5,
					y: 0.5
				}
	);

	defineKeyboardShortcuts('classification', {
		O: {
			help: "Agrandir/Réduire l'image",
			do() {
				expand = expand === 'subject' ? 'none' : 'subject';
			}
		},
		Z: {
			help: "Voir l'image entière/recadrée",
			do() {
				zoomed = !zoomed;
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

	{#if box}
		<CroppedImg
			src={uiState.getPreviewURL(image.fileId)}
			box={toTopLeftCoords(box)}
			background
		/>
	{:else}
		<picture><img src={uiState.getPreviewURL(image.fileId)} alt="" /></picture>
	{/if}
</WithExpandButton>

<style>
	:global(picture) {
		height: 100%;
	}
</style>
