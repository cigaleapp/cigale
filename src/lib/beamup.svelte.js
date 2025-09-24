/**
 * @import { BeamupSettings } from './schemas/protocols.js'
 * @import { Protocol, Metadata, MetadataValue } from './database.js'
 * @import { DatabaseHandle } from './idb.svelte.js'
 */

import * as beamup from '@cigale/beamup';
import { entries, groupBy, nonnull, pick, propOrNothing, range } from './utils.js';
import { generateId } from './database.js';
import { serializeMetadataValue } from './metadata.js';
import { getSetting } from './settings.svelte.js';
import { errorMessage } from './i18n.js';

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
	const consent = await getSetting('protocolBeamupConsent', db);
	if (!consent[protocol.id]) return;

	const image = await db.get('Image', subject).catch(() => undefined);
	const observation = image
		? undefined
		: await db.get('Observation', subject).catch(() => undefined);

	const file = image?.fileId ? await db.get('ImageFile', image.fileId) : undefined;

	const hash =
		image?.sha1 ??
		(await Promise.all(
			(observation?.images ?? []).map(async (imageId) =>
				db
					.get('Image', imageId)
					.catch(() => undefined)
					.then((img) => img?.sha1)
			)
		).then((hashes) => hashes.filter(nonnull).join(' ')));

	await db.add(
		'BeamupCorrection',
		$state.snapshot({
			id: generateId('BeamupCorrection'),
			client: { version: import.meta.env.buildCommit || 'unversioned' },
			protocol: pick(protocol, 'id', 'version', 'beamup'),
			metadata: pick(metadata, 'id', 'type'),
			subject: {
				[image ? 'image' : 'observation']: { id: subject },
				contentHash: hash || null
			},
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
 * @param {(ids: string[], error: string|undefined) => void} [onProgress]
 */
export async function syncCorrections(db, onProgress) {
	const correctionsByOrigin = await db
		.getAll('BeamupCorrection')
		.then((corrections) => groupBy(corrections, (c) => c.protocol.beamup.origin));

	for (const [origin, corrections] of correctionsByOrigin.entries()) {
		await beamup
			.sendCorrections({
				origin,
				corrections: corrections.map(makeCorrection),
				onProgress(chunk, sent) {
					const start = chunk * beamup.CHUNK_SIZE;

					const ids = range(start, sent - start)
						.map((i) => corrections[i]?.id)
						.filter(nonnull);

					onProgress?.(ids, undefined);
				}
			})
			.then(async () => {
				for (const { id } of corrections) {
					await db.delete('BeamupCorrection', id);
				}
			})
			.catch((error) => {
				onProgress?.(
					corrections.map((c) => c.id),
					errorMessage(error)
				);
			});
	}
}

/**
 *
 * @param {typeof import('$lib/database').Tables.BeamupCorrection.inferIn} correction
 * @returns {typeof import('@cigale/beamup').SendableCorrection.infer}
 */
function makeCorrection({ after, before, protocol, metadata, client, occurredAt, subject }) {
	return {
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
		subject_type: /** @type {import('@cigale/beamup').SubjectType} */ (
			subject.image ? 'image' : subject.observation ? 'observation' : 'other'
		),
		subject_content_hash: subject.contentHash,
		user: null // TODO?
	};
}
