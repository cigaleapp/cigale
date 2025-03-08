import { strToU8, zip } from 'fflate';
import { Jimp } from 'jimp';
import { TARGETHEIGHT, TARGETWIDTH } from './inference';
import * as db from './idb.svelte';
import { imageIdToFileId } from './images';
import { metadataPrettyKey, metadataPrettyValue, observationMetadata } from './metadata';
import { toasts } from './toasts.svelte';
/**
 * @param {Array<import("./database").Observation>} observations
 * @param {import('./database').Protocol} protocolUsed
 */
export async function generateResultsZip(observations, protocolUsed) {
	/** @type {Record<string, {label: string; metadata: import('./database').MetadataValues}>}  */
	const finalMetadata = Object.fromEntries(
		await Promise.all(
			observations.map(async (o) => [
				o.id,
				{
					label: o.label,
					metadata: await observationMetadata(o)
				}
			])
		)
	);
	console.log({ finalMetadata });

	const allMetadataKeys = [
		...new Set(observations.flatMap((o) => Object.keys(finalMetadata[o.id].metadata)))
	];

	const metadataDefinitions = Object.fromEntries(
		await Promise.all(allMetadataKeys.map((key) => db.tables.Metadata.get(key))).then((ms) =>
			ms.filter((m) => m !== undefined).map((m) => [m.id, m])
		)
	);

	const speciesDefinition = await db.tables.Metadata.get('species');
	if (!speciesDefinition) throw 'Species metadata not found';

	/** @param {string|undefined} key  */
	const speciesDisplayName = (key) =>
		key ? (speciesDefinition.options?.find((o) => o.key === key)?.label ?? key) : undefined;

	const buffersOfImages = await Promise.all(
		observations.flatMap((o) =>
			o.images.map(async (imageId) => {
				const image = await db.tables.Image.get(imageId);
				if (!image) throw 'Image non trouvée';
				const { contentType, filename } = image;
				const bytes = await cropImage(image);
				return { imageId, bytes: new Uint8Array(bytes), contentType, filename };
			})
		)
	);

	/**
	 * @type {Uint8Array<ArrayBufferLike>}
	 */
	const zipfile = await new Promise((resolve, reject) =>
		zip(
			{
				'analysis.json': strToU8(
					JSON.stringify({
						observations: finalMetadata,
						protocol: protocolUsed
					})
				),
				'metadata.csv': strToU8(
					toCSV(
						[
							'Identifiant',
							'Observation',
							...allMetadataKeys.map((k) => metadataPrettyKey(metadataDefinitions[k]))
						],
						observations.map((o) => ({
							Identifiant: o.id,
							Observation: o.label,
							...Object.fromEntries(
								Object.entries(finalMetadata[o.id].metadata).map(([key, { value }]) => [
									metadataPrettyKey(metadataDefinitions[key]),
									metadataPrettyValue(metadataDefinitions[key], value)
								])
							)
						}))
					)
				),
				...Object.fromEntries(
					Object.entries(
						Object.groupBy(
							observations,
							(o) => speciesDisplayName(finalMetadata[o.id].metadata.species) ?? '(Unknown)'
						)
					).map(([species, observations]) => [
						species,
						Object.fromEntries(
							(observations ?? []).map((o) => [
								o.label,
								Object.fromEntries(
									o.images.map((imageId) => {
										const img = buffersOfImages.find((i) => i.imageId === imageId);
										if (!img) throw 'Image non trouvée';
										return [img.filename, [img.bytes, { level: 0 }]];
									})
								)
							])
						)
					])
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

	const blob = new Blob([zipfile], { type: 'application/zip' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'results.zip';
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * @param {import('./database').Image} image
 */
export async function cropImage(image) {
	const boundingBox =
		/** @type {undefined | import("./metadata").RuntimeValue<'boundingbox'>}  */
		(image.metadata.crop?.value);

	if (!boundingBox) throw "L'image n'a pas d'information de recadrage";

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
		return cropped.getBuffer(image.contentType);
	} catch (error) {
		toasts.warn(`Impossible de recadrer ${image.filename}, l'image sera incluse sans recadrage`);
		console.error(
			`Couldn't crop ${image.filename} (id ${image.id}) with `,
			{ boundingBox, scaleFactors },
			':',
			error
		);
	}

	return bytes;
}

/**
 * @template {string} HeaderKey
 * @param {HeaderKey[]} header
 * @param {Array<Record<NoInfer<HeaderKey>, string>>} rows
 * @param {string} [separator=";"]
 */
function toCSV(header, rows, separator = ';') {
	/** @param {string} cell */
	const quote = (cell) => `"${cell.replace(/"/g, '""')}"`;

	return [
		header.map(quote).join(separator),
		...rows.map((row) => header.map((key) => quote(row[key])).join(separator))
	].join('\n');
}
