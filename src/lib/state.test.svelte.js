import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it, test } from 'vitest';

import { _tablesState, nukeDatabase } from './idb.svelte.js';
import { UIState } from './state.svelte.js';
import { keys } from './utils.js';

beforeEach(() => {
	nukeDatabase();
	for (const key of keys(_tablesState)) {
		_tablesState[key] = [];
	}
	localStorage.clear();
});

describe('processing', () => {
	test('progress is 0 when total is 0', () => {
		const state = new UIState();
		expect(state.processing.progress).toBe(0);
	});

	test('progress is done/total', () => {
		const state = new UIState();
		state.processing.total = 10;
		state.processing.done = 4;
		expect(state.processing.progress).toBe(0.4);
	});

	test('progress is 1 when done equals total', () => {
		const state = new UIState();
		state.processing.total = 5;
		state.processing.done = 5;
		expect(state.processing.progress).toBe(1);
	});

	test('removeFile removes a file by id', () => {
		const state = new UIState();
		state.processing.files = [
			{ id: 'a', name: 'file-a.jpg', addedAt: new Date() },
			{ id: 'b', name: 'file-b.jpg', addedAt: new Date() },
			{ id: 'c', name: 'file-c.jpg', addedAt: new Date() },
		];
		state.processing.removeFile('b');
		expect(state.processing.files.map((f) => f.id)).toEqual(['a', 'c']);
	});

	test('removeFile does nothing if id not found', () => {
		const state = new UIState();
		state.processing.files = [{ id: 'a', name: 'file-a.jpg', addedAt: new Date() }];
		state.processing.removeFile('nonexistent');
		expect(state.processing.files).toHaveLength(1);
	});

	test('reset clears total, done, time, and task', () => {
		const state = new UIState();
		state.processing.total = 10;
		state.processing.done = 5;
		state.processing.time = 1234;
		state.processing.task = 'import';
		state.processing.reset();
		expect(state.processing.total).toBe(0);
		expect(state.processing.done).toBe(0);
		expect(state.processing.time).toBe(0);
		expect(state.processing.task).toBe('');
	});
});

describe('preview URLs', () => {
	test('hasPreviewURL returns false for null', () => {
		const state = new UIState();
		expect(state.hasPreviewURL(null)).toBe(false);
	});

	test('hasPreviewURL returns false for undefined', () => {
		const state = new UIState();
		expect(state.hasPreviewURL(undefined)).toBe(false);
	});

	test('hasPreviewURL returns false when no URL is set', () => {
		const state = new UIState();
		expect(state.hasPreviewURL('file-1')).toBe(false);
	});

	test('hasPreviewURL returns true after setPreviewURL', () => {
		const state = new UIState();
		state.setPreviewURL('file-1', 'blob:http://example.com/1');
		expect(state.hasPreviewURL('file-1')).toBe(true);
	});

	test('hasPreviewURL returns true for global URLs', () => {
		const state = new UIState();
		state.setPreviewURL('file-1', 'blob:http://example.com/1', true);
		expect(state.hasPreviewURL('file-1')).toBe(true);
	});

	test('getPreviewURL returns undefined for null', () => {
		const state = new UIState();
		expect(state.getPreviewURL(null)).toBeUndefined();
	});

	test('getPreviewURL returns undefined when not set', () => {
		const state = new UIState();
		expect(state.getPreviewURL('file-1')).toBeUndefined();
	});

	test('getPreviewURL returns the URL from previewURLs', () => {
		const state = new UIState();
		state.setPreviewURL('file-1', 'blob:http://example.com/1');
		expect(state.getPreviewURL('file-1')).toBe('blob:http://example.com/1');
	});

	test('getPreviewURL returns the URL from globalPreviewURLs', () => {
		const state = new UIState();
		state.setPreviewURL('file-1', 'blob:http://example.com/global', true);
		expect(state.getPreviewURL('file-1')).toBe('blob:http://example.com/global');
	});

	test('getPreviewURL prefers previewURLs over globalPreviewURLs', () => {
		const state = new UIState();
		state.setPreviewURL('file-1', 'blob:http://example.com/local');
		state.setPreviewURL('file-1', 'blob:http://example.com/global', true);
		expect(state.getPreviewURL('file-1')).toBe('blob:http://example.com/local');
	});

	test('setPreviewURL with global=false stores in previewURLs', () => {
		const state = new UIState();
		state.setPreviewURL('file-1', 'blob:http://example.com/1', false);
		expect(state.previewURLs.get('file-1')).toBe('blob:http://example.com/1');
		expect(state.globalPreviewURLs.has('file-1')).toBe(false);
	});

	test('setPreviewURL with global=true stores in globalPreviewURLs', () => {
		const state = new UIState();
		state.setPreviewURL('file-1', 'blob:http://example.com/1', true);
		expect(state.globalPreviewURLs.get('file-1')).toBe('blob:http://example.com/1');
		expect(state.previewURLs.has('file-1')).toBe(false);
	});

	test('setPreviewURL does nothing for null imageFileId', () => {
		const state = new UIState();
		state.setPreviewURL(null, 'blob:http://example.com/1');
		expect(state.previewURLs.size).toBe(0);
		expect(state.globalPreviewURLs.size).toBe(0);
	});

	test('revokePreviewURL removes from previewURLs', () => {
		const state = new UIState();
		state.setPreviewURL('file-1', 'blob:http://example.com/1');
		state.setPreviewURL('file-2', 'blob:http://example.com/2');
		state.revokePreviewURL('file-1');
		expect(state.previewURLs.has('file-1')).toBe(false);
		expect(state.previewURLs.has('file-2')).toBe(true);
	});

	test('revokePreviewURL also removes from globalPreviewURLs', () => {
		const state = new UIState();
		state.setPreviewURL('file-1', 'blob:http://example.com/1');
		state.setPreviewURL('file-1', 'blob:http://example.com/1-global', true);
		state.revokePreviewURL('file-1');
		expect(state.previewURLs.has('file-1')).toBe(false);
		expect(state.globalPreviewURLs.has('file-1')).toBe(false);
	});

	test('revokePreviewURL does nothing if URL not set', () => {
		const state = new UIState();
		expect(() => state.revokePreviewURL('nonexistent')).not.toThrow();
	});

	test('clearPreviewURLs removes all previewURLs', () => {
		const state = new UIState();
		state.setPreviewURL('file-1', 'blob:http://example.com/1');
		state.setPreviewURL('file-2', 'blob:http://example.com/2');
		state.clearPreviewURLs();
		expect(state.previewURLs.size).toBe(0);
	});
});

describe('toggleSelection', () => {
	it('does nothing when setSelection is undefined', () => {
		const state = new UIState();
		state.selection = ['a', 'b'];
		state.toggleSelection('c');
		expect(state.selection).toEqual(['a', 'b']);
	});

	it('does nothing when no ids are provided', () => {
		const state = new UIState();
		const selected = ['a', 'b'];
		state.selection = [...selected];
		state.setSelection = (s) => {
			state.selection = s;
		};
		state.toggleSelection();
		expect(state.selection).toEqual(selected);
	});

	it('adds ids not already in the selection', () => {
		const state = new UIState();
		state.selection = ['a'];
		state.setSelection = (s) => {
			state.selection = s;
		};
		state.toggleSelection('b', 'c');
		expect(state.selection).toContain('a');
		expect(state.selection).toContain('b');
		expect(state.selection).toContain('c');
	});

	it('removes all ids when all are already selected', () => {
		const state = new UIState();
		state.selection = ['a', 'b', 'c'];
		state.setSelection = (s) => {
			state.selection = s;
		};
		state.toggleSelection('a', 'b');
		expect(state.selection).not.toContain('a');
		expect(state.selection).not.toContain('b');
		expect(state.selection).toContain('c');
	});

	it('adds a single id when not in selection', () => {
		const state = new UIState();
		state.selection = ['a', 'b'];
		state.setSelection = (s) => {
			state.selection = s;
		};
		state.toggleSelection('c');
		expect(state.selection).toEqual(['a', 'b', 'c']);
	});

	it('removes a single id when already in selection', () => {
		const state = new UIState();
		state.selection = ['a', 'b'];
		state.setSelection = (s) => {
			state.selection = s;
		};
		state.toggleSelection('a');
		expect(state.selection).toEqual(['b']);
	});
});

describe('setCurrentSession', () => {
	test('stores session id in localStorage', async () => {
		const state = new UIState();
		await state.setCurrentSession('session-1');
		expect(localStorage.getItem('currentSessionId')).toBe('session-1');
	});

	test('removes session id from localStorage when null', async () => {
		const state = new UIState();
		localStorage.setItem('currentSessionId', 'session-1');
		await state.setCurrentSession(null);
		expect(localStorage.getItem('currentSessionId')).toBeNull();
	});

	test('updates _currentSessionId', async () => {
		const state = new UIState();
		await state.setCurrentSession('session-abc');
		expect(state._currentSessionId).toBe('session-abc');
	});
});

describe('currentSessionId derived state', () => {
	test('reads from _currentSessionId when set', () => {
		$effect.root(() => {
			const state = new UIState();
			state._currentSessionId = 'direct-id';
			expect(state.currentSessionId).toBe('direct-id');
		})();
	});

	test('falls back to localStorage when _currentSessionId is null', () => {
		$effect.root(() => {
			localStorage.setItem('currentSessionId', 'stored-id');
			const state = new UIState();
			state._currentSessionId = null;
			expect(state.currentSessionId).toBe('stored-id');
		})();
	});

	test('returns null when neither _currentSessionId nor localStorage is set', () => {
		$effect.root(() => {
			const state = new UIState();
			state._currentSessionId = null;
			expect(state.currentSessionId).toBeNull();
		})();
	});
});

describe('derived state from tables', () => {
	/** @type {import('./database.js').Session} */
	const session = {
		id: 'session-1',
		name: 'Test Session',
		description: '',
		protocol: 'com.example.proto',
		createdAt: new Date().toISOString(),
		openedAt: new Date().toISOString(),
		metadata: {},
		inferenceModels: {},
		remoteId: '',
		fullscreenClassifier: { layout: 'top-bottom' },
		sort: { global: { field: 'id', direction: 'asc' } },
		group: { global: { field: 'none' } },
	};

	/** @type {import('./database.js').Protocol} */
	const protocol = {
		id: 'com.example.proto',
		name: 'Test Protocol',
		description: 'A test protocol',
		metadata: ['com.example.proto__species', 'com.example.proto__crop'],
		sessionMetadata: [],
		importedMetadata: [],
		authors: [],
		metadataGroups: [],
		dirty: false,
		updates: 'manual',
		learnMore: 'https://example.com',
	};

	/** @type {import('./database.js').Metadata} */
	const speciesMetadata = {
		id: 'com.example.proto__species',
		type: 'enum',
		label: 'Species',
		description: '',
		mergeMethod: 'none',
		required: false,
		sortable: false,
		groupable: false,
		images: [],
		infer: {
			neural: [
				{
					model: { url: 'https://example.com/model.onnx' },
					input: { width: 224, height: 224, channels: 3 },
					classmapping: ['species-a', 'species-b'],
				},
			],
		},
	};

	/** @type {import('./database.js').Metadata} */
	const speciesMetadata2 = {
		id: 'com.example.proto__subspecies',
		type: 'enum',
		label: 'Subspecies',
		description: '',
		mergeMethod: 'none',
		required: false,
		sortable: false,
		groupable: false,
		images: [],
		infer: {
			neural: [
				{
					model: { url: 'https://example.com/subspecies-model.onnx' },
					input: { width: 224, height: 224, channels: 3 },
					classmapping: ['sub-a', 'sub-b'],
				},
			],
		},
	};

	/** @type {import('./database.js').Metadata} */
	const cropMetadata = {
		id: 'com.example.proto__crop',
		type: 'boundingbox',
		label: 'Crop',
		description: '',
		mergeMethod: 'none',
		required: false,
		sortable: false,
		groupable: false,
		images: [],
		infer: {
			neural: [
				{
					model: { url: 'https://example.com/crop-model.onnx' },
					input: { width: 640, height: 640, channels: 3 },
				},
			],
		},
	};

	test('currentSession returns the matching session', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.currentSession).toEqual(session);
		})();
	});

	test('currentSession returns undefined when no matching session', () => {
		$effect.root(() => {
			_tablesState.Session = [];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.currentSession).toBeUndefined();
		})();
	});

	test('currentProtocol returns the matching protocol', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			_tablesState.Protocol = [protocol];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.currentProtocol).toEqual(protocol);
		})();
	});

	test('currentProtocol returns undefined when session has no matching protocol', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			_tablesState.Protocol = [];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.currentProtocol).toBeUndefined();
		})();
	});

	test('classificationModels returns neural models from classificationMetadata', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.classificationModels).toHaveLength(1);
			expect(state.classificationModels[0].classmapping).toEqual(['species-a', 'species-b']);
		})();
	});

	test('classificationModels returns empty array when no protocol', () => {
		$effect.root(() => {
			_tablesState.Session = [];
			_tablesState.Protocol = [];
			const state = new UIState();
			expect(state.classificationModels).toEqual([]);
		})();
	});

	test('cropModels returns neural models from cropMetadata', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.cropModels).toHaveLength(1);
		})();
	});

	test('cropModels returns empty array when no crop metadata with neural inference', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.cropModels).toEqual([]);
		})();
	});

	test('allClassificationMetadata returns all enum metadata with neural inference in protocol', () => {
		$effect.root(() => {
			const extendedProtocol = {
				...protocol,
				metadata: [
					'com.example.proto__species',
					'com.example.proto__subspecies',
					'com.example.proto__crop',
				],
			};
			_tablesState.Session = [{ ...session, protocol: extendedProtocol.id }];
			_tablesState.Protocol = [extendedProtocol];
			_tablesState.Metadata = [speciesMetadata, speciesMetadata2, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.allClassificationMetadata).toHaveLength(2);
			expect(state.allClassificationMetadata.map((m) => m.id)).toContain(
				'com.example.proto__species'
			);
			expect(state.allClassificationMetadata.map((m) => m.id)).toContain(
				'com.example.proto__subspecies'
			);
		})();
	});

	test('allClassificationModels maps metadata IDs to their neural models', () => {
		$effect.root(() => {
			const extendedProtocol = {
				...protocol,
				metadata: [
					'com.example.proto__species',
					'com.example.proto__subspecies',
					'com.example.proto__crop',
				],
			};
			_tablesState.Session = [{ ...session, protocol: extendedProtocol.id }];
			_tablesState.Protocol = [extendedProtocol];
			_tablesState.Metadata = [speciesMetadata, speciesMetadata2, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(Object.keys(state.allClassificationModels)).toContain(
				'com.example.proto__species'
			);
			expect(Object.keys(state.allClassificationModels)).toContain(
				'com.example.proto__subspecies'
			);
			expect(state.allClassificationModels['com.example.proto__species']).toHaveLength(1);
		})();
	});

	test('selectedClassificationModels defaults to 0 when not set in inferenceModels', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.selectedClassificationModels['com.example.proto__species']).toBe(0);
		})();
	});

	test('selectedClassificationModels uses inferenceModels from session', () => {
		$effect.root(() => {
			_tablesState.Session = [
				{ ...session, inferenceModels: { 'com.example.proto__species': 1 } },
			];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.selectedClassificationModels['com.example.proto__species']).toBe(1);
		})();
	});

	test('enabledClassificationMetadata excludes metadata with inferenceModels set to -1', () => {
		$effect.root(() => {
			const extendedProtocol = {
				...protocol,
				metadata: [
					'com.example.proto__species',
					'com.example.proto__subspecies',
					'com.example.proto__crop',
				],
			};
			_tablesState.Session = [
				{
					...session,
					protocol: extendedProtocol.id,
					inferenceModels: { 'com.example.proto__species': -1 },
				},
			];
			_tablesState.Protocol = [extendedProtocol];
			_tablesState.Metadata = [speciesMetadata, speciesMetadata2, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.enabledClassificationMetadata.map((m) => m.id)).not.toContain(
				'com.example.proto__species'
			);
			expect(state.enabledClassificationMetadata.map((m) => m.id)).toContain(
				'com.example.proto__subspecies'
			);
		})();
	});

	test('cropInferenceAvailable is true when crop models exist and not disabled', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.cropInferenceAvailable).toBe(true);
		})();
	});

	test('cropInferenceAvailable is false when selectedCropModel is -1', () => {
		$effect.root(() => {
			_tablesState.Session = [
				{ ...session, inferenceModels: { 'com.example.proto__crop': -1 } },
			];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.cropInferenceAvailable).toBe(false);
		})();
	});

	test('cropInferenceAvailable is false when no crop models', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.cropInferenceAvailable).toBe(false);
		})();
	});

	test('classificationInferenceAvailable is true when enabled classification metadata exist', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.classificationInferenceAvailable).toBe(true);
		})();
	});

	test('classificationInferenceAvailable is false when all classification metadata are disabled', () => {
		$effect.root(() => {
			_tablesState.Session = [
				{ ...session, inferenceModels: { 'com.example.proto__species': -1 } },
			];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.classificationInferenceAvailable).toBe(false);
		})();
	});

	test('selectedCropModel defaults to 0 when not set in inferenceModels', () => {
		$effect.root(() => {
			_tablesState.Session = [session];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [speciesMetadata, cropMetadata];
			const state = new UIState();
			state._currentSessionId = 'session-1';
			expect(state.selectedCropModel).toBe(0);
		})();
	});

	test('selectedCropModel is -1 when no current protocol', () => {
		$effect.root(() => {
			const state = new UIState();
			expect(state.selectedCropModel).toBe(-1);
		})();
	});
});

describe('cropMetadataValueOf', () => {
	test('returns undefined when image has no matching metadata', () => {
		const state = new UIState();
		const image = {
			id: 'img-1',
			metadata: {},
		};
		// @ts-ignore
		expect(state.cropMetadataValueOf(image)).toBeUndefined();
	});

	test('returns the metadata value when present', () => {
		$effect.root(() => {
			/** @type {import('./database.js').Protocol} */
			const protocol = {
				id: 'com.example.proto',
				name: 'Test',
				description: '',
				metadata: ['com.example.proto__crop'],
				sessionMetadata: [],
				importedMetadata: [],
				authors: [],
				metadataGroups: [],
				dirty: false,
				updates: 'manual',
				learnMore: 'https://example.com',
			};
			/** @type {import('./database.js').Metadata} */
			const cropMeta = {
				id: 'com.example.proto__crop',
				type: 'boundingbox',
				label: 'Crop',
				description: '',
				mergeMethod: 'none',
				required: false,
				sortable: false,
				groupable: false,
				images: [],
				infer: { neural: [] },
			};
			_tablesState.Session = [
				{
					id: 'session-1',
					name: 'Test',
					description: '',
					protocol: 'com.example.proto',
					createdAt: new Date().toISOString(),
					openedAt: new Date().toISOString(),
					metadata: {},
					inferenceModels: {},
					remoteId: '',
					fullscreenClassifier: { layout: 'top-bottom' },
					sort: { global: { field: 'id', direction: 'asc' } },
					group: { global: { field: 'none' } },
				},
			];
			_tablesState.Protocol = [protocol];
			_tablesState.Metadata = [cropMeta];
			const state = new UIState();
			state._currentSessionId = 'session-1';

			const bbox = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
			const image = {
				id: 'img-1',
				metadata: {
					'com.example.proto__crop': {
						value: bbox,
						confidence: 0.9,
						confirmed: false,
						manuallyModified: false,
						isDefault: false,
						alternatives: {},
					},
				},
			};
			// @ts-ignore
			const result = state.cropMetadataValueOf(image);
			expect(result?.value).toEqual(bbox);
		})();
	});
});
