/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { classify, infer, loadModel } from '$lib/inference.js';
import { loadToTensor } from '$lib/inference_utils.js';
import { metadataOptionId, namespacedMetadataId } from '$lib/schemas/metadata.js';
import { ExportedProtocol } from '$lib/schemas/protocols.js';
import { fetchHttpRequest, omit, pick } from '$lib/utils.js';
import { openDB } from 'idb';
import * as Swarp from 'swarpc';
import YAML from 'yaml';
import { Schemas } from './lib/database.js';
import { PROCEDURES } from './web-worker-procedures.js';
import { storeMetadataValue } from '$lib/metadata.js';

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
	const id = inferenceModelId(protocolId, request);
	const existingSession = inferenceSessions.get(task);
	if (existingSession && existingSession.id === id) {
		console.log(`Model ${task} already loaded with ID ${id}`);
		return true; // Model is already loaded
	}

	console.log(`Loading model for task ${task} with ID ${id}`);
	/** @type {InferenceSession} */
	const session = {
		id,
		onnx: await loadModel(request, webgpu, ({ transferred, total }) => {
			// Account for the fact that the model loading is 75% of the total progress, if we have to load a classmapping next.
			onProgress((classmapping ? 0.75 : 1) * (transferred / total));
		})
	};

	if (classmapping) {
		session.classmapping = await fetchHttpRequest(classmapping, {
			cacheAs: 'model',
			onProgress({ transferred, total }) {
				// Account for progress being already 0.75 of the way there because of the model loading
				onProgress(0.75 + 0.25 * (transferred / total));
			}
		})
			.then((res) => res.text())
			.then((text) => text.split(/\r?\n/).filter(Boolean));
	}

	console.log(`Model ${task} loaded successfully with ID ${id}`);

	inferenceSessions.set(task, session);
	return true;
});

swarp.isModelLoaded(async (task) => inferenceSessions.has(task));

swarp.inferBoundingBoxes(async ({ fileId, taskSettings }, _, tools) => {
	let aborted = false;
	tools.abortSignal?.addEventListener('abort', () => {
		aborted = true;
	});

	const session = inferenceSessions.get('detection')?.onnx;
	if (!session) {
		throw new Error('Modèle de détection non chargé');
	}

	const db = await openDatabase();
	if (aborted) return { boxes: [], scores: [] };

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

swarp.classify(async ({ imageId, metadataIds, taskSettings }, _, tools) => {
	tools.abortSignal?.throwIfAborted();

	const db = await openDatabase();
	const image = Schemas.Image.assert(await db.get('Image', imageId));

	tools.abortSignal?.throwIfAborted();
	const session = inferenceSessions.get('classification');
	if (!session) throw new Error('Modèle de classification non chargé');
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

	console.log('Classifying image', image.id, 'with cropbox', cropbox);

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
		.slice(0, 3)
		.filter(({ confidence }) => confidence > 0.005);

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

void swarp.start();
