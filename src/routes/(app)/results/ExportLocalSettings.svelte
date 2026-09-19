<script lang="ts">
	import { tick } from 'svelte';

	import IconCroppedOnly from '~icons/ri/crop-line';
	import IconMetadataOnly from '~icons/ri/list-view';
	import IconFullExport from '~icons/ri/multi-image-line';
	import EnumButtons from '$lib/EnumButtons.svelte';
	import Field from '$lib/Field.svelte';
	import { parseCropPadding } from '$lib/images';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import Tooltip from '$lib/Tooltip.svelte';

	import { exporter } from './files.svelte.js';

	exporter.setup();
</script>

<div class="include">
	<Field label="Inclure">
		<EnumButtons
			bind:value={exporter.include}
			cards
			options={[
				{
					key: 'metadataonly',
					label: 'Métadonnées seulement',
					icon: IconMetadataOnly,
				},
				{
					key: 'croppedonly',
					label: 'Métadonnées et images recadrées',
					icon: IconCroppedOnly,
				},
				{
					key: 'full',
					label: 'Tout',
					subtext: 'Permet de ré-importer ultérieurement',
					icon: IconFullExport,
				},
			]}
		/>
	</Field>
</div>
<div class="crop-padding" class:irrelevant={exporter.include === 'metadataonly'}>
	<Field>
		{#snippet label()}
			Marge de recadrage
			<p class="fineprint"></p>
		{/snippet}
		<EnumButtons
			bind:value={exporter.cropPaddingPreset}
			options={[
				{ key: 'none', label: 'Aucune' },
				{ key: 'small', label: '5%' },
				{ key: 'medium', label: '10%' },
				{ key: 'customPercent', label: '?%' },
				{ key: 'customPixels', label: '?px' },
			]}
		>
			{#snippet children({ key: option, label })}
				{#if option.startsWith('custom')}
					<div
						class="numeric"
						style:--width={exporter.unitOfPreset(option) === '%' ? '3ch' : '4ch'}
					>
						<InlineTextInput
							label={option === 'customPercent'
								? "en pourcentage des dimensions de l'image"
								: 'en pixels'}
							value={exporter.cropPaddingDisplay(option)}
							onblur={async (newValue) => {
								// otherwise, the input value updates to a '?' too quickly when changing value but not unit
								await tick();
								exporter.updateCropPadding(newValue, option);
							}}
						/>
						{exporter.unitOfPreset(option)}
					</div>
				{:else if label.includes('%')}
					<Tooltip text="Pour chaque image, relativement à ses dimensions">
						{label}
					</Tooltip>
				{:else}
					{label}
				{/if}
			{/snippet}
		</EnumButtons>
	</Field>
</div>

<style>
	.crop-padding,
	.include {
		display: flex;
		flex-direction: column;
		accent-color: var(--fg-primary);
	}

	.crop-padding.irrelevant {
		opacity: 0.5;
		pointer-events: none;
	}

	.crop-padding .numeric {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		overflow: hidden;
	}

	.crop-padding .numeric :global(input) {
		width: var(--width, 3ch);
	}
</style>
