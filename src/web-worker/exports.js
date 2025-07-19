import { stringifyWithToplevelOrdering } from '$lib/download';
import { addExifMetadata } from '$lib/exif';
import { cropImage } from '$lib/images';
import {
	addValueLabels,
	isType,
	METADATA_ZERO_VALUE,
	metadataPrettyKey,
	metadataPrettyValue,
	observationMetadata
} from '$lib/metadata';
import {
	isNamespacedToProtocol,
	MetadataValues,
	removeNamespaceFromMetadataId
} from '$lib/schemas/metadata';
import { FilepathTemplate } from '$lib/schemas/protocols';
import { Analysis } from '$lib/schemas/results';
import { compareBy } from '$lib/utils';
import { base } from '$service-worker';
import { strToU8, zip } from 'fflate';
import { openDatabase, swarp } from './init';
import { Schemas } from '$lib/database';

swarp.generateResultsZip(async ({ include, protocolId, jsonSchemaURL, cropPadding }, notify) => {
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
	const metadataOptions = await db.getAll('MetadataOption');

	/**
	 * @type {typeof Analysis.inferIn['observations']}
	 */
	let exportedObservations = {};
	let sequence = 1;

	// To have stable sequence numbers, really useful for testing
	observations.sort(compareBy((o) => o.label + o.id));
	for (const { id, label, images, metadataOverrides } of observations) {
		const metadata = await observationMetadata(
			{ images, metadataOverrides: MetadataValues.assert(metadataOverrides) },
			imagesFromDatabase.map((img) => Schemas.Image.assert(img))
		).then((obsm) => addValueLabels(obsm, metadataOptions, Object.values(metadataDefinitions)));

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

			const metadataValues = await addValueLabels(
				imageFromDatabase.metadata,
				metadataOptions,
				Object.values(metadataDefinitions)
			);

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
			if (!imagesFromDatabase.some((i) => i.id === imageId)) continue;
			let image = Schemas.Image.assert(imagesFromDatabase.find((i) => i.id === imageId));

			const metadata = MetadataValues.assert({
				...image.metadata,
				...observation.metadataOverrides
			});

			const { contentType, filename } = image;
			const cropbox = image.metadata[protocolUsed.crop?.metadata ?? 'crop'];
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

			done++;
			notify({ progress: done / total });
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

	notify({ progress: 1 });
	return zipfile.buffer;
});

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
 * @param {import('$lib/database').Protocol} protocol
 * @param {import('$lib/database').MetadataValues} values
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
