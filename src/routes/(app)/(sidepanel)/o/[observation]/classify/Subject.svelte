<script lang="ts">
	import type { Expandable } from './WithExpandButton.svelte';
	import type { Props as CarouselProps } from '$lib/Carousel.svelte';
	import type * as DB from '$lib/database';

	import { onDestroy } from 'svelte';

	import IconZoomIn from '~icons/ri/zoom-in-line';
	import IconZoomOut from '~icons/ri/zoom-out-line';
	import AudioPlayer from '$lib/audio/AudioPlayer.svelte';
	import { paletteSVGFilter } from '$lib/audio/spectrogram.js';
	import { FULL_IMAGE_CROPBOX, toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import Carousel from '$lib/Carousel.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { accessBytes } from '$lib/storage/utils.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { switchValue } from '$lib/utils.js';
	import { getTheme } from '$routes/+layout.svelte';

	import WithExpandButton from './WithExpandButton.svelte';

	interface Props {
		medias: Array<DB.Image | DB.Sound>;
		currentMedia: DB.Image | DB.Sound;
		expand: Expandable;
		buttons: `${'top' | 'bottom'}-${'left' | 'right'}`;
	}

	let {
		medias,
		currentMedia = $bindable(),
		expand = $bindable(),
		buttons: buttonsCorner,
	}: Props = $props();

	let zoomed = $state(true);
	let transitionCrop = $state(false);
	let carouselScrollers: CarouselProps['scrollers'] = $state();
	const theme = getTheme();

	/** Maps file IDs to blob URIs */
	let audioSources = $state(new Map<string, string>());

	$effect(() => {
		if (!currentMedia) return;
		if (currentMedia._table !== 'Sound') return;
		const audiofile = tables.AudioFile.getFromState(currentMedia.fileId);
		if (!audiofile) return;

		(async () => {
			audioSources.set(
				audiofile.id,
				await accessBytes('AudioFile', audiofile)
					.then((bytes) => new Blob([bytes], { type: audiofile.contentType }))
					.then((blob) => URL.createObjectURL(blob))
			);
		})();
	});

	onDestroy(() => {
		for (const uri of audioSources.values()) {
			URL.revokeObjectURL(uri);
		}
	});

	defineKeyboardShortcuts('classification', {
		ArrowRight: {
			help: 'Image suivante',
			do: () => carouselScrollers?.next(),
		},
		ArrowLeft: {
			help: 'Image précédente',
			do: () => carouselScrollers?.prev(),
		},
		O: {
			help: "Agrandir/Réduire l'image",
			do() {
				transitionCrop = false;
				expand = expand === 'subject' ? 'none' : 'subject';
			},
		},
		C: {
			help: "Voir l'image entière/recadrée",
			do() {
				transitionCrop = true;
				zoomed = !zoomed;
				setTimeout(() => {
					transitionCrop = false;
				}, /* XXX: Duration of crop transition as set in CroppedImg component */ 200);
			},
		},
	});
</script>

<!-- eslint-disable-next-line svelte/no-at-html -->
{@html paletteSVGFilter(
	switchValue(theme.effective, {
		light: 'ylgnbu',
		dark: 'magma',
	})
)}

<WithExpandButton
	corner={buttonsCorner}
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
		items={medias}
		slideName={(img, i) => `${img.filename} (${i + 1} sur ${medias.length})`}
		bind:scrollers={carouselScrollers}
		bind:currentItem={currentMedia}
		keyboard-prev="ArrowLeft"
		keyboard-next="ArrowRight"
	>
		{#snippet item(media)}
			{const box = $derived(
				zoomed
					? (uiState.cropMetadataValueOf(media)?.value ?? FULL_IMAGE_CROPBOX)
					: FULL_IMAGE_CROPBOX
			)}
			{const audiofile = $derived(
				media._table === 'Sound' ? tables.AudioFile.getFromState(media.fileId) : undefined
			)}
			<div class="slide" class:audio={audiofile}>
				<CroppedImg
					dimensions={media._table === 'Sound'
						? audiofile!.spectrogram.imageDimensions
						: media.dimensions}
					src={uiState.getPreviewURL(media.fileId)}
					alt={media.filename}
					box={toTopLeftCoords(box)}
					transitions={transitionCrop}
					background
				/>

				<div class="audio-player">
					<AudioPlayer {box} src={audioSources.get(media.fileId ?? '')} />
				</div>
			</div>
		{/snippet}
	</Carousel>
</WithExpandButton>

<style>
	.slide {
		width: 100%;
		height: 100%;

		:global(picture) {
			height: 100%;
		}
	}

	.slide.audio {
		--img-filter: url(#spectro-palette);
		--audio-player-height: 3rem;

		:global(picture) {
			height: calc(100% - var(--audio-player-height));
		}

		.audio-player {
			font-size: 0.85rem;
		}
	}
</style>
