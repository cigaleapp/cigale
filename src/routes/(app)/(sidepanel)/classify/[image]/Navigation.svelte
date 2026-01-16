<script lang="ts">
	import IconPrev from '~icons/ri/arrow-left-s-line';
	import IconNext from '~icons/ri/arrow-right-s-line';
	import IconConfirmedClassification from '~icons/ri/check-double-line';
	import IconClassified from '~icons/ri/check-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfirmedOverlay from '$lib/ConfirmedOverlay.svelte';
	import type { Image, Metadata } from '$lib/database';
	import { percent } from '$lib/i18n';
	import { databaseHandle } from '$lib/idb.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import { storeMetadataValue } from '$lib/metadata';
	import { goto } from '$lib/paths.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';

	interface Props {
		currentImage: Image;
		currentImageIndex: number;
		totalImages: number;
		nextImage: { id: string } | undefined | null;
		prevImage: { id: string } | undefined | null;
		classifiedImagesCount: number;
		confirmedClassificationsCount: number;
		nextUnconfirmedImage?: { id: string } | undefined | null;
		focusedMetadata: Metadata | undefined;
	}

	const {
		currentImage,
		currentImageIndex,
		totalImages,
		nextImage,
		prevImage,
		classifiedImagesCount,
		confirmedClassificationsCount,
		nextUnconfirmedImage,
		focusedMetadata
	}: Props = $props();

	let showOverlay = $state(async () => {});

	async function goToImage(image: { id: string } | undefined | null) {
		if (!image) return;
		await goto('/(app)/(sidepanel)/classify/[image]', {
			image: image.id
		});
	}

	async function setConfirmation(confirmed: boolean) {
		if (!focusedMetadata) return;
		if (!uiState.currentSessionId) return;

		const currently = currentImage.metadata[focusedMetadata.id];

		if (!currently) {
			toasts.warn('Aucune classification à confirmer pour cette image.');
		} else {
			await storeMetadataValue({
				db: databaseHandle(),
				metadataId: focusedMetadata.id,
				sessionId: uiState.currentSessionId,
				subjectId: currentImage.id,
				...currently,
				confirmed
			});

			if (!currently.confirmed && confirmed) await showOverlay();
		}
	}

	defineKeyboardShortcuts('classification', {
		'$mod+ArrowRight': {
			help: 'Image suivante',
			do: async () => goToImage(nextImage)
		},
		Space: {
			help: 'Marquer la classification comme confirmée et passer à la prochaine image non confirmée',
			async do() {
				await setConfirmation(true);
				await goToImage(nextUnconfirmedImage);
			}
		},
		'$mod+ArrowLeft': {
			help: 'Image précédente',
			do: async () => goToImage(prevImage)
		},
		'Shift+Space': {
			help: 'Image précédente',
			do: async () => goToImage(prevImage)
		}
	});
</script>

<ConfirmedOverlay bind:show={showOverlay} />

<section class="progress">
	{#snippet percentage(value: number)}
		<code>
			{percent(value / totalImages)}
		</code>
	{/snippet}

	<div class="bar">
		<p>
			<IconClassified />
			Images classifiées
			{@render percentage(classifiedImagesCount)}
		</p>
		<ProgressBar alwaysActive progress={classifiedImagesCount / totalImages} />
	</div>
	<div class="bar">
		<p>
			<IconConfirmedClassification />
			Classifications confirmées
			{@render percentage(confirmedClassificationsCount)}
		</p>
		<ProgressBar alwaysActive progress={confirmedClassificationsCount / totalImages} />
	</div>
</section>

<nav>
	<div class="image-switcher">
		<ButtonIcon
			help="Image précédente"
			keyboard="$mod+ArrowLeft"
			disabled={!prevImage}
			onclick={async () => {
				await goToImage(prevImage);
			}}
		>
			<IconPrev />
		</ButtonIcon>
		<code class="numbers">
			{currentImageIndex + 1}
			<div class="separator">⁄</div>
			{totalImages}
		</code>
		<ButtonIcon
			help="Image suivante"
			keyboard="$mod+ArrowRight"
			disabled={!nextImage}
			onclick={async () => {
				await goToImage(nextImage);
			}}
		>
			<IconNext />
		</ButtonIcon>
	</div>
	<div class="continue">
		<ButtonSecondary
			keyboard="Space"
			help="Marquer la classification comme confirmée et passer à la prochaine classification non confirmée"
			disabled={!nextUnconfirmedImage}
			onclick={async () => {
				await setConfirmation(true);
				await goToImage(nextUnconfirmedImage);
			}}
		>
			Continuer
		</ButtonSecondary>
	</div>
</nav>

<style>
	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.image-switcher {
		display: flex;
		align-items: center;
		gap: 0.5em;

		.numbers {
			display: flex;
			align-items: center;
			gap: 0.2em;
			font-family: var(--font-mono);
		}
	}

	.progress {
		display: flex;
		flex-direction: column;
		--inactive-bg: var(--gray);
		gap: 1.25em;
		margin-bottom: 2em;
	}

	.progress .bar p {
		margin-bottom: 0.25em;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.progress .bar p code {
		color: var(--gay);
		font-size: 0.9em;
		margin-left: auto;
	}
</style>
