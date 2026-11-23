import type { DatabaseHandle } from '#lib/idb.svelte.js';

import { ArkErrors, type } from 'arktype';

import { Tables } from '#lib/database.js';
import { httpStreamLines } from '#lib/http-streaming.ts';
import { streamJsonl } from '#lib/jsonl.ts';
import { lookupMostRecentCompatibleProtocol } from '#lib/protocols/registry.js';
import { NamespacedMetadataID } from '#lib/schemas/common.js';
import {
	ensureNamespacedMetadataId,
	Metadata,
	MetadataEnum,
	MetadataEnumVariant,
	MetadataGroup,
	MetadataInDatabase,
	metadataOptionId,
} from '#lib/schemas/metadata.js';
import { ExportedProtocol } from '#lib/schemas/protocols.js';
import { recomputeSearchIndex } from '#lib/search.ts';
import { entries, mapKeys, parseYAMLorJSON, switchValue } from '#lib/utils.ts';

type ProgressCallback = (protocol: string, phase: string, done: number, total: number) => void;

class DependsOnOtherProtocolError extends Error {
	constructor(public protocolIds: string[]) {
		super();
	}
}

export async function importProtocol(
	db: DatabaseHandle,
	url: string | URL,
	options: {
		onProgress: ProgressCallback;
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

type MetadataGroupInDatabase = typeof MetadataGroup.inferIn;

type MetadataInManifest = (typeof ExportedProtocol.inferIn)['metadata'][string];

export async function importSingleProtocol(
	db: DatabaseHandle,
	url: string | URL,
	options: {
		onProgress: ProgressCallback;
	}
) {
	const progress = new Progress(url.toString());
	progress.bind(options.onProgress);

	progress.phase('get-manifest', 1);
	const manifest = await fetchManifest(url);
	progress.increment();

	progress.phase('check-imports', manifest.imports?.length ?? 1);
	await checkImports(db, manifest, progress);

	const namespaced = (bare: string) => ensureNamespacedMetadataId(bare, manifest.id);

	const metadatas = metadatasOfManifest(manifest);

	progress.phase('metadata-options', 0);
	await countEnumOptions(metadatas, progress);

	for (const [id, metadata] of metadatas) {
		if (metadata.type !== 'enum') continue;

		await installEnumOptions(db, id, metadata, progress);
	}

	progress.phase('metadata', metadatas.size);

	for (const [id, metadata] of metadatas) {
		await storeMetadata(db, id, metadata);
		progress.increment();
	}

	progress.phase('resolve-imported-items', manifest.imports?.length ?? 1);
	const { metadataGroups, importedMetadata, importedSessionMetadata } =
		await resolveImportedItems(db, manifest);

	const allMetadataKeys = [...metadatas.keys(), ...importedMetadata, ...importedSessionMetadata];

	const sessionMetadataKeys = [
		...Object.keys(manifest.sessionMetadata ?? {}).map(namespaced),
		...importedSessionMetadata,
	];

	progress.phase('protocol', 1);
	await storeProtocol(db, manifest, {
		metadataGroups,
		metadata: allMetadataKeys,
		sessionMetadata: sessionMetadataKeys,
		metadataOrder: manifest.metadataOrder?.map(namespaced) ?? allMetadataKeys,
	});
	progress.increment();
}

async function fetchManifest(url: string | URL): Promise<ExportedProtocol> {
	const manifest = await fetch(url)
		.then((response) => parseYAMLorJSON(response))
		.then((parsed) => ExportedProtocol.in(parsed));

	if (manifest instanceof ArkErrors) {
		throw new Error(manifest.summary);
	}

	return manifest;
}

async function checkImports(db: DatabaseHandle, manifest: ExportedProtocol, progress: Progress) {
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
}

function metadatasOfManifest(
	manifest: ExportedProtocol
): Map<NamespacedMetadataID, MetadataInManifest> {
	const namespaced = (bare: string) => ensureNamespacedMetadataId(bare, manifest.id);

	return new Map(
		entries(mapKeys({ ...manifest.metadata, ...(manifest.sessionMetadata ?? {}) }, namespaced))
	);
}

const ExternalOptionsHeader = type({
	count: 'number',
});

async function countEnumOptions(metadatas: Map<string, MetadataInManifest>, progress: Progress) {
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
}

async function installEnumOptions(
	db: DatabaseHandle,
	id: NamespacedMetadataID,
	metadata: Extract<MetadataInManifest, { type: 'enum' }>,
	progress: Progress
) {
	// TODO: _narrowableIn

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
		for (const option of metadata.options) {
			await storeOption(option);
			progress.increment();
		}
	}

	if (metadata.externalOptions) {
		const { format, postprocess } = MetadataEnum.get('externalOptions').from(
			metadata.externalOptions
		)!;

		let total: number | undefined;
		const csv = {
			keys: [] as string[],
			separator: switchValue(format, {
				'csv-commas': ',',
				'csv-semicolons': ';',
				txt: '',
				'json-lines': '',
			}),
		};

		let i = -1;
		for await (const line of httpStreamLines(metadata.externalOptions.at)) {
			i++;

			let object: unknown;

			switch (format) {
				case 'csv-commas':
				case 'csv-semicolons': {
					if (!line.trim()) continue;
					const cells = line.trim().split(csv.separator);
					if (csv.keys.length === 0) {
						csv.keys = cells;
						continue;
					}

					object = Object.fromEntries(cells.map((cell, i) => [csv.keys[i], cell]));
					break;
				}
				case 'txt': {
					object = undefined;
					break;
				}
				case 'json-lines': {
					object = JSON.parse(line);
					if (ExternalOptionsHeader.allows(object)) {
						total = object.count;
						continue;
					}
					break;
				}
			}

			let output = object;

			if (postprocess) {
				output = await postprocess.evaluate({
					lineIndex: i,
					totalCount: total,
					raw: line,
					line: object,
				});
			}

			const option = MetadataEnumVariant.assert(output);
			await storeOption(option);

			progress.increment();
		}
	}
}

async function storeMetadata(
	db: DatabaseHandle,
	id: NamespacedMetadataID,
	metadata: MetadataInManifest
) {
	await db.put(
		'Metadata',
		// TODO: remove this whole .from() thing once #2312 is resolved
		MetadataInDatabase.in.merge({ '+': 'delete' }).from({
			id,
			...metadata,
		})
	);
}

async function resolveImportedItems(
	db: DatabaseHandle,
	manifest: ExportedProtocol
): Promise<{
	metadataGroups: Array<MetadataGroupInDatabase>;
	importedMetadata: Set<NamespacedMetadataID>;
	importedSessionMetadata: Set<NamespacedMetadataID>;
}> {
	const importedMetadata = new Set<NamespacedMetadataID>();
	const importedSessionMetadata = new Set<NamespacedMetadataID>();

	const metadataGroups: Array<MetadataGroupInDatabase> = entries(
		manifest.metadataGroups ?? {}
	).map(([id, group]) => ({
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
	}

	return { metadataGroups, importedMetadata, importedSessionMetadata };
}

async function storeProtocol(
	db: DatabaseHandle,
	manifest: ExportedProtocol,
	overrides: {
		metadataGroups: Array<MetadataGroupInDatabase>;
		metadata: NamespacedMetadataID[];
		sessionMetadata: NamespacedMetadataID[];
		metadataOrder: NamespacedMetadataID[];
	}
) {
	await db.put('Protocol', {
		...manifest,
		...overrides,
	});
}

class Progress {
	#cb: ProgressCallback;

	constructor(
		public protocolId: string,
		public phaseName = '',
		public done = 0,
		public total = 0
	) {
		this.#cb = () => {};
	}

	bind(cb: ProgressCallback) {
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
