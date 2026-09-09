<script lang="ts">
	import type { TreeNode, TreeNodeMaybeLoading } from '$lib/file-tree.js';

	import { watch } from 'runed';

	import { page } from '$app/state';
	import Field from '$lib/Field.svelte';
	import { gatherToTree } from '$lib/file-tree.js';
	import { formatBytesSize } from '$lib/i18n.js';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import { ensureNoLoneImages } from '$lib/observations.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { entries, switchValue } from '$lib/utils.js';
	import ZipContentsTree from '$lib/ZipContentsTree.svelte';

	import { exporter } from './files.svelte.js';

	const swarpc = $derived(page.data.swarpc);

	const loadingFolder: TreeNodeMaybeLoading[number] = {
		folder: Loading,
		children: Array(10).fill(Loading),
	};

	const loadingPreview: TreeNodeMaybeLoading = [
		Loading,
		Loading,
		...switchValue(exporter.include, {
			metadataonly: [],
			croppedonly: [loadingFolder],
			full: [loadingFolder, loadingFolder],
		}),
	];

	watch([() => exporter.reloadPreviews, () => exporter.include], () => {
		exporter.preview = undefined;
		(async () => {
			exporter.preview = await previewZipContents();
		})();
	});

	watch(
		[() => exporter.reloadPreviews, () => exporter.include, () => exporter.cropPadding],
		() => {
			exporter.sizeEstimates = {};
			(async () => {
				if (!uiState.currentSessionId) return;
				exporter.sizeEstimates = await swarpc.estimateResultsZipSize.once({
					include: exporter.include,
					sessionId: uiState.currentSessionId,
					cropPadding: exporter.cropPadding.withUnit,
				});
			})();
		}
	);

	async function previewZipContents(): Promise<TreeNode> {
		if (!uiState.currentSessionId) {
			toasts.error('Aucune session active à prévisualiser.');
			return [];
		}

		await ensureNoLoneImages();

		const preview = await swarpc.previewResultsZip.once({
			include: exporter.include,
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
</script>

<div class="tree loading" pw-testid="zip-preview">
	<Field label="Contenu de l'export">
		<ZipContentsTree tree={exporter.preview ?? loadingPreview}>
			{#snippet rootHelp()}
				<LoadingText
					value={exporter.sizeEstimates.uncompressed}
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

<style>
	.tree {
		margin-top: 1em;
	}
</style>
