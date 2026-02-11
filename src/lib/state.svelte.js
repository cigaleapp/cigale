import { Estimation as ETA } from 'arrival-time';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import { tables } from './idb.svelte.js';
import { getMetadataValue } from './metadata/index.js';
import { defaultClassificationMetadata, defaultCropMetadata } from './protocols.js';

/**
 * @import * as DB from './database';
 * @import { TypedMetadataValue } from './metadata/index.js';
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

	#eta = new ETA({ total: 0 });

	/** @param {number} total, @param {number} done */
	#updateETA(done, total) {
		if (done >= total || total === 0) {
			this.#eta.reset();
			return;
		}

		this.#eta.update(done, total);
	}

	eta = $derived.by(() => {
		this.#updateETA(this.processing.done, this.processing.total);
		return this.#eta.estimate();
	});

	/** @type {string[]} */
	selection = $state([]);
	/** @type {string | ''} */
	imageOpenedInCropper = $state('');
	/** @type {string | ''} */
	imagePreviouslyOpenedInCropper = $state('');
	/** @type {Map<string, string>} */
	previewURLs = new SvelteMap();
	/** @type {Map<string, string>} These persist across session changes */
	globalPreviewURLs = new SvelteMap();
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
	/** @type {string | null} */
	_currentSessionId = $state(null);

	/** @type {string | null} */
	currentSessionId = $derived(
		this._currentSessionId || localStorage.getItem('currentSessionId') || null
	);

	/**
	 * @param {string | null} id
	 */
	async setCurrentSession(id) {
		if (id === null) {
			localStorage.removeItem('currentSessionId');
		} else {
			void tables.Session.update(id, 'openedAt', new Date().toISOString());
			localStorage.setItem('currentSessionId', id);
		}

		this._currentSessionId = id;
	}

	/** @type {import('./database').Session | undefined}  */
	currentSession = $derived(tables.Session.state.find((s) => s.id === this.currentSessionId));

	currentProtocolId = $derived(this.currentSession?.protocol);

	/** @type {import('./database').Protocol | undefined} */
	currentProtocol = $derived(tables.Protocol.state.find((p) => p.id === this.currentProtocolId));

	classificationMetadata = $derived(
		this.currentProtocol
			? defaultClassificationMetadata(this.currentProtocol, tables.Metadata.state)
			: undefined
	);

	/** @type {string|undefined} */
	classificationMetadataId = $derived(this.classificationMetadata?.id);

	cropMetadata = $derived(
		this.currentProtocol
			? defaultCropMetadata(this.currentProtocol, tables.Metadata.state)
			: undefined
	);

	/** @type {string} */
	cropMetadataId = $derived(this.cropMetadata?.id ?? 'crop');

	/**
	 * @param {import('./database').Image} image
	 * @returns {import('./metadata').TypedMetadataValue<'boundingbox'>|undefined}
	 */
	cropMetadataValueOf(image) {
		return getMetadataValue(image, 'boundingbox', this.cropMetadataId);
	}

	/**
	 * @param {string | undefined | null} imageFileId
	 * @returns {boolean}
	 */
	hasPreviewURL(imageFileId) {
		if (!imageFileId) return false;
		return this.globalPreviewURLs.has(imageFileId) || this.previewURLs.has(imageFileId);
	}

	/**
	 *
	 * @param {string | undefined | null} imageFileId
	 * @returns {string | undefined}
	 */
	getPreviewURL(imageFileId) {
		if (!imageFileId) return undefined;
		return this.previewURLs.get(imageFileId) || this.globalPreviewURLs.get(imageFileId);
	}

	/**
	 * @param {string | undefined | null} imageFileId
	 * @param {string} url
	 * @param {boolean} [global=false]
	 */
	setPreviewURL(imageFileId, url, global = false) {
		console.debug('setPreviewURL', { imageFileId, url, global });
		if (!imageFileId) return;
		if (global) {
			this.globalPreviewURLs.set(imageFileId, url);
		} else {
			this.previewURLs.set(imageFileId, url);
		}
	}

	/**
	 * @param {string} imageFileId
	 */
	revokePreviewURL(imageFileId) {
		const url = this.previewURLs.get(imageFileId);
		if (!url) return;
		URL.revokeObjectURL(url);
		this.previewURLs.delete(imageFileId);
		this.globalPreviewURLs.delete(imageFileId);
	}

	clearPreviewURLs() {
		for (const id of this.previewURLs.keys()) {
			this.revokePreviewURL(id);
		}
	}

	/** @type {typeof import('$lib/schemas/neural.js').NeuralEnumInference.infer[]} */
	classificationModels = $derived.by(() => {
		const inference = this.classificationMetadata?.infer;

		if (!inference) return [];
		if (!('neural' in inference)) return [];
		return inference.neural;
	});

	/** @type {typeof import('$lib/schemas/neural.js').NeuralBoundingBoxInference.infer[]} */
	cropModels = $derived.by(() => {
		const inference = this.cropMetadata?.infer;

		if (!inference) return [];
		return inference.neural;
	});

	/** @type {number} */
	selectedCropModel = $derived.by(() => {
		if (!this.currentProtocolId) return -1;
		const metadataId = this.cropMetadataId;
		if (!metadataId) return -1;
		return this.currentSession?.inferenceModels[metadataId] ?? 0;
	});

	/** @type {number} */
	selectedClassificationModel = $derived.by(() => {
		if (!this.currentProtocolId) return -1;
		const metadataId = this.classificationMetadataId;
		if (!metadataId) return -1;
		return this.currentSession?.inferenceModels[metadataId] ?? 0;
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
		if (!this.currentSession) return;

		if (classification === null && crop === null) return; // no change

		const metadataIds = {
			classification: this.classificationMetadataId,
			crop: this.cropMetadataId
		};

		if (!metadataIds.classification || !metadataIds.crop) return;

		const current = this.currentSession.inferenceModels;
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

		await tables.Session.update(this.currentSession.id, 'inferenceModels', {
			...current,
			...changes
		});
	}
}

export const uiState = new UIState();
