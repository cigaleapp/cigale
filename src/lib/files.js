/**
 *
 * @param {object} [param0 ]
 * @param {string | string[]} [param0.accept] - accepted file types, e.g. "image/*,.pdf"
 * @param {boolean} [param0.multiple] - allow multiple file selection
 * @returns {Promise<File[]>} - selected files
 */
export async function promptForFiles({ accept = '', multiple = false } = {}) {
	const input = document.createElement('input');
	input.type = 'file';
	if (accept) input.accept = typeof accept === 'string' ? accept : accept.join(',');
	if (multiple) input.multiple = true;

	return new Promise((resolve) => {
		input.addEventListener('change', (event) => {
			if (!(event.currentTarget instanceof HTMLInputElement)) return;
			if (!event.currentTarget.files) return;
			const files = Array.from(event.currentTarget.files);
			if (files.length === 0) return;
			resolve(files);
		});
		input.click();
	});
}
