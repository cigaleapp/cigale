<script lang="ts">
	import IconPrevious from '~icons/ri/arrow-left-line';
	import IconNext from '~icons/ri/arrow-right-line';
	import IconExpand from '~icons/ri/expand-up-down-line';
	import { invalidate } from '$app/navigation';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import type { Image, Metadata, MetadataEnumVariant } from '$lib/database.js';
	import { dependencyURI, openDatabase } from '$lib/idb.svelte.js';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { storeMetadataValue, type TypedMetadataValue } from '$lib/metadata.js';
	import MetadataCombobox, { type Props as ComboboxProps } from '$lib/MetadataCombobox.svelte';
	import { undo } from '$lib/undo.svelte.js';
	import { compareBy, entries, mapKeys, nonnull } from '$lib/utils.js';

	interface Props {
		image: Image;
		focusedMetadata: Metadata;
		options: MetadataEnumVariant[];
		currentMetadataValue: TypedMetadataValue<'enum'> | undefined;
		layout: 'left-right' | 'top-bottom';
	}

	const {
		image,
		focusedMetadata,
		options,
		currentMetadataValue: current,
		layout
	}: Props = $props();

	let focusOptionCombobox: ComboboxProps['focuser'] = $state((_) => {});

	const option = $derived(options.find((o) => o.key === current?.value));

	const confidences = $derived.by(() => {
		if (!current) return {};
		return {
			[option!.key]: current.confidence,
			...mapKeys(current.alternatives!, (k) => JSON.parse(k).toString() as string)
		};
	});

	const byConfidence = $derived(
		Object.entries(confidences)
			.map(([key, confidence]) => ({ key, confidence }))
			.sort(compareBy('confidence'))
			.reverse()
			.map(({ key }) => options.find((o) => o.key === key))
			.filter(nonnull)
	);

	const currentIndex = $derived(byConfidence.findIndex((o) => o.key === option?.key));
	const nextOption = $derived(byConfidence[currentIndex + 1]);
	const prevOption = $derived(byConfidence[currentIndex - 1]);

	async function setOption(
		option: { key: string },
		confidences: Record<string, number>,
		{ pushToUndoStack = true } = {}
	) {
		if (!image) throw new Error('Image not found');
		if (!focusedMetadata) throw new Error('No metadata focused');

		const newAlternative = current
			? { value: current.value, confidence: current.confidence }
			: undefined;

		await storeMetadataValue({
			db: await openDatabase(),
			metadataId: focusedMetadata.id,
			subjectId: image.id,
			type: 'enum',
			value: option.key,
			confidence: confidences[option.key] ?? 1,
			alternatives: [
				...(newAlternative ? [newAlternative] : []),
				...entries(confidences).map(([value, confidence]) => ({
					value,
					confidence
				}))
			]
		});

		if (pushToUndoStack && current) {
			undo.push('classify/enum/edit', {
				imageId: image.id,
				metadataId: focusedMetadata.id,
				before: { key: current.value },
				after: { key: option.key }
			});
		}

		await invalidate(dependencyURI('Image', image.id));
	}

	undo.on('classify/enum/edit', async ({ metadataId, imageId, before }) => {
		if (imageId !== image.id) return;
		if (metadataId !== focusedMetadata.id) return;
		await setOption(before, confidences, { pushToUndoStack: false });
	});

	defineKeyboardShortcuts('classification', {
		L: {
			help: 'Option suivante',
			async do() {
				if (!nextOption) return;
				await setOption(nextOption, confidences);
			}
		},
		J: {
			help: 'Option précédente',
			async do() {
				if (!prevOption) return;
				await setOption(prevOption, confidences);
			}
		},
		'$mod+F': {
			help: 'Ouvrir/Fermer la liste des options',
			do: (e) => {
				e.preventDefault();
				focusOptionCombobox('toggle');
			}
		}
	});
</script>

<div class="bar" data-layout={layout}>
	<div class="prev" style:grid-area="prev">
		<ButtonSecondary
			disabled={!prevOption}
			onclick={async () => setOption(prevOption!, confidences)}
			help={{
				text: prevOption?.label ?? '',
				keyboard: 'J'
			}}
		>
			<div class="button-contents prev">
				<ConfidencePercentage
					compact
					tooltip={() => ''}
					value={prevOption ? confidences[prevOption.key] : undefined}
				/>
				{#if layout === 'left-right'}
					Précédente
				{/if}
				<IconPrevious />
			</div>
		</ButtonSecondary>
	</div>

	<div class="current" style:grid-area="current">
		<ButtonSecondary
			onclick={() => focusOptionCombobox('focus')}
			help={{
				text: 'Voir toutes les options',
				keyboard: '$mod+F'
			}}
		>
			<MetadataCombobox
				{confidences}
				{options}
				type="single"
				value={option?.key ?? ''}
				bind:focuser={focusOptionCombobox}
				onValueChange={async (newKey) => {
					if (!newKey) return;
					await setOption({ key: newKey }, confidences);
				}}
			/>
			<ConfidencePercentage compact value={current?.confidence} />
			<IconExpand />
		</ButtonSecondary>
	</div>

	<div class="next" style:grid-area="next">
		<ButtonSecondary
			disabled={!nextOption}
			onclick={async () => setOption(nextOption!, confidences)}
			help={{
				text: nextOption?.label ?? '',
				keyboard: 'L'
			}}
		>
			<div class="button-contents">
				<IconNext />
				{#if layout === 'left-right'}
					Suivante
				{/if}
				<ConfidencePercentage
					compact
					tooltip={() => ''}
					value={nextOption ? confidences[nextOption.key] : undefined}
				/>
			</div>
		</ButtonSecondary>
	</div>
</div>

<style>
	.bar {
		display: grid;
		align-items: center;
		justify-content: center;
		gap: 1em;

		&[data-layout='left-right'] {
			grid-template-areas: 'prev current next';
			grid-template-columns: 1fr auto 1fr;
		}

		&[data-layout='top-bottom'] {
			justify-content: start;
			grid-template-areas: 'current prev next';
			grid-template-columns: auto 1fr 1fr;

			.button-contents.prev {
				flex-direction: row-reverse;
			}
		}
	}

	.button-contents {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		/* XXX: To match up height with the combobox "button" */
		padding: 0.13em 0;
	}

	.current :global(input) {
		font-size: 1em;
		background: transparent;
		width: 150px;
	}
</style>
