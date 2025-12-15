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
	stack = [];

	/**
	 * Stores undone operations for redo functionality
	 * @type {UndoableOperation[]}
	 */
	graveyard = [];

	/** @type {Partial<{ [K in UndoableOperationName]: UndoHandler<K> }>} */
	handlers = {};

	/** Max undo depth */
	depth = 100;

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
			return;
		}

		this.graveyard = [];
		this.stack.push({ op, data: _data });
		if (this.stack.length > this.depth) {
			this.stack.shift();
		}
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

	clear() {
		this.stack = [];
		this.graveyard = [];
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
		this.graveyard = [];
		this.depth = depth;
		this.handlers = {};

		if (!import.meta.vitest) {
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
}

export const undo = new UndoStack();

if (import.meta.vitest) {
	const { it, expect, vi, describe } = import.meta.vitest;

	describe('UndoStack', () => {
		it('pushes and pops undo operations', () => {
			const handler = vi.fn();

			$effect.root(() => {
				undo.initialize(100);
				undo.handlers['crop/box/create'] = handler;
				undo.push('crop/box/create', {
					imageId: 'img1',
					box: { x: 0, y: 0, w: 100, h: 100 }
				});

				undo.pop();
			})();

			expect(handler).toHaveBeenCalledOnce();
			expect(handler).toHaveBeenCalledWith({
				imageId: 'img1',
				box: { x: 0, y: 0, w: 100, h: 100 }
			});
		});

		it('rewinds undone operations', () => {
			const createHandler = vi.fn();
			const deleteHandler = vi.fn();

			$effect.root(() => {
				undo.initialize(100);
				undo.handlers['crop/box/create'] = createHandler;
				undo.handlers['crop/box/delete'] = deleteHandler;

				undo.push('crop/box/create', {
					imageId: 'img2',
					box: { x: 10, y: 10, w: 50, h: 50 }
				});

				undo.pop(); // Undo create
				undo.rewind(); // Redo create
			})();

			expect(createHandler).toHaveBeenCalledOnce();
			expect(createHandler).toHaveBeenCalledWith({
				imageId: 'img2',
				box: { x: 10, y: 10, w: 50, h: 50 }
			});

			expect(deleteHandler).toHaveBeenCalledOnce();
			expect(deleteHandler).toHaveBeenCalledWith({
				imageId: 'img2',
				box: { x: 10, y: 10, w: 50, h: 50 }
			});
		});

		it('can undo/redo multiple operations', () => {
			const handle = vi.fn();

			const box90 = { x: 10, y: 10, w: 90, h: 90 };
			const box80 = { x: 10, y: 10, w: 80, h: 80 };
			const box60 = { x: 20, y: 20, w: 60, h: 60 };

			$effect.root(() => {
				undo.initialize(100);
				undo.handlers['crop/box/edit'] = handle;

				undo.push('crop/box/edit', { imageId: 'img3', before: box90, after: box80 });
				undo.push('crop/box/edit', { imageId: 'img3', before: box80, after: box60 });

				undo.pop(); // Undo second edit
				undo.pop(); // Undo first edit
				undo.rewind(); // Redo first edit
				undo.rewind(); // Redo second edit
			})();

			expect(handle).toHaveBeenCalledTimes(4);
			// before/after are swapped because the handler *undoes* the operation
			expect(handle).toHaveBeenNthCalledWith(1, {
				imageId: 'img3',
				before: box80,
				after: box60
			});
			expect(handle).toHaveBeenNthCalledWith(2, {
				imageId: 'img3',
				before: box90,
				after: box80
			});
			expect(handle).toHaveBeenNthCalledWith(3, {
				imageId: 'img3',
				before: box80,
				after: box90
			});
			expect(handle).toHaveBeenNthCalledWith(4, {
				imageId: 'img3',
				before: box60,
				after: box80
			});
		});

		it('respects max undo depth', () => {
			const handler = vi.fn();

			$effect.root(() => {
				undo.initialize(2);
				undo.handlers['crop/box/create'] = handler;

				undo.push('crop/box/create', {
					imageId: 'img4',
					box: { x: 0, y: 0, w: 10, h: 10 }
				});
				undo.push('crop/box/create', {
					imageId: 'img4',
					box: { x: 0, y: 0, w: 20, h: 20 }
				});
				undo.push('crop/box/create', {
					imageId: 'img4',
					box: { x: 0, y: 0, w: 30, h: 30 }
				});

				// First operation should have been discarded
				undo.pop(); // Undoes w:30
				undo.pop(); // Undoes w:20
				undo.pop(); // Nothing to undo
			})();

			expect(handler).toHaveBeenCalledTimes(2);
			expect(handler).toHaveBeenNthCalledWith(1, {
				imageId: 'img4',
				box: { x: 0, y: 0, w: 30, h: 30 }
			});
			expect(handler).toHaveBeenNthCalledWith(2, {
				imageId: 'img4',
				box: { x: 0, y: 0, w: 20, h: 20 }
			});
		});

		it('does nothing when undo stack is empty', () => {
			const handler = vi.fn();
			$effect.root(() => {
				undo.initialize(100);
				undo.handlers['crop/box/create'] = handler;

				undo.pop(); // Nothing to undo
			})();

			expect(handler).not.toHaveBeenCalled();
		});

		it('errors out when pushing invalid operation data', () => {
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
			const handler = vi.fn();
			$effect.root(() => {
				undo.initialize(100);
				undo.handlers['crop/box/create'] = handler;
				undo.push('crop/box/create', {
					imageId: 'img5',
					// @ts-expect-error Testing invalid data
					box: { x: 'invalid', y: 0, w: 100, h: 100 }
				});

				undo.pop();
			})();

			expect(consoleError).toHaveBeenCalled();
			consoleError.mockRestore();
			expect(handler).not.toHaveBeenCalled();
		});

		it('errors out when popping operation with no handler', () => {
			$effect.root(() => {
				undo.initialize(100);
				undo.push('crop/box/create', {
					imageId: 'img6',
					box: { x: 0, y: 0, w: 100, h: 100 }
				});
				// No handler registered for 'crop/box/create'
				expect(() => undo.pop()).toThrowError(
					'No handler for undo operation crop/box/create'
				);
			})();
		});

		it('can clear the undo stack', () => {
			const handler = vi.fn();

			$effect.root(() => {
				undo.initialize(100);
				undo.handlers['crop/box/create'] = handler;
				undo.push('crop/box/create', {
					imageId: 'img9',
					box: { x: 0, y: 0, w: 100, h: 100 }
				});

				undo.clear();

				undo.pop(); // Nothing to undo
				undo.rewind(); // Nothing to redo
			})();

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe('Crop operations', () => {
		it('rewinds crop box edit operations correctly', () => {
			const boxBefore = { x: 15, y: 15, w: 70, h: 70 };
			const boxAfter = { x: 20, y: 20, w: 60, h: 60 };
			let box = { ...boxBefore };
			$effect.root(() => {
				undo.initialize(100);
				undo.handlers['crop/box/edit'] = ({ before }) => {
					box = { ...before };
				};

				undo.push('crop/box/edit', {
					imageId: 'img7',
					before: boxBefore,
					after: boxAfter
				});

				// Simulate applying the edit
				box = { ...boxAfter };

				undo.pop(); // Undo edit
				expect(box).toEqual(boxBefore);

				undo.rewind(); // Redo edit
				expect(box).toEqual(boxAfter);
			})();
		});

		it('rewinds crop box create/delete operations correctly', () => {
			const box = { x: 5, y: 5, w: 50, h: 50 };
			let boxes = { testBox: { ...box }, otherBox: { ...box } };
			$effect.root(() => {
				undo.initialize(100);
				undo.handlers['crop/box/create'] = () => {
					delete boxes['testBox'];
				};
				undo.handlers['crop/box/delete'] = ({ box }) => {
					boxes['testBox'] = { ...box };
				};

				// Create box
				undo.push('crop/box/create', {
					imageId: 'img8',
					box
				});

				// Simulate creating the box
				boxes['testBox'] = { ...box };

				expect(boxes).toHaveProperty('testBox');

				undo.pop(); // Undo create
				expect(boxes).not.toHaveProperty('testBox');

				undo.rewind(); // Redo create
				expect(boxes).toEqual({
					testBox: { ...box },
					otherBox: { ...box }
				});
			})();
		});
	});
}
