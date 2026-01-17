<script>
	import { fade } from 'svelte/transition';

	import IconMergeNone from '~icons/ri/close-circle-line';
	import IconMergeAverage from '~icons/ri/divide-line';
	import IconMergeMedian from '~icons/ri/equal-line';
	import IconMergeUnion from '~icons/ri/shadow-line';
	import IconMergeMinimum from '~icons/ri/skip-down-line';
	import IconMergeMaximum from '~icons/ri/skip-up-line';
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import { uppercaseFirst } from '$lib/i18n';
	import IconDatatype from '$lib/IconDatatype.svelte';
	import { MERGEABLE_METADATA_TYPES } from '$lib/metadata';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import {
		METADATA_MERGE_METHODS,
		METADATA_TYPES,
		removeNamespaceFromMetadataId
	} from '$lib/schemas/metadata';
	import Switch from '$lib/Switch.svelte';
	import { entries } from '$lib/utils';

	import { updater } from '../updater.svelte.js';

	const { data } = $props();
	const { type, description, learnMore, required, mergeMethod } = $derived(data.metadata);
	const technical = $derived(!data.metadata.label);

	/**
	 * @param {typeof import('$lib/schemas/metadata').MetadataMergeMethod.infer} mergeMethod
	 */
	const IconMergeMethod = (mergeMethod) =>
		({
			min: IconMergeMinimum,
			max: IconMergeMaximum,
			median: IconMergeMedian,
			average: IconMergeAverage,
			union: IconMergeUnion,
			none: IconMergeNone
		})[mergeMethod] ?? IconMergeNone;
</script>

<main in:fade={{ duration: 100 }}>
	<Field label="Description">
		<textarea
			rows="5"
			value={description}
			onblur={updater((m, { target }) => {
				m.description = target.value;
			})}
		></textarea>
	</Field>

	<FieldUrl
		label="En savoir plus"
		value={learnMore ?? ''}
		onblur={updater((m, value) => {
			if (value) {
				m.learnMore = value;
			} else {
				delete m.learnMore;
			}
		})}
	/>

	<Field label="Obligatoire">
		<Switch
			show-label
			label="Il faut remplir cette métadonnée pour chaque observation"
			value={required}
			onchange={updater((m, value) => {
				m.required = value;
			})}
		/>
	</Field>

	<Field label="Métadonnée technique">
		<Switch
			show-label
			label="Cacher cette métadonnée dans l'interface. Utile pour les métadonnées gérées automatiquement, comme celle stockant la boîte de recadrage, par example."
			value={technical}
			onchange={updater((m, value) => {
				if (value) {
					m.label = '';
				} else {
					m.label = uppercaseFirst(
						removeNamespaceFromMetadataId(m.id).replaceAll('_', ' ')
					);
				}
			})}
		/>
	</Field>

	<Field composite label="Type de métadonnée">
		<RadioButtons
			horizontal
			cards
			options={entries(METADATA_TYPES).map(([key, { label, help }]) => ({
				key,
				label: uppercaseFirst(label),
				subtext: uppercaseFirst(help)
			}))}
			value={type}
			onchange={updater((m, value) => {
				if (!value) return;

				if (m.infer && [value, m.type].includes('location')) {
					delete m.infer;
				}

				if (!MERGEABLE_METADATA_TYPES.has(value)) {
					m.mergeMethod = 'none';
				}

				if (m.mergeMethod === 'union' && value !== 'boundingbox') {
					m.mergeMethod = 'min';
				}

				m.type = value;
			})}
		>
			{#snippet children({ key, label, subtext })}
				<div class="datatype-option">
					<IconDatatype tooltip={false} type={key} />
					<span class="text">{label}</span>
				</div>
				<p class="datatype-description">{subtext}</p>
			{/snippet}
		</RadioButtons>
	</Field>

	<Field composite>
		{#snippet label()}
			Méthode de fusion
			<p class="label-help">
				Comment fusionner les valeurs de cette métadonnée lors du regroupement de plusieurs
				observations en une seule
			</p>
		{/snippet}
		<RadioButtons
			horizontal
			cards
			value={mergeMethod}
			options={entries(METADATA_MERGE_METHODS).map(([key, { label, help }]) => ({
				key,
				label: uppercaseFirst(label),
				disabled:
					!MERGEABLE_METADATA_TYPES.has(type) ||
					(key === 'union' && type !== 'boundingbox'),
				subtext: help
			}))}
			onchange={updater((m, value) => {
				if (!value) return;

				if (value === 'union' && m.type !== 'boundingbox') {
					throw new Error(
						"La méthode 'union' n'est disponible que pour les métadonnées de type 'boîte de recadrage'"
					);
				}

				m.mergeMethod = value;
			})}
		>
			{#snippet children({ key, label, subtext })}
				{@const Icon = IconMergeMethod(key)}
				<div class="datatype-option">
					<Icon />
					<span class="text">{label}</span>
				</div>
				<p class="datatype-description">{subtext}</p>
			{/snippet}
		</RadioButtons>
	</Field>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 2em;
	}

	.label-help {
		font-size: 0.85em;
		color: var(--gay);
		margin-top: 0.25em;
		margin-bottom: 1em;
	}

	.datatype-option {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.datatype-description {
		color: var(--gay);
		font-size: 0.85em;
	}
</style>
