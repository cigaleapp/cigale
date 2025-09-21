/**
 * @import { BeamupSettings } from './schemas/protocols.js'
 * @import { Protocol, Metadata, MetadataValue } from './database.js'
 * @import { DatabaseHandle } from './idb.svelte.js'
 */

import { sendCorrection } from '@cigale/beamup';
import { entries, pick, propOrNothing } from './utils.js';
import { generateId } from './database.js';
import { serializeMetadataValue } from './metadata.js';

/**
 * Stores a correction made to a protocol's metadata value.
 * @param {DatabaseHandle} db - The database handle.
 * @param {Pick<Protocol, 'id' | 'version'> & { beamup: typeof BeamupSettings.infer }} protocol - The protocol of the metadata.
 * @param {string} subject - The ID of the subject (image or observation) the metadata is associated with.
 * @param {Metadata} metadata - The metadata of the value.
 * @param {MetadataValue} beforeValue - The value before the correction.
 * @param {MetadataValue} afterValue - The value after the correction.
 */
export async function storeCorrection(db, protocol, subject, metadata, beforeValue, afterValue) {
	const image = await db.get('Image', subject).catch(() => undefined);
	// const observation = image
	// 	? undefined
	// 	: await db.get('Observation', subject).catch(() => undefined);

	const file = image?.fileId ? await db.get('ImageFile', image.fileId) : undefined;

	await db.add(
		'BeamupCorrection',
		$state.snapshot({
			id: generateId('BeamupCorrection'),
			client: { version: import.meta.env.buildCommit || 'unversioned' },
			protocol: pick(protocol, 'id', 'version', 'beamup'),
			metadata: pick(metadata, 'id', 'type'),
			subject: image ? { image: { id: subject } } : { observation: { id: subject } },
			...propOrNothing(
				'file',
				file
					? pick(file, 'id', /* TODO 'contentHash', */ 'filename', 'contentType', 'dimensions')
					: undefined
			),
			before: { ...beforeValue, value: serializeMetadataValue(beforeValue) },
			after: { ...afterValue, value: serializeMetadataValue(afterValue) },
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			occurredAt: new Date().toISOString()
		})
	);
}

/**
 * @param {DatabaseHandle} db
 * @param {(id: string, error: string|undefined) => void} [onProgress]
 */
export async function syncCorrections(db, onProgress) {
	const corrections = await db.getAll('BeamupCorrection');
	for (const {
		id,
		after,
		before,
		protocol,
		metadata,
		client,
		occurredAt,
		subject
	} of corrections) {
		await sendCorrection({
			origin: protocol.beamup.origin,
			after: {
				alternatives: entries(after.alternatives).map(([value, confidence]) => ({
					value,
					confidence
				})),
				type: metadata.type,
				value: after.value
			},
			before: {
				alternatives: entries(before.alternatives).map(([value, confidence]) => ({
					value,
					confidence
				})),
				type: metadata.type,
				value: before.value
			},
			client_name: 'Cigale',
			client_version: client.version,
			comment: null,
			done_at: occurredAt,
			metadata: metadata.id,
			protocol_id: protocol.id,
			protocol_version: protocol.version?.toString() ?? 'non versioned',
			subject: subject.image?.id ?? subject.observation?.id ?? '',
			subject_type: subject.image ? 'image' : subject.observation ? 'observation' : 'other',
			subject_content_hash: null, // TODO
			user: null, // TODO?
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			sent_at: new Date().toISOString()
		})
			.then(async () => db.delete('BeamupCorrection', id))
			.then(() => onProgress?.(id, undefined))
			.catch((e) => onProgress?.(id, e?.toString() ?? 'Unknown error'));
	}
}
