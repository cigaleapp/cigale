import { type } from 'arktype';

// Can't use $lib/ in $lib/schemas files, they're susceptible
// to be imported by non-Vite-managed pre-build scripts (e.g. JSON Schema generation)
import { mapValues } from '../utils.js';
import { ID, NamespacedMetadataID } from './common.js';
import { MetadataErrors, MetadataRecord } from './metadata.js';

export const AnalyzedImage = type({
	id: ['string', '@', "ID de l'image"],
	fileId: ['string | null', '@', "ID du fichier source de l'image"],
	filename: ['string', '@', 'Nom du fichier utilisé pour cette image'],
	contentType: [
		'string',
		'@',
		"Type de contenu de l'image, au format MIME (exemple: image/jpeg)"
	],
	sequence: [
		'number > 0',
		'@',
		"Numéro de séquence de l'image dans l'archive .zip. Unique à l'entièreté de l'export"
	],
	numberInObservation: ['number > 0', '@', "Numéro de l'image dans l'observation"],
	metadata: MetadataRecord(NamespacedMetadataID),
	protocolMetadata: MetadataRecord(ID).describe(
		'Même logique que protocolMetadata pour les observations'
	),
	metadataErrors: MetadataErrors.default(() => ({})),
	exportedAs: type({
		original: ['string', '@', "Chemin vers l'image originale"],
		cropped: ['string', '@', "Chemin vers l'image recadrée"]
	}).describe("Chemins dans l'archive .zip vers l'image exportée")
});

export const AnalyzedObservation = type({
	number: ['number > 0', '@', "Numéro de l'observation dans l'export"],
	label: ['string', '@', "Label de l'observation"],
	images: AnalyzedImage.array(),
	metadata: MetadataRecord(NamespacedMetadataID),
	metadataErrors: MetadataErrors.default(() => ({})),
	protocolMetadata: MetadataRecord(ID).describe(
		"Métadonnées définies par le protocole. Les clés de l'objet sont les identifiants des métadonnées, sans le préfixe qui identifie leur protocole de provenance"
	)
});

/**
 * @template {string} K
 * @param {Record<K, Omit<import('$lib/database.js').MetadataValue, 'value'> & { value: null | import('$lib/schemas/metadata.js').RuntimeValue }>} values
 * @returns {Record<K, typeof import('$lib/schemas/metadata.js').MetadataRecordValue.infer>}
 */
export function toMetadataRecord(values) {
	return mapValues(values, ({ value, ...rest }) => ({
		value: value instanceof Date ? value.toISOString() : value,
		...rest
	}));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	describe('toMetadataRecord', () => {
		it('should convert Date to ISO string', () => {
			const input = {
				meta1: {
					value: new Date('2024-01-01T12:00:00Z'),
					confidence: 0.9,
					manuallyModified: false,
					confirmed: true,
					alternatives: {
						alt1: 0.7
					}
				}
			};
			const output = toMetadataRecord(input);
			expect(output.meta1).toMatchObject({
				...input.meta1,
				value: '2024-01-01T12:00:00.000Z'
			});
		});
		it('should keep other types unchanged', () => {
			const input = {
				meta1: {
					value: 42,
					confidence: 0.8,
					manuallyModified: true,
					confirmed: false,
					alternatives: {
						alt1: 0.7
					}
				},
				meta2: {
					value: 'test',
					confidence: 1,
					manuallyModified: false,
					confirmed: false,
					alternatives: {
						alt1: 0.7
					}
				},
				meta3: {
					value: null,
					confidence: 0,
					manuallyModified: false,
					confirmed: false,
					alternatives: {
						alt1: 0.7
					}
				}
			};
			const output = toMetadataRecord(input);
			expect(output.meta1).toMatchObject(input.meta1);
			expect(output.meta2).toMatchObject(input.meta2);
			expect(output.meta3).toMatchObject(input.meta3);
		});
	});
}
