/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { classify, infer, loadModel } from '$lib/inference.js';
import { loadToTensor } from '$lib/inference_utils.js';
import { metadataOptionId, namespacedMetadataId } from '$lib/schemas/metadata.js';
import { ExportedProtocol } from '$lib/schemas/protocols.js';
import { omit, pick } from '$lib/utils.js';
import { openDB } from 'idb';
import * as Swarp from 'swarpc';
import YAML from 'yaml';
import { PROCEDURES } from './web-worker-procedures.js';

const ww = /** @type {Worker} */ (/** @type {unknown} */ self);

/**
 * @type {import('idb').IDBPDatabase<import('./lib/idb.svelte.js').IDBDatabaseType> | undefined}
 */
let db;

/** @type {undefined | { name: string , revision: number }} */
let databaseParams;

async function openDatabase() {
	if (!databaseParams) {
		throw new Error('Database parameters not set, call swarp.init() first');
	}
	if (db) return db;
	db = await openDB(databaseParams.name, databaseParams.revision);
}

const swarp = Swarp.Server(PROCEDURES, { worker: ww });

/**
 * @type {Map<string, { onnx: import('onnxruntime-web').InferenceSession, id: string }>}
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

swarp.loadModel(async ({ task, request, protocolId, webgpu }, onProgress) => {
	const id = inferenceModelId(protocolId, request);
	if (inferenceSessions.has(task) && inferenceSessions.get(task).id === id) {
		console.log(`Model ${task} already loaded with ID ${id}`);
		return true; // Model is already loaded
	}

	console.log(`Loading model for task ${task} with ID ${id}`);
	const session = await loadModel(request, onProgress, webgpu);
	console.log(`Model ${task} loaded successfully with ID ${id}`);
	inferenceSessions.set(task, { onnx: session, id });
	return true;
});

swarp.isModelLoaded((task) => inferenceSessions.has(task));

swarp.inferBoundingBoxes(async ({ fileId, taskSettings }) => {
	const session = inferenceSessions.get('detection')?.onnx;
	if (!session) {
		throw new Error('Modèle de détection non chargé');
	}

	await openDatabase();
	const file = await db.get('ImageFile', fileId);
	if (!file) {
		throw new Error(`Fichier avec l'ID ${fileId} non trouvé`);
	}

	const [[boxes], [scores]] = await infer(taskSettings, [file.bytes], session);

	return { boxes, scores };
});

swarp.classify(async ({ fileId, cropbox, taskSettings }) => {
	const session = inferenceSessions.get('classification')?.onnx;
	if (!session) {
		throw new Error('Modèle de classification non chargé');
	}

	await openDatabase();
	const file = await db.get('ImageFile', fileId);
	if (!file) {
		throw new Error(`Fichier avec l'ID ${fileId} non trouvé`);
	}

	console.log('Classifying file', fileId, 'with cropbox', cropbox);

	// We gotta normalize since this img will be used to set a cropped Preview URL -- classify() itself takes care of normalizing (or not) depending on the protocol
	const img = await loadToTensor([file.bytes], {
		...taskSettings.input,
		normalized: true,
		crop: cropbox
	});

	const scores = await classify(taskSettings, img, session);

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
	onLoadingState('filtering-builtin-metadata');

	const builtinMetadata = Object.entries(parsed.metadata ?? {})
		.filter(([, value]) => value === 'builtin')
		.map(([id]) => id);

	parsed.metadata = Object.fromEntries(
		Object.entries(parsed.metadata ?? {}).filter(([, value]) => value !== 'builtin')
	);

	onLoadingState('input-validation');
	console.time('Validating protocol');
	const protocol = ExportedProtocol.in.assert(parsed);
	console.timeEnd('Validating protocol');

	// await openTransaction(['Protocol', 'Metadata', 'MetadataOption'], {}, (tx) => {
	if (!db) throw new Error('Database not initialized');
	const tx = db.transaction(['Protocol', 'Metadata', 'MetadataOption'], 'readwrite');
	onLoadingState('write-protocol');
	console.time('Storing Protocol');
	tx.objectStore('Protocol').put({
		...protocol,
		metadata: [...Object.keys(protocol.metadata), ...builtinMetadata]
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

swarp.start(ww);
