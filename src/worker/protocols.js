/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import YAML from 'yaml';

import { compareProtocolWithUpstream } from '$lib/protocols.js';
import { metadataOptionId, namespacedMetadataId } from '$lib/schemas/metadata.js';
import { ExportedProtocol } from '$lib/schemas/protocols.js';
import { omit, pick } from '$lib/utils.js';

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
	const tx = db.transaction(['Protocol', 'Metadata', 'MetadataOption'], 'readwrite');
	onLoadingState('write-protocol');
	console.time('Storing Protocol');
	tx.objectStore('Protocol').put({
		...protocol,
		metadata: [...Object.keys(protocol.metadata), ...Object.keys(protocol.sessionMetadata)],
		sessionMetadata: Object.keys(protocol.sessionMetadata)
	});
	console.timeEnd('Storing Protocol');

	for (const [id, metadata] of Object.entries({
		...protocol.metadata,
		...protocol.sessionMetadata
	})) {
		if (typeof metadata === 'string') continue;

		onLoadingState('write-metadata', metadata.label || id);
		console.time(`Storing Metadata ${id}`);
		tx.objectStore('Metadata').put({ id, ...omit(metadata, 'options') });
		console.timeEnd(`Storing Metadata ${id}`);

		console.time(`Storing Metadata Options for ${id}`);
		const total = metadata.options?.length ?? 0;
		let done = 0;
		for (const option of metadata.options ?? []) {
			done++;
			if (done % 1000 === 0) {
				onLoadingState(
					'write-metadata-options',
					`${metadata.label || id} > ${option.label || option.key} (${done}/${total})`
				);
			}
			tx.objectStore('MetadataOption').put({
				id: metadataOptionId(namespacedMetadataId(protocol.id, id), option.key),
				metadataId: namespacedMetadataId(protocol.id, id),
				...option
			});

			if (option.icon) {
				iconsToPreload.add(option.icon);
			}
		}
		console.timeEnd(`Storing Metadata Options for ${id}`);
	}

	onLoadingState('output-validation');
	console.time('Validating protocol after storing');
	const validated = ExportedProtocol.assert(protocol);
	console.timeEnd('Validating protocol after storing');

	return {
		...pick(validated, 'id', 'name', 'version'),
		iconsToPreload: [...iconsToPreload]
	};
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
