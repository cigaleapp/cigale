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

		this.dragselect = new _DragSelect({
			// @ts-ignore
			selectables: [...this.imagesContainer.querySelectorAll('[data-selectable]')],
			area: this.imagesContainer.parentElement ?? this.imagesContainer,
			draggability: false
		});

		this.dragselect.subscribe('DS:select', ({ item }) => {
			if (!item.dataset.title) return;
			if (item.dataset.loading) return;
			this.selection.push(item.dataset.title);
		});
		this.dragselect.subscribe('DS:unselect', ({ item }) => {
			if (!item.dataset.title) return;
			this.selection = this.selection.filter((title) => title !== item.dataset.title);
		});

		// Implement shift-click selection:
		// We get the item we just selected, and the closest item before it that was already selected. We select everything in between.
		this.dragselect.subscribe('DS:end', ({ items, event }) => {
			if (!event?.shiftKey) return;
			if (!(event.target instanceof HTMLElement)) return;
			const targetIndex = Number.parseInt(
				// @ts-ignore
				event.target?.closest('[data-selectable]')?.dataset.index
			);
			const closestSelectedIndex = Math.max(
				// @ts-ignore
				...items
					.map(({ dataset }) => Number.parseInt(dataset.index ?? '-1'))
					.filter((index) => index < targetIndex)
			);
			this.dragselect?.addSelection(
				// @ts-ignore
				this.imagesContainer
					?.querySelectorAll(`[data-selectable]`)
					.values()
					// @ts-ignore
					.filter(({ dataset }) => {
						const index = Number.parseInt(dataset.index);
						return index >= closestSelectedIndex && index <= targetIndex;
					})
			);
		});
	}
}
