<script lang="ts">
	import { tick } from 'svelte';

	import Download from '~icons/ri/download-2-line';
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { downloadAsFile } from '$lib/download';
	import { tables } from '$lib/idb.svelte';
	import { parseCropPadding } from '$lib/images';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Modal from '$lib/Modal.svelte';
	import ModalToasts from '$lib/ModalToasts.svelte';
	import { ensureNoLoneImages } from '$lib/observations';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';

	// TODO show download size estimates

	/**
	 * @typedef {object} Props
	 * @property {() => void} open
	 * @property {import('swarpc').SwarpcClient<typeof import('$worker/procedures.js').PROCEDURES>} swarpc
	 */

	/** @type {Props} */
	let { open = $bindable(), swarpc } = $props();

	const progress = $derived(uiState.processing.progress);

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
		await toasts.clear('exporter');
		uiState.processing.reset();
		exporting = true;

		const chosenProtocol = tables.Protocol.state.find(
			(p) => p.id === uiState.currentProtocolId
		);
		if (!chosenProtocol) {
			toasts.error('Aucun protocole sélectionné');
			exporting = false;
			return;
		}
		try {
			await ensureNoLoneImages();
			uiState.processing.task = 'export';
			uiState.processing.total = 1;
			uiState.processing.done = 0;
			const zipfileBytes = await swarpc.generateResultsZip(
				{
					include,
					sessionId: uiState.currentSessionId,
					cropPadding: cropPadding.withUnit,
					jsonSchemaURL: new URL(
						asset('/results.schema.json'),
						page.url.origin
					).toString()
				},
				({ warning, progress }) => {
					if (warning) {
						const [message, { filename }] = warning;

						switch (message) {
							case 'exif-write-error':
								toasts.warn(
									`Impossible d'ajouter les métadonnées EXIF à l'image ${filename}`
								);
								break;
						}
					}

					if (progress) uiState.processing.done = progress;
				}
			);

			downloadAsFile(zipfileBytes, 'results.zip', 'application/zip');
		} catch (error) {
			console.error(error);
			toasts.error(`Erreur lors de l'exportation des résultats: ${error}`);
		} finally {
			exporting = false;
		}
	}
</script>

<Modal
	--footer-direction="column"
	key="modal_export_results"
	bind:open
	title="Exporter les résultats"
	onopen={() => {
		toasts.setCurrentPool('exporter');
	}}
	onclose={() => {
		toasts.setCurrentPool('default');
		uiState.processing.reset();
	}}
>
	<div class="include">
		<RadioButtons
			bind:value={include}
			options={[
				{ key: 'metadataonly', label: 'Métadonnées seulement' },
				{ key: 'croppedonly', label: 'Métadonnées et images recadrées' },
				{
					key: 'full',
					label: 'Métadonnées, images recadrées et images originales',
					subtext: 'Permet de ré-importer les résultats ultérieurement'
				}
			]}
		/>
	</div>

	<section class="crop-padding" class:irrelevant={include === 'metadataonly'}>
		<div class="label">Marge autour des images recadrées</div>

		<SegmentedGroup
			options={['none', 'small', 'medium', 'customPercent', 'customPixels']}
			labels={{ none: 'Aucune', small: '5%', medium: '10%' }}
			bind:value={cropPaddingPreset}
		>
			{#snippet customOption(option)}
				{@const unit = option === 'customPercent' ? '%' : 'px'}
				<div class="numeric" style:--width={unit === '%' ? '3ch' : '4ch'}>
					<InlineTextInput
						label={option === 'customPercent'
							? "en pourcentage des dimensions de l'image"
							: 'en pixels'}
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
		<p class="fineprint">
			Une valeur en % signifie que la marge est relative aux dimensions de chacune des images
		</p>
	</section>

	{#snippet footer()}
		<ModalToasts pool="exporter" />

		<section class="progress">
			<ProgressBar percentage alwaysActive {progress} />
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
