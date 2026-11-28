import type * as DB from '#lib/database.js';
import type { DatabaseHandle } from '#lib/idb.svelte.js';
import type { NamespacedMetadataID } from '#lib/schemas/common.js';
import type { RuntimeValue } from '#lib/schemas/metadata.js';

import { MetadataEnumVariant } from '#lib/schemas/metadata.js';

/**
 * Lookup by either option key or option extraKeys
 */
export async function findMetadataOption(
	db: DatabaseHandle,
	metadata: NamespacedMetadataID,
	key: string
): Promise<(DB.MetadataEnumVariant & { id: string }) | undefined> {
	const option =
		(await db.get('MetadataOption', metadataOptionId(metadata, key))) ??
		(await db.getFromIndex(
			'MetadataOption',
			'namespacedExtraKeys',
			namespaceToMetadataOptionInDB(metadata, key)
		));

	if (!option) return;

	return { ...MetadataEnumVariant.from(option), id: option.id };
}

export function parseMetadataOptionId(optionId: string) {
	const [metadataId, ...keyparts] = optionId.split(':');
	const key = keyparts.join(':');
	return { metadataId, key };
}

export function metadataOptionId(metadataId: NamespacedMetadataID, key: RuntimeValue<'enum'>) {
	return namespaceToMetadataOptionInDB(metadataId, key.toString());
}

export function namespaceToMetadataOptionInDB<S = string>(
	metadataId: NamespacedMetadataID,
	rest: S
) {
	return `${metadataId}:${rest}` as const;
}
