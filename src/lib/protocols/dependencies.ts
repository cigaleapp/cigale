import type { DatabaseHandle } from '#lib/idb.svelte.js';

export async function dependentProtocols(
	db: DatabaseHandle,
	childProtocol: string,
	seen = new Set<string>()
) {
	const protocols = await db.getAll('Protocol');

	for await (const p of protocols) {
		if (seen.has(p.id)) continue;
		if (p.imports?.some((imp) => imp.from === childProtocol)) {
			seen.add(p.id);
			dependentProtocols(db, p.id, seen);
		}
	}

	return seen;
}
