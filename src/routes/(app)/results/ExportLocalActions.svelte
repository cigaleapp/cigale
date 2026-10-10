<script lang="ts">
	import { Capacitor } from '@capacitor/core';
	import { FileViewer } from '@capacitor/file-viewer';

	import IconDownloadAsDarwinCore from '~icons/ri/archive-2-line';
	import IconDownloadAsZip from '~icons/ri/file-zip-line';
	import IconDownloadAsFolder from '~icons/ri/folder-download-line';
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { downloadAsFile } from '$lib/download.js';
	import { writeToFilesystem } from '$lib/filesystem.js';
	import { formatBytesSize } from '$lib/i18n.js';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import LoadingText from '$lib/LoadingText.svelte';
	import { sendNotification } from '$lib/notifications.js';
	import { ensureNoLoneImages } from '$lib/observations.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { switchValue } from '$lib/utils.js';

	import { exporter } from './files.svelte.js';

	interface Props {
		confirmExportIfMetadataErrors: () => Promise<boolean>;
	}

	const swarpc = $derived(page.data.swarpc);

	const { confirmExportIfMetadataErrors }: Props = $props();

	const supportsDarwinCore = $derived(Boolean(uiState.currentProtocol?.darwincore));

	async function downloadExport(
		format: 'cigale' | 'darwincore',
		directoryHandle: FileSystemDirectoryHandle | undefined
	) {
		if (!(await confirmExportIfMetadataErrors())) return;

		await toasts.clear('exporter');
		uiState.processing.reset();

		const exportFormat = switchValue(format, {
			darwincore: 'darwincore',
			cigale: directoryHandle ? 'folder' : 'zip',
		});

		exporter.exporting = exportFormat;

		if (!uiState.currentSessionId) {
			toasts.error('Aucune session active à exporter.');
			exporter.exporting = false;
			return;
		}

		void swarpc.syncStoredCorrections(undefined);

		try {
			await ensureNoLoneImages();
			uiState.processing.task = 'export';
			uiState.processing.total = 1;
			uiState.processing.done = 0;

			let zipfileBytes: ArrayBuffer | undefined;

			switch (exportFormat) {
				case 'darwincore': {
					zipfileBytes = await swarpc.onceBy('export').generateDarwinCoreExport(
						{
							protocolId: uiState.currentProtocolId!,
							sessionIds: [uiState.currentSessionId],
						},
						({ done, total }) => {
							uiState.processing.done = done;
							uiState.processing.total = total;
						}
					);
					break;
				}
				case 'zip':
				case 'folder': {
					zipfileBytes = await swarpc.onceBy('export').generateResultsExport(
						{
							include: exporter.include,
							format: exportFormat,
							sessionId: uiState.currentSessionId,
							cropPadding: exporter.cropPadding.withUnit,
							jsonSchemaURL: new URL(
								asset('/results.schema.json'),
								page.url.origin
							).toString(),
						},
						async ({ event, data }) => {
							switch (event) {
								case 'progress':
									uiState.processing.done = data;
									break;
								case 'writeFile': {
									if (!directoryHandle) return;
									await writeToFilesystem(
										directoryHandle,
										data.filepath,
										data.content
									);
									break;
								}
								case 'warning': {
									const [message, { filename }] = data;
									switch (message) {
										case 'exif-write-error':
											toasts.warn(
												`Impossible d'ajouter les métadonnées EXIF à l'image ${filename}`
											);
											break;
									}

									break;
								}
							}
						}
					);
					break;
				}
			}

			if (exportFormat === 'folder' && directoryHandle) {
				toasts.success(`Fichiers sauvegardés dans ${directoryHandle.name}`);
			}

			if (exportFormat === 'zip' || exportFormat === 'darwincore') {
				const savedAt = await downloadAsFile(
					zipfileBytes,
					switchValue(exportFormat, { zip: 'results.zip', darwincore: 'dwca.zip' }),
					'application/zip'
				);

				if (savedAt) {
					await sendNotification('Export terminé', {
						awayOnly: true,
						body: `Fichier disponible à ${decodeURIComponent(savedAt.pathname)}`,
						actions: [
							{
								id: 'open-export',
								title: 'Ouvrir',
								async callback() {
									await FileViewer.openDocumentFromLocalPath({
										path: savedAt.pathname,
									});
								},
							},
						],
					});
				}
			}
		} catch (error) {
			console.error(error);
			toasts.error(`Erreur lors de l'exportation des résultats: ${error}`);
		} finally {
			exporter.exporting = false;
		}
	}
</script>

<ButtonSecondary onclick={async () => await downloadExport('cigale', undefined)}>
	{#if exporter.exporting === 'zip'}
		<LoadingSpinner />
	{:else}
		<IconDownloadAsZip />
	{/if}

	Archive ZIP

	<code class="size" use:tooltip={"Taille estimée de l'archive .zip"}>
		<LoadingText
			value={exporter.sizeEstimates.compressed}
			mask="~{formatBytesSize(150e3, 'narrow')}"
		>
			{#snippet loaded(size)}
				~{formatBytesSize(size, 'narrow')}
			{/snippet}
		</LoadingText>
	</code>
</ButtonSecondary>

{#if !Capacitor.isNativePlatform()}
	<ButtonSecondary
		disabled={!exporter.supportsWritingFolder}
		help={exporter.supportsWritingFolder
			? undefined
			: "Votre navigateur ne supporte pas l'exportation en dossier, utilisez Chrome ou Edge."}
		onclick={async () => {
			if (!exporter.supportsWritingFolder) return;
			const directory = await (window as any).showDirectoryPicker({
				mode: 'readwrite',
				startIn: 'documents',
				id: 'results-export',
			});
			await downloadExport('cigale', directory);
		}}
	>
		{#if exporter.exporting === 'folder'}
			<LoadingSpinner />
		{:else}
			<IconDownloadAsFolder />
		{/if}

		Dossier

		{#if exporter.supportsWritingFolder}
			<code class="size" use:tooltip={'Taille totale estimée du dossier'}>
				<LoadingText
					value={exporter.sizeEstimates.uncompressed}
					mask="~{formatBytesSize(150e3, 'narrow')}"
				>
					{#snippet loaded(size)}
						~{formatBytesSize(size, 'narrow')}
					{/snippet}
				</LoadingText>
			</code>
		{/if}
	</ButtonSecondary>
{/if}

{#if supportsDarwinCore}
	<ButtonSecondary onclick={async () => await downloadExport('darwincore', undefined)}>
		{#if exporter.exporting === 'darwincore'}
			<LoadingSpinner />
		{:else}
			<IconDownloadAsDarwinCore />
		{/if}

		Darwin Core
	</ButtonSecondary>
{/if}

<style>
	code.size {
		font-size: 0.9rem;
	}
</style>
