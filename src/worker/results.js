/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { ArkErrors } from 'arktype';
import { strToU8, zip } from 'fflate';

import { stringifyWithToplevelOrdering } from '$lib/download';
import { addExifMetadata } from '$lib/exif';
import { cropImage, parseCropPadding } from '$lib/images.js';
import {
	addValueLabels,
	metadataPrettyKey,
	metadataPrettyValue,
	protocolMetadataValues
} from '$lib/metadata/index.js';
import { observationMetadata } from '$lib/observations.js';
import { Analysis } from '$lib/schemas/exports.js';
import { MetadataRuntimeValue, MetadataValues } from '$lib/schemas/metadata';
import { FilepathTemplate } from '$lib/schemas/protocols';
import { toMetadataRecord } from '$lib/schemas/results';
import { compareBy, progressSplitter, sum } from '$lib/utils';

import { Schemas } from '../lib/database.js';
import { toCSV } from '../lib/results.svelte.js';
import { unlessAborted } from '../lib/utils.js';
import { openDatabase, swarp } from './index.js';

swarp.generateResultsZip(
	async ({ sessionId, include, cropPadding, jsonSchemaURL }, notify, { abortSignal }) => {
		const db = await openDatabase();
		const session = await db.get('Session', sessionId).then(Schemas.Session.assert);
		if (!session) throw new Error(`Session with ID ${sessionId} not found`);
		abortSignal?.throwIfAborted();

		const protocolId = session.protocol;
		const protocolUsed = await db.get('Protocol', protocolId).then(Schemas.Protocol.assert);
		if (!protocolUsed) throw new Error(`Protocol with ID ${protocolId} not found`);
		abortSignal?.throwIfAborted();

		const mtimeMetadataKey = protocolUsed.exports?.images?.mtime;

		const observations = await db.getAllFromIndex('Observation', 'sessionId', sessionId);
		abortSignal?.throwIfAborted();
		const imagesFromDatabase = await db.getAllFromIndex('Image', 'sessionId', sessionId);
		abortSignal?.throwIfAborted();
		const metadataDefinitions = await db
			.getAll('Metadata')
			.then((ms) => Object.fromEntries(ms.map((m) => [m.id, m])));
		abortSignal?.throwIfAborted();

		const splitProgress = progressSplitter('prepare', 0.7, 'encode');

		const { exportedObservations, filepaths } = await prepare({
			protocolUsed,
			sessionId,
			db,
			abortSignal,
			onProgress(p) {
				notify({ progress: splitProgress('prepare', p) });
			}
		});

		const allMetadataKeys = [
			...new Set(
				observations.flatMap((o) => Object.keys(exportedObservations[o.id].metadata))
			)
		];

		/**
		 * @type {Array<{imageId: string, croppedBytes: Uint8Array, originalBytes?: Uint8Array|undefined, contentType: string, filename: string}>}
		 */
		let buffersOfImages = [];

		let total = 1;
		let done = 0;

		abortSignal?.throwIfAborted();

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

				abortSignal?.throwIfAborted();

				const { contentType, filename } = Schemas.Image.assert(image);
				const cropbox = metadata[protocolUsed.crop?.metadata ?? 'crop']?.value;
				if (!image.fileId) continue;
				const file = await db.get('ImageFile', image.fileId);
				if (!file) continue;

				abortSignal?.throwIfAborted();

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

				abortSignal?.throwIfAborted();

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

				abortSignal?.throwIfAborted();

				buffersOfImages.push({
					imageId,
					croppedBytes,
					originalBytes,
					contentType,
					filename
				});

				done++;
				notify({ progress: splitProgress('encode', done / total) });
			}
		}

		abortSignal?.throwIfAborted();

		/** @type {Uint8Array<ArrayBuffer>} */
		const zipfile = await unlessAborted(
			abortSignal,
			new Promise((resolve, reject) =>
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
													metadataPrettyValue(value, {
														// Exports always have english value serializations for better interoperability
														language: 'en',
														type: metadataDefinitions[key].type,
														valueLabel
													})
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
											const buffers = buffersOfImages.find(
												(i) => i.imageId === id
											);
											if (!buffers) return [];

											/**
											 * @type {import('fflate').AsyncZipOptions}
											 */
											let options = { level: 0 };

											if (
												mtimeMetadataKey &&
												typeof metadata[mtimeMetadataKey]?.value ===
													'string'
											) {
												options.mtime = new Date(
													metadata[mtimeMetadataKey].value
												);
											}

											return [
												[
													exportedAs.cropped,
													[buffers.croppedBytes, options]
												],
												[
													exportedAs.original,
													[buffers.originalBytes, options]
												]
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
			)
		);

		notify({ progress: 1 });
		return zipfile.buffer;
	}
);

swarp.previewResultsZip(async ({ sessionId, include }, _, { abortSignal }) => {
	const db = await openDatabase();
	const session = await db.get('Session', sessionId).then(Schemas.Session.assert);
	if (!session) throw new Error(`Session with ID ${sessionId} not found`);
	abortSignal?.throwIfAborted();

	const protocolId = session.protocol;
	const protocolUsed = await db.get('Protocol', protocolId).then(Schemas.Protocol.assert);
	if (!protocolUsed) throw new Error(`Protocol with ID ${protocolId} not found`);
	abortSignal?.throwIfAborted();

	const { exportedObservations, filepaths } = await prepare({
		protocolUsed,
		sessionId,
		db,
		abortSignal
	});

	return {
		'metadata.csv': [filepaths.metadata.csv],
		'metadata.json': [filepaths.metadata.json],
		'images.cropped':
			include === 'metadataonly'
				? []
				: Object.values(exportedObservations).flatMap((o) =>
						o.images.map((i) => i.exportedAs.cropped)
					),
		'images.original':
			include !== 'full'
				? []
				: Object.values(exportedObservations).flatMap((o) =>
						o.images.map((i) => i.exportedAs.original)
					)
	};
});

swarp.estimateResultsZipSize(async ({ sessionId, include, cropPadding }, _, { abortSignal }) => {
	const db = await openDatabase();
	const session = await db.get('Session', sessionId).then(Schemas.Session.assert);
	if (!session) throw new Error(`Session with ID ${sessionId} not found`);
	abortSignal?.throwIfAborted();

	const protocolId = session.protocol;
	const protocolUsed = await db.get('Protocol', protocolId).then(Schemas.Protocol.assert);
	if (!protocolUsed) throw new Error(`Protocol with ID ${protocolId} not found`);
	abortSignal?.throwIfAborted();

	const observations = await db.getAllFromIndex('Observation', 'sessionId', sessionId);
	const images = await Promise.all(
		Object.values(observations)
			.flatMap((o) => o.images)
			.map(async (id) => db.get('Image', id).then(Schemas.Image.assert))
	);
	abortSignal?.throwIfAborted();

	const imageFileStats = await db.getAllFromIndex('ImageFile', 'sessionId', sessionId).then(
		(images) =>
			new Map(
				images.map(({ bytes, dimensions, id }) => [
					id,
					{
						dimensions,
						fullSize: bytes.byteLength,
						bytePerPixel: bytes.byteLength / (dimensions.width * dimensions.height)
					}
				])
			)
	);
	abortSignal?.throwIfAborted();

	const estimations = {
		json: (5300e3 / 94) * Object.keys(observations).length,
		csv: (30e3 / 94) * Object.keys(observations).length,
		full: sum(
			images.map(({ fileId }) => {
				if (!fileId) return 0;
				const stats = imageFileStats.get(fileId);
				if (!stats) return 0;
				return stats.fullSize;
			})
		),
		// Infer cropped image's sizes based on their full image file's byte per pixel and the cropbox's dimensions
		cropped: sum(
			images.map(({ fileId, metadata }) => {
				if (!fileId) return 0;
				const stats = imageFileStats.get(fileId);
				if (!stats) return 0;
				const cropbox = MetadataRuntimeValue.boundingbox(
					metadata[protocolUsed.crop?.metadata ?? 'crop']?.value
				);
				if (cropbox instanceof ArkErrors) return stats.fullSize;

				const { width, height } = parseCropPadding(cropPadding).apply(
					stats.dimensions,
					cropbox
				);

				const estimation = stats.bytePerPixel * (width * height);

				// XXX: We determined experimentally that cropped size estimation has a +80% error when compared to real sizes.
				// We see that the estimated size is on average 6.37 times smaller than the real size. (with σ = 3.30 so... yeah not ideal)
				// This was determined over a sample of 50 images (we should probably do a bigger sample size, sth like 500 images)
				return estimation * 6.37;
			})
		)
	};

	/** @satisfies { Record<keyof typeof estimations, number> } */
	const compressionRates = {
		json: 1 - 0.93,
		csv: 1 - 0.7,
		cropped: 1,
		full: 1
	};

	/**
	 *
	 * @param  {...(keyof typeof estimations)} things
	 */
	function computeEstimates(...things) {
		return {
			compressed: sum(things.map((thing) => compressionRates[thing] * estimations[thing])),
			uncompressed: sum(things.map((thing) => estimations[thing]))
		};
	}

	switch (include) {
		case 'metadataonly':
			return computeEstimates('json', 'csv');
		case 'croppedonly':
			return computeEstimates('json', 'csv', 'cropped');
		case 'full':
			return computeEstimates('json', 'csv', 'cropped', 'full');
		default:
			throw new Error(`Unknown include type: ${include}`);
	}
});

/**
 *
 * @param {object} param0
 * @param {import('../lib/database.js').Protocol} param0.protocolUsed
 * @param {string} param0.sessionId
 * @param {import('$lib/idb.svelte.js').DatabaseHandle} param0.db
 * @param {AbortSignal} [param0.abortSignal]
 * @param {(progress: number) => void} [param0.onProgress]
 */
async function prepare({ protocolUsed, sessionId, db, abortSignal, onProgress }) {
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
	abortSignal?.throwIfAborted();
	const imagesFromDatabase = await db.getAllFromIndex('Image', 'sessionId', sessionId);
	abortSignal?.throwIfAborted();
	const metadataOptions = await db.getAll('MetadataOption').then((opts) => {
		/** @type {Record<string, Record<string, typeof opts[number]>>} */
		const options = {};
		for (const opt of opts) {
			if (!options[opt.metadataId]) options[opt.metadataId] = {};
			options[opt.metadataId][opt.key] = opt;
		}
		return options;
	});
	abortSignal?.throwIfAborted();

	/**
	 * @type {typeof Analysis.inferIn['observations']}
	 */
	let exportedObservations = {};
	let sequence = 1;
	let observationNumber = 0;

	// To have stable sequence numbers, really useful for testing
	observations.sort(compareBy((o) => o.label + o.id));
	abortSignal?.throwIfAborted();

	const total = sum(observations.map((o) => o.images.length));

	for (const { id, label, images, metadataOverrides } of observations) {
		observationNumber++;

		const metadata = await observationMetadata(db, protocolUsed, {
			images,
			metadataOverrides: MetadataValues.assert(metadataOverrides)
		}).then((obsm) => addValueLabels(obsm, metadataOptions));
		abortSignal?.throwIfAborted();

		exportedObservations[id] = {
			label,
			number: observationNumber,
			metadata: toMetadataRecord(metadata),
			protocolMetadata: toMetadataRecord(protocolMetadataValues(protocolUsed, metadata)),
			images: []
		};
		abortSignal?.throwIfAborted();

		for (const [i, imageId] of images.entries()) {
			const databaseImage = imagesFromDatabase.find((i) => i.id === imageId);
			if (!databaseImage) continue;
			const imageFromDatabase = Schemas.Image.assert(databaseImage);

			const metadataValues = await addValueLabels(
				imageFromDatabase.metadata,
				metadataOptions
			);

			abortSignal?.throwIfAborted();

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

			abortSignal?.throwIfAborted();

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

			abortSignal?.throwIfAborted();

			onProgress?.(sequence / total);

			sequence++;
		}
	}

	return { exportedObservations, filepaths };
}
