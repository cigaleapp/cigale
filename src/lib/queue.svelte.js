import { classifyImage } from './classification.svelte';
import { errorMessage } from './i18n';
import { imageFileId } from './images';
import { inferBoundingBoxes, processImageFile } from './import.svelte';
import { importResultsZip } from './results.svelte';
import { uiState } from './state.svelte';
import { isZip } from './utils';

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
	 * @param {import('swarpc').SwarpcClient<typeof import('$lib/../web-worker-procedures.js').PROCEDURES>} swarpc
	 * @param {Map<string, import("swarpc").CancelablePromise["cancel"]>} [cancellers]
	 */
	constructor(swarpc, cancellers) {
		this.swarpc = swarpc;
		this.cancellers = cancellers;
		/**
		 * @type {ProcessingQueueTask[]}
		 */
		this.tasks = [];
		this.taskIds = new Set();

		this.abortController = new AbortController();

		$effect(() => {
			this.start().finally(() => this.logWarning(null, 'Processing queue mainloop exited'));
		});
	}

	async start() {
		this.log(null, 'Starting processing queue mainloop');
		while (true) {
			while (this.tasks.length > 0) {
				await new Promise((resolve, reject) => {
					this.abortController.signal.addEventListener('abort', () => {
						resolve(undefined);
					});
					this.pop().then(resolve).catch(reject);
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
				id: task.importing.id
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
			uiState.processing.done++;
		}

		if (this.tasks.length === 0) {
			this.#drained();
		}
	}
}

/**
 * Initialize the processing queue. Must be called in a root $effect (during component initialization).
 * @param {import('swarpc').SwarpcClient<typeof import('$lib/../web-worker-procedures.js').PROCEDURES>} swarpc
 * @param {Map<string, import("swarpc").CancelablePromise["cancel"]>} [cancellers]
 */
export function initializeProcessingQueue(swarpc, cancellers) {
	processingQueue ??= new ProcessingQueue(swarpc, cancellers);
}

/**
 * Cancel a task in the processing queue.
 * @param {string} subjectId
 * @param {string} reason
 * @throws {Error} if the processing queue is not initialized
 */
export function cancelTask(subjectId, reason) {
	assertQueueInitiliazed(processingQueue);

	processingQueue.cancel(subjectId, reason);
}

/**
 * Import new files and add them to the processing queue.
 * @param {File[]} files
 */
export function importMore(files) {
	assertQueueInitiliazed(processingQueue);

	for (const file of files) {
		processingQueue.push({ importing: { file, id: imageFileId() } });
	}
}

/**
 * Add detection tasks to the processing queue.
 * @param {string[]} fileIds
 */
export function detectMore(fileIds) {
	assertQueueInitiliazed(processingQueue);

	for (const fileId of fileIds) {
		processingQueue.push({ detection: { fileId } });
	}
}

/**
 * Add classification tasks to the processing queue.
 * @param  {string[]} imageIds
 */
export function classifyMore(imageIds) {
	assertQueueInitiliazed(processingQueue);

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
function assertQueueInitiliazed(queue) {
	if (!queue)
		throw new Error('Processing queue not initialized. Call initializeProcessingQueue first.');
}
