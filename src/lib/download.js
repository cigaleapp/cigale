/**
 *
 * @param {BlobPart | string} content
 * @param {string} filename
 * @param {string} [contentType] defaults to 'text/plain' for strings and 'application/octet-stream' for blobs
 */
export function downloadAsFile(content, filename, contentType) {
	const blob =
		content instanceof Blob
			? content
			: new Blob([content], {
					type:
						contentType ?? (typeof content === 'string' ? 'text/plain' : 'application/octet-stream')
				});

	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
