import { strToU8, zip } from 'fflate';
import { Jimp } from 'jimp';
import { toTopLeftCoords } from './BoundingBoxes.svelte';
import { Schemas } from './database';
import { downloadAsFile, stringifyWithToplevelOrdering } from './download';
import * as db from './idb.svelte';
import { imageIdToFileId } from './images';
import { TARGETHEIGHT, TARGETWIDTH } from './inference';
import {
	addValueLabels,
	metadataPrettyKey,
	metadataPrettyValue,
	observationMetadata
} from './metadata';
import { toasts } from './toasts.svelte';

/**
 * @param {Array<import("./database").Observation>} observations
 * @param {import('./database').Protocol} protocolUsed
 * @param {object} param2
 * @param {'croppedonly'|'full'|'metadataonly'} param2.include
 * @param {string} param2.base base path of the app - import `base` from `$app/paths`
 */
export async function generateResultsZip(
	observations,
	protocolUsed,
	{ include = 'croppedonly', base }
) {
	/** @type {Record<string, {label: string; metadata: import('./database').MetadataValues}>}  */
	const finalObservationsData = Object.fromEntries(
		await Promise.all(
			observations.map(async (o) => [
				o.id,
				{
					label: o.label,
					metadata: await observationMetadata(o).then(addValueLabels),
					images: o.images.map((id) => {
						const image = db.tables.Image.state.find((i) => i.id === id);
						if (!image) return;
						return { ...image, metadata: addValueLabels(image.metadata) };
					})
				}
			])
		)
	);

	const allMetadataKeys = [
		...new Set(observations.flatMap((o) => Object.keys(finalObservationsData[o.id].metadata)))
	];

	const metadataDefinitions = Object.fromEntries(db.tables.Metadata.state.map((m) => [m.id, m]));

	/**
	 * @type {Array<{imageId: string, croppedBytes: Uint8Array, originalBytes?: Uint8Array, contentType: string, filename: string}>}
	 */
	let buffersOfImages = [];

	if (include !== 'metadataonly')
		buffersOfImages = await Promise.all(
			observations.flatMap((o) =>
				o.images.map(async (imageId) => {
					const image = await db.tables.Image.get(imageId);
					if (!image) throw 'Image non trouvée';
					const { contentType, filename } = image;
					const { cropped, original } = await cropImage(image);
					return {
						imageId,
						croppedBytes: new Uint8Array(cropped),
						originalBytes: include === 'full' ? new Uint8Array(original) : undefined,
						contentType,
						filename
					};
				})
			)
		);

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
	 * @type {Uint8Array<ArrayBufferLike>}
	 */
	const zipfile = await new Promise((resolve, reject) =>
		zip(
			{
				[filepaths.metadata.json]: strToU8(
					stringifyWithToplevelOrdering(
						'json',
						`${window.location.origin}${base}/results.schema.json`,
						{
							observations: finalObservationsData,
							protocol: protocolUsed
						},
						['protocol', 'observations']
					)
				),
				[filepaths.metadata.csv]: strToU8(
					toCSV(
						[
							'Identifiant',
							'Observation',
							...allMetadataKeys.flatMap((k) => [
								metadataPrettyKey(metadataDefinitions[k]),
								`${metadataPrettyKey(metadataDefinitions[k])}: Confiance`
							])
						],
						observations.map((o) => ({
							Identifiant: o.id,
							Observation: o.label,
							...Object.fromEntries(
								Object.entries(finalObservationsData[o.id].metadata).flatMap(
									([key, { value, confidence }]) => [
										[
											metadataPrettyKey(metadataDefinitions[key]),
											metadataPrettyValue(metadataDefinitions[key], value)
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
				...Object.fromEntries(
					include === 'metadataonly'
						? []
						: observations
								.flatMap((o) => o.images.map((imageId) => /** @type {const} */ ([o, imageId])))
								.flatMap(([observation, imageId], index) => {
									const buffers = buffersOfImages.find((i) => i.imageId === imageId);
									if (!buffers) throw 'Image non trouvée';
									const image = db.tables.Image.state.find((i) => i.id === imageId);
									if (!image) throw 'Image non trouvée';

									const filepathTemplateData = {
										image: { ...image, metadata: addValueLabels(image.metadata) },
										observation,
										sequence: index + 1
									};

									return [
										[
											filepaths.images.cropped(filepathTemplateData),
											[buffers.croppedBytes, { level: 0 }]
										],
										[
											filepaths.images.original(filepathTemplateData),
											[buffers.originalBytes, { level: 0 }]
										]
									].filter(([, [bytes]]) => bytes !== undefined);
								})
				)
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

	downloadAsFile(zipfile, 'results.zip', 'application/zip');
}

/**
 * @param {import('./database').Image} image
 * @returns {Promise<{ cropped: ArrayBuffer, original: ArrayBuffer }>}
 */
export async function cropImage(image) {
	const centeredBoundingBox =
		/** @type {undefined | import("./metadata").RuntimeValue<'boundingbox'>}  */
		(image.metadata.crop?.value);

	if (!centeredBoundingBox) throw "L'image n'a pas d'information de recadrage";

	const boundingBox = toTopLeftCoords(centeredBoundingBox);

	const bytes = await db.get('ImageFile', imageIdToFileId(image.id)).then((f) => f?.bytes);
	if (!bytes) throw "L'image n'a pas de fichier associé";

	const tensor = await Jimp.read(bytes);

	// Inferred crop box is for the [TARGETHEIGHT, TARGETWIDTH] resized image. Scale it back to it fits to the original image.
	const scaleFactors = {
		widthWise: tensor.width / TARGETWIDTH,
		heightWise: tensor.height / TARGETHEIGHT
	};

	try {
		const cropped = tensor.crop({
			x: boundingBox.x * scaleFactors.widthWise,
			y: boundingBox.y * scaleFactors.heightWise,
			w: boundingBox.width * scaleFactors.widthWise,
			h: boundingBox.height * scaleFactors.heightWise
		});
		// @ts-ignore
		return { cropped: await cropped.getBuffer(image.contentType), original: bytes };
	} catch (error) {
		toasts.warn(`Impossible de recadrer ${image.filename}, l'image sera incluse sans recadrage`);
		console.error(
			`Couldn't crop ${image.filename} (id ${image.id}) with `,
			{ boundingBox, scaleFactors },
			':',
			error
		);
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
