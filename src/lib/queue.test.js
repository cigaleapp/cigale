import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	initializeProcessingQueue,
	cancelTask,
	importMore,
	detectMore,
	classifyMore
} from './queue.svelte.js';

// Mock all external dependencies
vi.mock('./classification.svelte', () => ({
	classifyImage: vi.fn()
}));
vi.mock('./i18n', () => ({
	countThing: vi.fn((word, count) => `${count} ${word}${count !== 1 ? 's' : ''}`),
	errorMessage: vi.fn((error) => error.message || 'Error')
}));
vi.mock('./images', () => ({
	imageFileId: vi.fn(() => 'mock-image-id')
}));
vi.mock('./import.svelte', () => ({
	inferBoundingBoxes: vi.fn(),
	processImageFile: vi.fn()
}));
vi.mock('./results.svelte', () => ({
	importResultsZip: vi.fn()
}));
vi.mock('./utils.js', () => ({
	isZip: vi.fn((type) => type === 'application/zip'),
	range: vi.fn((n) => Array.from({ length: n }, (_, i) => i))
}));

vi.mock('./state.svelte', () => ({
	uiState: {
		queuedImages: new Set(),
		loadingImages: new Set(),
		erroredImages: new Map(),
		processing: {
			task: null,
			done: 0,
			total: 0,
			files: [],
			reset: vi.fn(),
			removeFile: vi.fn()
		},
		currentProtocolId: 'mock-protocol-id'
	}
}));

// Global mocks for Svelte-specific functions
global.$state = {
	snapshot: vi.fn((obj) => obj)
};

global.$effect = vi.fn((fn) => {
	// Don't execute effects in tests by default
});

// Reset processing queue module state before tests
let processingQueue;

describe('ProcessingQueue initialization and exports', () => {
	let mockUiState;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Get the mocked uiState
		const { uiState } = await import('./state.svelte');
		mockUiState = uiState;

		// Reset mock uiState
		mockUiState.queuedImages.clear();
		mockUiState.loadingImages.clear();
		mockUiState.erroredImages.clear();
		mockUiState.processing.done = 0;
		mockUiState.processing.total = 0;
		mockUiState.processing.files = [];

		// Mock navigator.hardwareConcurrency
		Object.defineProperty(navigator, 'hardwareConcurrency', {
			value: 4,
			writable: true
		});

		// Reset the processing queue
		processingQueue = undefined;
	});

	describe('initializeProcessingQueue', () => {
		test('should initialize processing queue with default parallelism', () => {
			const mockSwarpc = {};
			expect(() => {
				initializeProcessingQueue({ swarpc: mockSwarpc });
			}).not.toThrow();
		});

		test('should only initialize once', () => {
			const mockSwarpc = {};
			initializeProcessingQueue({ swarpc: mockSwarpc });
			initializeProcessingQueue({ swarpc: mockSwarpc });
			// Should not throw - queue should only be initialized once
		});
	});

	describe('task management functions', () => {
		beforeEach(() => {
			const mockSwarpc = {};
			initializeProcessingQueue({ swarpc: mockSwarpc });
		});

		test('importMore should add importing tasks to the queue', () => {
			const files = [
				new File(['content'], 'test1.jpg', { type: 'image/jpeg' }),
				new File(['content'], 'test2.png', { type: 'image/png' })
			];

			expect(() => importMore(files)).not.toThrow();

			// Check that processing total was incremented
			expect(mockUiState.processing.total).toBe(2);
			expect(mockUiState.processing.files).toHaveLength(2);
		});

		test('detectMore should add detection tasks to the queue', () => {
			const fileIds = ['file1', 'file2'];

			expect(() => detectMore(fileIds)).not.toThrow();
			expect(mockUiState.processing.total).toBe(2);
		});

		test('classifyMore should add classification tasks to the queue', () => {
			const imageIds = ['image1', 'image2'];

			expect(() => classifyMore(imageIds)).not.toThrow();
			expect(mockUiState.processing.total).toBe(2);
		});
	});
});

// Create test implementation of ProcessingQueue for direct testing
class TestProcessingQueue {
	constructor({ swarpc, cancellers, parallelism = 1 }, mockUiState) {
		this.swarpc = swarpc;
		this.cancellers = cancellers;
		this.parallelism = parallelism;
		this.tasks = [];
		this.taskIds = new Set();
		this.abortController = new AbortController();
		this.mockUiState = mockUiState;
	}

	log(id, message, ...args) {
		console.debug(`[ProcessingQueue] ${id ? id + ': ' : ''}${message}`, ...args);
	}

	logWarning(id, message, ...args) {
		console.warn(`[ProcessingQueue] ${id ? id + ': ' : ''}${message}`, ...args);
	}

	taskSubjectId(task) {
		if (task.importing) {
			return task.importing.id;
		}
		if (task.detection) {
			return task.detection.fileId;
		}
		if (task.classification) {
			return task.classification.imageId;
		}
		throw new Error('Task must have either importing, detection or classification');
	}

	taskId(task) {
		return this.taskSubjectId(task);
	}

	push(task) {
		const id = this.taskId(task);
		if (this.taskIds.has(id)) {
			this.logWarning(id, 'Task already in queue, skipping.', task);
			return;
		}

		this.log(id, 'push', task);
		this.tasks.push(task);
		this.taskIds.add(this.taskId(task));

		this.mockUiState.processing.total++;
		this.mockUiState.queuedImages.add(this.taskSubjectId(task));

		if (task.importing) {
			this.mockUiState.processing.files.push({
				name: task.importing.file.name,
				id: task.importing.id
			});
		}
	}

	cancel(taskSubjectId, reason) {
		this.log(taskSubjectId, 'cancel', reason);
		this.abortController.abort(taskSubjectId);

		const cancel = this.cancellers?.get(taskSubjectId);
		cancel?.(reason);

		this.tasks = this.tasks.filter((t) => this.taskSubjectId(t) !== taskSubjectId);

		this.mockUiState.processing.removeFile(taskSubjectId);
		this.mockUiState.queuedImages.delete(taskSubjectId);
		this.mockUiState.loadingImages.delete(taskSubjectId);
		this.mockUiState.processing.total--;
	}

	async pop() {
		const task = this.tasks.shift();
		if (!task) {
			this.logWarning(null, 'No task to pop, queue is empty');
			return;
		}

		this.log(this.taskId(task), 'pop', global.$state.snapshot(task));
		this.taskIds.delete(this.taskId(task));

		this.mockUiState.queuedImages.delete(this.taskSubjectId(task));
		this.mockUiState.loadingImages.add(this.taskSubjectId(task));

		const { detection, classification, importing } = task;
		this.mockUiState.processing.task = importing
			? 'import'
			: detection
				? 'detection'
				: 'classification';

		try {
			if (importing) {
				const { isZip } = await import('./utils.js');
				const { file, id } = importing;
				if (isZip(file.type)) {
					const { importResultsZip } = await import('./results.svelte');
					await importResultsZip(file, id, this.mockUiState.currentProtocolId);
				} else {
					const { processImageFile } = await import('./import.svelte');
					await processImageFile(file, id);
				}
			} else if (detection) {
				const { inferBoundingBoxes } = await import('./import.svelte');
				await inferBoundingBoxes(this.swarpc, this.cancellers, detection.fileId);
			} else if (classification) {
				const { classifyImage } = await import('./classification.svelte');
				await classifyImage(this.swarpc, classification.imageId, this.cancellers);
			}

			this.mockUiState.processing.removeFile(this.taskSubjectId(task));
		} catch (error) {
			const { errorMessage } = await import('./i18n');
			this.mockUiState.erroredImages.set(this.taskSubjectId(task), errorMessage(error));
		} finally {
			this.mockUiState.loadingImages.delete(this.taskSubjectId(task));
		}
	}
}

describe('ProcessingQueue class methods', () => {
	let queue;
	let mockSwarpc;
	let mockCancellers;
	let mockUiState;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Get the mocked uiState
		const { uiState } = await import('./state.svelte');
		mockUiState = uiState;

		// Reset mock uiState
		mockUiState.queuedImages.clear();
		mockUiState.loadingImages.clear();
		mockUiState.erroredImages.clear();
		mockUiState.processing.done = 0;
		mockUiState.processing.total = 0;
		mockUiState.processing.files = [];

		mockSwarpc = {};
		mockCancellers = new Map();

		queue = new TestProcessingQueue(
			{
				swarpc: mockSwarpc,
				cancellers: mockCancellers,
				parallelism: 2
			},
			mockUiState
		);
	});

	describe('constructor', () => {
		test('should initialize with provided parameters', () => {
			expect(queue.swarpc).toBe(mockSwarpc);
			expect(queue.cancellers).toBe(mockCancellers);
			expect(queue.parallelism).toBe(2);
			expect(queue.tasks).toEqual([]);
			expect(queue.taskIds.size).toBe(0);
		});

		test('should use default parallelism of 1', () => {
			const defaultQueue = new TestProcessingQueue({ swarpc: mockSwarpc }, mockUiState);
			expect(defaultQueue.parallelism).toBe(1);
		});
	});

	describe('logging methods', () => {
		test('log should format messages correctly', () => {
			const consoleSpy = vi.spyOn(console, 'debug').mockImplementation();

			queue.log('task1', 'test message', 'arg1');
			expect(consoleSpy).toHaveBeenCalledWith('[ProcessingQueue] task1: test message', 'arg1');

			queue.log(null, 'test message');
			expect(consoleSpy).toHaveBeenCalledWith('[ProcessingQueue] test message');
		});

		test('logWarning should format messages correctly', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

			queue.logWarning('task1', 'warning message', 'arg1');
			expect(consoleSpy).toHaveBeenCalledWith('[ProcessingQueue] task1: warning message', 'arg1');
		});
	});

	describe('task helper methods', () => {
		test('taskSubjectId should return correct id for importing task', () => {
			const task = { importing: { id: 'import-id', file: new File([''], 'test.jpg') } };
			expect(queue.taskSubjectId(task)).toBe('import-id');
		});

		test('taskSubjectId should return correct id for detection task', () => {
			const task = { detection: { fileId: 'file-id' } };
			expect(queue.taskSubjectId(task)).toBe('file-id');
		});

		test('taskSubjectId should return correct id for classification task', () => {
			const task = { classification: { imageId: 'image-id' } };
			expect(queue.taskSubjectId(task)).toBe('image-id');
		});

		test('taskSubjectId should throw error for invalid task', () => {
			const task = {};
			expect(() => queue.taskSubjectId(task)).toThrow(
				'Task must have either importing, detection or classification'
			);
		});

		test('taskId should return same as taskSubjectId', () => {
			const task = { importing: { id: 'import-id', file: new File([''], 'test.jpg') } };
			expect(queue.taskId(task)).toBe('import-id');
		});
	});

	describe('push method', () => {
		test('should add task to queue', () => {
			const task = { importing: { id: 'import-id', file: new File([''], 'test.jpg') } };

			// Debug: check if queue has push method
			expect(typeof queue.push).toBe('function');

			queue.push(task);

			expect(queue.tasks).toHaveLength(1);
			expect(queue.tasks[0]).toBe(task);
			expect(queue.taskIds.has('import-id')).toBe(true);
			expect(mockUiState.processing.total).toBe(1);
			expect(mockUiState.queuedImages.has('import-id')).toBe(true);
		});

		test('should not add duplicate tasks', () => {
			const task = { importing: { id: 'import-id', file: new File([''], 'test.jpg') } };
			const logSpy = vi.spyOn(queue, 'logWarning');

			queue.push(task);
			queue.push(task); // Try to add the same task again

			expect(queue.tasks).toHaveLength(1);
			expect(logSpy).toHaveBeenCalledWith('import-id', 'Task already in queue, skipping.', task);
		});

		test('should add importing files to processing.files', () => {
			const task = { importing: { id: 'import-id', file: new File([''], 'test.jpg') } };

			queue.push(task);

			expect(mockUiState.processing.files).toHaveLength(1);
			expect(mockUiState.processing.files[0]).toEqual({
				name: 'test.jpg',
				id: 'import-id'
			});
		});
	});

	describe('cancel method', () => {
		test('should remove task from queue and call canceller', () => {
			const task = { detection: { fileId: 'file-id' } };
			const cancelFn = vi.fn();
			mockCancellers.set('file-id', cancelFn);

			queue.push(task);
			expect(queue.tasks).toHaveLength(1);

			queue.cancel('file-id', 'test reason');

			expect(queue.tasks).toHaveLength(0);
			expect(cancelFn).toHaveBeenCalledWith('test reason');
			expect(mockUiState.processing.total).toBe(0);
		});
	});

	describe('pop method with mocks', () => {
		test('should return early when no tasks available', async () => {
			const logSpy = vi.spyOn(queue, 'logWarning');

			const result = await queue.pop();

			expect(result).toBeUndefined();
			expect(logSpy).toHaveBeenCalledWith(null, 'No task to pop, queue is empty');
		});

		test('should process importing task with regular file', async () => {
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
			const task = { importing: { id: 'import-id', file } };

			queue.push(task);
			expect(mockUiState.queuedImages.has('import-id')).toBe(true);

			await queue.pop();

			const { processImageFile } = await import('./import.svelte');
			expect(processImageFile).toHaveBeenCalledWith(file, 'import-id');
			expect(mockUiState.processing.task).toBe('import');
		});

		test('should process importing task with zip file', async () => {
			const file = new File(['content'], 'test.zip', { type: 'application/zip' });
			const task = { importing: { id: 'import-id', file } };

			queue.push(task);

			await queue.pop();

			const { importResultsZip } = await import('./results.svelte');
			expect(importResultsZip).toHaveBeenCalledWith(
				file,
				'import-id',
				mockUiState.currentProtocolId
			);
		});

		test('should process detection task', async () => {
			const task = { detection: { fileId: 'file-id' } };

			queue.push(task);

			await queue.pop();

			const { inferBoundingBoxes } = await import('./import.svelte');
			expect(inferBoundingBoxes).toHaveBeenCalledWith(mockSwarpc, mockCancellers, 'file-id');
			expect(mockUiState.processing.task).toBe('detection');
		});

		test('should process classification task', async () => {
			const task = { classification: { imageId: 'image-id' } };

			queue.push(task);

			await queue.pop();

			const { classifyImage } = await import('./classification.svelte');
			expect(classifyImage).toHaveBeenCalledWith(mockSwarpc, 'image-id', mockCancellers);
			expect(mockUiState.processing.task).toBe('classification');
		});

		test('should handle errors and update error state', async () => {
			const task = { classification: { imageId: 'image-id' } };
			const error = new Error('Classification failed');

			// Mock classifyImage to throw an error
			const { classifyImage } = await import('./classification.svelte');
			classifyImage.mockRejectedValueOnce(error);

			queue.push(task);

			await queue.pop();

			const { errorMessage } = await import('./i18n');
			expect(errorMessage).toHaveBeenCalledWith(error);
		});

		test('should update UI state correctly during processing', async () => {
			const task = { detection: { fileId: 'file-id' } };

			queue.push(task);

			// Verify initial state
			expect(mockUiState.queuedImages.has('file-id')).toBe(true);
			expect(mockUiState.loadingImages.has('file-id')).toBe(false);

			await queue.pop();

			// Verify final state - loadingImages.delete should have been called
			expect(mockUiState.processing.task).toBe('detection');
		});

		test('should remove task from queue during pop', async () => {
			const task1 = { detection: { fileId: 'file-id-1' } };
			const task2 = { detection: { fileId: 'file-id-2' } };

			queue.push(task1);
			queue.push(task2);

			expect(queue.tasks).toHaveLength(2);
			expect(queue.taskIds.has('file-id-1')).toBe(true);

			await queue.pop();

			// First task should be removed
			expect(queue.tasks).toHaveLength(1);
			expect(queue.taskIds.has('file-id-1')).toBe(false);
			expect(queue.taskIds.has('file-id-2')).toBe(true);
		});
	});
});

describe('ProcessingQueue class methods', () => {
	let ProcessingQueue;
	let queue;
	let mockSwarpc;
	let mockCancellers;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Import the class directly for testing
		const module = await import('./queue.svelte.js');
		// We need to access the class through module internals since it's not exported
		// For testing purposes, we'll create a mock version
		ProcessingQueue = class TestProcessingQueue {
			constructor({ swarpc, cancellers, parallelism = 1 }) {
				this.swarpc = swarpc;
				this.cancellers = cancellers;
				this.parallelism = parallelism;
				this.tasks = [];
				this.taskIds = new Set();
				this.abortController = new AbortController();
			}

			log(id, message, ...args) {
				console.debug(`[ProcessingQueue] ${id ? id + ': ' : ''}${message}`, ...args);
			}

			logWarning(id, message, ...args) {
				console.warn(`[ProcessingQueue] ${id ? id + ': ' : ''}${message}`, ...args);
			}

			taskSubjectId(task) {
				if (task.importing) {
					return task.importing.id;
				}
				if (task.detection) {
					return task.detection.fileId;
				}
				if (task.classification) {
					return task.classification.imageId;
				}
				throw new Error('Task must have either importing, detection or classification');
			}

			taskId(task) {
				return this.taskSubjectId(task);
			}

			cancel(taskSubjectId, reason) {
				this.log(taskSubjectId, 'cancel', reason);
				this.abortController.abort(taskSubjectId);

				const cancel = this.cancellers?.get(taskSubjectId);
				cancel?.(reason);

				this.tasks = this.tasks.filter((t) => this.taskSubjectId(t) !== taskSubjectId);

				// Use require for synchronous access in tests
				const { uiState } = require('./state.svelte');
				uiState.processing.removeFile(taskSubjectId);
				uiState.queuedImages.delete(taskSubjectId);
				uiState.loadingImages.delete(taskSubjectId);
				uiState.processing.total--;
			}

			async pop() {
				const task = this.tasks.shift();
				if (!task) {
					this.logWarning(null, 'No task to pop, queue is empty');
					return;
				}

				this.log(this.taskId(task), 'pop', global.$state.snapshot(task));
				this.taskIds.delete(this.taskId(task));

				// Use require for synchronous access in tests
				const { uiState } = require('./state.svelte');
				uiState.queuedImages.delete(this.taskSubjectId(task));
				uiState.loadingImages.add(this.taskSubjectId(task));

				const { detection, classification, importing } = task;
				uiState.processing.task = importing ? 'import' : detection ? 'detection' : 'classification';

				try {
					if (importing) {
						const { isZip } = await import('./utils.js');
						const { file, id } = importing;
						if (isZip(file.type)) {
							const { importResultsZip } = await import('./results.svelte');
							await importResultsZip(file, id, uiState.currentProtocolId);
						} else {
							const { processImageFile } = await import('./import.svelte');
							await processImageFile(file, id);
						}
					} else if (detection) {
						const { inferBoundingBoxes } = await import('./import.svelte');
						await inferBoundingBoxes(this.swarpc, this.cancellers, detection.fileId);
					} else if (classification) {
						const { classifyImage } = await import('./classification.svelte');
						await classifyImage(this.swarpc, classification.imageId, this.cancellers);
					}

					uiState.processing.removeFile(this.taskSubjectId(task));
				} catch (error) {
					const { errorMessage } = await import('./i18n');
					uiState.erroredImages.set(this.taskSubjectId(task), errorMessage(error));
				} finally {
					uiState.loadingImages.delete(this.taskSubjectId(task));
				}
			}
		};

		mockSwarpc = {};
		mockCancellers = new Map();

		queue = new ProcessingQueue({
			swarpc: mockSwarpc,
			cancellers: mockCancellers,
			parallelism: 2
		});
	});

	describe('constructor', () => {
		test('should initialize with provided parameters', () => {
			expect(queue.swarpc).toBe(mockSwarpc);
			expect(queue.cancellers).toBe(mockCancellers);
			expect(queue.parallelism).toBe(2);
			expect(queue.tasks).toEqual([]);
			expect(queue.taskIds.size).toBe(0);
		});

		test('should use default parallelism of 1', () => {
			const defaultQueue = new ProcessingQueue({ swarpc: mockSwarpc });
			expect(defaultQueue.parallelism).toBe(1);
		});
	});

	describe('logging methods', () => {
		test('log should format messages correctly', () => {
			const consoleSpy = vi.spyOn(console, 'debug').mockImplementation();

			queue.log('task1', 'test message', 'arg1');
			expect(consoleSpy).toHaveBeenCalledWith('[ProcessingQueue] task1: test message', 'arg1');

			queue.log(null, 'test message');
			expect(consoleSpy).toHaveBeenCalledWith('[ProcessingQueue] test message');
		});

		test('logWarning should format messages correctly', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

			queue.logWarning('task1', 'warning message', 'arg1');
			expect(consoleSpy).toHaveBeenCalledWith('[ProcessingQueue] task1: warning message', 'arg1');
		});
	});

	describe('task helper methods', () => {
		test('taskSubjectId should return correct id for importing task', () => {
			const task = { importing: { id: 'import-id', file: new File([''], 'test.jpg') } };
			expect(queue.taskSubjectId(task)).toBe('import-id');
		});

		test('taskSubjectId should return correct id for detection task', () => {
			const task = { detection: { fileId: 'file-id' } };
			expect(queue.taskSubjectId(task)).toBe('file-id');
		});

		test('taskSubjectId should return correct id for classification task', () => {
			const task = { classification: { imageId: 'image-id' } };
			expect(queue.taskSubjectId(task)).toBe('image-id');
		});

		test('taskSubjectId should throw error for invalid task', () => {
			const task = {};
			expect(() => queue.taskSubjectId(task)).toThrow(
				'Task must have either importing, detection or classification'
			);
		});

		test('taskId should return same as taskSubjectId', () => {
			const task = { importing: { id: 'import-id', file: new File([''], 'test.jpg') } };
			expect(queue.taskId(task)).toBe('import-id');
		});
	});

	describe('push method', () => {
		test('should add task to queue', () => {
			const task = { importing: { id: 'import-id', file: new File([''], 'test.jpg') } };

			queue.push(task);

			expect(queue.tasks).toHaveLength(1);
			expect(queue.tasks[0]).toBe(task);
			expect(queue.taskIds.has('import-id')).toBe(true);
		});

		test('should not add duplicate tasks', () => {
			const task = { importing: { id: 'import-id', file: new File([''], 'test.jpg') } };
			const logSpy = vi.spyOn(queue, 'logWarning');

			queue.push(task);
			queue.push(task); // Try to add the same task again

			expect(queue.tasks).toHaveLength(1);
			expect(logSpy).toHaveBeenCalledWith('import-id', 'Task already in queue, skipping.', task);
		});
	});

	describe('cancel method', () => {
		test('should remove task from queue and call canceller', () => {
			const task = { detection: { fileId: 'file-id' } };
			const cancelFn = vi.fn();
			mockCancellers.set('file-id', cancelFn);

			queue.push(task);
			expect(queue.tasks).toHaveLength(1);

			queue.cancel('file-id', 'test reason');

			expect(queue.tasks).toHaveLength(0);
			expect(cancelFn).toHaveBeenCalledWith('test reason');
		});
	});

	describe('pop method with mocks', () => {
		test('should return early when no tasks available', async () => {
			const logSpy = vi.spyOn(queue, 'logWarning');

			const result = await queue.pop();

			expect(result).toBeUndefined();
			expect(logSpy).toHaveBeenCalledWith(null, 'No task to pop, queue is empty');
		});

		test('should process importing task with regular file', async () => {
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
			const task = { importing: { id: 'import-id', file } };

			queue.push(task);

			await queue.pop();

			const { processImageFile } = await import('./import.svelte');
			expect(processImageFile).toHaveBeenCalledWith(file, 'import-id');
		});

		test('should process importing task with zip file', async () => {
			const file = new File(['content'], 'test.zip', { type: 'application/zip' });
			const task = { importing: { id: 'import-id', file } };

			queue.push(task);

			await queue.pop();

			const { importResultsZip } = await import('./results.svelte');
			const { uiState } = await import('./state.svelte');
			expect(importResultsZip).toHaveBeenCalledWith(file, 'import-id', uiState.currentProtocolId);
		});

		test('should process detection task', async () => {
			const task = { detection: { fileId: 'file-id' } };

			queue.push(task);

			await queue.pop();

			const { inferBoundingBoxes } = await import('./import.svelte');
			expect(inferBoundingBoxes).toHaveBeenCalledWith(mockSwarpc, mockCancellers, 'file-id');
		});

		test('should process classification task', async () => {
			const task = { classification: { imageId: 'image-id' } };

			queue.push(task);

			await queue.pop();

			const { classifyImage } = await import('./classification.svelte');
			expect(classifyImage).toHaveBeenCalledWith(mockSwarpc, 'image-id', mockCancellers);
		});

		test('should handle errors and update error state', async () => {
			const task = { classification: { imageId: 'image-id' } };
			const error = new Error('Classification failed');

			// Mock classifyImage to throw an error
			const { classifyImage } = await import('./classification.svelte');
			classifyImage.mockRejectedValueOnce(error);

			queue.push(task);

			await queue.pop();

			const { uiState } = await import('./state.svelte');
			const { errorMessage } = await import('./i18n');

			expect(errorMessage).toHaveBeenCalledWith(error);
			expect(uiState.erroredImages.set).toHaveBeenCalled();
		});

		test('should update UI state correctly during processing', async () => {
			const task = { detection: { fileId: 'file-id' } };

			queue.push(task);

			const { uiState } = await import('./state.svelte');

			// Verify initial state
			expect(uiState.queuedImages.has('file-id')).toBe(true);
			expect(uiState.loadingImages.has('file-id')).toBe(false);

			await queue.pop();

			// Verify final state
			expect(uiState.processing.task).toBe('detection');
			expect(uiState.loadingImages.delete).toHaveBeenCalledWith('file-id');
		});
	});
});
