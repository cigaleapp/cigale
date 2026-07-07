import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockIsNativePlatform = vi.fn();
const mockBinaryStorage = {
	count: vi.fn(),
	create: vi.fn(),
	delete: vi.fn(),
	list: vi.fn(),
	read: vi.fn(),
	size: vi.fn(),
	clear: vi.fn(),
};
const mockProcessImageFile = vi.fn();
const mockImageFileId = vi.fn();
const mockErrorMessage = vi.fn();
const mockToastError = vi.fn();

vi.mock('@capacitor/core', () => ({
	Capacitor: {
		isNativePlatform: mockIsNativePlatform,
	},
}));

vi.mock('$lib/storage/index.js', () => ({
	binaryStorage: mockBinaryStorage,
}));

vi.mock('$lib/import.svelte.js', () => ({
	processImageFile: mockProcessImageFile,
}));

vi.mock('$lib/images.js', () => ({
	imageFileId: mockImageFileId,
}));

vi.mock('$lib/i18n.js', () => ({
	errorMessage: mockErrorMessage,
}));

vi.mock('$lib/toasts.svelte.js', () => ({
	toasts: {
		error: mockToastError,
	},
}));

const importModule = async () => import('./pendingstorage.svelte.js');

async function collect<T>(items: AsyncIterable<T>) {
	const result: T[] = [];
	for await (const item of items) result.push(item);
	return result;
}

function asyncIterable<T>(items: T[]) {
	return {
		async *[Symbol.asyncIterator]() {
			yield* items;
		},
	};
}

describe('PendingStorage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		mockIsNativePlatform.mockReturnValue(false);
		mockBinaryStorage.count.mockResolvedValue(0);
		mockBinaryStorage.create.mockResolvedValue({ area: '.pending_captures', sessionId: 'session', name: 'IMG_0001.PNG' });
		mockBinaryStorage.delete.mockResolvedValue(undefined);
		mockBinaryStorage.list.mockReturnValue(asyncIterable([]));
		mockBinaryStorage.read.mockResolvedValue({ name: 'IMG_0001.PNG', type: 'image/png' });
		mockBinaryStorage.size.mockResolvedValue(0);
		mockBinaryStorage.clear.mockResolvedValue(undefined);
		mockProcessImageFile.mockResolvedValue(undefined);
		mockImageFileId.mockReturnValue('generated-image-id');
		mockErrorMessage.mockImplementation((_error, message) => message);
	});

	it('opens a storage and lists sessions', async () => {
		const { PendingStorage, PENDING_PHOTOS_ROOT_FOLDER } = await importModule();
		mockBinaryStorage.count.mockResolvedValueOnce(3);
		mockBinaryStorage.list.mockReturnValueOnce(
			asyncIterable([
				{ area: PENDING_PHOTOS_ROOT_FOLDER, sessionId: 'one', name: '' },
				{ area: PENDING_PHOTOS_ROOT_FOLDER, sessionId: '', name: '' },
				{ area: PENDING_PHOTOS_ROOT_FOLDER, sessionId: 'two', name: '' },
			])
		);

		const storage = await PendingStorage.open('session-a');
		const sessions = await collect(PendingStorage.sessions());

		expect(mockBinaryStorage.count).toHaveBeenCalledWith({
			area: PENDING_PHOTOS_ROOT_FOLDER,
			sessionId: 'session-a',
			name: '',
		});
		expect(storage.count).toBe(3);
		expect(sessions).toEqual(['one', 'two']);
	});

	it('saves photos with the native jpeg content type', async () => {
		mockIsNativePlatform.mockReturnValue(true);
		const { PendingStorage } = await importModule();
		const storage = await PendingStorage.open('session-a');
		mockBinaryStorage.create.mockResolvedValueOnce({
			area: '.pending_captures',
			sessionId: 'session-a',
			name: 'IMG_0001.JPEG',
		});

		await storage.save('base64-photo');

		expect(storage.count).toBe(1);
		expect(mockBinaryStorage.create).toHaveBeenCalledWith(
			{
				area: '.pending_captures',
				sessionId: 'session-a',
				name: 'IMG.JPEG',
			},
			{
				type: 'image/jpeg',
				base64: 'base64-photo',
			},
			{
				fixedFilenameCounter: expect.any(Number),
			}
		);
	});

	it('restores the count and reports save failures', async () => {
		const saveError = new Error('disk full');
		mockBinaryStorage.create.mockRejectedValueOnce(saveError);
		const { PendingStorage } = await importModule();
		const storage = await PendingStorage.open('session-a');

		await storage.save('base64-photo');

		expect(storage.count).toBe(0);
		expect(mockErrorMessage).toHaveBeenCalledWith(saveError, 'Impossible de sauvgarder la photo');
		expect(mockToastError).toHaveBeenCalledWith('Impossible de sauvgarder la photo');
	});

	it('filters unrelated files when reading and sums size across entries', async () => {
		const { PendingStorage } = await importModule();
		const storage = await PendingStorage.open('session-a');
		mockBinaryStorage.list.mockReturnValueOnce(
			asyncIterable([
				{ area: '.pending_captures', sessionId: 'session-a', name: 'IMG_0001.PNG' },
				{ area: '.pending_captures', sessionId: 'session-a', name: 'notes.txt' },
				{ area: '.pending_captures', sessionId: 'session-a', name: 'IMG_0002.PNG' },
			])
		);
		mockBinaryStorage.read.mockResolvedValueOnce({ name: 'IMG_0001.PNG', type: 'image/png' });
		mockBinaryStorage.read.mockResolvedValueOnce({ name: 'IMG_0002.PNG', type: 'image/png' });

		const files = await collect(storage.files());
		expect(files).toEqual([
			{ name: 'IMG_0001.PNG', type: 'image/png' },
			{ name: 'IMG_0002.PNG', type: 'image/png' },
		]);

		mockBinaryStorage.list.mockReturnValueOnce(
			asyncIterable([
				{ area: '.pending_captures', sessionId: 'session-a', name: 'IMG_0001.PNG' },
				{ area: '.pending_captures', sessionId: 'session-a', name: 'IMG_0002.PNG' },
			])
		);
		mockBinaryStorage.size.mockResolvedValueOnce(12);
		mockBinaryStorage.size.mockResolvedValueOnce(18);

		expect(await storage.size()).toBe(30);
	});

	it('flushes successful files, reports progress, and keeps failures', async () => {
		const { PendingStorage } = await importModule();
		const storage = await PendingStorage.open('session-a');
		storage.count = 2;
		mockBinaryStorage.list.mockReturnValueOnce(
			asyncIterable([
				{ area: '.pending_captures', sessionId: 'session-a', name: 'IMG_0001.PNG' },
				{ area: '.pending_captures', sessionId: 'session-a', name: 'IMG_0002.PNG' },
			])
		);
		mockBinaryStorage.read
			.mockResolvedValueOnce({ name: 'IMG_0001.PNG', type: 'image/png' })
			.mockResolvedValueOnce({ name: 'IMG_0002.PNG', type: 'image/png' });
		mockProcessImageFile
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error('import failed'));
		const progress: Array<{ total: number; done: number }> = [];

		const ok = await storage.flush({
			onProgress: (value) => progress.push(value),
		});

		expect(ok).toBe(false);
		expect(mockImageFileId).toHaveBeenCalledTimes(2);
		expect(mockProcessImageFile).toHaveBeenNthCalledWith(1, {
			id: 'generated-image-id',
			file: { name: 'IMG_0001.PNG', type: 'image/png' },
			sidecars: [],
		});
		expect(mockProcessImageFile).toHaveBeenNthCalledWith(2, {
			id: 'generated-image-id',
			file: { name: 'IMG_0002.PNG', type: 'image/png' },
			sidecars: [],
		});
		expect(mockBinaryStorage.delete).toHaveBeenCalledTimes(1);
		expect(mockBinaryStorage.delete).toHaveBeenCalledWith({
			area: '.pending_captures',
			sessionId: 'session-a',
			name: 'IMG_0001.PNG',
		});
		expect(progress).toEqual([
			{ total: 2, done: 1 },
			{ total: 2, done: 2 },
		]);
	});

	it('deletes files and restores the count after delete failures', async () => {
		const deleteError = new Error('locked');
		mockBinaryStorage.count.mockResolvedValueOnce(7);
		mockBinaryStorage.delete.mockRejectedValueOnce(deleteError);
		const { PendingStorage } = await importModule();
		const storage = await PendingStorage.open('session-a');
		storage.count = 5;

		await storage.delete('IMG_0001.PNG');

		expect(storage.count).toBe(0);
		expect(mockErrorMessage).toHaveBeenCalledWith(deleteError,expect.any(String));
		expect(mockToastError).toHaveBeenCalledWith(expect.any(String));
	});

	it('clears the session folder', async () => {
		const { PendingStorage } = await importModule();
		const storage = await PendingStorage.open('session-a');

		await storage.clear();

		expect(mockBinaryStorage.clear).toHaveBeenCalledWith({
			area: '.pending_captures',
			sessionId: 'session-a',
			name: '',
		});
	});
});
