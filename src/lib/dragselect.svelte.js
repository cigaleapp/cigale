import { default as _DragSelect } from 'dragselect';

export class DragSelect {
	/** @type {HTMLElement|undefined} */
	imagesContainer;

	/** @type {string[]} */
	// eslint-disable-next-line no-undef
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
		this.imagesContainer = container;

		if (!this.imagesContainer) return;

		this.#instance = new _DragSelect({
			// @ts-ignore
			selectables: [...this.imagesContainer.querySelectorAll('[data-selectable]')],
			area: this.imagesContainer.parentElement ?? this.imagesContainer,
			draggability: false
		});

		this.#instance.subscribe('DS:select', ({ item }) => {
			if (!item.dataset.title) return;
			if (item.dataset.loading) return;
			this.selection.push(item.dataset.title);
		});
		this.#instance.subscribe('DS:unselect', ({ item }) => {
			if (!item.dataset.title) return;
			this.selection = this.selection.filter((title) => title !== item.dataset.title);
		});

		// Implement shift-click selection:
		// We get the item we just selected, and the item that was last selected without shift-clicking (the "shift selection anchor").
		// We then select all items between these two.
		// See https://stackoverflow.com/a/16530782 for more info
		this.#instance.subscribe('DS:end', ({ event }) => {
			if (!(event?.target instanceof HTMLElement)) return;
			if (!event.shiftKey) {
				this.shiftSelectionAnchor =
					// @ts-ignore
					event.target.closest('[data-selectable]')?.dataset.title ?? this.shiftSelectionAnchor;
				return;
			}
			const targetIndex = Number.parseInt(
				// @ts-ignore
				event.target.closest('[data-selectable]')?.dataset.index
			);
			const anchorIndex = Number.parseInt(
				// @ts-ignore
				this.imagesContainer?.querySelector(`[data-title="${this.shiftSelectionAnchor}"]`)?.dataset
					.index
			);
			this.#instance?.addSelection(
				// @ts-ignore
				this.imagesContainer
					?.querySelectorAll(`[data-selectable]`)
					.values()
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
