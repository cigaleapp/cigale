import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock Svelte state functionality globally
global.$state = vi.fn();
global.$state.snapshot = vi.fn((obj) => obj);

// Mock external dependencies
vi.mock('@cigale/beamup', () => ({
	sendCorrections: vi.fn(),
	CHUNK_SIZE: 10
}));

vi.mock('./database.js', () => ({
	generateId: vi.fn()
}));

vi.mock('./settings.svelte.js', () => ({
	getSetting: vi.fn()
}));

vi.mock('./metadata.js', () => ({
	serializeMetadataValue: vi.fn()
}));

vi.mock('./i18n.js', () => ({
	errorMessage: vi.fn((error) => error?.message || 'Error')
}));

// Import after setting up mocks
import { storeCorrection, syncCorrections } from './beamup.svelte.js';
import * as beamup from '@cigale/beamup';
import { generateId } from './database.js';
import { getSetting } from './settings.svelte.js';
import { serializeMetadataValue } from './metadata.js';

describe('beamup functionality', () => {
	let mockDb;
	let mockProtocol;
	let mockMetadata;
	let mockBeforeValue;
	let mockAfterValue;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Setup mock database
		mockDb = {
			get: vi.fn(),
			add: vi.fn(),
			getAll: vi.fn(),
			delete: vi.fn()
		};

		// Setup mock data
		mockProtocol = {
			id: 'test-protocol',
			version: 1,
			beamup: {
				origin: 'https://test-beamup.example.com'
			}
		};

		mockMetadata = {
			id: 'test-metadata',
			type: 'enum'
		};

		mockBeforeValue = {
			value: 'before',
			alternatives: { before: 0.8, other: 0.2 }
		};

		mockAfterValue = {
			value: 'after',
			alternatives: { after: 0.9, other: 0.1 }
		};
	});

	describe('storeCorrection', () => {
		test('should store correction when beamup is enabled', async () => {
			// Arrange
			const subject = 'test-subject';
			const mockImage = {
				id: 'test-image',
				sha1: 'test-hash',
				fileId: 'test-file'
			};
			const mockFile = {
				id: 'test-file',
				filename: 'test.jpg',
				contentType: 'image/jpeg',
				dimensions: { width: 100, height: 100 }
			};
			const mockPreferences = {
				[mockProtocol.id]: {
					enable: true,
					email: 'test@example.com'
				}
			};

			getSetting.mockResolvedValue(mockPreferences);
			mockDb.get.mockImplementation((table, id) => {
				if (table === 'Image' && id === subject) {
					return Promise.resolve(mockImage);
				}
				if (table === 'ImageFile' && id === mockImage.fileId) {
					return Promise.resolve(mockFile);
				}
				return Promise.reject(new Error('Not found'));
			});
			generateId.mockReturnValue('correction-id');
			serializeMetadataValue.mockImplementation((value) => value.value);

			// Act
			await storeCorrection(
				mockDb,
				mockProtocol,
				subject,
				mockMetadata,
				mockBeforeValue,
				mockAfterValue
			);

			// Assert
			expect(getSetting).toHaveBeenCalledWith('beamupPreferences', mockDb);
			expect(mockDb.get).toHaveBeenCalledWith('Image', subject);
			expect(mockDb.get).toHaveBeenCalledWith('ImageFile', mockImage.fileId);
			expect(mockDb.add).toHaveBeenCalledWith(
				'BeamupCorrection',
				expect.objectContaining({
					id: 'correction-id',
					protocol: {
						id: mockProtocol.id,
						version: mockProtocol.version,
						beamup: mockProtocol.beamup
					},
					metadata: {
						id: mockMetadata.id,
						type: mockMetadata.type
					},
					email: 'test@example.com',
					subject: {
						image: { id: subject },
						contentHash: mockImage.sha1
					},
					file: {
						id: mockFile.id,
						filename: mockFile.filename,
						contentType: mockFile.contentType,
						dimensions: mockFile.dimensions
					},
					before: expect.objectContaining({
						value: 'before'
					}),
					after: expect.objectContaining({
						value: 'after'
					})
				})
			);
		});

		test('should not store correction when beamup is disabled', async () => {
			// Arrange
			const subject = 'test-subject';
			const mockPreferences = {
				[mockProtocol.id]: {
					enable: false
				}
			};

			getSetting.mockResolvedValue(mockPreferences);

			// Act
			await storeCorrection(
				mockDb,
				mockProtocol,
				subject,
				mockMetadata,
				mockBeforeValue,
				mockAfterValue
			);

			// Assert
			expect(getSetting).toHaveBeenCalledWith('beamupPreferences', mockDb);
			expect(mockDb.add).not.toHaveBeenCalled();
		});

		test('should handle observation subjects', async () => {
			// Arrange
			const subject = 'test-observation';
			const mockObservation = {
				id: 'test-observation',
				images: ['image1', 'image2']
			};
			const mockImages = [{ sha1: 'hash1' }, { sha1: 'hash2' }];
			const mockPreferences = {
				[mockProtocol.id]: {
					enable: true,
					email: 'test@example.com'
				}
			};

			getSetting.mockResolvedValue(mockPreferences);
			mockDb.get.mockImplementation((table, id) => {
				if (table === 'Image' && id === subject) {
					return Promise.reject(new Error('Not found'));
				}
				if (table === 'Observation' && id === subject) {
					return Promise.resolve(mockObservation);
				}
				if (table === 'Image' && (id === 'image1' || id === 'image2')) {
					return Promise.resolve(mockImages[id === 'image1' ? 0 : 1]);
				}
				return Promise.reject(new Error('Not found'));
			});
			generateId.mockReturnValue('correction-id');
			serializeMetadataValue.mockImplementation((value) => value.value);

			// Act
			await storeCorrection(
				mockDb,
				mockProtocol,
				subject,
				mockMetadata,
				mockBeforeValue,
				mockAfterValue
			);

			// Assert
			expect(mockDb.add).toHaveBeenCalledWith(
				'BeamupCorrection',
				expect.objectContaining({
					subject: {
						observation: { id: subject },
						contentHash: 'hash1 hash2'
					}
				})
			);
		});
	});

	describe('syncCorrections', () => {
		test('should sync corrections by origin and delete them on success', async () => {
			// Arrange
			const mockCorrections = [
				{
					id: 'correction1',
					protocol: { beamup: { origin: 'https://example1.com' } },
					after: { alternatives: { value1: 0.9 }, value: 'value1' },
					before: { alternatives: { value0: 0.8 }, value: 'value0' },
					metadata: { id: 'meta1', type: 'enum' },
					client: { version: '1.0.0' },
					occurredAt: '2023-01-01T00:00:00Z',
					subject: { image: { id: 'img1' }, contentHash: 'hash1' },
					email: 'test@example.com'
				},
				{
					id: 'correction2',
					protocol: { beamup: { origin: 'https://example2.com' } },
					after: { alternatives: { value2: 0.7 }, value: 'value2' },
					before: { alternatives: { value1: 0.6 }, value: 'value1' },
					metadata: { id: 'meta2', type: 'enum' },
					client: { version: '1.0.0' },
					occurredAt: '2023-01-02T00:00:00Z',
					subject: { observation: { id: 'obs1' }, contentHash: 'hash2' },
					email: 'test@example.com'
				}
			];

			mockDb.getAll.mockResolvedValue(mockCorrections);
			beamup.sendCorrections.mockResolvedValue(undefined);
			const onProgress = vi.fn();

			// Act
			await syncCorrections(mockDb, onProgress);

			// Assert
			expect(mockDb.getAll).toHaveBeenCalledWith('BeamupCorrection');
			expect(beamup.sendCorrections).toHaveBeenCalledTimes(2);

			// Check first origin call
			expect(beamup.sendCorrections).toHaveBeenCalledWith(
				expect.objectContaining({
					origin: 'https://example1.com',
					corrections: [
						expect.objectContaining({
							client_name: 'Cigale',
							client_version: '1.0.0',
							protocol_id: undefined,
							subject_type: 'image',
							subject: 'img1',
							subject_content_hash: 'hash1'
						})
					]
				})
			);

			// Check second origin call
			expect(beamup.sendCorrections).toHaveBeenCalledWith(
				expect.objectContaining({
					origin: 'https://example2.com',
					corrections: [
						expect.objectContaining({
							client_name: 'Cigale',
							client_version: '1.0.0',
							protocol_id: undefined,
							subject_type: 'observation',
							subject: 'obs1',
							subject_content_hash: 'hash2'
						})
					]
				})
			);

			// Check corrections were deleted
			expect(mockDb.delete).toHaveBeenCalledWith('BeamupCorrection', 'correction1');
			expect(mockDb.delete).toHaveBeenCalledWith('BeamupCorrection', 'correction2');
		});

		test('should handle sync errors and report them via callback', async () => {
			// Arrange
			const mockCorrections = [
				{
					id: 'correction1',
					protocol: { beamup: { origin: 'https://example.com' } },
					after: { alternatives: { after: 0.9 }, value: 'after' },
					before: { alternatives: { before: 0.8 }, value: 'before' },
					metadata: { id: 'meta1', type: 'enum' },
					client: { version: '1.0.0' },
					occurredAt: '2023-01-01T00:00:00Z',
					subject: { image: { id: 'img1' }, contentHash: 'hash1' },
					email: 'test@example.com'
				}
			];
			const syncError = new Error('Network error');

			mockDb.getAll.mockResolvedValue(mockCorrections);
			beamup.sendCorrections.mockRejectedValue(syncError);
			const onProgress = vi.fn();

			// Act
			await syncCorrections(mockDb, onProgress);

			// Assert
			expect(onProgress).toHaveBeenCalledWith(['correction1'], 'Network error');
			expect(mockDb.delete).not.toHaveBeenCalled();
		});

		test('should group corrections by origin', async () => {
			// Arrange
			const mockCorrections = [
				{
					id: 'correction1',
					protocol: { beamup: { origin: 'https://example.com' } },
					after: { alternatives: { after1: 0.9 }, value: 'after1' },
					before: { alternatives: { before1: 0.8 }, value: 'before1' },
					metadata: { id: 'meta1', type: 'enum' },
					client: { version: '1.0.0' },
					occurredAt: '2023-01-01T00:00:00Z',
					subject: { image: { id: 'img1' }, contentHash: 'hash1' },
					email: 'test@example.com'
				},
				{
					id: 'correction2',
					protocol: { beamup: { origin: 'https://example.com' } },
					after: { alternatives: { after2: 0.8 }, value: 'after2' },
					before: { alternatives: { before2: 0.7 }, value: 'before2' },
					metadata: { id: 'meta2', type: 'enum' },
					client: { version: '1.0.0' },
					occurredAt: '2023-01-02T00:00:00Z',
					subject: { image: { id: 'img2' }, contentHash: 'hash2' },
					email: 'test@example.com'
				},
				{
					id: 'correction3',
					protocol: { beamup: { origin: 'https://other.com' } },
					after: { alternatives: { after3: 0.7 }, value: 'after3' },
					before: { alternatives: { before3: 0.6 }, value: 'before3' },
					metadata: { id: 'meta3', type: 'enum' },
					client: { version: '1.0.0' },
					occurredAt: '2023-01-03T00:00:00Z',
					subject: { observation: { id: 'obs1' }, contentHash: 'hash3' },
					email: 'test@example.com'
				}
			];

			mockDb.getAll.mockResolvedValue(mockCorrections);
			beamup.sendCorrections.mockResolvedValue(undefined);

			// Act
			await syncCorrections(mockDb);

			// Assert
			expect(beamup.sendCorrections).toHaveBeenCalledTimes(2);

			// First call should have 2 corrections for https://example.com
			const firstCall = beamup.sendCorrections.mock.calls[0][0];
			expect(firstCall.origin).toBe('https://example.com');
			expect(firstCall.corrections).toHaveLength(2);

			// Second call should have 1 correction for https://other.com
			const secondCall = beamup.sendCorrections.mock.calls[1][0];
			expect(secondCall.origin).toBe('https://other.com');
			expect(secondCall.corrections).toHaveLength(1);
		});
	});
});
