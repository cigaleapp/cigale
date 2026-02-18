/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import YAML from 'yaml';

import { resolveProtocolImports } from '$lib/metadata/imports.js';
import { compareProtocolWithUpstream } from '$lib/protocols.js';
import { metadataOptionId, namespacedMetadataId } from '$lib/schemas/metadata.js';
import { ExportedProtocol } from '$lib/schemas/protocols.js';
import { entries, keys, omit, pick } from '$lib/utils.js';

import { openDatabase, swarp } from './index.js';

swarp.importProtocol(async ({ contents, isJSON }, onProgress) => {
	// ri: icons to preload from Iconify API. See MetadataEnumVariant's "icon" field.
	/** @type {Set<string>} */
	const iconsToPreload = new Set();

	/**
	 * @param {typeof import('./procedures.js').PROCEDURES.importProtocol.progress.infer.phase} phase
	 * @param {string} [detail]
	 */
	const onLoadingState = (phase, detail) => {
		onProgress(detail ? { phase, detail } : { phase });
	};

	onLoadingState('parsing');
	console.time('Parsing protocol');
	let parsed = isJSON ? JSON.parse(contents) : YAML.parse(contents);
	console.timeEnd('Parsing protocol');

	console.info(`Importing protocol ${parsed.id}`);
	console.info(parsed);

	onLoadingState('input-validation');
	console.time('Validating protocol');
	const protocol = ExportedProtocol.assert(parsed);
	console.timeEnd('Validating protocol');

	const db = await openDatabase();

	console.time('Resolve imports');
	const importedProtocols = await resolveProtocolImports(
		db,
		protocol.id,
		protocol.importedMetadata
	);
	console.timeEnd('Resolve imports');

	const tx = db.transaction(['Protocol', 'Metadata', 'MetadataOption'], 'readwrite');

	for (const p of [...importedProtocols, protocol]) {
		const exists = await tx.objectStore('Protocol').get(p.id);
		if (exists && p.id !== protocol.id) {
			console.debug(
				`Protocol ${p.id} already exists in the database. Skipping import of this protocol, which is an import of the main protocol ${protocol.id}. If you want to update this protocol, you should update it directly, not through the import of ${protocol.id}. Skipping.`
			);
			continue;
		}

		onLoadingState('write-protocol', p.id);
		console.time('Storing Protocol');
		tx.objectStore('Protocol').put({
			...p,
			metadata: [
				...p.importedMetadata.map((imported) => imported.target),
				...keys(p.metadata),
				...keys(p.sessionMetadata)
			],
			sessionMetadata: keys(p.sessionMetadata)
		});
		console.timeEnd('Storing Protocol');

		for (const [id, metadata] of entries({
			...p.metadata,
			...p.sessionMetadata
		})) {
			if (typeof metadata === 'string') continue;

			onLoadingState('write-metadata', metadata.label || id);
			console.time(`Storing Metadata ${id}`);
			tx.objectStore('Metadata').put({ id, ...omit(metadata, 'options') });
			console.timeEnd(`Storing Metadata ${id}`);

			console.time(`Storing Metadata Options for ${id}`);
			const total = metadata.options?.length ?? 0;
			let done = 0;
			for (const [i, option] of metadata.options?.entries() ?? []) {
				done++;
				if (done % 1000 === 0) {
					onLoadingState(
						'write-metadata-options',
						`${metadata.label || id} > ${option.label || option.key} (${done}/${total})`
					);
				}
				tx.objectStore('MetadataOption').put({
					id: metadataOptionId(namespacedMetadataId(p.id, id), option.key),
					metadataId: namespacedMetadataId(p.id, id),
					index: i,
					...option
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
				iconsToPreload: [...iconsToPreload]
			};
		}
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
