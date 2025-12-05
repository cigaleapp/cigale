import { type } from 'arktype';
import { onDestroy, onMount } from 'svelte';

import { centeredBoundingBox } from './BoundingBoxes.svelte.js';
import { defineKeyboardShortcuts } from './keyboard.svelte.js';

const OPERATIONS = {
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
 * @type {{ [K in UndoableOperationName]: RedoTransformer<K> } }
 */
const OPERATION_REWINDERS = {
	'crop/box/create': (data) => ({ op: 'crop/box/delete', data }),
	'crop/box/delete': (data) => ({ op: 'crop/box/create', data }),
	'crop/box/edit': ({ imageId, before, after }) => ({
		op: 'crop/box/edit',
		data: { imageId, before: after, after: before }
	})
};
/**
 * @typedef {keyof typeof OPERATIONS} UndoableOperationName
 */

/**
 * @template {UndoableOperationName} T
 * @typedef {typeof OPERATIONS[T]['inferIn']} UndoableOperationData
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

	/**
	 * Stores undone operations for redo functionality
	 * @type {UndoableOperation[]}
	 */
	graveyard = $state([]);

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

		if (!OPERATIONS[op].allows(_data)) {
			console.error(
				'Invalid undo operation data',
				{ op, data: _data },
				OPERATIONS[op](_data)
			);
		}

		this.graveyard = [];
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

		this.graveyard.push(operation);

		return this.#handle(operation);
	}

	rewind() {
		const operation = this.graveyard.pop();
		if (!operation) {
			console.warn('Redo stack is empty');
			return;
		}

		const { op, data } = operation;

		return this.#handle(OPERATION_REWINDERS[op](data));
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
			'$mod+Shift+z': {
				help: 'Rétablir',
				do: async () => undo.rewind()
			}
		});
	}
}

export const undo = new UndoStack();
