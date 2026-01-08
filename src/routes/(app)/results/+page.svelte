<script lang="ts">
	import { watch } from 'runed';
	import { tick } from 'svelte';

	import Download from '~icons/ri/download-2-line';
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { downloadAsFile } from '$lib/download.js';
	import { gatherToTree, type TreeNode, type TreeNodeMaybeLoading } from '$lib/file-tree.js';
	import { formatBytesSize } from '$lib/i18n';
	import { parseCropPadding } from '$lib/images';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import { ensureNoLoneImages } from '$lib/observations.js';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import { entries } from '$lib/utils.js';
	import ZipContentsTree from '$lib/ZipContentsTree.svelte';

	const { data } = $props();
	const swarpc = $derived(data.swarpc);

	let exporting = $state(false);
	let include: 'metadataonly' | 'croppedonly' | 'full' = $state('croppedonly');

	let cropPadding = $derived(parseCropPadding(uiState.currentProtocol?.crop.padding ?? '0px'));

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

	// TODO tidy up that code once https://github.com/gwennlbh/swarpc/issues/115 is implemented
	let cancelExportGeneration = $state((_: string) => {});
	let cancelExportPreview = $state((_: string) => {});
	let cancelExportSizeEstimation = $state((_: string) => {});

	async function generateExport() {
		cancelExportGeneration('Un nouvel export a été démarré');

		await toasts.clear('exporter');
		uiState.processing.reset();
		exporting = true;

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
			const { cancel, request: zipfileBytes } = swarpc.generateResultsZip.cancelable(
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

			cancelExportGeneration = cancel;

			downloadAsFile(await zipfileBytes, 'results.zip', 'application/zip');
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

		cancelExportPreview('Une nouvelle prévisualisation a été demandée');

		await ensureNoLoneImages();

		const { cancel, request } = swarpc.previewResultsZip.cancelable({
			include,
			sessionId: uiState.currentSessionId
		});

		cancelExportPreview = cancel;

		const preview = await request;

		const tree: TreeNode = [];
		for (const [provenance, paths] of entries(preview)) {
			gatherToTree({ tree, paths, provenance });
		}
		return tree;
	}

	let preview: TreeNode | undefined = $state();

	watch([() => include], () => {
		preview = undefined;
		(async () => {
			preview = await previewZipContents();
		})();
	});

	let sizeEstimates: { compressed?: number; uncompressed?: number } = $state({});

	watch([() => include], () => {
		cancelExportSizeEstimation('Une nouvelle estimation de taille a été demandée');
		sizeEstimates = {};
		(async () => {
			const { cancel, request } = swarpc.estimateResultsZipSize.cancelable({
				include,
				sessionId: uiState.currentSessionId
			});
			cancelExportSizeEstimation = cancel;
			sizeEstimates = await request;
		})();
	});

	const loadingFolder: TreeNodeMaybeLoading[number] = {
		folder: Loading,
		children: Array(10).fill(Loading)
	};
</script>

<main>
	<header>
		<h1>Résultats</h1>

		<ButtonSecondary onclick={generateExport}>
			{#if exporting}
				<LoadingSpinner />
			{:else}
				<Download />
			{/if}
			results.zip
			<code class="size" use:tooltip={"Taille estimée de l'archive .zip"}>
				<LoadingText value={sizeEstimates.compressed} mask="~{formatBytesSize(150e3)}">
					{#snippet loaded(size)}
						~{formatBytesSize(size)}
					{/snippet}
				</LoadingText>
			</code>
		</ButtonSecondary>
	</header>
	<div class="side-by-side">
		<section class="settings">
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
			<div class="crop-padding" class:irrelevant={include === 'metadataonly'}>
				<div class="label">Marge autour des images recadrées</div>
				<SegmentedGroup
					aria-label="Marge autour des images recadrées"
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
					Une valeur en % signifie que la marge est relative aux dimensions de chacune des
					images
				</p>
			</div>
		</section>

		<section class="preview" data-testid="zip-preview">
			<h2>Contenu de l'export .zip</h2>

			<div class="tree loading">
				<ZipContentsTree
					tree={preview ?? [
						Loading,
						Loading,
						...{
							metadataonly: [],
							croppedonly: [loadingFolder],
							full: [loadingFolder, loadingFolder]
						}[include]
					]}
				>
					{#snippet rootHelp()}
						<LoadingText
							value={sizeEstimates.uncompressed}
							mask="~{formatBytesSize(1e6)}"
						>
							{#snippet loaded(size)}
								~{formatBytesSize(size)}
							{/snippet}
						</LoadingText>
						une fois dézippé
					{/snippet}
				</ZipContentsTree>
			</div>
		</section>
	</div>
</main>

<style>
	main {
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 3em;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1em;
	}

	.side-by-side {
		display: grid;
		grid-template-columns: 3fr 2fr;
		gap: 2em;
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

	code.size {
		font-size: 0.85em;
		min-width: 6ch;
	}
</style>
