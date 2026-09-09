<script lang="ts">
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';

	import { SvelteMap } from 'svelte/reactivity';

	import Field from '$lib/Field.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import SessionMetadataForm from '$lib/SessionMetadataForm.svelte';
	import { uiState } from '$lib/uistate.svelte.js';

	import TopbarOpenSession from '../TopbarOpenSession.svelte';
	import ExportPanel from './ExportPanel.svelte';
	import { exporter as exporterFiles } from './files.svelte.js';
	import { exporter as exporterPlatforms } from './platforms.svelte.js';

	const exporting = $derived(exporterFiles.exporting || exporterPlatforms.uploading);

	$effect(() => {
		if (!exporting && uiState.processing.task === 'export') {
			uiState.processing.reset();
		}
	});

	let confirmExportWithMetadataErrors = $state<() => Promise<boolean>>();
	const metadataErrors: Map<NamespacedMetadataID, string[]> = new SvelteMap();

	async function confirmExportIfMetadataErrors() {
		const hasErrors = metadataErrors.values().some((errs) => errs.length > 0);
		if (!hasErrors) return true;
		return await confirmExportWithMetadataErrors?.();
	}
</script>

<ModalConfirm
	dangerous
	key="modal_export_with_metadata_errors"
	title="Métadonnées incorrectes"
	bind:show={confirmExportWithMetadataErrors}
	confirm="Exporter quand même"
	cancel="Corriger"
>
	Certaines métadonnées sont incorrectes

	<section class="problems">
		{#each metadataErrors as [id, errors] (id)}
			<Field label={tables.Metadata.getFromState(id)?.label ?? id}>
				<ul>
					{#each errors as error (error)}
						<li>{error}</li>
					{/each}
				</ul>
			</Field>
		{/each}
	</section>
</ModalConfirm>

<TopbarOpenSession />

<main>
	<section class="session">
		<header>
			<h2>Vérifier les métadonnées</h2>
		</header>

		<section class="metadata">
			{#if uiState.currentSession}
				<SessionMetadataForm
					session={uiState.currentSession}
					errors={metadataErrors}
					onmetadatachange={() => {
						exporterFiles.reloadPreviews++;
					}}
				/>
			{/if}
		</section>
	</section>

	<ExportPanel {confirmExportIfMetadataErrors} />
</main>

<style>
	main {
		max-width: calc(min(1400px, 100vw));
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 3em;
	}

	header {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.problems {
		display: flex;
		flex-direction: column;
		gap: 1em;
		margin-top: 1em;
	}

	.session header {
		justify-content: space-between;
	}

	.session {
		display: flex;
		flex-direction: column;
		gap: 2em;
		max-width: 50rem;
		width: 100%;
	}

	.session .metadata {
		display: flex;
		flex-direction: column;
		max-width: 50rem;
		gap: 2em;
	}

	@media (max-width: 1300px) {
		main {
			margin: 0 auto;
			align-items: center;
		}
	}
</style>
