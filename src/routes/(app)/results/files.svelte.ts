import type { TreeNode } from '$lib/file-tree.js';

import { parseCropPadding } from '$lib/images';
import { uiState } from '$lib/uistate.svelte.js';
import { switchValue } from '$lib/utils.js';

class ExporterFiles {
	preview: TreeNode | undefined = $state();

	reloadPreviews = $state(0);

	/** We are currently generating an export (of the specified format) */
	exporting: 'zip' | 'folder' | false = $state(false);

	include: 'metadataonly' | 'croppedonly' | 'full' = $state('croppedonly');

	cropPadding = $derived(parseCropPadding(uiState.currentProtocol?.crop?.padding ?? '0px'));

	cropPaddingPreset = $derived.by(() => {
		if (this.cropPadding.unitless === 0) return 'none' as const;
		if (this.cropPadding.unit === 'px') return 'customPixels' as const;
		if (this.cropPadding.unitless === 5) return 'small' as const;
		if (this.cropPadding.unitless === 10) return 'medium' as const;
		return 'customPercent' as const;
	});

	sizeEstimates: { compressed?: number; uncompressed?: number } = $state({});

	supportsWritingFolder = $state(false);

	cropPaddingDisplay(preset: typeof this.cropPaddingPreset) {
		const unit = this.unitOfPreset(preset);
		if (this.cropPadding.unitless === 0) return '0';
		if (this.cropPadding.unit === unit) return this.cropPadding.unitless.toString();
		return '?';
	}

	unitOfPreset(preset: typeof this.cropPaddingPreset): 'px' | '%' {
		return switchValue(preset, {
			none: 'px',
			customPixels: 'px',
			small: '%',
			medium: '%',
			customPercent: '%',
		});
	}

	updateCropPadding(value: string, preset: typeof this.cropPaddingPreset) {
		const unit = this.unitOfPreset(preset);
		const parsed = Number.parseInt(value, 10);
		if (!isNaN(parsed) && parsed > 0) {
			exporter.cropPadding = parseCropPadding(parsed + unit);
			exporter.cropPaddingPreset = preset;
		}
	}

	constructor() {}

	setup() {
		$effect(() => {
			switch (this.cropPaddingPreset) {
				case 'none':
					this.cropPadding = parseCropPadding('0px');
					break;

				case 'small':
					this.cropPadding = parseCropPadding('5%');
					break;

				case 'medium':
					this.cropPadding = parseCropPadding('10%');
					break;

				default:
					break;
			}
		});

		$effect(() => {
			if ('showDirectoryPicker' in window) {
				this.supportsWritingFolder = true;
			}
		});
	}
}

export const exporter = new ExporterFiles();
