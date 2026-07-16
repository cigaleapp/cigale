<script lang="ts">
	import type { Metadata, MetadataEnumVariant, Observation } from '$lib/database.js';
	import type { TypedMetadataValue } from '$lib/metadata/index.js';
	import type { Props as ComboboxProps } from '$lib/MetadataCombobox.svelte';

	import IconPrevious from '~icons/ri/arrow-left-line';
	import IconNext from '~icons/ri/arrow-right-line';
	import IconExpand from '~icons/ri/expand-up-down-line';
	import { invalidate } from '$app/navigation';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import { dependencyURI, openDatabase } from '$lib/idb.svelte.js';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { storeMetadataValue } from '$lib/metadata/index.js';
	import MetadataCombobox from '$lib/MetadataCombobox.svelte';
	import { IsMobile } from '$lib/mobile.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { uiState } from '$lib/uistate.svelte.js';
	import { undo } from '$lib/undo.svelte.js';
	import { compareBy, mapKeys, nonnull } from '$lib/utils.js';

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
		currentMetadataValue: current,
	}: Props = $props();

	const mobile = new IsMobile();
	const isdesktop = $derived(!mobile.current);

	const layout = $derived(uiState.currentSession?.fullscreenClassifier.layout ?? 'top-bottom');

	let focusOptionCombobox: ComboboxProps['focuser'] = $state((_) => {});

	const option = $derived(options.find((o) => o.key === current?.value?.toString()));

	const confidences = $derived.by(() => {
		if (!current) return {};
		if (!option) return {};
		return {
			...mapKeys(current.confidences, (k) => JSON.parse(k).toString() as string),
			[option.key]: current.confidence,
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

		await storeMetadataValue({
			db: await openDatabase(),
			sessionId: uiState.currentSessionId,
			metadataId: focusedMetadata.id,
			subjectId: observation.id,
			type: 'enum',
			value: option.key,
			confidence: confidences[option.key] ?? 1,
			manuallyModified,
			confirmed,
		});

		if (pushToUndoStack && current) {
			undo.push('classify/enum/edit', {
				observationId: observation.id,
				metadataId: focusedMetadata.id,
				before: { key: current.value.toString() },
				after: { key: option.key },
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
			},
		},
		J: {
			help: 'Option précédente',
			async do() {
				if (!prevOption) return;
				await setOption(prevOption, confidences);
			},
		},
		'$mod+F': {
			help: 'Ouvrir/Fermer la liste des options',
			do: (e) => {
				e.preventDefault();
				focusOptionCombobox?.('toggle');
			},
		},
		M: {
			help: 'Ouvrir le lien "En savoir plus" dans un nouvel onglet',
			when: () => Boolean(option?.learnMore),
			do() {
				window.open(option!.learnMore, '_blank');
			},
		},
	});
</script>

<div class="bar" data-layout={layout}>
	<div class="current" style:grid-area="current" pw-testid="current">
		<ButtonSecondary
			tight={!isdesktop}
			onclick={() => focusOptionCombobox?.('focus')}
			help={{
				text: 'Voir toutes les options',
				keyboard: '$mod+F',
			}}
		>
			<div class="button-contents">
				<MetadataCombobox
					{confidences}
					options={undefined}
					metadata={focusedMetadata}
					type="single"
					value={option?.key ?? ''}
					bind:focuser={focusOptionCombobox}
					onValueChange={async (newKey) => {
						if (!newKey) return;
						await setOption({ key: newKey }, confidences, { manuallyModified: true });
					}}
				/>
				<ConfidencePercentage compact={!isdesktop} value={current?.confidence} />
				<IconExpand />
			</div>
		</ButtonSecondary>
	</div>

	{#if isdesktop}
		<div class="others">
			{@render prevAndNext()}
		</div>
	{:else}
		{@render prevAndNext()}
	{/if}

	{#snippet prevAndNext()}
		<div class="prev">
			<ButtonSecondary
				aria-label="Option précédente"
				disabled={!prevOption}
				onclick={async () => setOption(prevOption!, confidences)}
				help={{
					text: prevOption?.label ?? '',
					keyboard: 'J',
				}}
			>
				<div class="button-contents prev">
					<IconPrevious />
					{#if isdesktop}
						<OverflowableText no-tooltip text="Précédente" />
						<ConfidencePercentage
							tooltip={() => ''}
							value={prevOption ? confidences[prevOption.key] : undefined}
						/>
					{/if}
				</div>
			</ButtonSecondary>
		</div>

		<div class="next">
			<ButtonSecondary
				aria-label="Option suivante"
				disabled={!nextOption}
				onclick={async () => setOption(nextOption!, confidences)}
				help={{
					text: nextOption?.label ?? '',
					keyboard: 'L',
				}}
			>
				<div class="button-contents">
					<IconNext />
					{#if isdesktop}
						<OverflowableText no-tooltip text="Suivante" />
						<ConfidencePercentage
							tooltip={() => ''}
							value={nextOption ? confidences[nextOption.key] : undefined}
						/>
					{/if}
				</div>
			</ButtonSecondary>
		</div>
	{/snippet}
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1em;

		@media (min-width: 600px) {
			&[data-layout='left-right'] {
				flex-direction: column;
			}
		}

		@media (max-width: 600px) {
			display: grid;
			grid-template-areas: 'prev current next';
			/*XXX: 50px = also width of buttons */
			grid-template-columns: 50px 1fr 50px;
			gap: 0.5em;

			.prev {
				grid-area: prev;
			}

			.next {
				grid-area: next;
			}

			.current {
				grid-area: current;
				font-weight: normal;
				text-align: left;
			}
		}
	}

	.others {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1em;

		> * {
			width: 100%;
			min-width: 0;
			overflow: hidden;
		}
	}

	.current {
		--metadata-combobox-trigger-bg: transparent;
		--metadata-combobox-trigger-padding: 0.5em 0;
	}

	.button-contents {
		display: flex;
		align-items: center;
		gap: 0.5em;

		width: 100%;

		text-align: left;
		font-weight: normal;

		@media (max-width: 600px) {
			padding: 0 0.5em;
		}
	}

	/* XXX: To match up height with the combobox "button" */
	:is(.prev, .next) .button-contents {
		padding: 0.13em 0;

		@media (max-width: 600px) {
			padding-block: 0.12em;
		}
	}

	@media (max-width: 600px) {
		.current .button-contents {
			justify-content: space-between;
		}

		:is(.prev, .next) .button-contents {
			justify-content: center;
		}
	}

	@media (min-width: 600px) {
		.prev,
		.next {
			:global(button) {
				width: 100%;
			}
		}

		.current {
			width: 100%;
		}
	}
</style>
