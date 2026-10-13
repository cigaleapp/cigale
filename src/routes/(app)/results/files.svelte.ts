import type { TreeNode } from '$lib/file-tree.js';

export class ExporterFiles {
	preview: TreeNode | undefined = $state();

	reloadPreviews = $state(0);

	/** We are currently generating an export (of the specified format) */
	exporting: 'zip' | 'folder' | 'darwincore' | false = $state(false);

	include: 'metadataonly' | 'croppedonly' | 'full' = $state('croppedonly');

	cropPadding: `${number}${'px' | '%'}` = '0px';

	sizeEstimates: { compressed?: number; uncompressed?: number } = $state({});

	supportsWritingFolder = $state(false);

	constructor() {}

	setup() {
		$effect(() => {
			if ('showDirectoryPicker' in window) {
				this.supportsWritingFolder = true;
			}
		});
	}
}

export const exporter = new ExporterFiles();
