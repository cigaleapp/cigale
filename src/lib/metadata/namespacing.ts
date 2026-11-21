import type * as DB from '#lib/database.js';
import type { NamespacedMetadataID } from '#lib/schemas/common.js';

import { isNamespacedToProtocol, removeNamespaceFromMetadataId } from '#lib/schemas/metadata.js';
import { fromEntries } from '#lib/utils.js';

import { METADATA_ZERO_VALUE } from './index.js';

/**
 * Returns a un-namespaced object of all metadata values of the given protocol, given the metadata values object of an image/observation. If a metadata value is absent from the given values, the value is still present, but set to `null`.
 */
export function protocolMetadataValues(
	area: 'session' | 'observations+images',
	protocol: Pick<DB.Protocol, 'id' | 'metadata' | 'sessionMetadata'>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	values: { [x: string]: any }
) {
	return fromEntries(
		protocol.metadata
			.filter((id) => {
				if (!protocol.metadata.includes(id)) return false;
				const sessionwide = protocol.sessionMetadata.includes(id);
				return sessionwide === (area === 'session');
			})
			.map((id) => [removeNamespaceFromMetadataId(id), values[id] ?? METADATA_ZERO_VALUE])
	);
}

/**
 * Get a full metadata id from a non-namespaced one.
 * If already namespaced, returns undefined unless the
 * namespaced metadata is in the protocol
 * If not namespaced, finds the metadata
 * in the given protocol that matches
 * when ignoring namespaces
 */
export function resolveMetadataId(
	protocol: Pick<DB.Protocol, 'metadata' | 'id'>,
	key: string
): NamespacedMetadataID | undefined {
	if (isNamespacedToProtocol(null, key)) {
		if (!protocol.metadata.includes(key)) return;
		return key;
	}

	return protocol.metadata.find((id) => removeNamespaceFromMetadataId(id) === key);
}
