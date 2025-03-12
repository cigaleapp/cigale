<script>
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { tables } from '$lib/idb.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Download from '~icons/ph/download-simple';
	import Modal from '$lib/Modal.svelte';
	import { ensureNoLoneImages } from '$lib/observations';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import { generateResultsZip } from '$lib/results';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { base } from '$app/paths';

	// TODO show download size estimates

	/**
	 * @typedef {object} Props
	 * @property {() => void} open
	 */
	let { open = $bindable() } = $props();
	let exporting = $state(false);
	/** @type {'metadataonly'|'croppedonly'|'full'} */
	let include = $state('croppedonly');

	async function generateExport() {
		exporting = true;
		const chosenProtocol = tables.Protocol.state.find((p) => p.id === uiState.currentProtocol);
		if (!chosenProtocol) {
			toasts.error('Aucun protocole sélectionné');
			exporting = false;
			return;
		}
		try {
			await ensureNoLoneImages();
			await generateResultsZip(tables.Observation.state, chosenProtocol, {
				base,
				include
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

<Modal key="export-results" bind:open title="Exporter les résultats">
	<RadioButtons
		bind:value={include}
		options={[
			{ key: 'metadataonly', label: 'Métadonnées seulement' },
			{ key: 'croppedonly', label: 'Métadonnées et images recadrées' },
			{ key: 'full', label: 'Métadonnées, images recadrées et images originales' }
		]}
	>
		Quoi inclure dans l'export
	</RadioButtons>

	{#snippet footer()}
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
