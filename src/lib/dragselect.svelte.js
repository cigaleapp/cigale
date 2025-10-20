import Viselect from '@viselect/vanilla';

import './dragselect.css';

import { nonnull } from './utils';

export class DragSelect {
	/** @type {HTMLElement|undefined} */
	imagesContainer;

	/** @type {string[]} */

	selection = $state([]);

	/** @type {Viselect|undefined}  */
	#instance;

	/**
	 * id of last selected item that wasn't selected by shift-clicking.
	 * needed to properly do shift-click selection
	 *
	 * See https://stackoverflow.com/a/16530782
	 *
	 * @type {string|undefined}
	 */
	shiftSelectionAnchor;

	/**
	 * @param {string[]} newSelection
	 */
	setSelection(newSelection) {
		if (!this.#instance) return;
		// Tell DragSelect that the set of selected items changed
		// Since we store the selection as an array of ids, we
		// find the corresponding elements in the imagesContainer by [data-id]
		const elements = newSelection
			.map((id) => this.imagesContainer?.querySelector(`[data-selectable][data-id="${id}"]`))
			.filter((el) => el !== null && el !== undefined);

		this.#instance.clearSelection(true, true);
		const result = /** @type {HTMLElement[]} */ (this.#instance.select(elements, true));
		this.selection = result.map((e) => e.dataset.id).filter((id) => id !== undefined);
		return result;
	}

	refreshSelectables() {
		if (!this.#instance) return;
		this.#instance.resolveSelectables();
	}

	destroy() {
		this.#instance?.destroy();
	}

	/**
	 *
	 * @param {HTMLElement} container the container where all the [data-selectable] elements are. Selection square will be available in the parent of this container.
	 * @param {string[]} [initialSelection]
	 * @param {object} [options]
	 * @param {(e: MouseEvent|TouchEvent|null) => void} [options.ondeadclick] callback when the user clicks on an empty area, and does not do so in order to unselect everything (i.e. the click did not result in a selection change)
	 */
	constructor(container, initialSelection = [], { ondeadclick } = {}) {
		// Save the container element on the class instance
		this.selection = initialSelection;
		this.imagesContainer = container;
		// If the container doesn't exist, we can't do anything
		if (!this.imagesContainer) return;

		const boundary = this.imagesContainer.parentElement ?? this.imagesContainer;

		// Create a new Viselect instance: this comes from the dragselect package
		// It manages the selection of items in a container by dragging or clicking
		this.#instance = new Viselect({
			// Tell it what elements we want to be able to select: they have a [data-selectable] attribute
			selectables: '[data-selectable]',
			// Tell it where it should take over mouse dragging and stuff: the parent of the images container
			// We use the parent to allow users of the AreaObservations component to decide how much padding they want around the images
			// Using the parent, we can let the user start their selection in the padding area, and still select the images
			boundaries: boundary,
			startAreas: boundary,
			// file://./dragselect.css
			selectionAreaClass: 'viselect-selection-area',
			behaviour: {
				overlap: 'keep'
			},
			features: {
				deselectOnBlur: true
			}
		});

		// Clear selection if no modifier key is pressed
		this.#instance.on('start', ({ event }) => {
			if (!event) return;
			if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
				this.selection = [];
			}
		});

		// React to a move event: we just changed the selection
		this.#instance.on('move', ({ store: { changed } }) => {
			const removed = idsOfElements(changed.removed);
			const added = idsOfElements(changed.added);

			this.selection = [...this.selection.filter((id) => !removed.includes(id)), ...added];
		});

		this.#instance.on('stop', ({ event, store: { changed } }) => {
			if (changed.added.length > 0) return;
			if (changed.removed.length > 0) return;
			ondeadclick?.(event);
		});
	}
}

/** @param {Element[]} elements */
function idsOfElements(elements) {
	return elements
		.filter((el) => el instanceof HTMLElement)
		.map((el) => el.dataset.id)
		.filter(nonnull);
}
