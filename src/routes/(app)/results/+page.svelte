<script lang="ts">
	import type { TreeNode, TreeNodeMaybeLoading } from '$lib/file-tree.js';
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';

	import { Capacitor } from '@capacitor/core';
	import { FileViewer } from '@capacitor/file-viewer';
	import { watch } from 'runed';
	import { tick } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	import IconSendToPlatform from '~icons/ri/cloud-line';
	import IconCroppedOnly from '~icons/ri/crop-line';
	import IconDownloadAsZip from '~icons/ri/file-zip-line';
	import IconDownloadAsFolder from '~icons/ri/folder-download-line';
	import IconMetadataOnly from '~icons/ri/list-view';
	import IconFullExport from '~icons/ri/multi-image-line';
	import IconExpand from '~icons/ri/skip-left-line';
	import IconCollapse from '~icons/ri/skip-right-line';
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import Account from '$lib/Account.svelte';
	import { providers } from '$lib/accounts/registry.js';
	import { FULL_IMAGE_CROPBOX, toRelativeCoords } from '$lib/BoundingBoxes.svelte.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import CompositeAvatar from '$lib/CompositeAvatar.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import { downloadAsFile } from '$lib/download.js';
	import EnumButtons from '$lib/EnumButtons.svelte';
	import Field from '$lib/Field.svelte';
	import { gatherToTree } from '$lib/file-tree.js';
	import { writeToFilesystem } from '$lib/filesystem.js';
	import { formatBytesSize, plural } from '$lib/i18n.js';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import { parseCropPadding } from '$lib/images';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { sendNotification } from '$lib/notifications.js';
	import { ensureNoLoneImages } from '$lib/observations.js';
	import ProgressTree from '$lib/ProgressTree.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import SessionMetadataForm from '$lib/SessionMetadataForm.svelte';
	import { toasts } from '$lib/toasts.svelte.js';
	import Tooltip from '$lib/Tooltip.svelte';
	import { tooltip } from '$lib/tooltips.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { entries, switchValue } from '$lib/utils.js';
	import ZipContentsTree from '$lib/ZipContentsTree.svelte';

	import TopbarOpenSession from '../TopbarOpenSession.svelte';
	import ExportPanel from './ExportPanel.svelte';
	import { exporter as exporterFiles } from './files.svelte.js';
	import { exporter as exporterPlatforms } from './platforms.svelte.js';

	const { data } = $props();
	const swarpc = $derived(data.swarpc);

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

	code.size {
		font-size: 0.85em;
		min-width: 6ch;
	}

	.error {
		width: 100%;
		color: var(--fg-error);
	}

	.actions {
		display: flex;
		gap: 1em;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;

		.avatar {
			font-size: 0.75rem;
			margin-right: 0.5em;
		}
	}

	@media (max-width: 1300px) {
		main {
			margin: 0 auto;
			align-items: center;
		}
	}
</style>
