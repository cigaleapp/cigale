import type { DatabaseHandle } from '$lib/idb.svelte.js';
import { namespaceOfMetadataId } from '$lib/schemas/metadata.js';
import { ExportedProtocol, ProtocolRegistry } from '$lib/schemas/protocols.js';

let PROTOCOLS_REGISTRY: typeof ProtocolRegistry.infer | null = null;

/**
 * Downloads (recursively) all the protocols needed to import the given protocol
 */
export async function resolveProtocolImports(
	db: DatabaseHandle,
	protocolId: string,
	imports: (typeof ExportedProtocol.inferOut)['importedMetadata'],
	/** Resolved imports  */
	resolved = new Map<string, typeof ExportedProtocol.infer>()
): Promise<(typeof ExportedProtocol.infer)[]> {
	if (imports.length === 0) {
		return [];
	}

	if (!PROTOCOLS_REGISTRY) {
		PROTOCOLS_REGISTRY = await fetch(
			'https://raw.githubusercontent.com/cigaleapp/cigale/main/protocols/registry.json'
		)
			.then((res) => res.json())
			.then((data) => ProtocolRegistry.assert(data));
	}

	const importedProtocolIds = new Set(imports.map((imp) => namespaceOfMetadataId(imp.source)));

	for (const from of importedProtocolIds) {
		if (resolved.has(from)) {
			continue;
		}

		if (await db.get('Protocol', from)) {
			// Protocol already in the database, we can skip it
			continue;
		}

		const registryEntry = PROTOCOLS_REGISTRY?.protocols.find((entry) => entry.id === from);

		if (!registryEntry) {
			throw new Error(`Protocol ${protocolId} inherits from unknown protocol ${from}`);
		}

		const parentProtocol = await fetch(registryEntry.url)
			.then((res) => res.json())
			.then((data) => ExportedProtocol.assert(data));

		// TODO resolve parentProtocol.importedMetadata in case there's a >2-depth import. We can also detect import cycles there

		resolved.set(from, parentProtocol);

		await resolveProtocolImports(
			db,
			parentProtocol.id,
			parentProtocol.importedMetadata,
			resolved
		);
	}

	return [...resolved.values()];
}
