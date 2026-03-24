<script lang="ts">
	import type { TreeNode, TreeNodeMaybeLoading } from '$lib/file-tree.js';
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';

	import { watch } from 'runed';
	import { tick } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	import IconDownloadAsZip from '~icons/ri/file-zip-line';
	import IconDownloadAsFolder from '~icons/ri/folder-download-line';
	import IconExpand from '~icons/ri/skip-left-line';
	import IconCollapse from '~icons/ri/skip-right-line';
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import { FULL_IMAGE_CROPBOX, toRelativeCoords } from '$lib/BoundingBoxes.svelte.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import { downloadAsFile } from '$lib/download.js';
	import Field from '$lib/Field.svelte';
	import { gatherToTree } from '$lib/file-tree.js';
	import { writeToFilesystem } from '$lib/filesystem.js';
	import { formatBytesSize } from '$lib/i18n';
	import { tables } from '$lib/idb.svelte.js';
	import { parseCropPadding } from '$lib/images';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { ensureNoLoneImages } from '$lib/observations.js';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import SessionMetadataForm from '$lib/SessionMetadataForm.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import Tooltip from '$lib/Tooltip.svelte';
	import { tooltip } from '$lib/tooltips.js';
	import { entries } from '$lib/utils.js';
	import ZipContentsTree from '$lib/ZipContentsTree.svelte';

	const { data } = $props();
	const swarpc = $derived(data.swarpc);

	let windowWidth: number | undefined = $state();
	let collapsedExportPanel = $derived((windowWidth ?? 0) <= 1400);

	/** We are currently generating an export (of the specified format) */
	let exporting: 'zip' | 'folder' | false = $state(false);

	let include: 'metadataonly' | 'croppedonly' | 'full' = $state('croppedonly');

	let cropPadding = $derived(parseCropPadding(uiState.currentProtocol?.crop?.padding ?? '0px'));

	let cropPaddingPreset = $derived.by(() => {
		if (cropPadding.unitless === 0) return 'none' as const;
		if (cropPadding.unit === 'px') return 'customPixels' as const;
		if (cropPadding.unitless === 5) return 'small' as const;
		if (cropPadding.unitless === 10) return 'medium' as const;
		return 'customPercent' as const;
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

	$effect(() => {
		if (!exporting && uiState.processing.task === 'export') {
			uiState.processing.reset();
		}
	});

	async function downloadExport(directoryHandle: FileSystemDirectoryHandle | undefined) {
		if (metadataErrors.values().some((errs) => errs.length > 0)) {
			if (!(await confirmExportWithMetadataErrors())) {
				return;
			}
		}

		await toasts.clear('exporter');
		uiState.processing.reset();
		const exportFormat = directoryHandle ? 'folder' : 'zip';
		exporting = exportFormat;

		if (!uiState.currentSessionId) {
			toasts.error('Aucune session active à exporter.');
			exporting = false;
			return;
		}

		try {
			await ensureNoLoneImages();
			uiState.processing.task = 'export';
			uiState.processing.total = 1;
			uiState.processing.done = 0;

			const zipfileBytes = await swarpc.generateResultsExport.once(
				{
					include,
					format: exportFormat,
					sessionId: uiState.currentSessionId,
					cropPadding: cropPadding.withUnit,
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
							await writeToFilesystem(directoryHandle, data.filepath, data.contents);
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

			if (exportFormat === 'folder' && directoryHandle) {
				toasts.success(`Fichiers sauvegardés dans ${directoryHandle.name}`);
			}

			if (exportFormat === 'zip') {
				downloadAsFile(zipfileBytes, 'results.zip', 'application/zip');
			}
		} catch (error) {
			console.error(error);
			toasts.error(`Erreur lors de l'exportation des résultats: ${error}`);
		} finally {
			exporting = false;
		}
	}

	async function previewZipContents(): Promise<TreeNode> {
		if (!uiState.currentSessionId) {
			toasts.error('Aucune session active à prévisualiser.');
			return [];
		}

		await ensureNoLoneImages();

		const preview = await swarpc.previewResultsZip.once({
			include,
			sessionId: uiState.currentSessionId,
		});

		const tree: TreeNode = [];
		for (const [provenance, files] of entries(preview)) {
			gatherToTree({
				tree,
				paths: files.map((f) => f.path),
				provenance,
				contentType: (path) =>
					files.find((f) => f.path === path)?.contentType ?? 'application/octet-stream',
			});
		}
		return tree;
	}

	let preview: TreeNode | undefined = $state();

	let reloadPreviews = $state(0);

	watch([() => reloadPreviews, () => include], () => {
		preview = undefined;
		(async () => {
			preview = await previewZipContents();
		})();
	});

	let sizeEstimates: { compressed?: number; uncompressed?: number } = $state({});

	watch([() => reloadPreviews, () => include, () => cropPadding], () => {
		sizeEstimates = {};
		(async () => {
			if (!uiState.currentSessionId) return;
			sizeEstimates = await swarpc.estimateResultsZipSize.once({
				include,
				sessionId: uiState.currentSessionId,
				cropPadding: cropPadding.withUnit,
			});
		})();
	});

	const loadingFolder: TreeNodeMaybeLoading[number] = {
		folder: Loading,
		children: Array(10).fill(Loading),
	};

	let confirmExportWithMetadataErrors: () => Promise<boolean> = $state();
	const metadataErrors: Map<NamespacedMetadataID, string[]> = new SvelteMap();

	let supportsWritingFolder = $state(false);
	$effect(() => {
		if ('showDirectoryPicker' in window) {
			supportsWritingFolder = true;
		}
	});
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

<svelte:window bind:innerWidth={windowWidth} />

<main>
	<section class="session">
		<header>
			<h2>Vérifier les métadonnées</h2>
		</header>

		<section class="metadata">
			{#if uiState.currentSession}
				<SessionMetadataForm
					session={uiState.currentSession}
					metadataOptions={new Map()}
					errors={metadataErrors}
					onmetadatachange={() => {
						reloadPreviews++;
					}}
				/>
			{/if}
		</section>
	</section>

	<section class="export" data-testid="export-results" class:collapsed={collapsedExportPanel}>
		<header>
			<div class="actions">
				<ButtonIcon
					help={collapsedExportPanel
						? "Montrer le panneau d'export"
						: "Cacher le panneau d'export"}
					onclick={() => {
						collapsedExportPanel = !collapsedExportPanel;
					}}
				>
					{#if collapsedExportPanel}
						<IconExpand />
					{:else}
						<IconCollapse />
					{/if}
				</ButtonIcon>
			</div>
			<h2>Exporter</h2>
		</header>

		<div class="scrollable">
			<div class="settings-and-gallery">
				<div class="settings">
					<div class="include">
						<Field label="Inclure">
							<RadioButtons
								bind:value={include}
								options={[
									{ key: 'metadataonly', label: 'Métadonnées seulement' },
									{
										key: 'croppedonly',
										label: 'Métadonnées et images recadrées',
									},
									{
										key: 'full',
										label: 'Tout',
										subtext: 'Permet de ré-importer ultérieurement',
									},
								]}
							/>
						</Field>
					</div>
					<div class="crop-padding" class:irrelevant={include === 'metadataonly'}>
						<Field>
							{#snippet label()}
								Marge de recadrage
								<p class="fineprint"></p>
							{/snippet}
							<RadioButtons
								options={[
									{ key: 'none', label: 'Aucune' },
									{ key: 'small', label: '5%' },
									{ key: 'medium', label: '10%' },
									{ key: 'customPercent', label: '?%' },
									{ key: 'customPixels', label: '?px' },
								]}
								// labels={{ none: 'Aucune', small: '5%', medium: '10%' }}
								bind:value={cropPaddingPreset}
							>
								{#snippet children({ key: option, label })}
									{#if option.startsWith('custom')}
										{@const unit = option === 'customPercent' ? '%' : 'px'}
										<div
											class="numeric"
											style:--width={unit === '%' ? '3ch' : '4ch'}
										>
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
														cropPadding = parseCropPadding(
															parsed + unit
														);
														cropPaddingPreset = option;
													}
												}}
											/>
											{unit}
										</div>
									{:else if label.includes('%')}
										<Tooltip
											text="Pour chaque image, relativement à ses dimensions"
										>
											{label}
										</Tooltip>
									{:else}
										{label}
									{/if}
								{/snippet}
							</RadioButtons>
						</Field>
					</div>
				</div>

				<div class="gallery">
					{#each tables.Image.state.slice(0, 100) as image (image.id)}
						{@const box = cropPadding.apply(
							image.dimensions,
							uiState.cropMetadataValueOf(image)?.value ?? FULL_IMAGE_CROPBOX
						)}
						<div
							class="thumbnail"
							data-box={JSON.stringify(uiState.cropMetadataValueOf(image))}
						>
							<CroppedImg
								transitions
								blurfill
								src={uiState.getPreviewURL(image.fileId)}
								box={toRelativeCoords(image.dimensions)(box)}
								dimensions={image.dimensions}
							/>
						</div>
					{/each}
				</div>
			</div>

			<div class="tree loading" data-testid="zip-preview">
				<Field label="Contenu de l'export">
					<ZipContentsTree
						tree={preview ?? [
							Loading,
							Loading,
							...{
								metadataonly: [],
								croppedonly: [loadingFolder],
								full: [loadingFolder, loadingFolder],
							}[include],
						]}
					>
						{#snippet rootHelp()}
							<LoadingText
								value={sizeEstimates.uncompressed}
								mask="~{formatBytesSize(1e6, 'narrow')}"
							>
								{#snippet loaded(size)}
									~{formatBytesSize(size, 'narrow')}
								{/snippet}
							</LoadingText>
							une fois dézippé
						{/snippet}
					</ZipContentsTree>
				</Field>
			</div>
		</div>

		<div class="actions">
			<ButtonSecondary onclick={async () => await downloadExport(undefined)}>
				{#if exporting === 'zip'}
					<LoadingSpinner />
				{:else}
					<IconDownloadAsZip />
				{/if}
				Archive ZIP
				<code class="size" use:tooltip={"Taille estimée de l'archive .zip"}>
					<LoadingText
						value={sizeEstimates.compressed}
						mask="~{formatBytesSize(150e3, 'narrow')}"
					>
						{#snippet loaded(size)}
							~{formatBytesSize(size, 'narrow')}
						{/snippet}
					</LoadingText>
				</code>
			</ButtonSecondary>
			<ButtonSecondary
				disabled={!supportsWritingFolder}
				help={supportsWritingFolder
					? undefined
					: "Votre navigateur ne supporte pas l'exportation en dossier, utilisez Chrome ou Edge."}
				onclick={async () => {
					if (!supportsWritingFolder) return;
					const directory = await (window as any).showDirectoryPicker({
						mode: 'readwrite',
						startIn: 'documents',
						id: 'results-export',
					});
					await downloadExport(directory);
				}}
			>
				{#if exporting === 'folder'}
					<LoadingSpinner />
				{:else}
					<IconDownloadAsFolder />
				{/if}
				Dossier
				{#if supportsWritingFolder}
					<code class="size" use:tooltip={'Taille totale estimée du dossier'}>
						<LoadingText
							value={sizeEstimates.uncompressed}
							mask="~{formatBytesSize(150e3, 'narrow')}"
						>
							{#snippet loaded(size)}
								~{formatBytesSize(size, 'narrow')}
							{/snippet}
						</LoadingText>
					</code>
				{/if}
			</ButtonSecondary>
		</div>
	</section>
</main>

<style>
	main {
		max-width: 1400px;
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
		padding: 2rem;
	}

	.session .metadata {
		display: flex;
		flex-direction: column;
		max-width: 50rem;
		gap: 2em;
	}

	.export {
		position: fixed;
		z-index: 10;
		top: calc(var(--navbar-height));
		bottom: 3rem;
		right: 3rem;
		max-width: 50rem;
		border-radius: var(--corner-radius);
		border: 1px solid var(--gray);
		background-color: var(--bg-neutral);
		display: flex;
		flex-direction: column;
		/* z-index: 200; */

		transition: right 80ms ease;

		&.collapsed {
			right: -35rem;
		}
	}

	.export > * {
		/* So that the .scrollable's scrollbar kisses the actual card's borders */
		padding: 1rem 2rem;

		&:first-child {
			padding-top: 2rem;
		}

		&:last-child {
			padding-bottom: 2rem;
		}
	}

	.export .scrollable {
		display: flex;
		flex-direction: column;
		gap: 1em;
		overflow-y: auto;
		height: 100%;
		scrollbar-gutter: stable;
	}

	.settings-and-gallery {
		--gallery-thumb: 80px;
		--gallery-gap: 1em;
		display: grid;
		grid-template-columns: auto calc(3 * (var(--gallery-thumb) + var(--gallery-gap)));
		gap: 3em;
	}

	.gallery {
		align-self: flex-start;
		width: 100%;
		display: grid;
		grid-auto-flow: columns;
		grid-template-columns: repeat(auto-fill, var(--gallery-thumb));
		gap: 1em;
		max-height: calc(4 * (var(--gallery-thumb) + var(--gallery-gap)));
		overflow: hidden;

		.thumbnail {
			width: var(--gallery-thumb);
			height: var(--gallery-thumb);
			position: relative;

			:global(picture) {
				position: absolute;
				inset: 0;
			}
		}
	}

	.settings {
		display: flex;
		flex-direction: column;
		gap: 2em;
	}

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

	code.size {
		font-size: 0.85em;
		min-width: 6ch;
	}

	.tree {
		margin-top: 1em;
	}

	.actions {
		display: flex;
		gap: 1em;
		align-items: center;
		justify-content: center;
	}

	@media (max-width: 1300px) {
		main {
			margin: 0 auto;
			align-items: center;
		}

		.export {
			position: static;
			border: none;
			width: 100%;
			header .actions {
				display: none;
			}

			&,
			> * {
				padding-inline: 0;
			}
		}
	}
</style>
