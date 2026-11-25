import type { DatabaseHandle } from '#lib/idb.svelte.js';

import { ProtocolRegistry } from '#lib/schemas/protocols.js';
import { compareBy } from '#lib/utils.ts';

import { manifestVersionsCompatible } from './manifestversion.js';

/**
 * Cache of fetched registries, keyed by registry URL.
 */
const PROTOCOLS_REGISTRIES = new Map<URL, typeof ProtocolRegistry.infer>();

let REGISTRY_URLS: URL[] = JSON.parse(import.meta.env.protocolRegistryUrls ?? '[]').map(
	(u: string) => new URL(u)
);

export function addProtocolRegistry(
	url: URL | string,
	{
		priority = -Infinity,
	}: {
		/** Where to place the registry URL in the array: in case of protocol ID conflicts, the later URLs take precedence. Pass Infinity to make it more important than all the others already present, and -Ininity for less priority than all already present */
		priority?: number;
	} = {}
) {
	switch (priority) {
		case Infinity: {
			REGISTRY_URLS.push(new URL(url));
			break;
		}
		case -Infinity: {
			REGISTRY_URLS.unshift(new URL(url));
			break;
		}
		default: {
			REGISTRY_URLS = [
				...REGISTRY_URLS.slice(0, priority),
				new URL(url),
				...REGISTRY_URLS.slice(priority),
			];
		}
	}
}

/**
 * Fetches all registries (each cached by URL) and merges them into a single
 * registry. Protocols sharing an `id` are deduplicated — the first registry
 * wins. A registry that fails to fetch is skipped; an error is thrown only
 * if no registry could be fetched.
 */
export async function fetchProtocolRegistries(): Promise<typeof ProtocolRegistry.infer> {
	const results = await Promise.allSettled(
		REGISTRY_URLS.map(async (url) => {
			let registry = PROTOCOLS_REGISTRIES.get(url);
			if (!registry) {
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`Failed to fetch registry from ${url}: ${response.status}`);
				}
				registry = ProtocolRegistry.assert(await response.json());
				PROTOCOLS_REGISTRIES.set(url, registry);
			}
			return registry;
		})
	);

	const seen = new Set<string>();
	const protocols = [];
	let fetchedAny = false;
	for (const result of results) {
		if (result.status === 'rejected') {
			console.warn('Failed to fetch protocol registry:', result.reason);
			continue;
		}
		fetchedAny = true;
		for (const protocol of result.value.protocols) {
			if (seen.has(protocol.id)) continue;
			seen.add(protocol.id);
			protocols.push(protocol);
		}
	}

	if (!fetchedAny) {
		throw new Error('Failed to fetch any protocol registry');
	}

	return { protocols };
}

export async function lookupMostRecentCompatibleProtocol(id: string): Promise<URL> {
	const registry = await fetchProtocolRegistries();
	const entry = registry.protocols.find((p) => p.id === id);
	if (!entry) throw new Error(`Protocol ${id} not in registry`);
	if (manifestVersionsCompatible(entry.manifestVersion)) return new URL(entry.url);

	const older = entry.older
		.toSorted(compareBy((e) => -e.version))
		.find((e) => manifestVersionsCompatible(e.manifestVersion));

	if (!older) throw new Error("Mettez à jour l'app pour installer ce protocole");

	return new URL(older.url);
}

/**
 * All protocols from registry
 * and any protocol that was installed
 * but is not listed in it
 */
export async function* listAllProtocols(db: DatabaseHandle) {
	const locally = await db.getAll('Protocol');

	for (const p of locally) {
		yield { protocol: p, installed: true };
	}

	const registry = await fetchProtocolRegistries().catch((e) => {
		console.error("Couldn't fetch protocol registry", e);
		return { protocols: [] };
	});

	for (const p of registry.protocols) {
		if (locally.some((l) => l.id === p.id)) continue;
		if (!p.suggested) continue;

		yield {
			installed: false,
			compatible: manifestVersionsCompatible(p.manifestVersion),
			protocol: { source: p.url, ...p },
		};
	}
}
