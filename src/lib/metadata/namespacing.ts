import type * as DB from '$lib/database.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';
import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
import { fromEntries } from '$lib/utils.js';

import { METADATA_ZERO_VALUE } from './index.js';

/**
 * Returns a un-namespaced object of all metadata values of the given protocol, given the metadata values object of an image/observation. If a metadata value is absent from the given values, the value is still present, but set to `null`.
 */
export function protocolMetadataValues(
	area: 'session' | 'observations+images',
	protocol: Pick<DB.Protocol, 'id' | 'metadata' | 'importedMetadata' | 'sessionMetadata'>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	values: { [x: string]: any }
) {
	const resolveImport = (key: NamespacedMetadataID) =>
		protocol.importedMetadata?.find((imp) => [imp.target, imp.source].includes(key));

	return fromEntries(
		protocol.metadata
			.filter((key) => {
				const isSessionMetadata = protocol.sessionMetadata.includes(key);
				const isSessionwideImport = resolveImport(key)?.sessionwide;

				return Boolean(isSessionMetadata || isSessionwideImport) === (area === 'session');
			})
			.map((key) => resolveImport(key)?.source ?? key)
			.map((key) => [removeNamespaceFromMetadataId(key), values[key] ?? METADATA_ZERO_VALUE])
	);
}
