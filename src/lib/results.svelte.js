/**
 * @import * as DB from './database';
 */
import { ArkErrors } from 'arktype';
import { strFromU8, strToU8, unzipSync, zip } from 'fflate';
import { coordsScaler, toTopLeftCoords } from './BoundingBoxes.svelte';
import { Schemas } from './database';
import { downloadAsFile, stringifyWithToplevelOrdering } from './download';
import { addExifMetadata } from './exif';
import * as db from './idb.svelte';
import { imageIdToFileId, resizeToMaxSize, storeImageBytes } from './images';
import {
	addValueLabels,
	METADATA_ZERO_VALUE,
	metadataPrettyKey,
	metadataPrettyValue,
	observationMetadata,
	serializeMetadataValue
} from './metadata';
import { isNamespacedToProtocol, removeNamespaceFromMetadataId } from './protocols';
import { Analysis } from './schemas/results';
import { uiState } from './state.svelte';
import { toasts } from './toasts.svelte';
import {
	clamp,
	compareBy,
	entries,
	mapValues,
	pick,
	safeJSONParse,
	uint8ArrayToArrayBuffer
} from './utils';

/**
 * @param {DB.Observation[]} observations
 * @param {DB.Protocol} protocolUsed
 * @param {object} param2
 * @param {'croppedonly'|'full'|'metadataonly'} param2.include
 * @param {string} param2.base base path of the app - import `base` from `$app/paths`
 * @param {number} [param2.cropPadding] padding to add around the bounding box when cropping images
 */
export async function generateResultsZip(
	observations,
	protocolUsed,
	{ include = 'croppedonly', base, cropPadding }
) {
	const filepaths = protocolUsed.exports ?? {
		images: {
			cropped: Schemas.FilepathTemplate.assert('cropped/{{sequence}}.{{extension image.filename}}'),
			original: Schemas.FilepathTemplate.assert(
				'original/{{sequence}}.{{extension image.filename}}'
			)
		},
		metadata: {
			json: 'analysis.json',
			csv: 'metadata.csv'
		}
	};

	/**
	 * @type {typeof Analysis.inferIn['observations']}
	 */
	let exportedObservations = {};
	let sequence = 1;

	// To have stable sequence numbers, really useful for testing
	observations.sort(compareBy((o) => o.label + o.id));
	for (const { id, label, images, metadataOverrides } of observations) {
		const metadata = await observationMetadata({ images, metadataOverrides }).then(addValueLabels);

		exportedObservations[id] = {
			label,
			metadata,
			protocolMetadata: protocolMetadataValues(protocolUsed, metadata),
			images: []
		};

		for (const imageId of images.sort()) {
			const imageFromDatabase = db.tables.Image.state.find((i) => i.id === imageId);
			if (!imageFromDatabase) continue;
			const metadataValues = await addValueLabels(imageFromDatabase.metadata);

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

	const metadataDefinitions = Object.fromEntries(db.tables.Metadata.state.map((m) => [m.id, m]));

	/**
	 * @type {Array<{imageId: string, croppedBytes: Uint8Array, originalBytes?: Uint8Array|undefined, contentType: string, filename: string}>}
	 */
	let buffersOfImages = [];

	uiState.processing.state = 'generating-zip';
	uiState.processing.total = 1;
	uiState.processing.done = 0;

	if (include !== 'metadataonly') {
		uiState.processing.total += observations.flatMap((o) => o.images).length;
		for (const [observation, imageId] of observations.flatMap((o) =>
			o.images.map((img) => /** @type {const} */ ([o, img]))
		)) {
			const image = await db.tables.Image.get(imageId);
			if (!image) continue;
			const metadata = { ...image.metadata, ...observation.metadataOverrides };
			const { contentType, filename } = image;
			const { cropped, original } = await cropImage(protocolUsed, image, cropPadding);

			/** @type {undefined | Uint8Array} */
			let originalBytes = undefined;
			/** @type {Uint8Array} */
			let croppedBytes;

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

			buffersOfImages.push({
				imageId,
				croppedBytes,
				originalBytes,
				contentType,
				filename
			});

			uiState.processing.done++;
		}
	}

	/**
	 * @type {Uint8Array<ArrayBufferLike>}
	 */
	const zipfile = await new Promise((resolve, reject) =>
		zip(
			{
				[filepaths.metadata.json]: strToU8(
					stringifyWithToplevelOrdering(
						'json',
						`${window.location.origin}${base}/results.schema.json`,
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
											metadataPrettyValue(metadataDefinitions[key], value, valueLabel)
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
				comment: `Generated by C.i.g.a.l.e on ${new Date().toISOString()} - ${window.location.origin}`
			},
			(err, data) => {
				if (err) reject(err);
				resolve(data);
			}
		)
	);

	uiState.processing.done++;

	downloadAsFile(zipfile, 'results.zip', 'application/zip');
}

/**
 * @param {DB.Protocol} protocol protocol used
 * @param {DB.Image} image
 * @param {number} [padding=protocol.crop.padding] padding to add around the bounding box
 * @returns {Promise<{ cropped: ArrayBuffer, original: ArrayBuffer }>}
 */
async function cropImage(protocol, image, padding = protocol.crop.padding) {
	const centeredBoundingBox =
		/** @type {undefined | import("./metadata").RuntimeValue<'boundingbox'>}  */
		(image.metadata[protocol.crop?.metadata ?? 'crop']?.value);

	const bytes = await db.get('ImageFile', imageIdToFileId(image.id)).then((f) => f?.bytes);
	if (!bytes) throw "L'image n'a pas de fichier associé";

	if (!centeredBoundingBox) {
		return { cropped: bytes, original: bytes };
	}

	const bitmap = await createImageBitmap(new Blob([bytes], { type: image.contentType }));
	const boundingBox = coordsScaler({ x: bitmap.width, y: bitmap.height })(
		toTopLeftCoords(centeredBoundingBox)
	);
	try {
		const croppedBitmap = await createImageBitmap(
			bitmap,
			clamp(boundingBox.x - padding, 0, bitmap.width),
			clamp(boundingBox.y - padding, 0, bitmap.height),
			clamp(boundingBox.width + padding, 1, bitmap.width),
			clamp(boundingBox.height + padding, 1, bitmap.height)
		);
		const canvas = document.createElement('canvas');
		canvas.width = croppedBitmap.width;
		canvas.height = croppedBitmap.height;
		canvas.getContext('2d')?.drawImage(croppedBitmap, 0, 0);
		const croppedBytes = await new Promise((resolve) =>
			canvas.toBlob(
				resolve,
				['image/png', 'image/jpeg'].includes(image.contentType) ? image.contentType : 'image/png'
			)
		).then((blob) => blob.arrayBuffer());

		// @ts-ignore
		return { cropped: croppedBytes, original: bytes };
	} catch (error) {
		toasts.warn(`Impossible de recadrer ${image.filename}, l'image sera incluse sans recadrage`);
		console.error(
			`Couldn't crop ${image.filename} (id ${image.id}) with `,
			{ boundingBox },
			':',
			error
		);
	} finally {
		bitmap.close();
	}

	return { cropped: bytes, original: bytes };
}

/**
 * @template {string} HeaderKey
 * @param {HeaderKey[]} header
 * @param {Array<Record<NoInfer<HeaderKey>, string>>} rows
 * @param {string} [separator=";"]
 */
function toCSV(header, rows, separator = ';') {
	/** @param {string} cell */
	const quote = (cell) => `"${cell?.replace(/"/g, '""') ?? ''}"`;

	return [
		header.map(quote).join(separator),
		...rows.map((row) => header.map((key) => quote(row[key])).join(separator))
	].join('\n');
}

/**
 * Returns a un-namespaced object of all metadata values of the given protocol, given the metadata values object of an image/observation. If a metadata value is absent from the given values, the value is still present, but set to `null`.
 *
 * @param {DB.Protocol} protocol
 * @param {DB.MetadataValues} values
 */
function protocolMetadataValues(protocol, values) {
	return Object.fromEntries(
		protocol.metadata
			.filter((key) => isNamespacedToProtocol(protocol.id, key))
			.map((key) => [
				removeNamespaceFromMetadataId(key),
				values[key] ?? {
					...METADATA_ZERO_VALUE,
					valueLabel: ''
				}
			])
	);
}

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
