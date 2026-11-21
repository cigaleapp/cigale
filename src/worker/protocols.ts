/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { PROCEDURES } from './procedures.js';

import JSONC from 'tiny-jsonc';
import YAML from 'yaml';

import { Tables } from '#lib/database.js';
import { compareProtocolWithUpstream } from '#lib/protocols.js';
import { importProtocol, importSingleProtocol } from '#lib/protocols/import.js';
import { metadataOptionId, namespacedMetadataId } from '#lib/schemas/metadata.js';
import { ExportedProtocol } from '#lib/schemas/protocols.js';
import { recomputeSearchIndex } from '#lib/search.js';
import { entries, keys, omit, orEmptyObj, pick, prefixIDBKeyRange } from '#lib/utils.js';

import { openDatabase, swarp } from './index.js';

swarp.importProtocol(async ({ url }, onProgress) => {
	// ri:* icons to preload from Iconify API. See MetadataEnumVariant's "icon" field.
	const iconsToPreload = new Set<string>();

	// TODO: iconsToPreload? or maybe we dont really need it? idk
	const db = await openDatabase();

	await importProtocol(db, url, {
		onProgress(protocol, phase, done, total) {
			onProgress?.({ protocol, phase, done, total });
		},
	});

	return {
		iconsToPreload: [...iconsToPreload],
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
