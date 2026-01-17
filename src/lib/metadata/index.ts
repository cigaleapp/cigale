import type * as DB from '$lib/database.js';

/**
 * A null-value MetadataValue object
 */
export const METADATA_ZERO_VALUE = {
	// @ts-expect-error strict null
	value: null,
	manuallyModified: false,
	confidence: 0,
	alternatives: {}
} as const satisfies DB.MetadataValue;


export * from './display.js';
export * from './merging.js';
export * from './namespacing.js';
export * from './serializing.js';
export * from './storage.js';
export * from './types.js';
