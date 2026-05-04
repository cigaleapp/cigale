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

if (import.meta.vitest) {
	const { it, expect, vi } = import.meta.vitest;
	it('promptForFiles', async () => {
		const mockFiles = [new File(['content'], 'test.txt', { type: 'text/plain' })];

		// Mock the input.click() to trigger change event with mock files
		const origClick = HTMLInputElement.prototype.click;
		HTMLInputElement.prototype.click = function () {
			if (this.type === 'file') {
				// Use Object.defineProperty to set files on the input
				Object.defineProperty(this, 'files', {
					value: mockFiles,
					writable: false,
				});
				// Dispatch change event
				const event = new Event('change', { bubbles: true });
				Object.defineProperty(event, 'currentTarget', { value: this, writable: false });
				this.dispatchEvent(event);
			}
		};

		const result = await promptForFiles({ accept: 'text/*', multiple: false });

		expect(result).toEqual(mockFiles);

		// Test with array of accept types
		const result2 = await promptForFiles({ accept: ['.jpg', '.png'], multiple: true });
		expect(result2).toEqual(mockFiles);

		HTMLInputElement.prototype.click = origClick;
	});
}
