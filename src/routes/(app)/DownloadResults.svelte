<script>
	import { base } from '$app/paths';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Modal from '$lib/Modal.svelte';
	import { ensureNoLoneImages } from '$lib/observations';
	import { m } from '$lib/paraglide/messages.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import { generateResultsZip, parseCropPadding } from '$lib/results.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { tick } from 'svelte';
	import Download from '~icons/ph/download-simple';

	// TODO show download size estimates

	/**
	 * @typedef {object} Props
	 * @property {() => void} open
	 * @property {number} [progress] progress bar to in the modal content
	 */
	let { open = $bindable(), progress } = $props();
	let exporting = $state(false);
	/** @type {'metadataonly'|'croppedonly'|'full'} */
	let include = $state('croppedonly');

	let cropPadding = $derived(parseCropPadding(uiState.currentProtocol?.crop.padding ?? '0px'));
	/**
	 * @type {'none'|'small'|'medium'|'customPercent'|'customPixels'|undefined}
	 */
	let cropPaddingPreset = $derived.by(() => {
		if (cropPadding.unitless === 0) return 'none';
		if (cropPadding.unit === 'px') return 'customPixels';
		if (cropPadding.unitless === 5) return 'small';
		if (cropPadding.unitless === 10) return 'medium';
		return 'customPercent';
	});

	$effect(() => {
		switch (cropPaddingPreset) {
			case 'none':
				cropPadding = parseCropPadding('0px');
				break;

			case 'small':
				cropPadding = parseCropPadding('5%');
				break;

			case 'medium':
				cropPadding = parseCropPadding('10%');
				break;

			default:
				break;
		}
	});

	async function generateExport() {
		exporting = true;
		const chosenProtocol = tables.Protocol.state.find((p) => p.id === uiState.currentProtocolId);
		if (!chosenProtocol) {
			toasts.error(m.no_protocol_selected());
			exporting = false;
			return;
		}
		try {
			await ensureNoLoneImages();
			await generateResultsZip(tables.Observation.state, chosenProtocol, {
				base,
				include,
				cropPadding: cropPadding.withUnit
			});
		} catch (error) {
			console.error(error);
			toasts.error(
				m.error_while_exporting_results({ error: error?.toString() ?? m.unexpected_error() })
			);
		} finally {
			exporting = false;
		}
	}
</script>

<Modal --footer-direction="column" key="modal_export_results" bind:open title={m.export_results()}>
	<div class="include">
		<RadioButtons
			bind:value={include}
			options={[
				{ key: 'metadataonly', label: m.metadata_only() },
				{ key: 'croppedonly', label: m.metadata_and_cropped_images() },
				{
					key: 'full',
					label: m.metadata_cropped_and_full_images(),
					subtext: m.allows_reusing_export_later()
				}
			]}
		>
			Quoi inclure dans l'export
		</RadioButtons>
	</div>

	<section class="crop-padding" class:irrelevant={include === 'metadataonly'}>
		<div class="label">{m.padding_around_cropped_images()}</div>

		<SegmentedGroup
			options={['none', 'small', 'medium', 'customPercent', 'customPixels']}
			labels={{ none: 'Aucune', small: '5%', medium: '10%' }}
			bind:value={cropPaddingPreset}
		>
			{#snippet customOption(option)}
				{@const unit = option === 'customPercent' ? '%' : 'px'}
				<div class="numeric" style:--width={unit === '%' ? '3ch' : '4ch'}>
					<InlineTextInput
						label={option === 'customPercent' ? m.in_percent_of_image_dimensions() : m.in_pixels()}
						value={cropPadding.unitless === 0
							? '0'
							: cropPadding.unit === unit
								? cropPadding.unitless.toString()
								: '?'}
						onblur={async (newValue) => {
							// otherwise, the input value updates to a '?' too quickly when changing value but not unit
							await tick();
							const parsed = Number.parseInt(newValue, 10);
							if (!isNaN(parsed) && parsed > 0) {
								cropPadding = parseCropPadding(parsed + unit);
								cropPaddingPreset = option;
							}
						}}
					/>
					{unit}
				</div>
			{/snippet}
		</SegmentedGroup>
		<p class="fineprint">{m.crop_padding_relative_values_explainer()}</p>
	</section>

	{#snippet footer()}
		<section class="progress">
			{#if ![0, 1].includes(progress)}
				<code>{Math.floor(progress * 100)}%</code>
				<ProgressBar {progress} />
			{/if}
		</section>
		<ButtonSecondary onclick={generateExport}>
			{#if exporting}
				<LoadingSpinner />
			{:else}
				<Download />
			{/if}
			results.zip
		</ButtonSecondary>
	{/snippet}
</Modal>

<style>
	.progress {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 300px;
		--corners: var(--corner-radius);
		margin-bottom: 1rem;
		gap: 0.5em;
	}

	.crop-padding,
	.include {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		accent-color: var(--fg-primary);
	}

	.crop-padding {
		margin-top: 1.5em;
	}

	.crop-padding.irrelevant {
		opacity: 0.5;
		pointer-events: none;
	}

	.crop-padding .label {
		margin-bottom: 0.5em;
	}

	.crop-padding .numeric {
		display: flex;
		align-items: center;
		gap: 0.5em;
		overflow: hidden;
	}

	.crop-padding .numeric :global(input) {
		width: var(--width, 3ch);
	}

	.crop-padding .fineprint {
		font-size: 0.9em;
		color: var(--gy);
		margin-top: 0.75em;
	}
</style>
