<script lang="ts">
	import IconUnconfirmed from '~icons/ri/arrow-go-back-line';
	import IconPrevious from '~icons/ri/arrow-left-line';
	import IconNext from '~icons/ri/arrow-right-line';
	import IconConfirmed from '~icons/ri/check-double-line';
	import IconExpand from '~icons/ri/expand-up-down-line';
	import { invalidate } from '$app/navigation';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import type { Metadata, MetadataEnumVariant, Observation } from '$lib/database.js';
	import { dependencyURI, openDatabase } from '$lib/idb.svelte.js';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { storeMetadataValue, type TypedMetadataValue } from '$lib/metadata/index.js';
	import MetadataCombobox, { type Props as ComboboxProps } from '$lib/MetadataCombobox.svelte';
	import { uiState } from '$lib/state.svelte';
	import { undo } from '$lib/undo.svelte.js';
	import { compareBy, entries, mapKeys, nonnull } from '$lib/utils.js';

	interface Props {
		observation: Observation;
		focusedMetadata: Metadata;
		options: MetadataEnumVariant[];
		currentMetadataValue: TypedMetadataValue<'enum'> | undefined;
	}

	const {
		observation,
		focusedMetadata,
		options,
		currentMetadataValue: current
	}: Props = $props();

	const layout = $derived(uiState.currentSession?.fullscreenClassifier.layout ?? 'top-bottom');

	let focusOptionCombobox: ComboboxProps['focuser'] = $state((_) => {});

	const option = $derived(options.find((o) => o.key === current?.value?.toString()));

	const confidences = $derived.by(() => {
		if (!current) return {};
		if (!option) return {};
		return {
			...mapKeys(current.alternatives, (k) => JSON.parse(k).toString() as string),
			[option.key]: current.confidence
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
		{ confirmed = false, manuallyModified = false, pushToUndoStack = true } = {}
	) {
		if (!observation) throw new Error('Image not found');
		if (!focusedMetadata) throw new Error('No metadata focused');

		const newAlternative = current
			? { value: current.value, confidence: current.confidence }
			: undefined;

		await storeMetadataValue({
			db: await openDatabase(),
			metadataId: focusedMetadata.id,
			subjectId: observation.id,
			type: 'enum',
			value: option.key,
			confidence: confidences[option.key] ?? 1,
			manuallyModified,
			confirmed,
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
				observationId: observation.id,
				metadataId: focusedMetadata.id,
				before: { key: current.value.toString() },
				after: { key: option.key }
			});
		}

		await invalidate(dependencyURI('Observation', observation.id));
	}

	undo.on('classify/enum/edit', async ({ metadataId, observationId, before }) => {
		if (observationId !== observation.id) return;
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
				focusOptionCombobox?.('toggle');
			}
		},
		M: {
			help: 'Ouvrir le lien "En savoir plus" dans un nouvel onglet',
			when: () => Boolean(option?.learnMore),
			do() {
				window.open(option!.learnMore, '_blank');
			}
		},
		ArrowUp: {
			help: 'Marquer la classification comme confirmée',
			async do() {
				if (!option) return;
				await setOption(option!, confidences, { confirmed: true, pushToUndoStack: false });
			}
		},
		ArrowDown: {
			help: 'Marquer la classification comme non confirmée',
			async do() {
				if (!option) return;
				await setOption(option!, confidences, { confirmed: false, pushToUndoStack: false });
			}
		}
	});
</script>

<div class="bar" data-layout={layout}>
	<div class="prev" style:grid-area="prev">
		<ButtonSecondary
			aria-label="Option précédente"
			disabled={!prevOption}
			onclick={async () => setOption(prevOption!, confidences)}
			help={{
				text: prevOption?.label ?? '',
				keyboard: 'J'
			}}
		>
			<div class="button-contents prev">
				<ConfidencePercentage
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

	<div class="current" style:grid-area="current" data-testid="current">
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
					await setOption({ key: newKey }, confidences, { manuallyModified: true });
				}}
			/>
			<ConfidencePercentage value={current?.confidence} />
			<IconExpand />
		</ButtonSecondary>
	</div>

	<div class="next" style:grid-area="next">
		<ButtonSecondary
			aria-label="Option suivante"
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
					tooltip={() => ''}
					value={nextOption ? confidences[nextOption.key] : undefined}
				/>
			</div>
		</ButtonSecondary>
	</div>

	{#if layout === 'top-bottom'}
		<div class="confirmation" style:grid-area="confirmation" data-testid="confirmation">
			<ButtonSecondary
				onclick={async () => {
					if (!option) return;
					await setOption(option, confidences, {
						confirmed: !current?.confirmed,
						pushToUndoStack: false
					});
				}}
				help={{
					text: current?.confirmed
						? 'Marquer comme non confirmée '
						: 'Confirmer la classification ',
					keyboard: current?.confirmed ? 'ArrowDown' : 'ArrowUp'
				}}
			>
				<div class="button-contents">
					{#if current?.confirmed}
						<IconUnconfirmed />
					{:else}
						<IconConfirmed />
					{/if}
				</div>
			</ButtonSecondary>
		</div>
	{/if}
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
			grid-template-areas: 'current prev next confirmation';
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
		justify-content: space-between;
	}

	.prev,
	.next {
		:global(button) {
			width: 100%;
		}
	}

	.current :global(input) {
		font-size: 1em;
		background: transparent;
		width: 150px;
	}
</style>
