import type { DatabaseHandle } from '#lib/idb.svelte.js';

import { ArkErrors, type } from 'arktype';

import { Tables } from '#lib/database.js';
import { streamJsonl } from '#lib/jsonl.ts';
import { lookupMostRecentCompatibleProtocol } from '#lib/protocols/registry.js';
import { NamespacedMetadataID } from '#lib/schemas/common.js';
import {
	ensureNamespacedMetadataId,
	MetadataEnumVariant,
	MetadataInDatabase,
	metadataOptionId,
} from '#lib/schemas/metadata.js';
import { ExportedProtocol } from '#lib/schemas/protocols.js';
import { recomputeSearchIndex } from '#lib/search.ts';
import { entries, mapKeys, parseYAMLorJSON } from '#lib/utils.ts';

export class DependsOnOtherProtocolError extends Error {
	constructor(public protocolIds: string[]) {
		super();
	}
}

export async function importProtocol(
	db: DatabaseHandle,
	url: string | URL,
	options: {
		onProgress: (protocol: string, phase: string, done: number, total: number) => void;
	}
) {
	try {
		await importSingleProtocol(db, url, options);
	} catch (error) {
		if (!(error instanceof DependsOnOtherProtocolError)) {
			throw new Error(`Could not import protocol at ${url}`, { cause: error });
		}

		for (const id of error.protocolIds) {
			const url = await lookupMostRecentCompatibleProtocol(id);
			await importProtocol(db, url, options);
		}

		await importSingleProtocol(db, url, options);
	}
}

export async function importSingleProtocol(
	db: DatabaseHandle,
	url: string | URL,
	options: {
		onProgress: (protocol: string, phase: string, done: number, total: number) => void;
	}
) {
	const progress = new Progress(url.toString());
	progress.bind(options.onProgress);

	// progress.phase('lookup', 1);
	// const url = await lookupMostRecentCompatibleProtocol(id);

	progress.phase('get-manifest', 1);
	const manifest = await fetch(url)
		.then((response) => parseYAMLorJSON(response))
		.then((parsed) => ExportedProtocol.in(parsed));
	progress.increment();

	if (manifest instanceof ArkErrors) {
		throw new Error(manifest.summary);
	}

	progress.phase('check-imports', manifest.imports?.length ?? 1);
	const imports = new Set((manifest.imports ?? []).map((imp) => imp.from));
	const missing = new Set<string>();
	for (const id of imports) {
		progress.increment();
		if (await db.get('Protocol', id)) continue;
		missing.add(id);
	}

	if (missing.size > 0) {
		throw new DependsOnOtherProtocolError([...missing]);
	}

	const namespaced = (bare: string) => ensureNamespacedMetadataId(bare, manifest.id);

	const metadatas = new Map(
		entries(mapKeys({ ...manifest.metadata, ...(manifest.sessionMetadata ?? {}) }, namespaced))
	);

	progress.phase('metadata', metadatas.size);

	for (const [id, metadata] of metadatas) {
		await db.put(
			'Metadata',
			// TODO: remove this whole .from() thing once #2312 is resolved
			MetadataInDatabase.in.merge({ '+': 'delete' }).from({
				id,
				...metadata,
			})
		);

		progress.increment();
	}

	progress.phase('metadata-options', 0);

	const ExternalOptionsHeader = type({
		count: 'number',
	});

	for (const metadata of metadatas.values()) {
		if (metadata.type !== 'enum') continue;

		if (metadata.options) {
			progress.total += metadata.options.length;
		}

		if (metadata.externalOptions) {
			for await (const object of streamJsonl(metadata.externalOptions.at)) {
				const header = ExternalOptionsHeader.assert(object);

				progress.total += header.count;

				break;
			}
		}
	}

	for (const [id, metadata] of metadatas) {
		if (metadata.type !== 'enum') continue;

		// TODO: _narrowableIn, searcher

		const storeOption = async (option: typeof MetadataEnumVariant.inferIn) => {
			const optionId = metadataOptionId(id, option.key);
			const tx = db.transaction(['MetadataOption'], 'readwrite');
			await tx.objectStore('MetadataOption').put({
				id: optionId,
				metadataId: id,
				...option,
			});

			await recomputeSearchIndex(tx, Tables, 'MetadataOption', optionId);
		};

		if (metadata.options) {
			debugger;
			for (const option of metadata.options) {
				await storeOption(option);
				progress.increment();
			}
		}

		if (metadata.externalOptions) {
			for await (const object of streamJsonl(metadata.externalOptions.at)) {
				if (ExternalOptionsHeader.allows(object)) continue;

				const option = MetadataEnumVariant.assert(object);
				await storeOption(option);

				progress.increment();
			}
		}
	}

	progress.phase('resolve-imported-items', manifest.imports?.length ?? 1);

	const importedMetadata = new Set<NamespacedMetadataID>();
	const importedSessionMetadata = new Set<NamespacedMetadataID>();

	const metadataGroups = entries(manifest.metadataGroups ?? {}).map(([id, group]) => ({
		id,
		...group,
	}));

	for (const imp of manifest.imports ?? []) {
		const ns = (bare: string) => ensureNamespacedMetadataId(bare, imp.from);

		for (const id of imp.metadata ?? []) {
			importedMetadata.add(ns(id));
		}
		for (const id of imp.sessionMetadata ?? []) {
			importedSessionMetadata.add(ns(id));
		}

		for (const id of imp.metadataGroups ?? []) {
			const p = await db.get('Protocol', imp.from);
			if (!p) throw new Error(`Protocol ${imp.from} not in db`);

			const group = p.metadataGroups?.find((g) => g.id === id);
			if (!group) {
				throw new Error(
					`Protocol ${imp.from} has no metadata group with id ${id} (groups: ${p.metadataGroups?.map((g) => g.id)?.join(', ') ?? '<none>'})`
				);
			}

			metadataGroups.push(group);

			for (const mid of p.metadata) {
				const m = await db.get('Metadata', mid);
				if (!m) throw new Error(`Metaata ${mid} not in database`);

				if (m.group !== id) continue;

				importedMetadata.add(mid);
				if (p.sessionMetadata?.includes(mid)) importedSessionMetadata.add(mid);
			}
		}

		progress.increment();
	}

	const allMetadataKeys = [...metadatas.keys(), ...importedMetadata, ...importedSessionMetadata];

	const sessionMetadataKeys = [
		...Object.keys(manifest.sessionMetadata ?? {}).map(namespaced),
		...importedSessionMetadata,
	];

	progress.phase('protocol', 1);

	await db.put('Protocol', {
		...manifest,
		metadataGroups,
		metadata: allMetadataKeys,
		sessionMetadata: sessionMetadataKeys,
		metadataOrder: manifest.metadataOrder?.map(namespaced) ?? allMetadataKeys,
	});

	progress.increment();
}

class Progress {
	#cb: (protocol: string, phase: string, done: number, total: number) => void;

	constructor(
		public protocolId: string,
		public phaseName = '',
		public done = 0,
		public total = 0
	) {
		this.#cb = () => {};
	}

	bind(cb: (protocol: string, phase: string, done: number, total: number) => void) {
		this.#cb = cb;
	}

	phase(phase: string, total: number) {
		this.done = 0;
		this.phaseName = phase;
		this.total = total;
		this.update();
	}

	increment(by = 1) {
		this.done += by;
		this.update();
	}

	update() {
		this.#cb(this.protocolId, this.phaseName, this.done, this.total);
	}
}
