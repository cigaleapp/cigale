import { type } from 'arktype';
import { onDestroy, onMount } from 'svelte';

import { centeredBoundingBox } from './BoundingBoxes.svelte.js';
import { defineKeyboardShortcuts } from './keyboard.svelte.js';

const UndoableOperationSchemas = {
	'crop/box/create': type({
		imageId: 'string',
		box: centeredBoundingBox
	}),
	'crop/box/delete': type({
		imageId: 'string',
		box: centeredBoundingBox
	}),
	'crop/box/edit': type({
		imageId: 'string',
		before: centeredBoundingBox,
		after: centeredBoundingBox
	})
};

/**
 * @typedef {keyof typeof UndoableOperationSchemas} UndoableOperationName
 */

/**
 * @template {UndoableOperationName} T
 * @typedef {typeof UndoableOperationSchemas[T]['inferIn']} UndoableOperationData
 */

/**
 * @template {UndoableOperationName} [T=UndoableOperationName]
 * @typedef {{op: T, data: UndoableOperationData<T>}} UndoableOperation
 */

/**
 * @template {UndoableOperationName} T
 * @typedef {(data: UndoableOperationData<T>) => void | Promise<void>} UndoHandler
 */

/**
 * Function that turns a undoable operation into another that does the opposite.
 * Calling a undo handler on the result of this function should redo the original operation.
 * @template {UndoableOperationName} T
 * @typedef {(data: UndoableOperationData<T>) => UndoableOperation} RedoTransformer<T>
 */

class UndoStack {
	/** @type {UndoableOperation[]} */
	stack = $state([]);

	/** @type {Partial<{ [K in UndoableOperationName]: UndoHandler<K> }>} */
	handlers = {};

	/**
	 *
	 * @param {UndoableOperation} operation
	 */
	#handle({ data, op }) {
		const handler = this.handlers[op];
		if (!handler) throw new Error(`No handler for undo operation ${op}`);

		return handler($state.snapshot(data));
	}

	/**
	 * @template {UndoableOperationName} T
	 * @param {T} op
	 * @param {UndoableOperationData<T>} data
	 */
	push(op, data) {
		const _data = $state.snapshot(data);

		if (!UndoableOperationSchemas[op].allows(_data)) {
			console.error(
				'Invalid undo operation data',
				{ op, data: _data },
				UndoableOperationSchemas[op](_data)
			);
		}

		console.log('Undo push', { op, data: _data });

		this.stack.push({ op, data: _data });
	}

	peek() {
		return this.stack.at(-1);
	}

	pop() {
		const operation = this.stack.pop();
		if (!operation) {
			console.warn('Undo stack is empty');
			return;
		}

		console.log('Undo pop', operation);

		this.graveyard.push(operation);

		return this.#handle(operation);
	}

	/**
	 * Register a handler until the page/layout is unmounted
	 * @template {UndoableOperationName} T
	 * @param {T} op
	 * @param {typeof this.handlers[T]} handler
	 */
	on(op, handler) {
		onMount(() => {
			this.handlers[op] = handler;
		});

		onDestroy(() => {
			delete this.handlers[op];
		});
	}

	/**
	 *
	 * @param {number} depth Max undo depth
	 */
	initialize(depth) {
		this.stack = [];

		$effect(() => {
			if (this.stack.length > depth) {
				this.stack.shift();
			}
		});

		defineKeyboardShortcuts('general', {
			'$mod+z': {
				help: 'Annuler',
				do: async () => undo.pop()
			},
		});
	}
}

export const undo = new UndoStack();
