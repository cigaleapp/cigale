import type { Page } from '@playwright/test';

// the window object must be cast to any often
/* eslint-disable @typescript-eslint/no-explicit-any */

// TODO: Revisit if https://github.com/microsoft/playwright/issues/18267 is ever resolved
// Mock FSA API, but only the parts that we actually use. This is not a complete FSA Mock.
// Although developping one would be pretty cool (and would be a separate reusable NPM package)

export async function mockFilesystemAccessAPI(
	page: Page,
	directoryName: string,
	/**
	 * Used to retrieve the created files afterwards
	 */
	id: string
) {
	if (page.context().browser()?.browserType().name() !== 'chromium') {
		throw new Error('Filesystem Access API is only supported in Chromium-based browsers.');
	}

	await page.evaluate(
		([rootDir, handleId]) => {
			console.info(
				`Mocking Filesystem Access API with root directory: ${rootDir} and id: ${handleId}`
			);

			const FILES = new Map<string, string | Uint8Array>();

			((window as any).___playwright_fsa_files ??= {})[handleId] = FILES;

			(window as any).showDirectoryPicker = async function showDirectoryPicker({
				mode = 'read'
			}: { mode?: 'read' | 'readwrite' } = {}) {
				return makeDirectoryHandle(rootDir, rootDir, mode === 'readwrite', true);
			};

			function makeFileHandle(
				fullpath: string,
				name: string,
				_contents: string | Uint8Array | undefined,
				writable: boolean,
				created: boolean | undefined
			): FilesystemFileHandle {
				return {
					___playwright_fullPath: fullpath,
					name,
					async createWritable() {
						if (!writable) {
							throw new Error('File is not writable');
						}

						const fullPath = this.___playwright_fullPath;

						return {
							___playwright_closed: false,
							async write(data: string | Uint8Array) {
								if (!created)
									throw new Error(
										'File handle was not created with { create: true }'
									);

								FILES.set(fullPath, data);
							},
							async close() {
								this.___playwright_closed = true;
							}
						};
					}
				};
			}

			function makeDirectoryHandle(
				fullpath: string,
				name: string,
				writable: boolean,
				created?: boolean | undefined
			): FilesystemDirectoryHandle {
				return {
					___playwright_fullPath: fullpath,
					name,
					async getDirectoryHandle(subdirectory, options) {
						return makeDirectoryHandle(
							`${this.___playwright_fullPath}/${subdirectory}`,
							subdirectory,
							writable,
							created && options?.create
						);
					},
					async getFileHandle(filename, options) {
						return makeFileHandle(
							`${this.___playwright_fullPath}/${filename}`,
							filename,
							undefined,
							writable,
							created && options?.create
						);
					}
				};
			}
		},
		[directoryName, id]
	);
}

export async function writtenFilesOfHandle(
	page: Page,
	id: string
): Promise<Record<string, string | Uint8Array<ArrayBufferLike>>> {
	const filesHandle = await page.evaluateHandle(
		([handleId]) => {
			const handle = (window as any).___playwright_fsa_files?.[handleId];
			if (!handle) return {};
			return Object.fromEntries([...handle.entries()]);
		},
		[id]
	);

	return await filesHandle.jsonValue();
}

type FilesystemDirectoryHandle = {
	___playwright_fullPath: string;
	name: string;
	getDirectoryHandle: (
		subdirectory: string,
		options?: { create: boolean }
	) => Promise<FilesystemDirectoryHandle>;
	getFileHandle: (
		filename: string,
		options?: { create: boolean }
	) => Promise<FilesystemFileHandle>;
};

type FilesystemFileHandle = {
	___playwright_fullPath: string;
	name: string;
	createWritable: () => Promise<FilesystemWritableFileStream>;
};

type FilesystemWritableFileStream = {
	___playwright_closed: boolean;
	write: (data: string | Uint8Array) => Promise<void>;
	close: () => Promise<void>;
};
