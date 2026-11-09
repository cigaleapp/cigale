<script lang="ts">
	import { tick } from 'svelte';

	import EnumButtons from '$lib/EnumButtons.svelte';
	import Field from '$lib/Field.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { uiState } from '$lib/uistate.svelte.js';
	import { switchValue } from '$lib/utils.js';

	import { ExporterFiles } from './files.svelte.js';
	import { ExporterPlatforms } from './platforms.svelte.js';

	interface Props {
		exporter: ExporterFiles | ExporterPlatforms;
	}

	const { exporter }: Props = $props();

	let cropPadding = $derived<`${number}${'px' | '%'}`>(
		uiState.currentSession?.exportCropPadding ?? uiState.currentProtocol?.crop?.padding ?? '0px'
	);

	$effect(() => {
		if (!uiState.currentSessionId) return;
		exporter.cropPadding = cropPadding;
		void tables.Session.update(uiState.currentSessionId, 'exportCropPadding', cropPadding);
	});
</script>

<Field label="Images confirmées">
	<EnumButtons
		--option-min-width="5rem"
		horizontal
		options={[
			{
				key: 'all',
				label: 'Peut importe',
			},
			{
				key: 'confirmed',
				label: 'Seulement',
			},
			{
				key: 'unconfirmed',
				label: 'Exclure',
			},
		]}
	/>
</Field>

<Field label="Score de confiance">
	<EnumButtons
		--option-min-width="6rem"
		horizontal
		cards
		options={[
			{
				key: 'all',
				label: 'Toutes',
			},
			{
				key: 'confidenceMinimum',
				label: '≥',
			},
			{
				key: 'confidenceMaximum',
				label: '<',
			},
		]}
	>
		{#snippet children({ key: option, label })}
			{#if option === 'all'}
				{label}
			{:else}
				<code>{label}</code>
				<div class="numeric" style:--width="4ch">
					<InlineTextInput {label} value="" />
				</div>
				%
			{/if}
		{/snippet}
	</EnumButtons>
</Field>

<div
	class="crop-padding"
	class:irrelevant={exporter instanceof ExporterFiles && exporter.include === 'metadataonly'}
>
	<Field label="Marge de recadrage">
		<EnumButtons
			bind:value={
				() =>
					['0px', '0%'].includes(cropPadding)
						? 'none'
						: cropPadding.includes('%')
							? 'customPercent'
							: 'customPixels',
				(value) => {
					if (value === 'none') cropPadding = '0px';
				}
			}
			horizontal
			--option-min-width="5rem"
			options={[
				{ key: 'none', label: 'Aucune' },
				// { key: 'small', label: '5%' },
				// { key: 'medium', label: '10%' },
				{ key: 'customPercent', label: '?%' },
				{ key: 'customPixels', label: '?px' },
			]}
		>
			{#snippet children({ key: option, label })}
				{#if option === 'none'}
					{label}
				{:else}
					{const unit = switchValue(option, {
						customPercent: '%',
						customPixels: 'px',
					})}

					<div class="numeric" style:--width={unit === '%' ? '4ch' : '5ch'}>
						<InlineTextInput
							label={unit === '%'
								? "en pourcentage des dimensions de l'image"
								: 'en pixels'}
							value={cropPadding.endsWith(unit) ? cropPadding.replace(unit, '') : ''}
							onblur={async (newValue) => {
								// otherwise, the input value updates to a '?' too quickly when changing value but not unit
								await tick();
								cropPadding = newValue + unit;
							}}
						/>
						{unit}
					</div>
				{/if}
			{/snippet}
		</EnumButtons>
	</Field>
</div>

<style>
	.crop-padding {
		display: flex;
		flex-direction: column;
		accent-color: var(--fg-primary);
	}

	.crop-padding.irrelevant {
		opacity: 0.5;
		pointer-events: none;
	}

	.numeric {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		overflow: hidden;
	}

	.numeric :global(input) {
		width: var(--width, 3ch);
	}
</style>
