import _rawRegistry from '$lib/registry.json' with { type: 'json' };
import { ProtocolRegistry } from '$lib/schemas/protocols.js';

let PROTOCOLS_REGISTRY: typeof ProtocolRegistry.infer | null = null;

export async function fetchProtocolRegistry() {
	// const registryUrl = Capacitor.isNativePlatform()
	// 	? `${import.meta.env.webOrigin}/registry.json`
	// 	: `${base}/registry.json`;

	// PROTOCOLS_REGISTRY ??= ProtocolRegistry.assert(await fetch(registryUrl).then((r) => r.json()));
	PROTOCOLS_REGISTRY ??= ProtocolRegistry.assert(_rawRegistry);

	return PROTOCOLS_REGISTRY;
}
