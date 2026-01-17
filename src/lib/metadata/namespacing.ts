import { isNamespacedToProtocol, removeNamespaceFromMetadataId } from '$lib/schemas/metadata';
import { fromEntries } from '$lib/utils';

import { METADATA_ZERO_VALUE } from '.';

/**
 * Returns a un-namespaced object of all metadata values of the given protocol, given the metadata values object of an image/observation. If a metadata value is absent from the given values, the value is still present, but set to `null`.
 */
export function protocolMetadataValues(
	protocol: { metadata: string[]; id: string },
	values: { [x: string]: any }
) {
	return fromEntries(
		protocol.metadata
			.filter((key) => isNamespacedToProtocol(protocol.id, key))
			.map((key) => [removeNamespaceFromMetadataId(key), values[key] ?? METADATA_ZERO_VALUE])
	);
}
