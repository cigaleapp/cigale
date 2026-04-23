/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import JSONC from 'tiny-jsonc';
import YAML from 'yaml';

import { resolveProtocolImports } from '$lib/metadata/imports.js';
import { compareProtocolWithUpstream } from '$lib/protocols.js';
import { metadataOptionId, namespacedMetadataId } from '$lib/schemas/metadata.js';
import { ExportedProtocol } from '$lib/schemas/protocols.js';
import { entries, keys, omit, orEmptyObj3, pick, prefixIDBKeyRange } from '$lib/utils.js';

import { openDatabase, swarp } from './index.js';

swarp.importProtocol(async ({ contents, isJSON }, onProgress) => {
	// ri: icons to preload from Iconify API. See MetadataEnumVariant's "icon" field.
	/** @type {Set<string>} */
	const iconsToPreload = new Set();

	let total = 1;
	let done = 0;

	/**
	 * @param {typeof import('./procedures.js').PROCEDURES.importProtocol.progress.infer.phase} phase
	 * @param {string} [detail]
	 */
	const onLoadingState = (phase, detail) => {
		onProgress({
			done,
			total,
			phase,
			...orEmptyObj3('detail', detail),
		});
	};

	onLoadingState('parsing');
	console.time('Parsing protocol');
	let parsed = isJSON ? JSONC.parse(contents) : YAML.parse(contents);
	console.timeEnd('Parsing protocol');

	console.info(`Importing protocol ${parsed.id}`);
	console.info(parsed);

	onLoadingState('input-validation');
	console.time('Validating protocol');
	const protocol = ExportedProtocol.assert(parsed);
	console.timeEnd('Validating protocol');

	const db = await openDatabase();

	console.time('Resolve imports');
	const importedProtocols = await resolveProtocolImports(db, protocol);
	console.timeEnd('Resolve imports');

	const tx = db.transaction(['Protocol', 'Metadata', 'MetadataOption'], 'readwrite');

	total += importedProtocols.length;

	for (const p of [...importedProtocols, protocol]) {
		const exists = await tx.objectStore('Protocol').get(p.id);
		if (exists && p.id !== protocol.id) {
			console.debug(
				`Protocol ${p.id} already exists in the database. Skipping import of this protocol, which is an import of the main protocol ${protocol.id}. If you want to update this protocol, you should update it directly, not through the import of ${protocol.id}. Skipping.`
			);
			continue;
		}

		const importedGroups = await Promise.all(
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
				...importedGroups.flatMap(({ metadata, sessionMetadata }) => [
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
				...importedGroups.flatMap(({ metadata }) =>
					metadata.map((m) => namespacedMetadataId(p.id, m))
				),
				...keys(p.metadata),
				...keys(p.sessionMetadata),
			],
			sessionMetadata: [
				...keys(p.sessionMetadata),
				...importedGroups.flatMap(({ sessionMetadata }) =>
					sessionMetadata.map((m) => namespacedMetadataId(p.id, m))
				),
			],
			metadataGroups: [
				...importedGroups.map(({ id, group }) => ({ id, ...group })),
				...entries(p.metadataGroups ?? {}).map(([id, group]) => ({
					id,
					...group,
				})),
			],
		});
		console.timeEnd('Storing Protocol');

		const metadataToImport = { ...p.metadata, ...p.sessionMetadata };

		total += keys(metadataToImport).length;
		for (const [id, metadata] of entries(metadataToImport)) {
			done++;
			if (typeof metadata === 'string') continue;

			onLoadingState('write-metadata', metadata.label || id);
			console.time(`Storing Metadata ${id}`);
			tx.objectStore('Metadata').put({ id, ...omit(metadata, 'options') });
			console.timeEnd(`Storing Metadata ${id}`);

			console.time(`Storing Metadata Options for ${id}`);
			const oTotal = metadata.options?.length ?? 0;
			total += oTotal;
			for (const [i, option] of metadata.options?.entries() ?? []) {
				done++;

				if (i % 1000 === 0) {
					onLoadingState(
						'write-metadata-options',
						`${metadata.label || id} > ${option.label || option.key} (${i + 1}/${total})`
					);
				}

				tx.objectStore('MetadataOption').put({
					id: metadataOptionId(namespacedMetadataId(p.id, id), option.key),
					metadataId: namespacedMetadataId(p.id, id),
					index: i,
					...option,
				});

				if (option.icon) {
					iconsToPreload.add(option.icon);
				}
			}
			console.timeEnd(`Storing Metadata Options for ${id}`);
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
