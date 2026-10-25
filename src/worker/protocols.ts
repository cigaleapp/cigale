/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { PROCEDURES } from './procedures.js';

import JSONC from 'tiny-jsonc';
import YAML from 'yaml';

import { Tables } from '$lib/database.js';
import { resolveProtocolImports } from '$lib/metadata/imports.js';
import { compareProtocolWithUpstream } from '$lib/protocols.js';
import { metadataOptionId, namespacedMetadataId } from '$lib/schemas/metadata.js';
import { ExportedProtocol } from '$lib/schemas/protocols.js';
import { recomputeSearchIndex } from '$lib/search.js';
import { entries, keys, omit, orEmptyObj, pick, prefixIDBKeyRange } from '$lib/utils.js';

import { openDatabase, swarp } from './index.js';

swarp.importProtocol(async ({ contents, isJSON }, onProgress) => {
	// ri:* icons to preload from Iconify API. See MetadataEnumVariant's "icon" field.
	const iconsToPreload = new Set<string>();

	let total = 1;
	let done = 0;

	function onLoadingState(
		phase: typeof PROCEDURES.importProtocol.progress.infer.phase,
		detail?: string
	) {
		onProgress({
			done,
			total,
			phase,
			...orEmptyObj(Boolean(detail), { detail: detail! }),
		});
	}

	const heapMB = () =>
		performance.memory
			? (performance.memory.usedJSHeapSize / 1048576).toFixed(0)
			: '?';

	onLoadingState('parsing');
	console.time('Parsing protocol');
	let parsed = isJSON ? JSONC.parse(contents) : YAML.parse(contents);
	console.timeEnd('Parsing protocol');

	console.info(`Importing protocol ${parsed.id} [heap: ${heapMB()}MB]`);

	onLoadingState('input-validation');
	console.time('Validating protocol');
	const protocol = ExportedProtocol.assert(parsed);
	console.timeEnd('Validating protocol');
	// Release the raw parsed object graph to reduce peak V8 heap pressure.
	parsed = null;
	console.info(`[heap after validation: ${heapMB()}MB]`);

	const db = await openDatabase();

	console.time('Resolve imports');
	const importedProtocols = await resolveProtocolImports(db, protocol);
	console.timeEnd('Resolve imports');
	console.info(`[heap after resolve imports: ${heapMB()}MB]`);

	total += importedProtocols.length;

	for (const p of [...importedProtocols, protocol]) {
		const exists = await db.get('Protocol', p.id);
		if (exists && p.id !== protocol.id) {
			console.debug(
				`Protocol ${p.id} already exists in the database. Skipping import of this protocol, which is an import of the main protocol ${protocol.id}. If you want to update this protocol, you should update it directly, not through the import of ${protocol.id}. Skipping.`
			);
			continue;
		}

		// Transaction 1: resolve imported groups + write the protocol row.
		const importedGroups = await (async () => {
			const tx = db.transaction(['Protocol', 'Metadata'], 'readwrite');
			const groups = await Promise.all(
				p.importedMetadataGroups.map(async ({ from, id }) => {
					const protocol = await tx.objectStore('Protocol').get(from);
					if (!protocol) return undefined;
					const group = protocol.metadataGroups?.find((group) => group.id === id);
					if (!group) return undefined;
					const metadata = await tx
						.objectStore('Metadata')
						.getAll(prefixIDBKeyRange(namespacedMetadataId(from, '')));
					return {
						id,
						group,
						metadata: metadata.filter((m) => m.group === id).map((m) => m.id),
						sessionMetadata: metadata
							.filter((m) => m.group === id && protocol.sessionMetadata?.includes(m.id))
							.map((m) => m.id),
					};
				})
			).then((groups) => groups.filter((group) => group !== undefined));

			onLoadingState('write-protocol', p.id);
			console.time('Storing Protocol');
			tx.objectStore('Protocol').put({
				...p,
				importedMetadata: [
					...(p.importedMetadata ?? []),
					...groups.flatMap(({ metadata, sessionMetadata }) => [
						...metadata.map((id) => ({
							source: id,
							target: namespacedMetadataId(p.id, id),
							sessionwide: false,
						})),
						...sessionMetadata.map((id) => ({
							source: id,
							target: namespacedMetadataId(p.id, id),
							sessionwide: true,
						})),
					]),
				],
				metadata: [
					...p.importedMetadata.map((imported) => imported.target),
					...groups.flatMap(({ metadata }) =>
						metadata.map((m) => namespacedMetadataId(p.id, m))
					),
					...keys(p.metadata),
					...keys(p.sessionMetadata),
				],
				sessionMetadata: [
					...keys(p.sessionMetadata),
					...groups.flatMap(({ sessionMetadata }) =>
						sessionMetadata.map((m) => namespacedMetadataId(p.id, m))
					),
				],
				metadataGroups: [
					...groups.map(({ id, group }) => ({ id, ...group })),
					...entries(p.metadataGroups ?? {}).map(([id, group]) => ({
						id,
						...group,
					})),
				],
			});
			console.timeEnd('Storing Protocol');
			await tx.done;
			return groups;
		})();

		/** Maps metadata IDs to list of metadata group names the metadata is a part of that are narrowable  */
		const narrowableMetadata = Object.fromEntries(
			Object.entries(p.metadata).map(([id, metadata]) => {
				const groups = Object.entries(p.metadataGroups)
					.filter(([id, { narrowable }]) => narrowable && metadata.group === id)
					.map(([id, group]) => ({ id, ...group }));

				return [namespacedMetadataId(p.id, id), new Set(groups.map((g) => g.id))];
			})
		);

		const metadataToImport = { ...p.metadata, ...p.sessionMetadata };

		total += keys(metadataToImport).length;
		for (const [id, metadata] of entries(metadataToImport)) {
			done++;
			if (typeof metadata === 'string') continue;

			onLoadingState('write-metadata', metadata.label || id);

			// Transaction 2: write the metadata row.
			{
				const tx = db.transaction(['Metadata'], 'readwrite');
				console.time(`Storing Metadata ${id}`);
				tx.objectStore('Metadata').put({
					id,
					...omit(metadata, 'options'),
					_optionsCount: metadata.options?.length ?? 0,
				});
				console.timeEnd(`Storing Metadata ${id}`);
				await tx.done;
			}

			// Write options in batches to keep each IDB transaction small.
			// A single long-running transaction buffers all structured clones
			// in memory until commit, which can exhaust the V8 heap in the
			// WebView worker process.
			console.time(`Storing Metadata Options for ${id}`);
			const options = metadata.options ?? [];
			const oTotal = options.length;
			total += oTotal;
			const BATCH_SIZE = 500;
			for (let i = 0; i < oTotal; i += BATCH_SIZE) {
				const tx = db.transaction(['MetadataOption'], 'readwrite');
				for (let j = i; j < Math.min(i + BATCH_SIZE, oTotal); j++) {
					const option = options[j];
					done++;

					if (j % 1000 === 0) {
						onLoadingState(
							'write-metadata-options',
							`${metadata.label || id} > ${option.label || option.key} (${j + 1}/${total})`
						);
					}

					const narrowableIn = new Set(
						Object.entries(narrowableMetadata)
							.filter(([id]) =>
								Object.keys(option.cascade ?? {}).some(
									(key) => id === namespacedMetadataId(p.id, key)
								)
							)
							.flatMap(([_, groups]) => [...groups])
					);

					const optionId = metadataOptionId(namespacedMetadataId(p.id, id), option.key);

					await tx.objectStore('MetadataOption').put({
						id: optionId,
						metadataId: namespacedMetadataId(p.id, id),
						index: j,
						_narrowableIn: [...narrowableIn],
						...option,
					});

					await recomputeSearchIndex(tx, Tables, 'MetadataOption', optionId);

					if (option.icon) {
						iconsToPreload.add(option.icon);
					}
				}
				await tx.done;
				if (i > 0 && i % 5000 === 0) {
					console.info(
						`[heap after ${i}/${oTotal} options of ${metadata.label || id}: ${heapMB()}MB]`
					);
				}
			}
			console.timeEnd(`Storing Metadata Options for ${id}`);
			console.info(`[heap after metadata ${id} (${oTotal} options): ${heapMB()}MB]`);
		}

		if (p.id === protocol.id) {
			return {
				...pick(p, 'id', 'name', 'version'),
				iconsToPreload: [...iconsToPreload],
			};
		}

		done++;
	}

	throw 'unreachable';
});

swarp.diffProtocolWithRemote(async ({ protocolId }, onProgress) => {
	const db = await openDatabase();

	const protocol = await db.get('Protocol', protocolId);
	if (!protocol) throw new Error(`Protocol with ID ${protocolId} not found`);

	const changes = await compareProtocolWithUpstream(db, protocolId, { onProgress });

	protocol.dirty = changes.length > 0;

	await db.put('Protocol', protocol);

	return { dirty: protocol.dirty, changes };
});
