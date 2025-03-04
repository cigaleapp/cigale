import { default as _DragSelect } from 'dragselect';

export class DragSelect {
	/** @type {HTMLElement|undefined} */
	imagesContainer;

	/** @type {string[]} */
	 
	selection = $state([]);

	/** @type {_DragSelect|undefined}  */
	#instance;

	/**
	 * title of last selected item that wasn't selected by shift-clicking.
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
		// Since we store the selection as an array of titles, we
		// find the corresponding elements in the imagesContainer by [data-title]
		return this.#instance.setSelection(
			// @ts-ignore
			newSelection.map((title) =>
				this.imagesContainer?.querySelector(`[data-selectable][data-title="${title}"]`)
			)
		);
	}

	/**
	 *
	 * @param {HTMLElement} container the container where all the [data-selectable] elements are. Selection square will be available in the parent of this container.
	 */
	constructor(container) {
		// Save the container element on the class instance
		this.imagesContainer = container;
		// If the container doesn't exist, we can't do anything
		if (!this.imagesContainer) return;

		// Create a new DragSelect instance: this comes from the dragselect package
		// It manages the selection of items in a container by dragging or clicking
		this.#instance = new _DragSelect({
			// Tell it what elements we want to be able to select: they have a [data-selectable] attribute
			// @ts-ignore
			selectables: [...this.imagesContainer.querySelectorAll('[data-selectable]')],
			// Tell it where it should take over mouse dragging and stuff: the parent of the images container
			// We use the parent to allow users of the AreaObservations component to decide how much padding they want around the images
			// Using the parent, we can let the user start their selection in the padding area, and still select the images
			area: this.imagesContainer.parentElement ?? this.imagesContainer,
			// Prevent DragSelect from allowing the user to move the cards around, we don't want/need that
			draggability: false
		});

		// React to a selection event: we just selected a new item by dragging
		this.#instance.subscribe('DS:select', ({ item }) => {
			// If it doesn't have a [data-title], we can't add it to the selection, do nothing
			if (!item.dataset.title) return;
			// If it's loading (has [data-loading]), do nothing: can't select a non-loaded item
			if (item.dataset.loading) return;
			// Add the title of the selected item to the selection
			this.selection.push(item.dataset.title);
		});

		// React to an unselection event: we just unselected an item by dragging
		this.#instance.subscribe('DS:unselect', ({ item }) => {
			// If it doesn't have a [data-title], we can't remove it from the selection, do nothing
			if (!item.dataset.title) return;
			// Remove the title of the unselected item from the selection by setting this.selection
			// to a new array with every value except the one that matches the title of the item we unselected
			this.selection = this.selection.filter((title) => title !== item.dataset.title);
		});

		// Implement shift-click selection:
		// We get the item we just selected, and the item that was last selected without shift-clicking (the "shift selection anchor").
		// We then select all items between these two.
		// See https://stackoverflow.com/a/16530782 for more info
		this.#instance.subscribe('DS:end', ({ event }) => {
			// If we shomehow didn't click on a HTML element, we can't do anything
			if (!(event?.target instanceof HTMLElement)) return;

			if (!event.shiftKey) {
				// We didn't hold the Shift key while selecting this item, so we change the anchor to that element
				this.shiftSelectionAnchor =
					// @ts-ignore
					event.target.closest('[data-selectable]')?.dataset.title ?? this.shiftSelectionAnchor;
				return;
			}

			// We did hold shift:

			// Get index of the element we just clicked: it's the value of the [data-index] attribute
			const targetIndex = Number.parseInt(
				// @ts-ignore
				event.target.closest('[data-selectable]')?.dataset.index
			);

			// Get index of the shift selection anchor: find the element by its title, then get its index
			const anchorIndex = Number.parseInt(
				// @ts-ignore
				this.imagesContainer?.querySelector(`[data-title="${this.shiftSelectionAnchor}"]`)?.dataset
					.index
			);

			const selectables = [
				...(this.imagesContainer
					// Get all elements marked with [data-selectable] inside the container
					?.querySelectorAll(`[data-selectable]`) ?? [])
			];

			// Select all selectables that have an index between the one we clicked and the anchor:
			this.#instance?.addSelection(
				// @ts-ignore
				selectables
					// Only keep elements with an index within the range we want
					.filter((element) =>
						// @ts-ignore
						inRange([anchorIndex, targetIndex], Number.parseInt(element.dataset.index))
					)
			);
		});
	}
}

/**
 *
 * @param {[number, number]} bounds of the range - can be in any order
 * @param {number} subject number to test for
 * @returns {boolean} whether the subject is in the range
 */
function inRange(bounds, subject) {
	const [min, max] = bounds.sort((a, b) => a - b);
	return subject >= min && subject <= max;
}
