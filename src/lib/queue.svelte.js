import { classifyImage } from './classification.svelte';
import { countThing, errorMessage } from './i18n';
import { imageFileId } from './images';
import { inferBoundingBoxes, processImageFile } from './import.svelte';
import { importResultsZip } from './results.svelte';
import { uiState } from './state.svelte';
import { isZip, range } from './utils.js';

/**
 * @type {undefined | ProcessingQueue}
 */
let processingQueue;

/**
 * @typedef {object} ProcessingQueueTask
 * @property {object} [importing]
 * @property {File} importing.file
 * @property {string} importing.id
 * @property {object} [detection]
 * @property {string} detection.fileId
 * @property {object} [classification]
 * @property {string} classification.imageId
 */

class ProcessingQueue {
	/**
	 * @param {object} param0
	 * @param {import('swarpc').SwarpcClient<typeof import('$lib/../web-worker-procedures.js').PROCEDURES>} param0.swarpc
	 * @param {Map<string, import("swarpc").CancelablePromise["cancel"]>} [param0.cancellers]
	 * @param {number} [param0.parallelism]
	 */
	constructor({ swarpc, cancellers, parallelism = 1 }) {
		this.swarpc = swarpc;
		this.cancellers = cancellers;
		this.parallelism = parallelism;
		/**
		 * @type {ProcessingQueueTask[]}
		 */
		this.tasks = [];
		this.taskIds = new Set();

		this.abortController = new AbortController();

		$effect(() => {
			this.start().finally(() => this.logWarning(null, 'Processing queue mainloop exited'));
		});

		$effect(() => {
			this.log(null, 'Progress is', uiState.processing.done, '/', uiState.processing.total);
		});
	}

	async start() {
		this.log(
			null,
			'Starting processing queue mainloop with up to',
			countThing('concurrent task', this.parallelism)
		);
		while (true) {
			while (this.tasks.length > 0) {
				await new Promise((resolve, reject) => {
					this.abortController.signal.addEventListener('abort', () => {
						resolve(undefined);
					});

					Promise.allSettled(range(this.parallelism).map(async () => this.pop())).then(
						(results) => {
							if (results.some((r) => r.status === 'rejected')) {
								reject(results.filter((r) => r.status === 'rejected').map((r) => r.reason));
							} else {
								resolve(undefined);
							}

							// TODO do this granularly at each this.pop(),
							// without triggering race conditions.
							// Might require using an atomic int, but the int has
							// to be Svelte-reactive too? hmmm...
							uiState.processing.done += results.length;

							if (this.tasks.length === 0) {
								this.#drained();
							}
						}
					);
				});
			}

			// Once queue empty, busywait for new tasks with 100ms delay.
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	/**
	 * Log a message with a prefix.
	 * @param {string|null} id
	 * @param {string} message
	 * @param {...any} args
	 */
	log(id, message, ...args) {
		console.debug(`[ProcessingQueue] ${id ? id + ': ' : ''}${message}`, ...args);
	}

	/**
	 * Log a warning message with a prefix.
	 * @param {string|null} id
	 * @param {string} message
	 * @param {...any} args
	 */
	logWarning(id, message, ...args) {
		console.warn(`[ProcessingQueue] ${id ? id + ': ' : ''}${message}`, ...args);
	}

	/**
	 * To be called when queue is drained (when all tasks have been done)
	 */
	#drained() {
		this.log(null, 'Queue was drained');
		uiState.loadingImages.clear();
		uiState.queuedImages.clear();
		document.dispatchEvent(new CustomEvent('processing-queue-drained'));
		setTimeout(() => {
			uiState.processing.reset();
		}, 500);
	}

	/**
	 * Get ID of Image or ImageFile processed by the task.
	 * @param {ProcessingQueueTask} task
	 */
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

	/**
	 * @param {ProcessingQueueTask} task
	 */
	taskId(task) {
		// TODO for now, we only support one task per subject.
		return this.taskSubjectId(task);
	}

	/**
	 *
	 * @param {ProcessingQueueTask} task
	 */
	push(task) {
		const id = this.taskId(task);
		if (this.taskIds.has(id)) {
			this.logWarning(id, 'Task already in queue, skipping.', task);
			return;
		}

		this.log(id, 'push', task);

		this.tasks.push(task);
		this.taskIds.add(this.taskId(task));

		uiState.processing.total++;

		uiState.queuedImages.add(this.taskSubjectId(task));

		if (task.importing)
			uiState.processing.files.push({
				name: task.importing.file.name,
				id: task.importing.id,
				addedAt: new Date()
			});
	}

	/**
	 * Cancel a task in the processing queue.
	 * @param {string} taskSubjectId
	 * @param {string} reason
	 * @returns
	 */
	cancel(taskSubjectId, reason) {
		this.log(taskSubjectId, 'cancel', reason);

		this.abortController.abort(taskSubjectId);

		const cancel = this.cancellers?.get(taskSubjectId);

		cancel?.(reason);
		this.tasks = this.tasks.filter((t) => this.taskSubjectId(t) !== taskSubjectId);
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

		this.log(this.taskId(task), 'pop', $state.snapshot(task));

		this.taskIds.delete(this.taskId(task));

		uiState.queuedImages.delete(this.taskSubjectId(task));
		uiState.loadingImages.add(this.taskSubjectId(task));

		const { detection, classification, importing } = task;

		uiState.processing.task = importing ? 'import' : detection ? 'detection' : 'classification';

		try {
			if (importing) {
				const { file, id } = importing;
				if (isZip(file.type)) {
					await importResultsZip(file, id, uiState.currentProtocolId);
				} else {
					await processImageFile(file, id);
				}
			} else if (detection) {
				await inferBoundingBoxes(this.swarpc, this.cancellers, detection.fileId);
			} else if (classification) {
				await classifyImage(this.swarpc, classification.imageId, this.cancellers);
			}

			uiState.processing.removeFile(this.taskSubjectId(task));
		} catch (error) {
			uiState.erroredImages.set(this.taskSubjectId(task), errorMessage(error));
		} finally {
			uiState.loadingImages.delete(this.taskSubjectId(task));
		}
	}
}

/**
 * Initialize the processing queue. Must be called in a root $effect (during component initialization).
 * @param {object} arg0
 * @param {import('swarpc').SwarpcClient<typeof import('$lib/../web-worker-procedures.js').PROCEDURES>} arg0.swarpc
 * @param {Map<string, import("swarpc").CancelablePromise["cancel"]>} [arg0.cancellers]
 */
export function initializeProcessingQueue(arg0) {
	processingQueue ??= new ProcessingQueue({
		parallelism: Math.ceil(navigator.hardwareConcurrency / 2),
		...arg0
	});
}

/**
 * Cancel a task in the processing queue.
 * @param {string} subjectId
 * @param {string} reason
 * @throws {Error} if the processing queue is not initialized
 */
export function cancelTask(subjectId, reason) {
	assertQueueInitialized(processingQueue);

	processingQueue.cancel(subjectId, reason);
}

/**
 * Import new files and add them to the processing queue.
 * @param {File[]} files
 */
export function importMore(files) {
	assertQueueInitialized(processingQueue);

	for (const file of files) {
		processingQueue.push({ importing: { file, id: imageFileId() } });
	}
}

/**
 * Add detection tasks to the processing queue.
 * @param {string[]} fileIds
 */
export function detectMore(fileIds) {
	assertQueueInitialized(processingQueue);

	for (const fileId of fileIds) {
		processingQueue.push({ detection: { fileId } });
	}
}

/**
 * Add classification tasks to the processing queue.
 * @param  {string[]} imageIds
 */
export function classifyMore(imageIds) {
	assertQueueInitialized(processingQueue);

	for (const imageId of imageIds) {
		processingQueue.push({
			classification: { imageId }
		});
	}
}

/**
 *
 * @param {ProcessingQueue | undefined} queue
 * @returns {asserts queue is ProcessingQueue}
 */
function assertQueueInitialized(queue) {
	if (!queue)
		throw new Error('Processing queue not initialized. Call initializeProcessingQueue first.');
}
