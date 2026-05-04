import type { GroupSettings, SortSettings } from './schemas/sessions.js';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { galleryEffectiveSorter, galleryItemsGrouper, galleryItemsSorter } from './gallery.ts';
import * as idb from './idb.svelte.js';

type MockGalleryItem = {
	id?: string;
	name?: string;
	metadata: Record<string, { value?: number | string; confidence?: number }>;
	[key: string]: unknown;
};

type MockMetadata = { id: string; type: string; label: string };

// Mock the dependencies
vi.mock('./idb.svelte.js', () => ({
	databaseHandle: vi.fn(),
	tables: {
		Metadata: {
			getOrThrow: vi.fn(),
		},
	},
}));

vi.mock('./metadata/index.js', () => ({
	compareByMetadataValue: vi.fn((config) => {
		return (a: MockGalleryItem, b: MockGalleryItem) => {
			const aVal = a.metadata[config.metadata.id]?.value ?? 0;
			const bVal = b.metadata[config.metadata.id]?.value ?? 0;
			return aVal - bVal;
		};
	}),
	metadataOptionsOf: vi.fn(async () => [
		{ key: 'option1', index: 0, label: 'Option 1' },
		{ key: 'option2', index: 1, label: 'Option 2' },
	]),
	metadataValueGrouper: vi.fn((_config) => {
		return (value: unknown) => `grouped_${String(value)}`;
	}),
}));

vi.mock('./settings.svelte.js', () => ({
	getSettings: vi.fn(() => ({ language: 'en' })),
}));

vi.mock('./utils.js', () => ({
	applySortDirection: vi.fn((direction, comparator) => {
		return direction === 'asc'
			? comparator
			: (a: MockGalleryItem, b: MockGalleryItem) => -comparator(a, b);
	}),
	compareBy: vi.fn((selector) => {
		return (a: MockGalleryItem, b: MockGalleryItem) => {
			const aVal = typeof selector === 'function' ? selector(a) : a[selector];
			const bVal = typeof selector === 'function' ? selector(b) : b[selector];
			if (aVal < bVal) return -1;
			if (aVal > bVal) return 1;
			return 0;
		};
	}),
}));

vi.mock('./schemas/metadata.js', () => ({
	removeNamespaceFromMetadataId: vi.fn((id) => id.split(':').pop()),
	splitMetadataId: vi.fn((id) => {
		const [, metadataId] = id.split(':');
		return { namespace: 'namespace', id: metadataId };
	}),
}));

describe('gallery', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('galleryItemsSorter', () => {
		it('sorts by id', async () => {
			const settings = {
				field: 'id',
				direction: 'asc',
			} as typeof SortSettings.infer;

			const sorter = await galleryItemsSorter(settings);

			const item1 = { id: 'a', name: 'Item A', metadata: {} };
			const item2 = { id: 'b', name: 'Item B', metadata: {} };

			expect(sorter(item1, item2)).toBeLessThan(0);
			expect(sorter(item2, item1)).toBeGreaterThan(0);
		});

		it('sorts by name', async () => {
			const settings = {
				field: 'name',
				direction: 'asc',
			} as typeof SortSettings.infer;

			const sorter = await galleryItemsSorter(settings);

			const item1 = { id: '1', name: 'Apple', metadata: {} };
			const item2 = { id: '2', name: 'Banana', metadata: {} };

			expect(sorter(item1, item2)).toBeLessThan(0);
		});

		it('throws when sorting by metadataConfidence without metadata ID', async () => {
			const settings = {
				field: 'metadataConfidence',
				direction: 'asc',
				metadata: undefined,
			} as unknown as typeof SortSettings.infer;

			await expect(galleryItemsSorter(settings)).rejects.toThrow(
				'Tried to sort by metadata confidence without specifying metadata ID'
			);
		});

		it('sorts by metadataConfidence', async () => {
			const settings = {
				field: 'metadataConfidence',
				direction: 'asc',
				metadata: 'namespace:field',
			} as typeof SortSettings.infer;

			const sorter = await galleryItemsSorter(settings);

			const item1 = {
				id: '1',
				name: 'Item 1',
				metadata: { 'namespace:field': { confidence: 0.5 } },
			};
			const item2 = {
				id: '2',
				name: 'Item 2',
				metadata: { 'namespace:field': { confidence: 0.9 } },
			};

			expect(sorter(item1, item2)).toBeLessThan(0);
		});

		it('sorts by metadataValue', async () => {
			const mockMetadata: MockMetadata = {
				id: 'namespace:field',
				type: 'string',
				label: 'Field',
			};
			vi.mocked(idb.tables.Metadata.getOrThrow).mockResolvedValue(
				mockMetadata as unknown as Awaited<
					ReturnType<typeof idb.tables.Metadata.getOrThrow>
				>
			);

			const settings = {
				field: 'metadataValue',
				direction: 'asc',
				metadata: 'namespace:field',
			} as typeof SortSettings.infer;

			const sorter = await galleryItemsSorter(settings);
			expect(sorter).toBeDefined();
		});
	});

	describe('galleryItemsGrouper', () => {
		it('returns null when grouping by none', async () => {
			const settings = {
				field: 'none',
			} as typeof GroupSettings.infer;

			const grouper = await galleryItemsGrouper(settings);
			expect(grouper).toBeNull();
		});

		it('throws when grouping without metadata ID', async () => {
			const settings = {
				field: 'metadataPresence',
				metadata: undefined,
			} as unknown as typeof GroupSettings.infer;

			await expect(galleryItemsGrouper(settings)).rejects.toThrow(
				'tried to group by metadataPresence without specifying metadata ID'
			);
		});

		it('groups by metadata presence', async () => {
			const mockMetadata: MockMetadata = {
				id: 'namespace:field',
				type: 'string',
				label: 'Field',
			};
			vi.mocked(idb.tables.Metadata.getOrThrow).mockResolvedValue(
				mockMetadata as unknown as Awaited<
					ReturnType<typeof idb.tables.Metadata.getOrThrow>
				>
			);

			const settings = {
				field: 'metadataPresence',
				metadata: 'namespace:field',
			} as typeof GroupSettings.infer;

			const grouper = await galleryItemsGrouper(settings);
			expect(grouper).toBeDefined();

			const itemWith = { metadata: { 'namespace:field': { value: 'test' } } };
			const itemWithout = { metadata: {} };

			const [keyWith, labelWith] = grouper!(itemWith);
			const [keyWithout, labelWithout] = grouper!(itemWithout);

			expect(keyWith).toBe(0);
			expect(keyWithout).toBe(1);
			expect(labelWith).toContain('Avec');
			expect(labelWithout).toContain('Sans');
		});

		it('groups by metadata confidence', async () => {
			const mockMetadata: MockMetadata = {
				id: 'namespace:field',
				type: 'string',
				label: 'Field',
			};
			vi.mocked(idb.tables.Metadata.getOrThrow).mockResolvedValue(
				mockMetadata as unknown as Awaited<
					ReturnType<typeof idb.tables.Metadata.getOrThrow>
				>
			);

			const settings = {
				field: 'metadataConfidence',
				metadata: 'namespace:field',
			} as typeof GroupSettings.infer;

			const grouper = await galleryItemsGrouper(settings);

			const item1 = { metadata: { 'namespace:field': { confidence: 0.9 } } };
			const item2 = { metadata: { 'namespace:field': { confidence: 0.6 } } };
			const item3 = { metadata: { 'namespace:field': { confidence: 0.3 } } };

			const [key1] = grouper!(item1);
			const [key2] = grouper!(item2);
			const [key3] = grouper!(item3);

			expect(key1).toBe(0); // 75%-100%
			expect(key2).toBe(1); // 50%-75%
			expect(key3).toBe(2); // 25%-50%
		});

		it('groups by metadata value', async () => {
			const mockMetadata: MockMetadata = {
				id: 'namespace:field',
				type: 'string',
				label: 'Field',
			};
			vi.mocked(idb.tables.Metadata.getOrThrow).mockResolvedValue(
				mockMetadata as unknown as Awaited<
					ReturnType<typeof idb.tables.Metadata.getOrThrow>
				>
			);

			const settings = {
				field: 'metadataValue',
				metadata: 'namespace:field',
				tolerances: {},
			} as typeof GroupSettings.infer;

			const grouper = await galleryItemsGrouper(settings);
			expect(grouper).toBeDefined();
		});
	});

	describe('galleryEffectiveSorter', () => {
		it('combines sorter and grouper', async () => {
			const mockMetadata: MockMetadata = {
				id: 'namespace:field',
				type: 'string',
				label: 'Field',
			};
			vi.mocked(idb.tables.Metadata.getOrThrow).mockResolvedValue(
				mockMetadata as unknown as Awaited<
					ReturnType<typeof idb.tables.Metadata.getOrThrow>
				>
			);

			const sortSettings = {
				field: 'id',
				direction: 'asc',
			} as typeof SortSettings.infer;

			const groupSettings = {
				field: 'metadataPresence',
				metadata: 'namespace:field',
			} as typeof GroupSettings.infer;

			const effectiveSorter = await galleryEffectiveSorter({
				sortSettings,
				groupSettings,
			});

			const itemA = {
				id: 'a',
				name: 'Item A',
				metadata: { 'namespace:field': { value: 'test' } },
			};
			const itemB = {
				id: 'b',
				name: 'Item B',
				metadata: {},
			};

			// Items with different groups should sort by group first
			expect(effectiveSorter(itemA, itemB)).toBeLessThan(0);
		});

		it('returns null grouper when not grouping', async () => {
			const sortSettings = {
				field: 'id',
				direction: 'asc',
			} as typeof SortSettings.infer;

			const groupSettings = {
				field: 'none',
			} as typeof GroupSettings.infer;

			const effectiveSorter = await galleryEffectiveSorter({
				sortSettings,
				groupSettings,
			});

			const item1 = { id: 'a', name: 'A', metadata: {} };
			const item2 = { id: 'b', name: 'B', metadata: {} };

			expect(effectiveSorter(item1, item2)).toBeLessThan(0);
		});
	});
});
