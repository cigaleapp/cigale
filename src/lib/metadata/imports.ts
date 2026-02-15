import { namespacedMetadataId } from '$lib/schemas/metadata.js';
import { ExportedProtocol, ProtocolImport, ProtocolRegistry } from '$lib/schemas/protocols.js';

let PROTOCOLS_REGISTRY: typeof ProtocolRegistry.infer | null = null;

export async function resolveProtocolImports(
	protocolId: string,
	imports: Array<typeof ProtocolImport.infer>
): Promise<Pick<typeof ExportedProtocol.infer, 'metadata' | 'sessionMetadata'>> {
	if (imports.length === 0) {
		return {
			metadata: {},
			sessionMetadata: {}
		};
	}

	if (!PROTOCOLS_REGISTRY) {
		PROTOCOLS_REGISTRY = await fetch(
			'https://raw.githubusercontent.com/cigaleapp/cigale/main/protocols/registry.json'
		)
			.then((res) => res.json())
			.then((data) => ProtocolRegistry.assert(data));
	}

	const parentProtocols = new Map<string, typeof ExportedProtocol.infer>();
	const inheritedMetadata: Pick<typeof ExportedProtocol.infer, 'metadata' | 'sessionMetadata'> = {
		metadata: {},
		sessionMetadata: {}
	};

	for (const imprt of imports) {
		const registryEntry = PROTOCOLS_REGISTRY?.protocols.find(
			(entry) => entry.id === imprt.from
		);

		if (!registryEntry) {
			throw new Error(`Protocol ${protocolId} inherits from unknown protocol ${imprt.from}`);
		}

		if (!parentProtocols.has(imprt.from)) {
			const parentProtocol = await fetch(registryEntry.url)
				.then((res) => res.json())
				.then((data) => ExportedProtocol.assert(data));

			parentProtocols.set(imprt.from, parentProtocol);
		}

		const parentProtocol = parentProtocols.get(imprt.from)!;

		for (const key of imprt.metadata) {
			const namespacedKey = {
				parent: namespacedMetadataId(imprt.from, key),
				child: namespacedMetadataId(protocolId, key)
			};

			if (namespacedKey.parent in parentProtocol.metadata) {
				inheritedMetadata.metadata[namespacedKey.child] = {
					...parentProtocol.metadata[namespacedKey.parent],
					inheritedFrom: imprt.from
				};
			}

			if (namespacedKey.parent in parentProtocol.sessionMetadata) {
				inheritedMetadata.sessionMetadata[namespacedKey.child] = {
					...parentProtocol.sessionMetadata[namespacedKey.parent],
					inheritedFrom: imprt.from
				};
			}
		}
	}

	return inheritedMetadata;
}
