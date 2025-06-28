<script>
	import { base } from '$app/paths';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Modal from '$lib/Modal.svelte';
	import { ensureNoLoneImages } from '$lib/observations';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import { generateResultsZip } from '$lib/results.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { avg } from '$lib/utils';
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

	let cropPadding = $derived(uiState.currentProtocol?.crop.padding ?? 0);
	const cropPaddingRangeMax = $derived(
		Math.floor(
			0.1 * avg(tables.Image.state.map((i) => avg([i.dimensions?.width, i.dimensions?.height])))
		)
	);
	const cropPaddingRangeStep = $derived(Math.floor(cropPaddingRangeMax / 100));

	async function generateExport() {
		exporting = true;
		const chosenProtocol = tables.Protocol.state.find((p) => p.id === uiState.currentProtocolId);
		if (!chosenProtocol) {
			toasts.error('Aucun protocole sélectionné');
			exporting = false;
			return;
		}
		try {
			await ensureNoLoneImages();
			await generateResultsZip(tables.Observation.state, chosenProtocol, {
				base,
				include,
				cropPadding
			});
		} catch (error) {
			console.error(error);
			toasts.error(
				`Erreur lors de l'exportation des résultats: ${error?.toString() ?? 'Erreur inattendue'}`
			);
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
		>
			Quoi inclure dans l'export
		</RadioButtons>
	</div>

	<label class="crop-padding">
		<div class="label">Marge autour des images recadrées</div>
		<div class="side-by-side">
			<input
				type="range"
				min="0"
				max={cropPaddingRangeMax}
				step={cropPaddingRangeStep}
				bind:value={cropPadding}
			/>
			<div class="numeric">
				<InlineTextInput
					label="valeur en pixels"
					value={cropPadding.toString()}
					onblur={(newValue) => {
						const parsed = Number.parseInt(newValue, 10);
						if (!isNaN(parsed) && parsed > 0) {
							cropPadding = parsed;
						}
					}}
				/>
			</div>
			px
		</div>
		<p class="proportion">
			<strong>~{Math.round((cropPadding / cropPaddingRangeMax) * 0.1 * 100)}%</strong> de la taille moyenne
			des images
		</p>
	</label>

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

	.crop-padding .label {
		margin-bottom: 0.5em;
	}

	.crop-padding .numeric {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		width: 4ch;
		overflow: hidden;
	}

	.crop-padding .proportion {
		margin-top: 0.5em;
		color: var(--gay);
	}

	.crop-padding .proportion strong {
		color: var(--fg-neutral);
	}
</style>
