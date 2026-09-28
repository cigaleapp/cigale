import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';

import { fetchProtocolRegistry } from '$lib/protocols/registry.js';
import { isNamespacedToProtocol, namespaceOfMetadataId } from '$lib/schemas/metadata.js';
import { ExportedProtocol } from '$lib/schemas/protocols.js';

/**
 * Resolve a metadata ID to its source metadata id in case it is imported
 * @param protocol
 * @param id
 * @returns
 */
export function resolveMetadataImport(
	protocol: Partial<Pick<DB.Protocol, 'importedMetadata'>>,
	id: NamespacedMetadataID
) {
	return protocol.importedMetadata?.find((imp) => imp.target === id)?.source ?? id;
}

export function metadataUsedByProtocol(
	protocol: Pick<DB.Protocol, 'id' | 'importedMetadata'>,
	metadata: NamespacedMetadataID
) {
	if (isNamespacedToProtocol(protocol.id, metadata)) return true;
	return protocol.importedMetadata?.some((imp) => imp.target === metadata);
}

export function importedProtocols({
	importedMetadata,
	importedMetadataGroups,
}: Pick<typeof ExportedProtocol.inferOut, 'importedMetadata' | 'id' | 'importedMetadataGroups'>) {
	return new Set([
		...importedMetadata.map((imp) => namespaceOfMetadataId(imp.source)),
		...importedMetadataGroups.map((imp) => imp.from),
	]);
}

/**
 * Downloads (recursively) all the protocols needed to import the given protocol
 */
export async function resolveProtocolImports(
	db: DatabaseHandle,
	{
		id: protocolId,
		importedMetadata,
		importedMetadataGroups,
	}: Pick<typeof ExportedProtocol.inferOut, 'importedMetadata' | 'id' | 'importedMetadataGroups'>,
	/** Resolved imports  */
	resolved = new Map<string, typeof ExportedProtocol.infer>()
): Promise<(typeof ExportedProtocol.infer)[]> {
	if (importedMetadata.length === 0 && importedMetadataGroups.length === 0) {
		return [];
	}

	const importedProtocolIds = importedProtocols({ importedMetadata, importedMetadataGroups });
	const registry = await fetchProtocolRegistry();

	for (const from of importedProtocolIds) {
		if (resolved.has(from)) {
			continue;
		}

		if (await db.get('Protocol', from)) {
			// Protocol already in the database, we can skip it
			continue;
		}

		const registryEntry = registry.protocols.find((entry) => entry.id === from);

		if (!registryEntry) {
			throw new Error(`Protocol ${protocolId} inherits from unknown protocol ${from}`);
		}

		const parentProtocol = await fetch(registryEntry.url)
			.then((res) => res.json())
			.then((data) => ExportedProtocol.assert(data));

		// TODO resolve parentProtocol.importedMetadata in case there's a >2-depth import. We can also detect import cycles there

		resolved.set(from, parentProtocol);

		await resolveProtocolImports(db, parentProtocol, resolved);
	}

	return [...resolved.values()];
}
