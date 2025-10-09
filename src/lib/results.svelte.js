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
 * @template {string} HeaderKey
 * @param {HeaderKey[]} header
 * @param {Array<Record<NoInfer<HeaderKey>, string>>} rows
 * @param {string} [separator=";"]
 */
export function toCSV(header, rows, separator = ';') {
	/** @param {string} cell */
	const quote = (cell) => `"${cell?.replace(/"/g, '""') ?? ''}"`;

	return [
		header.map(quote).join(separator),
		...rows.map((row) => header.map((key) => quote(row[key])).join(separator))
	].join('\n');
}

/**
 * Import back a results zip file.
 * @param {File} file
 * @param {string} id
 * @param {string} [protocolId] make sure that the protocolId is the same as the one used to export the zip file
 */
export async function importResultsZip(file, id, protocolId) {
	const contents = new Uint8Array(await file.arrayBuffer());

	const results = unzipSync(contents, {
		filter: ({ name }) => {
			return name === (uiState.currentProtocol?.exports?.metadata.json ?? 'analysis.json');
		}
	});

	if (Object.keys(results).length === 0) {
		uiState.processing.removeFile(id);
		toasts.error(`Aucun fichier d'analyse trouvé dans l'export ${file.name}`);
		return;
	}

	const [analysis] = Object.values(results)
		.map((d) => strFromU8(d))
		.map(safeJSONParse)
		.map((obj) => (obj ? Analysis(obj) : undefined));

	if (analysis === undefined) {
		uiState.processing.removeFile(id);
		toasts.error(
			`Le fichier d'analyse de ${file.name} n'est pas au format JSON ou est corrompu`
		);
		return;
	}

	if (analysis instanceof ArkErrors) {
		uiState.processing.removeFile(id);
		toasts.error(`Fichier d'analyse de ${file.name} invalide: ${analysis.summary}`);
		return;
	}

	const { protocol, observations } = analysis;

	if (protocolId && protocol.id !== protocolId) {
		uiState.processing.removeFile(id);
		toasts.error(
			`Le fichier d'analyse de ${file.name} a été exporté avec le protocole ${protocol.id}, mais le protocole actuel est ${protocolId}`
		);
		return;
	}

	const files = Object.values(observations)
		.flatMap((o) => o.images)
		.map((i) => ({ id: i.id, name: i.exportedAs.original }));

	uiState.processing.files.push(...files);

	const extractedImages = unzipSync(contents, {
		filter: ({ name }) => files.some((f) => f.name === name)
	});

	if (Object.keys(extractedImages).length === 0) {
		uiState.processing.removeFile(id);
		// Remove our files from the processing queue
		uiState.processing.files = uiState.processing.files.filter(
			(f) => !files.find((file) => file.id === f.id)
		);
		toasts.error(
			`Aucune image trouvée dans l'export ${file.name}. L'export doit contenir les images originales, pas seulement les images recadrées`
		);
		return;
	}

	for (const [name, bytes] of entries(extractedImages)) {
		const id = files.find((f) => f.name === name)?.id;
		if (!id) continue;

		const observation = entries(observations)
			.map(([id, o]) => ({ id, ...o }))
			.find((o) => o.images.some((i) => i.exportedAs.original === name));

		if (!observation) {
			uiState.processing.removeFile(id);
			continue;
		}

		const image = observation.images.find((i) => i.exportedAs.original === name);
		if (!image) {
			uiState.processing.removeFile(id);
			continue;
		}

		await db.tables.Observation.set({
			...pick(observation, 'id', 'label'),
			images: observation.images.map((i) => i.id),
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
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

		await storeImageBytes({
			id: imageIdToFileId(image.id),
			resizedBytes,
			originalBytes,
			contentType: image.contentType,
			filename: image.filename,
			width,
			height
		});

		await db.tables.Image.set({
			...pick(image, 'id', 'filename', 'contentType'),
			dimensions: { width, height },
			fileId: imageIdToFileId(image.id),
			boundingBoxesAnalyzed: true,
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			addedAt: new Date().toISOString(),
			metadata: mapValues(image.metadata, (v) => ({
				value: serializeMetadataValue(v.value),
				confidence: v.confidence,
				manuallyModified: v.manuallyModified,
				alternatives: v.alternatives
			}))
		});

		uiState.processing.removeFile(image.id);
	}

	uiState.processing.removeFile(id);
}
