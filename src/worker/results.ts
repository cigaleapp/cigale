/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { strToU8, zip } from 'fflate';

import { stringifyWithToplevelOrdering } from '$lib/download';
import { addExifMetadata } from '$lib/exif';
import { cropImage } from '$lib/images.js';
import {
	addValueLabels,
	metadataPrettyKey,
	metadataPrettyValue,
	observationMetadata,
	protocolMetadataValues
} from '$lib/metadata';
import { Analysis } from '$lib/schemas/exports.js';
import { MetadataValues } from '$lib/schemas/metadata';
import { FilepathTemplate } from '$lib/schemas/protocols';
import { toMetadataRecord } from '$lib/schemas/results';
import { compareBy } from '$lib/utils';

import { Schemas } from '../lib/database.js';
import { toCSV } from '../lib/results.svelte.js';
import { openDatabase, swarp } from './index.js';

swarp.generateResultsZip(async ({ sessionId, include, cropPadding, jsonSchemaURL }, notify) => {
	const db = await openDatabase();
	const session = await db.get('Session', sessionId).then(Schemas.Session.assert);
	if (!session) throw new Error(`Session with ID ${sessionId} not found`);

	const protocolId = session.protocol;
	const protocolUsed = await db.get('Protocol', protocolId).then(Schemas.Protocol.assert);
	if (!protocolUsed) throw new Error(`Protocol with ID ${protocolId} not found`);

	const mtimeMetadataKey = protocolUsed.exports?.images?.mtime;

	const filepaths = protocolUsed.exports ?? {
		images: {
			cropped: FilepathTemplate.assert('cropped/{{sequence}}.{{extension image.filename}}'),
			original: FilepathTemplate.assert('original/{{sequence}}.{{extension image.filename}}')
		},
		metadata: {
			json: 'analysis.json',
			csv: 'metadata.csv'
		}
	};

	const observations = await db.getAllFromIndex('Observation', 'sessionId', sessionId);
	const imagesFromDatabase = await db.getAllFromIndex('Image', 'sessionId', sessionId);
	const metadataDefinitions = await db
		.getAll('Metadata')
		.then((ms) => Object.fromEntries(ms.map((m) => [m.id, m])));
	const metadataOptions = await db.getAll('MetadataOption').then((opts) => {
		/** @type {Record<string, typeof opts>} */
		const options = {};
		for (const opt of opts) {
			if (!options[opt.metadataId]) options[opt.metadataId] = [];
			options[opt.metadataId].push(opt);
		}
		return options;
	});

	/**
	 * @type {typeof Analysis.inferIn['observations']}
	 */
	let exportedObservations = {};
	let sequence = 1;
	let observationNumber = 0;

	// To have stable sequence numbers, really useful for testing
	observations.sort(compareBy((o) => o.label + o.id));
	for (const { id, label, images, metadataOverrides } of observations) {
		observationNumber++;

		const metadata = await observationMetadata(db, {
			images,
			metadataOverrides: MetadataValues.assert(metadataOverrides)
		}).then((obsm) => addValueLabels(obsm, metadataOptions));

		exportedObservations[id] = {
			label,
			number: observationNumber,
			metadata: toMetadataRecord(metadata),
			protocolMetadata: toMetadataRecord(protocolMetadataValues(protocolUsed, metadata)),
			images: []
		};

		for (const [i, imageId] of images.entries()) {
			if (!imagesFromDatabase.some((i) => i.id === imageId)) continue;

			const imageFromDatabase = Schemas.Image.assert(
				imagesFromDatabase.find((i) => i.id === imageId)
			);

			const metadataValues = await addValueLabels(
				imageFromDatabase.metadata,
				metadataOptions
			);

			const numberInObservation = i + 1;

			const image = {
				...imageFromDatabase,
				sequence,
				numberInObservation,
				metadata: toMetadataRecord(metadataValues),
				protocolMetadata: toMetadataRecord(
					protocolMetadataValues(protocolUsed, metadataValues)
				)
			};

			const filepathsData = {
				observation: exportedObservations[id],
				image,
				sequence,
				numberInObservation
			};

			exportedObservations[id].images.push({
				...image,
				sequence,
				numberInObservation,
				exportedAs: {
					original: filepaths.images.original.render(filepathsData),
					cropped: filepaths.images.cropped.render(filepathsData)
				}
			});

			sequence++;
		}
	}

	const allMetadataKeys = [
		...new Set(observations.flatMap((o) => Object.keys(exportedObservations[o.id].metadata)))
	];

	/**
	 * @type {Array<{imageId: string, croppedBytes: Uint8Array, originalBytes?: Uint8Array|undefined, contentType: string, filename: string}>}
	 */
	let buffersOfImages = [];

	let total = 1;
	let done = 0;

	if (include !== 'metadataonly') {
		total += observations.flatMap((o) => o.images).length;
		for (const [observation, imageId] of observations.flatMap((o) =>
			o.images.map((img) => /** @type {const} */ ([o, img]))
		)) {
			const image = imagesFromDatabase.find((i) => i.id === imageId);
			if (!image) continue;

			const metadata = MetadataValues.assert({
				...image.metadata,
				...observation.metadataOverrides
			});

			const { contentType, filename } = Schemas.Image.assert(image);
			const cropbox = metadata[protocolUsed.crop?.metadata ?? 'crop']?.value;
			if (!image.fileId) continue;
			const file = await db.get('ImageFile', image.fileId);
			if (!file) continue;
			const { cropped, original } = cropbox
				? await cropImage(
						file.bytes,
						contentType,
						// @ts-expect-error
						cropbox,
						cropPadding
					)
				: { cropped: file.bytes, original: file.bytes };

			/** @type {undefined | Uint8Array} */
			let originalBytes = undefined;
			/** @type {Uint8Array} */
			let croppedBytes;

			try {
				if (contentType === 'image/jpeg') {
					croppedBytes = addExifMetadata(
						cropped,
						Object.values(metadataDefinitions),
						metadata
					);
				} else {
					croppedBytes = new Uint8Array(cropped);
				}

				if (include === 'full') {
					if (contentType === 'image/jpeg') {
						originalBytes = addExifMetadata(
							original,
							Object.values(metadataDefinitions),
							metadata
						);
					} else {
						originalBytes = new Uint8Array(original);
					}
				}
			} catch (error) {
				console.error(error);
				notify({ warning: ['exif-write-error', { filename: file.filename }] });
				originalBytes = new Uint8Array(original);
				croppedBytes = new Uint8Array(cropped);
			}

			buffersOfImages.push({
				imageId,
				croppedBytes,
				originalBytes,
				contentType,
				filename
			});

			done++;
			notify({ progress: done / total });
		}
	}

	/**
	 * @type {Uint8Array<ArrayBuffer>}
	 */
	const zipfile = await new Promise((resolve, reject) =>
		zip(
			{
				[filepaths.metadata.json]: strToU8(
					stringifyWithToplevelOrdering(
						'json',
						jsonSchemaURL.toString(),
						Analysis.assert({
							session: {
								...session,
								metadata: toMetadataRecord(session.metadata)
							},
							observations: exportedObservations
						}),
						['protocol', 'observations']
					)
				),
				[filepaths.metadata.csv]: strToU8(
					toCSV(
						[
							'Identifiant',
							'Observation',
							// 2 columns for each metadata: for the value itself, and for the confidence in the value
							...allMetadataKeys
								.filter((k) => Boolean(metadataDefinitions[k]?.label))
								.flatMap((k) => [
									metadataPrettyKey(metadataDefinitions[k]),
									`${metadataPrettyKey(metadataDefinitions[k])}: Confiance`
								])
						],
						observations.map((o) => ({
							Identifiant: o.id,
							Observation: o.label,
							...Object.fromEntries(
								Object.entries(exportedObservations[o.id].metadata).flatMap(
									([key, { value, confidence, valueLabel }]) => [
										[
											metadataPrettyKey(metadataDefinitions[key]),
											// Exports always have english value serializations for better interoperability
											metadataPrettyValue(
												'en',
												metadataDefinitions[key],
												value,
												valueLabel
											)
										],
										[
											`${metadataPrettyKey(metadataDefinitions[key])}: Confiance`,
											confidence.toString()
										]
									]
								)
							)
						}))
					)
				),
				...(include === 'metadataonly'
					? {}
					: Object.fromEntries(
							Object.values(exportedObservations)
								.flatMap(({ images }) => images)
								.flatMap(({ exportedAs, id, metadata }) => {
									const buffers = buffersOfImages.find((i) => i.imageId === id);
									if (!buffers) return [];

									/**
									 * @type {import('fflate').AsyncZipOptions}
									 */
									let options = { level: 0 };

									if (
										mtimeMetadataKey &&
										typeof metadata[mtimeMetadataKey]?.value === 'string'
									) {
										options.mtime = new Date(metadata[mtimeMetadataKey].value);
									}

									return [
										[exportedAs.cropped, [buffers.croppedBytes, options]],
										[exportedAs.original, [buffers.originalBytes, options]]
									].filter(([, [bytes]]) => bytes !== undefined);
								})
						))
			},
			{
				comment: `Generated by C.i.g.a.l.e on ${new Date().toISOString()}`
			},
			(err, data) => {
				if (err) reject(err);
				resolve(data);
			}
		)
	);

	notify({ progress: 1 });
	return zipfile.buffer;
});
