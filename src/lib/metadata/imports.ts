import type * as DB from '#lib/database.js';
import type { NamespacedMetadataID } from '#lib/schemas/common.js';

import { isNamespacedToProtocol } from '#lib/schemas/metadata.js';

export function metadataUsedByProtocol(
	protocol: Pick<DB.Protocol, 'id' | 'metadata'>,
	metadata: NamespacedMetadataID
) {
	return protocol.metadata.includes(metadata);
}
