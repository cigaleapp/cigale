import type * as DB from './database.js';
import type { TypedMetadataValue } from './metadata/index.js';
import type { NamespacedMetadataID } from './schemas/common.js';
import type { NeuralBoundingBoxInference, NeuralEnumInference } from './schemas/neural.js';
import type { NeuralModelSelector } from './schemas/sessions.js';
import type { ZoomState } from '$routes/(app)/(sidepanel)/o/[observation]/crop/[image]/zoom.svelte.js';

import { Estimation as ETA } from 'arrival-time';
import { dequal } from 'dequal';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import { tables } from './idb.svelte.js';
import { getMetadataValue } from './metadata/index.js';
import { defaultClassificationMetadata, defaultCropMetadata } from './protocols.js';
import { isMetadataInProtocol } from './schemas/protocols.js';
import { mapValues, omit, pick, transformObject } from './utils.js';

type NeuralModelSelector = (typeof NeuralModelSelector)['infer'];

export type Keybind<Groups extends string> = {
	/**
	 * used to group keybinds together in help dialogs
	 */
	group?: Groups;
	help: string;
	do: (e: MouseEvent | KeyboardEvent) => unknown;
	/**
	 * hide the keybinding from help
	 */
	hidden?: boolean;
	/**
	 *  only activate the keybinding in debug mode, hide it from help otherwise
	 */
	debug?: boolean;
	/**
	 *  condition to check before executing the keybind
	 */
	when?: (e: MouseEvent | KeyboardEvent) => boolean;
	/**
	 *  allow the keybind to be active even when a modal is open
	 */
	allowInModals?: boolean;
	/**
	 *  alternative binds that do the same action. Same syntax as {@link Keymap}'s keys
	 */
	alternatives?: string[];
};

export type Keymap<Groups extends string = string> = Record<string, Keybind<Groups>>;

export class UIState {
	constructor() {
		// Can't use if(window) cuz variable might be undeclared
		// Can't use if(browser) cuz $app/environment imports don't work when transforming worker code
		try {
			window.uiState = this;
		} catch {
			// ok
		}
	}

	/**
	 * Returns a JSON-compatible object of the state.
	 * Used for debugging purposes
	 */
	snapshot() {
		return $state.snapshot({
			processing: pick(this.processing, 'files', 'total', 'done', 'time', 'task'),
			eta: this.eta,
			selection: this.selection,
			imageOpenedInCropper: this.imageOpenedInCropper,
			imagePreviouslyOpenedInCropper: this.imagePreviouslyOpenedInCropper,
			previewURLs: Object.fromEntries(this.previewURLs.entries()),
			globalPreviewURLs: Object.fromEntries(this.globalPreviewURLs.entries()),
			erroredImages: Object.fromEntries(this.erroredImages.entries()),
			loadingImages: Array.from(this.loadingImages),
			queuedImages: Array.from(this.queuedImages),
			keybinds: mapValues(this.keybinds, (bind) =>
				transformObject(bind, (key, value) => (key === 'do' ? undefined : [key, value]))
			),
			currentSessionId: this.currentSessionId,
			currentSession: this.currentSession ? omit(this.currentSession, 'metadata') : null,
			currentProtocol: this.currentProtocol ? pick(this.currentProtocol, 'id', 'name') : null,
			classificationMetadata: this.classificationMetadata
				? pick(this.classificationMetadata, 'id', 'infer')
				: null,
			cropMetadata: this.cropMetadata ? pick(this.cropMetadata, 'id', 'infer') : null,
			classificationModels: this.classificationModels,
			cropModels: this.cropModels,
			selectedCropModel: this.selectedCropModel,
			selectedClassificationModel: this.selectedClassificationModel,
			cropInferenceAvailable: this.cropInferenceAvailable,
			classificationInferenceAvailable: this.classificationInferenceAvailable,
		});
	}

	processing = $state({
		files: [] as Array<{ name: string; id: string; addedAt: Date }>,
		total: 0,
		done: 0,
		time: 0,
		task: '' as '' | 'import' | 'detection' | 'classification' | 'export',
		get progress() {
			return this.total ? this.done / this.total : 0;
		},
		removeFile(id: string): void {
			const idx = this.files.findIndex((f) => f.id === id);
			if (idx === -1) return;
			this.files.splice(idx, 1);
		},
		reset(): void {
			this.total = 0;
			this.done = 0;
			this.time = 0;
			this.task = '';
		},
	});

	#eta = new ETA({ total: 0 });

	#updateETA(done: number, total: number) {
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

	selection: string[] = $state([]);
	imageOpenedInCropper: string | '' = $state('');
	imagePreviouslyOpenedInCropper: string | '' = $state('');
	previewURLs = new SvelteMap<string, string>();
	/**  These persist across session changes */
	globalPreviewURLs = new SvelteMap<string, string>();
	/**  Persisted set of inference session IDs loaded on the client */
	loadedInferenceSessions = new SvelteSet<string>();
	erroredImages = new SvelteMap<string, string>();
	loadingImages = new SvelteSet<string>();
	queuedImages = new SvelteSet<string>();
	keybinds: Keymap = $state({});
	cropperZoomStates = new SvelteMap<string, ZoomState>();
	setSelection = $state<(newSelection: string[]) => void>();
	_currentSessionId = $state<string | null>(null);

	currentSessionId: string | null = $derived(
		this._currentSessionId || localStorage.getItem('currentSessionId') || null
	);

	async setCurrentSession(id: string | null) {
		if (id === null) {
			localStorage.removeItem('currentSessionId');
		} else {
			localStorage.setItem('currentSessionId', id);
		}

		this._currentSessionId = id;
	}

	currentSession: DB.Session | undefined = $derived(
		tables.Session.state.find((s) => s.id === this.currentSessionId)
	);

	currentProtocolId = $derived(this.currentSession?.protocol);

	currentProtocol: DB.Protocol | undefined = $derived(
		tables.Protocol.state.find((p) => p.id === this.currentProtocolId)
	);

	/**
	 * @deprecated we dont have a single classification metadata anymore
	 */
	classificationMetadata = $derived(
		this.currentProtocol
			? defaultClassificationMetadata(this.currentProtocol, tables.Metadata.state)
			: undefined
	);

	/**
	 * @deprecated we dont have a single classification metadata anymore
	 */
	classificationMetadataId = $derived(this.classificationMetadata?.id);

	cropMetadata = $derived(
		this.currentProtocol
			? defaultCropMetadata(this.currentProtocol, tables.Metadata.state)
			: undefined
	);

	cropMetadataId = $derived<NamespacedMetadataID>(this.cropMetadata?.id ?? 'backbone__crop');

	cropMetadataValueOf(image: DB.Image): TypedMetadataValue<'boundingbox'> | undefined {
		return getMetadataValue(image, 'boundingbox', this.cropMetadataId);
	}

	/**
	 * @deprecated we dont have a single classification metadata anymore
	 */
	classificationMetadataValueOf(image: DB.Image): TypedMetadataValue<'enum'> | undefined {
		if (!this.classificationMetadataId) return undefined;
		return getMetadataValue(image, 'enum', this.classificationMetadataId);
	}

	hasPreviewURL(imageFileId: string | undefined | null): boolean {
		if (!imageFileId) return false;
		return this.globalPreviewURLs.has(imageFileId) || this.previewURLs.has(imageFileId);
	}

	getPreviewURL(imageFileId: string | undefined | null): string | undefined {
		if (!imageFileId) return undefined;
		return this.previewURLs.get(imageFileId) || this.globalPreviewURLs.get(imageFileId);
	}

	setPreviewURL(imageFileId: string | undefined | null, url: string, global = false) {
		console.debug('setPreviewURL', { imageFileId, url, global });
		if (!imageFileId) return;
		if (global) {
			this.globalPreviewURLs.set(imageFileId, url);
		} else {
			this.previewURLs.set(imageFileId, url);
		}
	}

	revokePreviewURL(imageFileId: string) {
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

	classificationModels: (typeof NeuralEnumInference.infer)[] = $derived.by(() => {
		const inference = this.classificationMetadata?.infer;

		if (!inference) return [];
		if (!('neural' in inference)) return [];
		return inference.neural;
	});

	/**
	 * Classification metadata with an enabled neural model selection.
	 */
	enabledClassificationMetadata: DB.Metadata[] = $derived.by(() => {
		return this.allClassificationMetadata.filter(
			(metadata) =>
				(this.currentSession?.neuralModels[metadata.id]?.kind ?? 'protocol') !== 'disabled'
		);
	});

	/**
	 * All metadata with neural enum inference (not just the first one)
	 * @type {DB.Metadata[]}
	 */
	allClassificationMetadata: DB.Metadata[] = $derived.by(() => {
		const protocol = this.currentProtocol;
		if (!protocol) return [];
		const inferenceMetadata = tables.Metadata.state
			.filter((m) => m.type === 'enum')
			.filter((m) => isMetadataInProtocol(protocol, m.id))
			.filter((m) => m.infer && 'neural' in m.infer);
		return inferenceMetadata;
	});

	/**
	 * Maps metadata IDs to their neural inference models
	 */
	allClassificationModels: Record<
		DB.Metadata['id'],
		Array<(typeof NeuralEnumInference)['infer']>
	> = $derived(
		Object.fromEntries(
			this.allClassificationMetadata.flatMap((metadata) =>
				metadata.type === 'enum' && metadata.infer?.neural
					? [[metadata.id, metadata.infer.neural]]
					: []
			)
		)
	);

	/**
	 * Maps metadata IDs to their selected model indices
	 */
	selectedClassificationModels: Record<DB.Metadata['id'], NeuralModelSelector> = $derived.by(
		() => {
			/** @type {Record<string, NeuralModelSelector>} */
			const result: Record<string, NeuralModelSelector> = {};
			for (const metadata of this.allClassificationMetadata) {
				result[metadata.id] = this.currentSession?.neuralModels[metadata.id] ?? {
					kind: 'protocol',
					i: 0,
				};
			}
			return result;
		}
	);

	cropModels: (typeof NeuralBoundingBoxInference.infer)[] = $derived.by(() => {
		const inference = this.cropMetadata?.infer;

		if (!inference) return [];
		if (!('neural' in inference)) return [];
		return inference.neural;
	});

	selectedCropModel: NeuralModelSelector = $derived.by(() => {
		const DISABLED = { kind: 'disabled' } as const;
		if (!this.currentProtocolId) return DISABLED;
		const metadataId = this.cropMetadataId;
		if (!metadataId) return DISABLED;
		return this.currentSession?.neuralModels[metadataId] ?? { kind: 'protocol', i: 0 };
	});

	selectedCropModelSettings = $derived.by(() => {
		switch (this.selectedCropModel.kind) {
			case 'disabled':
				return undefined;
			case 'protocol':
				return this.cropMetadata?.infer?.neural?.[this.selectedCropModel.i];
			case 'custom':
				return tables.CustomNeuralNetwork.getFromState(this.selectedCropModel.id);
		}
	});

	selectedCropModelUrl = $derived.by(() => {
		switch (this.selectedCropModel.kind) {
			case 'disabled':
				return undefined;
			case 'protocol': {
				const request = this.cropMetadata?.infer?.neural?.[this.selectedCropModel.i]?.model;
				if (!request) return undefined;
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				if (typeof request === 'string') return new URL(request);
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				if ('url' in request) return new URL(request.url);
				return undefined;
			}
			case 'custom': {
				const network = tables.CustomNeuralNetwork.getFromState(this.selectedCropModel.id);
				if (!network) return undefined;
				if (network.source === 'remote') return network.url;
				return undefined;
			}
		}
	});

	/**
	 * @deprecated we dont have a single classification metadata anymore
	 */
	selectedClassificationModel: NeuralModelSelector = $derived.by(() => {
		const DISABLED = { kind: 'disabled' } as const;
		if (!this.currentProtocolId) return DISABLED;
		const metadataId = this.classificationMetadataId;
		if (!metadataId) return DISABLED;
		return this.currentSession?.neuralModels[metadataId] ?? DISABLED;
	});

	cropInferenceAvailable: boolean = $derived(
		this.cropModels.length > 0 && this.selectedCropModel.kind !== 'disabled'
	);
	classificationInferenceAvailable: boolean = $derived(
		this.enabledClassificationMetadata.length > 0
	);

	/**
	 * Set the selected model index for a classification metadata.
	 */
	async selectNeuralModel(metadataId: string, selector: NeuralModelSelector): Promise<void> {
		if (!this.currentSession) return;

		const current = $state.snapshot(this.currentSession.neuralModels);
		if (dequal(current[metadataId], selector)) return;

		await tables.Session.update(this.currentSession.id, 'neuralModels', {
			...current,
			[metadataId]: $state.snapshot(selector),
		});
	}

	classificationModelBySelector(selector: NeuralModelSelector, metadataId: NamespacedMetadataID) {
		switch (selector.kind) {
			case 'disabled':
				return undefined;
			case 'custom':
				return tables.CustomNeuralNetwork.getFromState(selector.id);
			case 'protocol': {
				const metadata = tables.Metadata.getFromState(metadataId);
				if (metadata?.type === 'enum') return metadata.infer?.neural?.[selector.i];
				return undefined;
			}
		}
	}

	classificationModelUrl(selector: NeuralModelSelector, metadataId: NamespacedMetadataID) {
		switch (selector.kind) {
			case 'disabled':
				return undefined;
			case 'custom': {
				const network = tables.CustomNeuralNetwork.getFromState(selector.id);
				if (network?.source === 'remote') return network.url;
				return undefined;
			}
			case 'protocol': {
				const metadata = tables.Metadata.getFromState(metadataId);
				if (!metadata) return;
				if (metadata.type !== 'enum') return;
				const settings = metadata.infer?.neural?.[selector.i];
				if (!settings?.model) return;

				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				if (typeof settings.model === 'string') return new URL(settings.model);
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				return new URL(settings.model.url);
			}
		}
	}

	/**
	 * Toggle selection of given id(s).
	 * Does nothing if setSelection is not defined
	 *
	 * When given multiple IDs, it'll add them all unless they are all already selected, in which case it'll remove them all.
	 */
	toggleSelection(...ids: string[]) {
		if (!this.setSelection) return;
		if (ids.length === 0) return;

		const allSelected = ids.every((id) => this.selection.includes(id));

		if (allSelected) {
			this.setSelection(this.selection.filter((id) => !ids.includes(id)));
		} else {
			this.setSelection([...this.selection, ...ids]);
		}
	}
}

export const uiState = new UIState();
