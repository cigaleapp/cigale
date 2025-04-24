/**
 *
 * @param {HTMLElement} node
 * @param {string} filename
 * @returns
 */
export function sound(node, filename) {
	/**
	 *
	 * @param {MouseEvent} param0
	 * @returns
	 */
	const listener = ({ currentTarget }) => {
		if (!(currentTarget instanceof HTMLElement)) return;
		if (!currentTarget?.dataset?.sound) return;
		const audio = new Audio(currentTarget.dataset.sound);
		audio.play().catch((e) => {
			console.error('Error playing sound:', e);
		});
	};
	node.dataset.sound = filename;
	node.addEventListener('click', listener);
	return {
		/**
		 * @param {string} newFilename
		 */
		update(newFilename) {
			node.dataset.sound = newFilename;
		},
		destroy() {
			delete node.dataset.sound;
			node.removeEventListener('click', listener);
		}
	};
}
