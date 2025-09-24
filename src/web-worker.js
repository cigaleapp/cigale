/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { syncCorrections } from '$lib/beamup.svelte.js';
import { stringifyWithToplevelOrdering } from '$lib/download';
import { addExifMetadata } from '$lib/exif';
import { cropImage } from '$lib/images.js';
import { classify, infer, loadModel } from '$lib/inference.js';
import { loadToTensor } from '$lib/inference_utils.js';
import {
	addValueLabels,
	metadataPrettyKey,
	metadataPrettyValue,
	observationMetadata,
	protocolMetadataValues
} from '$lib/metadata';
import { storeMetadataValue } from '$lib/metadata.js';
import { MetadataValues } from '$lib/schemas/metadata';
import { metadataOptionId, namespacedMetadataId } from '$lib/schemas/metadata.js';
import { FilepathTemplate } from '$lib/schemas/protocols';
import { ExportedProtocol } from '$lib/schemas/protocols.js';
import { Analysis } from '$lib/schemas/results';
import { compareBy, progressSplitter } from '$lib/utils';
import { fetchHttpRequest, omit, pick } from '$lib/utils.js';
import { strToU8, zip } from 'fflate';
import { openDB } from 'idb';
import * as Swarp from 'swarpc';
import YAML from 'yaml';
import { Schemas } from './lib/database.js';
import { toCSV } from './lib/results.svelte.js';
import { PROCEDURES } from './web-worker-procedures.js';

/**
 * @type {import('idb').IDBPDatabase<import('./lib/idb.svelte.js').IDBDatabaseType> | undefined}
 */
let _db;

/** @type {undefined | { name: string , revision: number }} */
let databaseParams;

async function openDatabase() {
	if (!databaseParams) {
		throw new Error('Database parameters not set, call swarp.init() first');
	}
	if (_db) return _db;
	_db = await openDB(databaseParams.name, databaseParams.revision);
	return _db;
}

const swarp = Swarp.Server(PROCEDURES);

/**
 * @typedef {{ onnx: import('onnxruntime-web').InferenceSession, id: string, classmapping?: string[] }} InferenceSession
 */

/**
 * @type {Map<string, InferenceSession>}
 */
let inferenceSessions = new Map();

/**$
 * @param {string} protocolId
 * @param {import('./lib/database.js').HTTPRequest} request
 * @returns {string}
 */
function inferenceModelId(protocolId, request) {
	if (typeof request === 'string') return request;

	return [
		protocolId,
		request.method,
		request.url,
		Object.entries(request.headers)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${k}:${v}`)
	].join('|');
}

swarp.init(async ({ databaseName, databaseRevision }) => {
	databaseParams = { name: databaseName, revision: databaseRevision };
});

swarp.loadModel(async ({ task, request, classmapping, protocolId, webgpu }, onProgress) => {
	const splitProgress = progressSplitter('model', 0.9, 'classmapping');

	const id = inferenceModelId(protocolId, request);
	const existingSession = inferenceSessions.get(task);
	if (existingSession && existingSession.id === id) {
		console.debug(`Model ${task} already loaded with ID ${id}`);
		return true; // Model is already loaded
	}

	console.debug(`Loading model for task ${task} with ID ${id}`);
	/** @type {InferenceSession} */
	const session = {
		id,
		onnx: await loadModel(request, webgpu, ({ transferred, total }) => {
			onProgress(splitProgress('model', transferred / total));
		})
	};

	if (classmapping) {
		session.classmapping = await fetchHttpRequest(classmapping, {
			cacheAs: 'model',
			onProgress({ transferred, total }) {
				onProgress(splitProgress('classmapping', transferred / total));
			}
		})
			.then((res) => res.text())
			.then((text) => text.split(/\r?\n/).filter(Boolean));
	}

	console.debug(`Model ${task} loaded successfully with ID ${id}`);

	inferenceSessions.set(task, session);
	return true;
});

swarp.isModelLoaded(async (task) => inferenceSessions.has(task));

swarp.inferBoundingBoxes(async ({ fileId, taskSettings }, _, tools) => {
	const session = inferenceSessions.get('detection')?.onnx;
	if (!session) {
		throw new Error('Modèle de détection non chargé');
	}

	const db = await openDatabase();
	tools.abortSignal?.throwIfAborted();

	const file = await db.get('ImageFile', fileId);
	if (!file) {
		throw new Error(`Fichier avec l'ID ${fileId} non trouvé`);
	}

	const [[boxes], [scores]] = await infer(
		{
			...taskSettings,
			abortSignal: tools.abortSignal
		},
		[file.bytes],
		session
	);

	return { boxes, scores };
});

swarp.classify(async ({ imageId, metadataIds, taskSettings, protocol }, _, tools) => {
	tools.abortSignal?.throwIfAborted();

	const db = await openDatabase();
	const image = Schemas.Image.assert(await db.get('Image', imageId));

	tools.abortSignal?.throwIfAborted();
	const session = inferenceSessions.get('classification');
	if (!session) return { scores: [] };
	const { classmapping, onnx } = session;
	if (!classmapping) throw new Error("Le modèle de classification n'a pas de classmapping associé");

	tools.abortSignal?.throwIfAborted();
	if (!image.fileId) throw new Error(`Image ${imageId} has no ImageFile`);
	const file = await db.get('ImageFile', image.fileId);
	if (!file) {
		throw new Error(`Fichier avec l'ID ${image.fileId} non trouvé`);
	}

	const cropbox =
		/** @type {undefined | import('$lib/metadata.js').RuntimeValue<'boundingbox'>} */ (
			image.metadata[metadataIds.cropbox]?.value ?? { x: 0.5, y: 0.5, w: 1, h: 1 }
		);

	console.debug('Classifying image', image.id, 'with cropbox', cropbox);

	// We gotta normalize since this img will be used to set a cropped Preview URL -- classify() itself takes care of normalizing (or not) depending on the protocol
	const img = await loadToTensor([file.bytes], {
		...taskSettings.input,
		normalized: true,
		crop: cropbox,
		abortSignal: tools.abortSignal
	});

	const scores = await classify(taskSettings, img, onnx, tools.abortSignal);

	tools.abortSignal?.throwIfAborted();
	const results = scores
		.map((score, i) => ({
			confidence: score,
			value: classmapping[i]
		}))
		.sort((a, b) => b.confidence - a.confidence)
		.slice(0, 100);

	tools.abortSignal?.throwIfAborted();
	if (!results.length) {
		throw new Error('No species detected');
	} else {
		const [firstChoice, ...alternatives] = results;
		const metadataValue = /** @type {const} */ ({
			subjectId: imageId,
			...firstChoice,
			alternatives
		});

		await storeMetadataValue({
			db,
			protocol,
			...metadataValue,
			metadataId: metadataIds.target,
			abortSignal: tools.abortSignal
		});
	}

	return { scores };
});

swarp.importProtocol(async ({ contents, isJSON }, onProgress) => {
	/**
	 * @param {typeof import('./web-worker-procedures.js').PROCEDURES.importProtocol.progress.infer.phase} phase
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
		metadata: Object.keys(protocol.metadata)
	});
	console.timeEnd('Storing Protocol');

	for (const [id, metadata] of Object.entries(protocol.metadata)) {
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
		}
		console.timeEnd(`Storing Metadata Options for ${id}`);
	}

	onLoadingState('output-validation');
	console.time('Validating protocol after storing');
	const validated = ExportedProtocol.assert(protocol);
	console.timeEnd('Validating protocol after storing');

	return pick(validated, 'id', 'name', 'version');
});

swarp.generateResultsZip(async ({ protocolId, include, cropPadding, jsonSchemaURL }, notify) => {
	const db = await openDatabase();
	const protocolUsed = await db.get('Protocol', protocolId).then(Schemas.Protocol.assert);
	if (!protocolUsed) throw new Error(`Protocol with ID ${protocolId} not found`);

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

	const observations = await db.getAll('Observation');
	const imagesFromDatabase = await db.getAll('Image');
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

	// To have stable sequence numbers, really useful for testing
	observations.sort(compareBy((o) => o.label + o.id));
	for (const { id, label, images, metadataOverrides } of observations) {
		const metadata = await observationMetadata(db, {
			images,
			metadataOverrides: MetadataValues.assert(metadataOverrides)
		}).then((obsm) => addValueLabels(obsm, metadataOptions));

		exportedObservations[id] = {
			label,
			metadata,
			protocolMetadata: protocolMetadataValues(protocolUsed, metadata),
			images: []
		};

		for (const imageId of images.sort()) {
			if (!imagesFromDatabase.some((i) => i.id === imageId)) continue;

			const imageFromDatabase = Schemas.Image.assert(
				imagesFromDatabase.find((i) => i.id === imageId)
			);

			const metadataValues = await addValueLabels(imageFromDatabase.metadata, metadataOptions);

			const image = {
				...imageFromDatabase,
				metadata: metadataValues,
				protocolMetadata: protocolMetadataValues(protocolUsed, metadataValues)
			};

			const filepathsData = { observation: exportedObservations[id], image, sequence };

			exportedObservations[id].images.push({
				...image,
				sequence,
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
					croppedBytes = addExifMetadata(cropped, Object.values(metadataDefinitions), metadata);
				} else {
					croppedBytes = new Uint8Array(cropped);
				}

				if (include === 'full') {
					if (contentType === 'image/jpeg') {
						originalBytes = addExifMetadata(original, Object.values(metadataDefinitions), metadata);
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
							observations: exportedObservations,
							protocol: {
								...protocolUsed,
								exports: {
									...protocolUsed.exports,
									images: {
										original: filepaths.images.original.toJSON(),
										cropped: filepaths.images.cropped.toJSON()
									}
								}
							}
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
											metadataPrettyValue('en', metadataDefinitions[key], value, valueLabel)
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
								.flatMap(({ exportedAs, id }) => {
									const buffers = buffersOfImages.find((i) => i.imageId === id);
									if (!buffers) return [];

									return [
										[exportedAs.cropped, [buffers.croppedBytes, { level: 0 }]],
										[exportedAs.original, [buffers.originalBytes, { level: 0 }]]
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

swarp.syncStoredCorrections(async (_, onProgress) => {
	const db = await openDatabase();
	if (!db.objectStoreNames.contains('BeamupCorrection')) {
		throw new Error('Database does not support Beamup corrections');
	}

	/** @type {Array<{why: string, ids: string[]}>} */
	let failed = [];
	let succeeded = 0;
	const total = await db.count('BeamupCorrection');
	if (total === 0) {
		return { total, failed, succeeded };
	}

	await syncCorrections(db, (ids, error) => {
		if (error) {
			failed.push({ why: error, ids });
		} else {
			succeeded++;
		}

		onProgress((failed.length + succeeded) / total);
	});

	return { total, failed, succeeded };
});

void swarp.start();
