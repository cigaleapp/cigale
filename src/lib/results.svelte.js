/**
 * @import * as DB from './database';
 */
import { ArkErrors } from 'arktype';
import { strFromU8, unzipSync } from 'fflate';
import * as db from './idb.svelte';
import { imageIdToFileId, resizeToMaxSize, storeImageBytes } from './images';
import { serializeMetadataValue } from './metadata';
import { Analysis } from './schemas/results';
import { uiState } from './state.svelte';
import { toasts } from './toasts.svelte';
import { entries, mapValues, pick, safeJSONParse, uint8ArrayToArrayBuffer } from './utils';

/**
 * Import back a results zip file.
 * @param {File} file
 * @param {string} [protocolId] make sure that the protocolId is the same as the one used to export the zip file
 */
export async function importResultsZip(file, protocolId) {
	const contents = new Uint8Array(await file.arrayBuffer());

	const results = unzipSync(contents, {
		filter: ({ name }) => {
			return name === (uiState.currentProtocol?.exports?.metadata.json ?? 'analysis.json');
		}
	});

	if (Object.keys(results).length === 0) {
		uiState.processing.files.pop();
		toasts.error(`Aucun fichier d'analyse trouvé dans l'export ${file.name}`);
		return;
	}

	const [analysis] = Object.values(results)
		.map((d) => strFromU8(d))
		.map(safeJSONParse)
		.map((obj) => (obj ? Analysis(obj) : undefined));

	if (analysis === undefined) {
		uiState.processing.files.pop();
		toasts.error(`Le fichier d'analyse de ${file.name} n'est pas au format JSON ou est corrompu`);
		return;
	}

	if (analysis instanceof ArkErrors) {
		uiState.processing.files.pop();
		toasts.error(`Fichier d'analyse de ${file.name} invalide: ${analysis.summary}`);
		return;
	}

	const { protocol, observations } = analysis;

	if (protocolId && protocol.id !== protocolId) {
		uiState.processing.files.pop();
		toasts.error(
			`Le fichier d'analyse de ${file.name} a été exporté avec le protocole ${protocol.id}, mais le protocole actuel est ${protocolId}`
		);
		return;
	}

	uiState.processing.files = [
		...uiState.processing.files,
		...Object.values(observations).flatMap((o) => o.images.map((i) => i.filename))
	];

	const extractedImages = unzipSync(contents, {
		filter: ({ name }) =>
			Object.values(observations).some((o) => o.images.some((i) => i.exportedAs.original === name))
	});

	if (Object.keys(extractedImages).length === 0) {
		uiState.processing.files = uiState.processing.files.filter(
			(f) =>
				f !== file.name &&
				!Object.values(observations)
					.flatMap((o) => o.images.map((i) => i.filename))
					.includes(f)
		);
		toasts.error(
			`Aucune image trouvée dans l'export ${file.name}. L'export doit contenir les images originales, pas seulement les images recadrées`
		);
		return;
	}

	for (const [name, bytes] of entries(extractedImages)) {
		const observation = entries(observations)
			.map(([id, o]) => ({ id, ...o }))
			.find((o) => o.images.some((i) => i.exportedAs.original === name));

		if (!observation) {
			uiState.processing.files = uiState.processing.files.filter((f) => f !== name);
			continue;
		}

		const image = observation.images.find((i) => i.exportedAs.original === name);
		if (!image) {
			uiState.processing.files = uiState.processing.files.filter((f) => f !== name);
			continue;
		}

		await db.tables.Observation.set({
			...pick(observation, 'id', 'label'),
			images: observation.images.map((i) => i.id),
			addedAt: new Date().toISOString(),
			metadataOverrides: mapValues(observation.metadata, (v) => ({
				value: serializeMetadataValue(v.value),
				confidence: v.confidence,
				manuallyModified: v.manuallyModified,
				alternatives: v.alternatives
			}))
		});

		const originalBytes = uint8ArrayToArrayBuffer(bytes);

		const [[width, height], resizedBytes] = await resizeToMaxSize({
			source: new File([originalBytes], image.filename, { type: image.contentType })
		});

		uiState.processing.files.shift();

		await storeImageBytes({
			id: imageIdToFileId(image.id),
			resizedBytes,
			originalBytes,
			contentType: file.type,
			filename: file.name,
			width,
			height
		});

		await db.tables.Image.set({
			...pick(image, 'id', 'filename', 'contentType'),
			dimensions: { width, height },
			fileId: imageIdToFileId(image.id),
			boundingBoxesAnalyzed: true,
			addedAt: new Date().toISOString(),
			metadata: mapValues(image.metadata, (v) => ({
				value: serializeMetadataValue(v.value),
				confidence: v.confidence,
				manuallyModified: v.manuallyModified,
				alternatives: v.alternatives
			}))
		});
	}

	uiState.processing.files.shift();
}
