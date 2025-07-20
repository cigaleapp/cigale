import { extractMetadata } from '$lib/exif.js';
import * as db from '$lib/idb.svelte.js';
import { imageId } from '$lib/images';
import { storeMetadataValue } from '$lib/metadata';
import { ensureNamespacedMetadataId, namespacedMetadataId } from '$lib/schemas/metadata';
import { toasts } from '$lib/toasts.svelte';
import { match } from 'arktype';

/**
 *
 * @param {string} protocolId
 * @param {string} imageFileId
 * @param {ArrayBuffer|Buffer} imageBytes
 * @param {{ type: string; name: string }} file
 */
export async function processExifData(protocolId, imageFileId, imageBytes, file) {
	const protocol = await db.tables.Protocol.get(protocolId);
	if (!protocol) {
		throw new Error(`Protocole ${protocolId} introuvable`);
	}
	const metadataOfProtocol = await db.tables.Metadata.list().then((defs) =>
		defs.filter((def) => protocol.metadata.includes(def.id))
	);
	const metadataFromExif = await extractMetadata(
		// 2^16 + 100 of margin
		// see https://www.npmjs.com/package/exif-parser#creating-a-parser
		imageBytes.slice(0, 65_635),
		(metadataOfProtocol ?? [])
			.map(({ infer, type, id }) =>
				match
					.case(
						[
							{ exif: 'string' },
							'|',
							{ latitude: { exif: 'string' }, longitude: { exif: 'string' } }
						],
						(infer) =>
							/** @type {import('$lib/exif').ExifExtractionPlanItem} */ ({ key: id, infer, type })
					)
					.default(() => undefined)(infer)
			)
			.filter((entry) => entry !== undefined)
	).catch((e) => {
		console.warn(e);
		if (file.type === 'image/jpeg') {
			toasts.warn(
				`Impossible d'extraire les métadonnées EXIF de ${file.name}: ${e?.toString() ?? 'Erreur inattendue'}`
			);
		}
		return {};
	});

	const images = await db
		.list('Image')
		.then((imgs) => imgs.filter((img) => img.fileId === imageFileId));

	for (const { id: subjectId } of images) {
		for (const [key, { value, confidence }] of Object.entries(metadataFromExif)) {
			await storeMetadataValue({
				subjectId,
				metadataId: ensureNamespacedMetadataId(key, protocolId),
				value,
				confidence
			});
		}
	}
}

if (import.meta.vitest) {
	const { test, expect, describe, beforeEach } = import.meta.vitest;

	/**
	 * Read a file from ./tests/fixtures
	 * @param {string} filename
	 * @returns {Promise<Buffer>} the contents
	 */
	async function readImageBytes(filename) {
		return readFileSync(`./tests/fixtures/${filename}`);
	}

	describe('processExifData', () => {
		beforeEach(async () => {
			db.nukeDatabase();

			const metadataField = /** @type {const} */ ({
				description: '',
				mergeMethod: 'none',
				required: false,
				learnMore: 'https://example.com',
				label: ''
			});

			await db.tables.Metadata.set({
				...metadataField,
				id: namespacedMetadataId('test-protocol', 'date'),
				type: 'date',
				infer: { exif: 'DateTimeOriginal' }
			});

			await db.tables.Metadata.set({
				...metadataField,
				id: namespacedMetadataId('test-protocol', 'location'),
				type: 'location',
				infer: { latitude: { exif: 'GPSLatitude' }, longitude: { exif: 'GPSLongitude' } }
			});

			await db.tables.Metadata.set({
				...metadataField,
				id: namespacedMetadataId('test-protocol', 'no-exif'),
				type: 'string'
			});

			await db.tables.Protocol.set({
				id: 'test-protocol',
				name: 'Test Protocol',
				metadata: ['date', 'location', 'no-exif'].map((id) =>
					namespacedMetadataId('test-protocol', id)
				),
				authors: [],
				description: 'Test Protocol',
				learnMore: 'https://example.com',
				crop: {
					metadata: 'test-protocol.crop'
				}
			});

			await db.tables.Image.set({
				id: imageId(0, 0),
				addedAt: '2023-10-01T00:00:00Z',
				fileId: 'quoicoubaka',
				dimensions: { width: 100, height: 100 },
				contentType: 'image/jpeg',
				filename: 'test.jpg',
				metadata: {}
			});
		});

		test('extracts from image without GPS', async () => {
			const imageBytes = await readImageBytes('lil-fella.jpeg');

			await processExifData('test-protocol', 'quoicoubaka', imageBytes, {
				type: 'image/jpeg',
				name: 'test.jpg'
			});

			const image = await db.tables.Image.get(imageId(0, 0));
			expect(image?.metadata).toEqual({
				[namespacedMetadataId('test-protocol', 'date')]: {
					value: new Date('2025-04-25T12:38:36.000Z'),
					manuallyModified: false,
					confidence: 1,
					alternatives: {}
				}
			});
		});

		test('extracts from image with GPS', async () => {
			const imageBytes = await readImageBytes('with-exif-gps.jpeg');

			await processExifData('test-protocol', 'quoicoubaka', imageBytes, {
				type: 'image/jpeg',
				name: 'test.jpg'
			});

			const image = await db.tables.Image.get(imageId(0, 0));
			expect(image?.metadata).toEqual({
				[namespacedMetadataId('test-protocol', 'date')]: {
					value: new Date('2008-10-22T16:29:49.000Z'),
					manuallyModified: false,
					confidence: 1,
					alternatives: {}
				},
				[namespacedMetadataId('test-protocol', 'location')]: {
					value: {
						latitude: 43.46715666666389,
						longitude: 11.885394999997223
					},
					manuallyModified: false,
					confidence: 1,
					alternatives: {}
				}
			});
		});
	});
}
