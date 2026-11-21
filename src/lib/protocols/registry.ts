import type { DatabaseHandle } from '#lib/idb.svelte.js';

import _rawRegistry from '#lib/../../protocols/registry.json' with { type: 'json' };
import { ProtocolRegistry } from '#lib/schemas/protocols.js';
import { compareBy } from '#lib/utils.ts';

import { manifestVersionsCompatible } from './manifestversion';

let PROTOCOLS_REGISTRY: typeof ProtocolRegistry.infer | null = null;

export async function fetchProtocolRegistry() {
	// const registryUrl = Capacitor.isNativePlatform()
	// 	? `${import.meta.env.webOrigin}/registry.json`
	// 	: `${base}/registry.json`;

	// PROTOCOLS_REGISTRY ??= ProtocolRegistry.assert(await fetch(registryUrl).then((r) => r.json()));
	PROTOCOLS_REGISTRY ??= ProtocolRegistry.assert(_rawRegistry);

	return PROTOCOLS_REGISTRY;
}

export async function lookupMostRecentCompatibleProtocol(id: string): Promise<URL> {
	const registry = await fetchProtocolRegistry();
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

	const registry = await fetchProtocolRegistry().catch((e) => {
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
