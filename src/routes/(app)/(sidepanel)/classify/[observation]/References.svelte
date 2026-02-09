<script lang="ts">
	import { page } from '$app/state';
	import Carousel, { type Props as CarouselProps } from '$lib/Carousel.svelte';
	import type { MetadataEnumVariant } from '$lib/database';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import Logo from '$lib/Logo.svelte';
	import { uiState } from '$lib/state.svelte';

	import type { Expandable } from './+page.svelte';
	import WithExpandButton from './WithExpandButton.svelte';

	interface Props {
		option: MetadataEnumVariant;
		expand: Expandable;
	}

	let carouselScrollers: CarouselProps['scrollers'] = $state();

	let { option, expand = $bindable() }: Props = $props();
	const { image, images, label, key } = $derived(option);

	const layout = $derived(uiState.currentSession?.fullscreenClassifier.layout ?? 'top-bottom');

	defineKeyboardShortcuts('classification', {
		'Shift+L': {
			help: 'Image de référence suivante',
			do: () => carouselScrollers?.next()
		},
		'Shift+J': {
			help: 'Image de référence précédente',
			do: () => carouselScrollers?.prev()
		},
		E: {
			help: 'Agrandir/Réduire les images de référence',
			do: () => {
				expand = expand === 'references' ? 'none' : 'references';
			}
		}
	});
</script>

{#if images || image}
	<WithExpandButton
		corner={layout === 'top-bottom' ? 'bottom-left' : 'top-left'}
		keyboard="E"
		bind:expand={
			() => expand === 'references',
			(v) => {
				expand = v ? 'references' : 'none';
			}
		}
	>
		<Carousel
			items={images ?? [image]}
			slideName={(_, i) => `Image de référence ${i + 1} sur ${images?.length ?? 1}`}
			bind:scrollers={carouselScrollers}
			keyboard-prev="Shift+J"
			keyboard-next="Shift+L"
		>
			{#snippet item(src)}
				{#if src && page.url.hostname === 'localhost'}
					<img src="https://cors.gwen.works/{src}" />
				{:else}
					<img {src} />
				{/if}
			{/snippet}
		</Carousel>
	</WithExpandButton>
{:else}
	<div class="empty">
		<Logo --size="4em" variant="empty" />
		<p>
			Aucune image de référence pour
			<br />
			{#if label}
				<em>{label}</em>
			{:else}
				<code>{key}</code>
			{/if}
		</p>
	</div>
{/if}

<style>
	.empty {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
		justify-content: center;
		align-items: center;
		height: 100%;

		p {
			max-width: 300px;
			text-align: center;
		}
	}

	img {
		height: 100%;
		width: 100%;
		object-fit: contain;
	}
</style>
