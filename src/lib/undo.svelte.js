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

	/**
	 * Stores undone operations for redo functionality
	 * @type {UndoableOperation[]}
	 */
	graveyard = $state([]);

	/** @type {Partial<{ [K in UndoableOperationName]: UndoHandler<K> }>} */
	handlers = {};

	/** @type {Partial<{ [K in UndoableOperationName]: RedoTransformer<K> }>} */
	redoTransformers = {};

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

		const inversed = this.redoTransformers[op]?.(data);
		if (!inversed) {
			console.warn(`No redo transformer for operation ${op}`);
			return;
		}

		return this.#handle(inversed);
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
	 * Register a way to redo an operation by undoing its inverse
	 * The function given here should turn an operation into its inverse, so that when the undo handler is called on it, it redoes the original operation.
	 * @template {UndoableOperationName} T
	 * @param {T} op
	 * @param {typeof this.redoTransformers[T]} transformer
	 */
	rewinder(op, transformer) {
		onMount(() => {
			this.redoTransformers[op] = transformer;
		});

		onDestroy(() => {
			delete this.redoTransformers[op];
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
