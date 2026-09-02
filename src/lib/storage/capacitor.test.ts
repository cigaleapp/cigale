import { beforeEach, describe, expect, it, vi } from 'vitest';

import '@andy0130tw/es-arraybuffer-base64/auto';

const mockIsNativePlatform = vi.fn();
const mockStat = vi.fn();
const mockDeleteFile = vi.fn();
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockReaddir = vi.fn();
const mockRmdir = vi.fn();

vi.mock('@capacitor/core', () => ({
	Capacitor: {
		isNativePlatform: mockIsNativePlatform,
	},
}));

vi.mock('@capacitor/filesystem', () => ({
	Directory: {
		Data: 'Data',
		Documents: 'Documents',
	},
	Filesystem: {
		stat: mockStat,
		deleteFile: mockDeleteFile,
		readFile: mockReadFile,
		writeFile: mockWriteFile,
		readdir: mockReaddir,
		rmdir: mockRmdir,
	},
}));

async function importModule() {
	return import('./capacitor.js');
}

async function collect<T>(items: AsyncIterable<T>) {
	const result: T[] = [];
	for await (const item of items) result.push(item);
	return result;
}

describe('CapacitorFilesystemBackend', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		mockIsNativePlatform.mockReturnValue(true);
		mockStat.mockResolvedValue({ size: 5 });
		mockDeleteFile.mockResolvedValue(undefined);
		mockReadFile.mockResolvedValue({ data: 'aGVsbG8=' });
		mockWriteFile.mockResolvedValue(undefined);
		mockReaddir.mockResolvedValue({ files: [] });
		mockRmdir.mockResolvedValue(undefined);
	});

	it('throws on web', async () => {
		mockIsNativePlatform.mockReturnValue(false);

		const { CapacitorFilesystemBackend } = await importModule();

		await expect(async () => CapacitorFilesystemBackend()).rejects.toThrow(
			'Capacitor filesystem binary storage backend is not supported on Web'
		);
	});

	it('writes, reads and reports file metadata', async () => {
		const { CapacitorFilesystemBackend } = await importModule();
		const backend = await CapacitorFilesystemBackend();
		const parent = { area: 'ImageFile', sessionId: 'session-a', name: '' as const };
		const locator = { ...parent, name: 'sample.txt' as const };

		mockReaddir.mockResolvedValue({ files: [{ name: 'sample.txt' }] });

		await backend.write(locator, { type: 'text/plain', text: 'hello' });
		await backend.write(
			{ ...locator, name: 'bytes.bin' },
			{
				type: 'application/octet-stream',
				bytes: new Uint8Array([1, 2, 3]),
			}
		);

		expect(mockWriteFile).toHaveBeenNthCalledWith(1, {
			directory: 'Documents',
			path: 'Cigale/ImageFile/session-a/sample.txt',
			data: 'aGVsbG8=',
			recursive: true,
		});
		expect(mockWriteFile).toHaveBeenNthCalledWith(2, {
			directory: 'Documents',
			path: 'Cigale/ImageFile/session-a/bytes.bin',
			data: 'AQID',
			recursive: true,
		});

		expect(await backend.exists(locator)).toBe(true);
		expect(await backend.size(locator)).toBe(5);
		expect(await backend.bytes(locator)).toEqual(
			Uint8Array.from([104, 101, 108, 108, 111]).buffer
		);
		expect(await backend.text(locator)).toBe('hello');

		const file = await backend.read(locator, 'text/plain');
		expect(file).toBeInstanceOf(File);
		expect(file.name).toBe('sample.txt');
		expect(file.type).toBe('text/plain');
		expect(await file.text()).toBe('hello');

		expect(await backend.count(parent)).toBe(1);
		expect(await collect(backend.list(parent))).toEqual([{ ...parent, name: 'sample.txt' }]);

		await backend.delete(locator);
		expect(mockDeleteFile).toHaveBeenCalledWith({
			directory: 'Documents',
			path: 'Cigale/ImageFile/session-a/sample.txt',
		});

		await backend.clear(parent);
		expect(mockRmdir).toHaveBeenCalledWith({
			directory: 'Documents',
			path: 'Cigale/ImageFile/session-a',
			recursive: true,
		});
	});

	it('handles missing directories when counting and listing', async () => {
		mockReaddir.mockRejectedValueOnce(new Error('missing'));

		const { CapacitorFilesystemBackend } = await importModule();
		const backend = await CapacitorFilesystemBackend();
		const parent = { area: 'ImageFile', sessionId: 'missing-session', name: '' as const };

		expect(await backend.count(parent)).toBe(0);
		expect(await collect(backend.list(parent))).toEqual([]);
	});
});
