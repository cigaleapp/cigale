import { errorMessage } from './i18n';
import { imageFileId } from './images';
import { processImageFile } from './import.svelte';
import { importResultsZip } from './results.svelte';
import { uiState } from './state.svelte';
import { isZip } from './utils';

/**
 * @type {undefined | ProcessingQueue}
 */
let processingQueue;

/**
 * @typedef {object} ProcessingQueueTask
 * @property {object} [detection]
 * @property {File} detection.file
 * @property {string} detection.id
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
		this.tasks = $state([]);

		$effect(() => {
			uiState.processing.total = this.tasks.length;
		});

		$effect(() => {
			/**
			 *
			 * @param {ProcessingQueueTask[]} tasks
			 * @param {() => Promise<void>} pop
			 * @returns
			 */
			function step(tasks, pop) {
				if (!tasks.length) return;
				pop().then(() => step(tasks, pop));
			}

			step(this.tasks, this.pop.bind(this));
		});
	}

	/**
	 *
	 * @param {ProcessingQueueTask} task
	 */
	taskId(task) {
		if (task.detection) {
			return task.detection.id;
		}

		if (task.classification) {
			return task.classification.imageId;
		}

		throw new Error('Task must have either detection or classification');
	}

	/**
	 *
	 * @param {ProcessingQueueTask} task
	 */
	push(task) {
		uiState.loadingImages.add(this.taskId(task));

		if (task.detection)
			uiState.processing.files.push({
				name: task.detection.file.name,
				id: task.detection.id
			});

		this.tasks.push(task);
	}

	async pop() {
		const task = this.tasks.shift();
		console.log('Popping task', task);

		if (!task) {
			// Queue was drained
			uiState.processing.done = 0;
			uiState.processing.total = 0;
			uiState.loadingImages.clear();
			uiState.processing.files = [];
			return;
		}

		const { detection, classification } = task;

		try {
			if (detection) {
				const { file, id } = detection;
				if (isZip(file.type)) {
					await importResultsZip(file, id, uiState.currentProtocolId);
				} else {
					await processImageFile(this.swarpc, file, id, this.cancellers);
				}
			} else if (classification) {
				// TODO
			}

			uiState.processing.removeFile(this.taskId(task));
		} catch (error) {
			uiState.erroredImages.set(this.taskId(task), errorMessage(error));
		} finally {
			uiState.loadingImages.delete(this.taskId(task));
			uiState.processing.done++;
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
 * Import new files and add them to the processing queue.
 * @param {File[]} files
 */
export async function importMore(files) {
	if (!processingQueue)
		throw new Error('Processing queue not initialized. Call initializeProcessingQueue first.');

	for (const file of files) {
		const id = imageFileId();
		processingQueue.push({ detection: { file, id } });
		// .on('queued', () => {
		// 	uiState.processing.files.push({ name: file.name, id });
		// })
		// .on('failed', (error) => {
		// 	if (tables.Image.state.some((img) => img.fileId === id)) {
		// 		// ImageFile was created (so setting erroredImages makes sense)
		// 		uiState.erroredImages.set(id, errorMessage(error));
		// 	} else {
		// 		// no ImageFile was created (the CardObservation's id is still loading_n), so erroredImages is useless.
		// 		// We just remove the file from the processing list, and surface the error with a toast.
		// 		toasts.error(
		// 			m.error_importing_file({
		// 				filename: file.name,
		// 				error: errorMessage(error)
		// 			})
		// 		);
		// 	}
		// });
	}
}
