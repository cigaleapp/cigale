import { beforeEach, describe, expect, it, vi } from 'vitest';

import 'fake-indexeddb/auto';

const mockIsNativePlatform = vi.fn();
const mockBinaryStorage = {
	count: vi.fn(),
	create: vi.fn(),
	delete: vi.fn(),
	write: vi.fn(),
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

vi.mock('$lib/idb.svelte.js', () => ({}));

vi.mock('$lib/database.js', () => ({
	generateId: vi.fn(() => 'sampleId'),
}));

vi.mock('$lib/metadata/index.js', () => ({
	storeMetadataValue: vi.fn(),
}));

vi.mock('$lib/uistate.svelte.js', () => ({
	uiState: {
		currentSessionId: undefined,
		currentSession: undefined,
	},
}));

vi.mock('$lib/geolocation.js', async (original) => ({
	...(await original()),
	getCurrentLocation: () => ({ longitude: 0, latitude: 0 }),
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
	localeFromNavigator: vi.fn(() => 'fr'),
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
		mockBinaryStorage.create.mockResolvedValue({
			area: '.pending_captures/photos',
			sessionId: 'session',
			name: 'IMG_0001.PNG',
		});
		mockBinaryStorage.write.mockResolvedValue({
			area: '.pending_captures/exif',
			sessionId: 'session',
			name: 'IMG_0001.PNG.json',
		});
		mockBinaryStorage.delete.mockResolvedValue(undefined);
		mockBinaryStorage.list.mockReturnValue(asyncIterable([]));
		// mockBinaryStorage.read.mockResolvedValue();
		mockBinaryStorage.read.mockImplementation(async ({ area }) => {
			if (area === '.pending_captures/photos') {
				return { name: 'IMG_0001.PNG', type: 'image/png' };
			}
			return {
				name: 'IMG_0001.PNG.json',
				type: 'application/json',
				async text() {
					return '{}';
				},
			};
		});
		mockBinaryStorage.size.mockResolvedValue(0);
		mockBinaryStorage.clear.mockResolvedValue(undefined);
		mockProcessImageFile.mockResolvedValue(undefined);
		mockImageFileId.mockReturnValue('generated-image-id');
		mockErrorMessage.mockImplementation((_error, message) => message);
	});

	it('opens a storage and lists sessions', async () => {
		const { PendingStorage, PENDING_PHOTOS_ROOT_FOLDER } = await importModule();
		const root = `${PENDING_PHOTOS_ROOT_FOLDER}/photos`;
		mockBinaryStorage.count.mockResolvedValueOnce(3);
		mockBinaryStorage.list.mockReturnValueOnce(
			asyncIterable([
				{ area: root, sessionId: 'one', name: '' },
				{ area: root, sessionId: '', name: '' },
				{ area: root, sessionId: 'two', name: '' },
			])
		);

		const storage = await PendingStorage.open('session-a');
		const sessions = await collect(PendingStorage.sessions());

		expect(mockBinaryStorage.count).toHaveBeenCalledWith({
			area: root,
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
			area: '.pending_captures/photos',
			sessionId: 'session-a',
			name: 'IMG_0001.JPEG',
		});

		await storage.save('base64-photo');

		expect(mockBinaryStorage.create).toHaveBeenCalledWith(
			{
				area: '.pending_captures/photos',
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
		expect(mockErrorMessage).toHaveBeenCalledWith(
			saveError,
			'Impossible de sauvgarder la photo'
		);
		expect(mockToastError).toHaveBeenCalledWith('Impossible de sauvgarder la photo');
	});

	it('filters unrelated files when reading and sums size across entries', async () => {
		const { PendingStorage } = await importModule();
		const storage = await PendingStorage.open('session-a');
		mockBinaryStorage.list.mockReturnValueOnce(
			asyncIterable([
				{ area: '.pending_captures/photos', sessionId: 'session-a', name: 'IMG_0001.PNG' },
				{ area: '.pending_captures/photos', sessionId: 'session-a', name: 'notes.txt' },
				{ area: '.pending_captures/photos', sessionId: 'session-a', name: 'IMG_0002.PNG' },
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
				{ area: '.pending_captures/photos', sessionId: 'session-a', name: 'IMG_0001.PNG' },
				{ area: '.pending_captures/photos', sessionId: 'session-a', name: 'IMG_0002.PNG' },
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
				{ area: '.pending_captures/photos', sessionId: 'session-a', name: 'IMG_0001.PNG' },
				{ area: '.pending_captures/photos', sessionId: 'session-a', name: 'IMG_0002.PNG' },
			])
		);

		const mockReadImpl =
			(filename: string) =>
			async ({ area }) =>
				area === '.pending_captures/photos'
					? { name: `${filename}`, type: 'image/png' }
					: {
							name: `${filename}.json`,
							type: 'application/json',
							text: async () => '{ "ImageWidth": 67 }',
						};

		mockBinaryStorage.read
			.mockImplementationOnce(mockReadImpl('IMG_0001.PNG'))
			.mockImplementationOnce(mockReadImpl('IMG_0001.PNG'))
			.mockImplementationOnce(mockReadImpl('IMG_0002.PNG'))
			.mockImplementationOnce(mockReadImpl('IMG_0002.PNG'));
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
			extraExif: { ImageWidth: 67 },
			id: 'generated-image-id',
			file: { name: 'IMG_0001.PNG', type: 'image/png' },
			sidecars: [],
		});
		expect(mockProcessImageFile).toHaveBeenNthCalledWith(2, {
			extraExif: { ImageWidth: 67 },
			id: 'generated-image-id',
			file: { name: 'IMG_0002.PNG', type: 'image/png' },
			sidecars: [],
		});
		expect(mockBinaryStorage.delete).toHaveBeenCalledTimes(2);
		expect(mockBinaryStorage.delete).toHaveBeenNthCalledWith(1, {
			area: '.pending_captures/photos',
			sessionId: 'session-a',
			name: 'IMG_0001.PNG',
		});
		expect(mockBinaryStorage.delete).toHaveBeenNthCalledWith(2, {
			area: '.pending_captures/exif',
			sessionId: 'session-a',
			name: 'IMG_0001.PNG.json',
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
		expect(mockErrorMessage).toHaveBeenCalledWith(deleteError, expect.any(String));
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
