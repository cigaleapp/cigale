import type { Metadata, MetadataValue, Protocol } from './database.js';
import type { DatabaseHandle } from './idb.svelte.js';

import * as beamup from '@cigale/beamup';

import { generateId } from './database.js';
import { errorMessage } from './i18n.js';
import { serializeMetadataValue } from './metadata/serializing.js';
import { entries, groupBy, nonnull, pick, propOrNothing, range } from './utils.js';

/**
 * Stores a correction made to a protocol's metadata value.
 * @param  db The database handle.
 * @param  protocol The protocol of the metadata.
 * @param  subject The ID of the subject (image or observation) the metadata is associated with.
 * @param  metadata The metadata of the value.
 * @param  beforeValue The value before the correction.
 * @param  afterValue The value after the correction.
 */
export async function storeCorrection(
	db: DatabaseHandle,
	protocol: Pick<Protocol, 'id' | 'version' | 'beamup'>,
	subject: string,
	metadata: Metadata,
	beforeValue: MetadataValue,
	afterValue: MetadataValue
) {
	if (!('beamup' in protocol)) return;
	const settings = await db.get('Settings', 'user');
	const preferences = settings?.beamupPreferences?.[protocol.id];
	if (!preferences?.enable) return;

	const image = await db.get('Image', subject).catch(() => undefined);
	const observation = image
		? undefined
		: await db.get('Observation', subject).catch(() => undefined);

	const file = image?.fileId ? await db.get('ImageFile', image.fileId) : undefined;

	const subjectKind = image ? 'image' : observation ? 'observation' : 'unknown';

	await db.add('BeamupCorrection', {
		id: generateId('BeamupCorrection'),
		client: { version: import.meta.env.buildCommit || 'unversioned' },
		protocol: pick(protocol, 'id', 'version', 'beamup'),
		metadata: pick(metadata, 'id', 'type'),
		email: preferences?.email ?? null,
		subject: {
			[subjectKind]: { id: subject },
			contentHash: null,
		},
		...propOrNothing(
			'file',
			file
				? pick(
						file,
						'id',
						/* TODO 'contentHash', */ 'filename',
						'contentType',
						'dimensions',
						'remoteId'
					)
				: undefined
		),
		before: { ...beforeValue, value: serializeMetadataValue(beforeValue) },
		after: { ...afterValue, value: serializeMetadataValue(afterValue) },
		occurredAt: new Date().toISOString(),
	});
}

export async function syncCorrections(
	db: DatabaseHandle,
	onProgress: (ids: string[], error: string | undefined) => void
) {
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
				},
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
 * @returns {import('@cigale/beamup').SendableCorrection}
 */
function makeCorrection({
	after,
	before,
	protocol,
	metadata,
	client,
	occurredAt,
	subject,
	email,
}: typeof import('$lib/database').Tables.BeamupCorrection.inferIn): import('@cigale/beamup').SendableCorrection {
	return {
		after: {
			alternatives: entries(after.alternatives).map(([value, confidence]) => ({
				value,
				confidence,
			})),
			type: metadata.type,
			value: after.value,
		},
		before: {
			alternatives: entries(before.alternatives).map(([value, confidence]) => ({
				value,
				confidence,
			})),
			type: metadata.type,
			value: before.value,
		},
		client_name: 'Cigale',
		client_version: client.version,
		comment: null,
		done_at: occurredAt,
		metadata: metadata.id,
		protocol_id: protocol.id,
		protocol_version: protocol.version?.toString() ?? 'non versioned',
		subject: subject.image?.id ?? subject.observation?.id ?? '',
		subject_type: /** @type {import('@cigale/beamup').SubjectType} */ subject.image
			? 'image'
			: subject.observation
				? 'observation'
				: 'other',
		subject_content_hash: subject.contentHash,
		user: email,
	};
}
