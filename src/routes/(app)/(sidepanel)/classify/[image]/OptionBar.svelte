<script lang="ts">
	import IconPrevious from '~icons/ri/arrow-left-line';
	import IconNext from '~icons/ri/arrow-right-line';
	import IconExpand from '~icons/ri/expand-up-down-line';
	import { invalidate } from '$app/navigation';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import type { Image, Metadata, MetadataEnumVariant } from '$lib/database.js';
	import { databaseHandle, dependencyURI } from '$lib/idb.svelte.js';
	import { storeMetadataValue, type TypedMetadataValue } from '$lib/metadata.js';
	import MetadataCombobox from '$lib/MetadataCombobox.svelte';
	import { compareBy, entries, mapKeys, nonnull } from '$lib/utils.js';

	interface Props {
		image: Image;
		focusedMetadata: Metadata;
		options: MetadataEnumVariant[];
		currentMetadataValue: TypedMetadataValue<'enum'>;
	}

	const { image, focusedMetadata, options, currentMetadataValue }: Props = $props();

	const option = $derived(options.find((o) => o.key === currentMetadataValue.value)!);

	const confidences = $derived({
		[option.key]: currentMetadataValue.confidence,
		...mapKeys(currentMetadataValue.alternatives!, (k) => JSON.parse(k).toString() as string)
	});

	const byConfidence = $derived(
		Object.entries(confidences)
			.map(([key, confidence]) => ({ key, confidence }))
			.sort(compareBy('confidence'))
			.reverse()
			.map(({ key }) => options.find((o) => o.key === key))
			.filter(nonnull)
	);

	const currentIndex = $derived(byConfidence.findIndex((o) => o.key === option.key));
	const nextOption = $derived(byConfidence[currentIndex + 1]);
	const prevOption = $derived(byConfidence[currentIndex - 1]);

	async function setOption(option: { key: string }, confidences: Record<string, number>) {
		if (!image) throw new Error('Image not found');
		if (!focusedMetadata) throw new Error('No metadata focused');
		if (!currentMetadataValue) throw new Error('No current metadata value');

		await storeMetadataValue({
			db: databaseHandle(),
			metadataId: focusedMetadata.id,
			subjectId: image.id,
			type: 'enum',
			value: option.key,
			confidence: confidences[option.key],
			alternatives: [
				{ value: currentMetadataValue.value, confidence: currentMetadataValue.confidence },
				...entries(confidences).map(([value, confidence]) => ({
					value,
					confidence
				}))
			]
		});

		await invalidate(dependencyURI('Image', image.id));
	}
</script>

<div class="bar">
	<div class="prev">
		<ButtonSecondary
			disabled={!prevOption}
			onclick={async () => setOption(prevOption!, confidences)}
			help={{
				text: prevOption?.label ?? '',
				keyboard: 'ArrowLeft'
			}}
		>
			{#if prevOption}
				<ConfidencePercentage value={confidences[prevOption.key]} />
			{/if}
			Précédente
			<IconPrevious />
		</ButtonSecondary>
	</div>

	<div class="current">
		<ButtonSecondary onclick={() => {}}>
			<MetadataCombobox {confidences} {options} type="single" value={option.key}
			></MetadataCombobox>
			{#if currentMetadataValue?.confidence}
				<ConfidencePercentage value={currentMetadataValue.confidence} />
			{/if}
			<IconExpand />
		</ButtonSecondary>
	</div>

	<div class="next">
		<ButtonSecondary
			disabled={!nextOption}
			onclick={async () => setOption(nextOption!, confidences)}
			help={{
				text: nextOption?.label ?? '',
				keyboard: 'ArrowRight'
			}}
		>
			<IconNext />
			Suivante
			{#if nextOption}
				<ConfidencePercentage value={confidences[nextOption.key]} />
			{/if}
		</ButtonSecondary>
	</div>
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1em;
	}

	.current :global(input) {
		font-size: 1em;
		background: transparent;
		width: 150px;
	}
</style>
