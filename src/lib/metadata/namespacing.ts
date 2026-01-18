import { isNamespacedToProtocol, removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
import { fromEntries } from '$lib/utils.js';

import { METADATA_ZERO_VALUE } from './index.js';

/**
 * Returns a un-namespaced object of all metadata values of the given protocol, given the metadata values object of an image/observation. If a metadata value is absent from the given values, the value is still present, but set to `null`.
 */
export function protocolMetadataValues(
	protocol: { metadata: string[]; id: string },
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	values: { [x: string]: any }
) {
	return fromEntries(
		protocol.metadata
			.filter((key) => isNamespacedToProtocol(protocol.id, key))
			.map((key) => [removeNamespaceFromMetadataId(key), values[key] ?? METADATA_ZERO_VALUE])
	);
}
