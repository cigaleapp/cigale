import type { DatabaseHandle } from '#lib/idb.svelte.js';

import { ArkErrors } from 'arktype';

import { Tables } from '#lib/database.js';
import { httpStreamLines, httpStreamProcessLines } from '#lib/http-streaming.ts';
import { metadataOptionId, namespaceToMetadataOptionInDB } from '#lib/metadata/options.js';
import { lookupMostRecentCompatibleProtocol } from '#lib/protocols/registry.js';
import { NamespacedMetadataID } from '#lib/schemas/common.js';
import {
	ensureNamespacedMetadataId,
	MetadataEnumVariant,
	MetadataGroup,
	MetadataInDatabase,
} from '#lib/schemas/metadata.js';
import { ExportedProtocol } from '#lib/schemas/protocols.js';
import { recomputeSearchIndex } from '#lib/search.ts';
import { entries, mapKeys, parseYAMLorJSON } from '#lib/utils.ts';

type ProgressCallback = (
	protocol: string,
	phase: string,
	done: number,
	total: number
) => Promise<void>;

class DependsOnOtherProtocolError extends Error {
	constructor(public protocolIds: string[]) {
		super();
	}

	get message() {
		return `depends on ${this.protocolIds.join(', ')}`;
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
		// the await is important here otherwise the error slips through without
		// being caught by the try-catch since we return the promise , which the
		// caller will resolve, instead of resolving it right here
		return await importSingleProtocol(db, url, options);
	} catch (error) {
		if (!(error instanceof DependsOnOtherProtocolError)) {
			throw new Error(`Could not import protocol at ${url}`, { cause: error });
		}

		const childurl = url;
		for (const id of error.protocolIds) {
			console.info(`protocol ${childurl} depends on ${id}, importing it`);
			const url = await lookupMostRecentCompatibleProtocol(id);
			await importProtocol(db, url, options);
		}

		return importSingleProtocol(db, url, options);
	}
}

type MetadataGroupInDatabase = typeof MetadataGroup.inferIn;

type MetadataInManifest = (typeof ExportedProtocol.inferIn)['metadata'][string];

async function importSingleProtocol(
	db: DatabaseHandle,
	url: string | URL,
	options: {
		onProgress: ProgressCallback;
	}
) {
	const progress = new Progress(url.toString());
	progress.bind(options.onProgress);

	await progress.phase('get-manifest', 1);
	const manifest = await fetchManifest(url);
	await progress.increment();

	await progress.phase('check-imports', manifest.imports?.length ?? 1);
	await checkImports(db, manifest, progress);

	const namespaced = (bare: string) => ensureNamespacedMetadataId(bare, manifest.id);

	const metadatas = metadatasOfManifest(manifest);

	await progress.phase('metadata-options', 0);
	await countEnumOptions(metadatas, (add) => {
		progress.total += add;
	});

	for (const [id, metadata] of metadatas) {
		if (metadata.type !== 'enum') continue;

		await installEnumOptions(db, id, metadata, async (by) => progress.increment(by));
	}

	await progress.phase('metadata', metadatas.size);

	for (const [id, metadata] of metadatas) {
		await storeMetadata(db, id, metadata);
		await progress.increment();
	}

	await progress.phase('resolve-imported-items', manifest.imports?.length ?? 1);
	const { metadataGroups, importedMetadata, importedSessionMetadata } =
		await resolveImportedItems(db, manifest);

	const allMetadataKeys = [...metadatas.keys(), ...importedMetadata, ...importedSessionMetadata];

	const sessionMetadataKeys = [
		...Object.keys(manifest.sessionMetadata ?? {}).map(namespaced),
		...importedSessionMetadata,
	];

	await progress.phase('protocol', 1);
	await storeProtocol(db, manifest, {
		metadataGroups,
		metadata: allMetadataKeys,
		sessionMetadata: sessionMetadataKeys,
		metadataOrder: manifest.metadataOrder?.map(namespaced) ?? allMetadataKeys,
	});

	await progress.increment();

	return manifest;
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

async function countEnumOptions(
	metadatas: Map<string, MetadataInManifest>,
	addToTotal: (add: number) => void
) {
	for (const metadata of metadatas.values()) {
		if (metadata.type !== 'enum') continue;

		if (metadata.options) {
			addToTotal(metadata.options.length);
		}

		for (const config of metadata.externalOptions ?? []) {
			for await (const line of httpStreamLines(config.at)) {
				if (!line.totalBytes) continue;
				addToTotal(line.totalBytes);
				break;
			}
		}
	}
}

async function installEnumOptions(
	db: DatabaseHandle,
	id: NamespacedMetadataID,
	metadata: Extract<MetadataInManifest, { type: 'enum' }>,
	incrementProgress: (by: number) => Promise<void>
) {
	// TODO: _narrowableIn

	const storeOption = async (option: typeof MetadataEnumVariant.inferIn) => {
		const optionId = metadataOptionId(id, option.key);
		const tx = db.transaction(['MetadataOption'], 'readwrite');
		await tx.objectStore('MetadataOption').put({
			id: optionId,
			namespacedLabel: namespaceToMetadataOptionInDB(id, option.label),
			namespacedExtraKeys: (option.extraKeys ?? []).map((ex) =>
				namespaceToMetadataOptionInDB(id, ex)
			),
			metadataId: id,
			...option,
		});

		await recomputeSearchIndex(tx, Tables, 'MetadataOption', optionId);
	};

	if (metadata.options) {
		for (const option of metadata.options) {
			await storeOption(option);
			await incrementProgress(1);
		}
	}

	for (const config of metadata.externalOptions ?? []) {
		for await (const line of httpStreamProcessLines(MetadataEnumVariant, config)) {
			await incrementProgress(line.byteSize ?? 0);
			if (!line.parsed) {
				console.error(
					`Couldn't import metadata option on line ${line.index + 1} of ${config.at}`,
					line.error,
					line
				);
				continue;
			}

			await storeOption(line.parsed);
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
		this.#cb = async () => {};
	}

	bind(cb: ProgressCallback) {
		this.#cb = cb;
	}

	async phase(phase: string, total: number) {
		this.done = 0;
		this.phaseName = phase;
		this.total = total;
		await this.update();
	}

	async increment(by = 1) {
		this.done += by;
		await this.update();
	}

	async update() {
		const progress = this.done / this.total;
		if (Number.isNaN(progress)) return;
		if (!Number.isFinite(progress)) return;

		await this.#cb(this.protocolId, this.phaseName, this.done, this.total);
	}
}
