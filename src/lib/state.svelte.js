import { MetadataInferOptionsNeural } from '$lib/schemas/metadata.js';
import { match } from 'arktype';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { tables } from './idb.svelte';
import { getMetadataValue } from './metadata';
import { getSetting, getSettings, setSetting } from './settings.svelte';

/**
 * @import * as DB from './database';
 * @import { TypedMetadataValue } from './metadata';
 * @import { ZoomState } from './DraggableBoundingBox.svelte.js';
 */

/**
 * @template {string} [Groups=string]
 * @typedef Keybind
 * @type {object}
 * @property {Groups} [group] used to group keybinds together in help dialogs
 * @property {string} help
 * @property {(e: MouseEvent|KeyboardEvent) => unknown} do
 * @property {boolean} [hidden=false] hide the keybinding from help
 * @property {boolean} [debug=false] only activate the keybinding in debug mode, hide it from help otherwise
 * @property {(e: MouseEvent|KeyboardEvent) => boolean} [when=() => true] condition to check before executing the keybind
 * @property {boolean} [allowInModals=false] allow the keybind to be active even when a modal is open
 */

/**
 * @template {string} [Groups=string]
 * @typedef Keymap
 * @type {Record<string, Keybind<Groups>>}
 */

// UIState class fields and methods are annotated with @type for documentation and IDE support
class UIState {
	processing = $state({
		/** @type {Array<{name: string; id: string; addedAt: Date }>} */
		files: [],
		/** @type {number} */
		total: 0,
		/** @type {number} */
		done: 0,
		/** @type {number} */
		time: 0,
		/** @type {''|'import'|'detection'|'classification'|'export'} */
		task: '',
		/** @type {number} */
		get progress() {
			return this.total ? this.done / this.total : 0;
		},
		/** @type {(id: string) => void} */
		removeFile(id) {
			const idx = this.files.findIndex((f) => f.id === id);
			if (idx === -1) return;
			this.files.splice(idx, 1);
		},
		/** @type {() => void} */
		reset() {
			this.total = 0;
			this.done = 0;
			this.time = 0;
			this.task = '';
		}
	});
	/** @type {string[]} */
	selection = $state([]);
	/** @type {string | ''} */
	imageOpenedInCropper = $state('');
	/** @type {string | ''} */
	imagePreviouslyOpenedInCropper = $state('');
	/** @type {Map<string, string>} */
	previewURLs = new SvelteMap();
	/** @type {Map<string, string>} */
	erroredImages = new SvelteMap();
	/** @type {Set<string>} */
	loadingImages = new SvelteSet();
	/** @type {Set<string>} */
	queuedImages = new SvelteSet();
	/** @type {Keymap} */
	keybinds = $state({});
	/** @type {Map<string, import('./DraggableBoundingBox.svelte.js').ZoomState>} */
	cropperZoomStates = new SvelteMap();
	/** @type {undefined | ((newSelection: string[]) => void)} */
	setSelection = $state(undefined);
	/** @type {string} */
	_currentProtocolId = $state('');

	/**
	 * @param {import('./database').Image} image
	 * @returns {import('./metadata').TypedMetadataValue<'boundingbox'>|undefined}
	 */
	cropMetadataValueOf(image) {
		return getMetadataValue(image, 'boundingbox', this.cropMetadataId);
	}

	/** @type {import('./database').Protocol | undefined} */
	currentProtocol = $derived(tables.Protocol.state.find((p) => p.id === this.currentProtocolId));

	/** @type {string} */
	currentProtocolId = $derived(
		this._currentProtocolId || localStorage.getItem('currentProtocolId') || ''
	);

	/**
	 * @param {string} id
	 */
	setCurrentProtocolId(id) {
		localStorage.setItem('currentProtocolId', id);
		this._currentProtocolId = id;
	}

	/** @type {string} */
	cropMetadataId = $derived(
		tables.Metadata.state.find(
			(m) =>
				this.currentProtocol?.metadata.includes(m.id) &&
				this.currentProtocol?.crop?.metadata === m.id
		)?.id ?? 'crop'
	);

	/** @type {string} */
	cropConfirmationMetadataId = $derived(
		tables.Metadata.state.find(
			(m) =>
				this.currentProtocol?.metadata.includes(m.id) &&
				this.currentProtocol?.crop?.confirmationMetadata === m.id
		)?.id ?? ''
	);

	/**
	 * @param {string | undefined | null} imageFileId
	 * @returns {boolean}
	 */
	hasPreviewURL(imageFileId) {
		if (!imageFileId) return false;
		return this.previewURLs.has(imageFileId);
	}
	/**
	 * @param {string | undefined | null} imageFileId
	 * @param {string} url
	 */
	setPreviewURL(imageFileId, url) {
		console.debug('setPreviewURL', { imageFileId, url });
		if (!imageFileId) return;
		this.previewURLs.set(imageFileId, url);
	}

	/** @type {typeof import('$lib/schemas/metadata.js').MetadataInferOptionsNeural.infer['neural']} */
	classificationModels = $derived(
		tables.Metadata.state.find((m) => m.id === this.classificationMetadataId)?.infer?.neural ?? []
	);
	/** @type {NonNullable<typeof import('$lib/schemas/protocols.js').Protocol.infer['crop']['infer']>} */
	cropModels = $derived(this.currentProtocol?.crop?.infer ?? []);

	/** @type {number} */
	selectedCropModel = $derived.by(() => {
		const metadataId = this.cropMetadataId;
		if (!metadataId) return -1;
		return getSettings().protocolModelSelections[this.currentProtocolId]?.[metadataId] ?? 0;
	});

	/** @type {number} */
	selectedClassificationModel = $derived.by(() => {
		const metadataId = this.classificationMetadataId;
		if (!metadataId) return -1;
		return getSettings().protocolModelSelections[this.currentProtocolId]?.[metadataId] ?? 0;
	});

	/** @type {boolean} */
	cropInferenceAvailable = $derived(this.cropModels.length > 0 && this.selectedCropModel !== -1);
	/** @type {boolean} */
	classificationInferenceAvailable = $derived(
		this.classificationModels.length > 0 && this.selectedClassificationModel !== -1
	);

	/**
	 * @param {{ classification?: number | null, crop?: number | null }} indices
	 * @returns {Promise<void>}
	 */
	async setModelSelections({ classification = null, crop = null }) {
		if (classification === null && crop === null) return; // no change

		const metadataIds = {
			classification: this.classificationMetadataId,
			crop: this.cropMetadataId
		};

		if (!metadataIds.classification || !metadataIds.crop) return;

		const current = await getSetting('protocolModelSelections');
		/** @type {Record<string, number>} */
		const changes = {};

		if (classification !== null && classification !== this.selectedClassificationModel) {
			changes[metadataIds.classification] = classification;
		}
		if (crop !== null && crop !== this.selectedCropModel) {
			changes[metadataIds.crop] = crop;
		}

		if (Object.keys(changes).length === 0) {
			return; // no change
		}

		await setSetting('protocolModelSelections', {
			...current,
			[this.currentProtocolId]: {
				...current[this.currentProtocolId],
				...changes
			}
		});
	}

	/** @type {string|undefined} */
	classificationMetadataId = $derived.by(() => {
		const isCandidate = match
			.case(
				{
					id: 'string',
					type: '"enum"',
					infer: MetadataInferOptionsNeural
				},
				({ id }) => this.currentProtocol?.metadata.includes(id)
			)
			.default(() => false);
		return tables.Metadata.state.find((m) => isCandidate(m))?.id;
	});
}

export const uiState = new UIState();
