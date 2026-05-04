export async function writeToFilesystem(
	root: FileSystemDirectoryHandle,
	filepath: string,
	contents: string | Uint8Array
) {
	const [filename, ...directories] = filepath.split('/').filter(Boolean).toReversed();

	let cwd = root;
	for (const directory of directories.toReversed()) {
		cwd = await cwd.getDirectoryHandle(directory, { create: true });
	}

	const writable = await cwd
		.getFileHandle(filename, { create: true })
		.then((file) => file.createWritable());

	await writable.write(contents);
	await writable.close();
}

if (import.meta.vitest) {
	const { it, expect, vi } = import.meta.vitest;
	it('writeToFilesystem', async () => {
		type MockWritable = {
			write: (content: string | Uint8Array) => Promise<void>;
			close: () => Promise<void>;
		};

		type MockFileHandle = {
			createWritable: () => Promise<MockWritable>;
		};

		type MockDirectoryHandle = {
			name: string;
			getDirectoryHandle: (
				dirName: string,
				_options: { create: true }
			) => Promise<MockDirectoryHandle>;
			getFileHandle: (
				fileName: string,
				_options: { create: true }
			) => Promise<MockFileHandle>;
		};

		// Track directory handles and files
		const directories: Map<string, MockDirectoryHandle> = new Map();
		const files: Map<string, Uint8Array | string> = new Map();

		// Mock FileSystemFileHandle
		const mockFileHandle = {
			createWritable: vi.fn(async () => ({
				write: vi.fn(async (content: string | Uint8Array) => {
					files.set('file.txt', content);
				}),
				close: vi.fn(async () => {}),
			})),
		};

		// Mock FileSystemDirectoryHandle
		const createMockDirectoryHandle = (name: string): MockDirectoryHandle => ({
			name,
			getDirectoryHandle: vi.fn(async (dirName: string, _options: { create: true }) => {
				const key = `${name}/${dirName}`;
				if (!directories.has(key)) {
					directories.set(key, createMockDirectoryHandle(key));
				}
				return directories.get(key);
			}),
			getFileHandle: vi.fn(async (_fileName: string, _options: { create: true }) => {
				return mockFileHandle;
			}),
		});

		const rootHandle = createMockDirectoryHandle('root');

		// Test simple file write
		await writeToFilesystem(rootHandle, 'file.txt', 'hello world');
		expect(files.get('file.txt')).toBe('hello world');
		expect(mockFileHandle.createWritable).toHaveBeenCalled();

		// Reset for next test
		files.clear();
		directories.clear();

		// Test nested directory creation
		directories.set('root', rootHandle);
		const nestedRootHandle = createMockDirectoryHandle('root');
		await writeToFilesystem(nestedRootHandle, 'path/to/file.txt', new Uint8Array([1, 2, 3]));

		// Verify directories were traversed
		expect(nestedRootHandle.getDirectoryHandle).toHaveBeenCalledWith('path', { create: true });
		expect(mockFileHandle.createWritable).toHaveBeenCalled();
	});
}
