import { ExportedProtocol, ProtocolImport, ProtocolRegistry } from '$lib/schemas/protocols.js';

let PROTOCOLS_REGISTRY: typeof ProtocolRegistry.infer | null = null;

/**
 * Downloads (recursively) all the protocols needed to import the given protocol
 */
export async function resolveProtocolImports(
	protocolId: string,
	imports: Array<typeof ProtocolImport.infer>,
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

	for (const imprt of imports) {
		if (resolved.has(imprt.from)) {
			continue;
		}

		const registryEntry = PROTOCOLS_REGISTRY?.protocols.find(
			(entry) => entry.id === imprt.from
		);

		if (!registryEntry) {
			throw new Error(`Protocol ${protocolId} inherits from unknown protocol ${imprt.from}`);
		}

		const parentProtocol = await fetch(registryEntry.url)
			.then((res) => res.json())
			.then((data) => ExportedProtocol.assert(data));

		// TODO resolve parentProtocol.importedMetadata in case there's a >2-depth import. We can also detect import cycles there

		resolved.set(imprt.from, parentProtocol);

		await resolveProtocolImports(parentProtocol.id, parentProtocol.imports ?? [], resolved);
	}

	return [...resolved.values()];
}
