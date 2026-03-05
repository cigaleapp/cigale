import JSONC from 'tiny-jsonc';
import * as YAML from 'yaml';

import * as DB from './database.js';
import { errorMessage } from './i18n.js';
import type { DatabaseHandle } from './idb.svelte.js';
import { imageId } from './images.js';
import { storeMetadataValue } from './metadata/storage.js';
import { MetadataType, namespaceOfMetadataId } from './schemas/metadata.js';
import { compareBy } from './utils.js';

export const ACCEPTED_SIDECAR_TYPES = ['.json', '.xml', '.xmp', '.yaml', '.yml'];

export function isSidecar(filepath: string) {
	return ACCEPTED_SIDECAR_TYPES.some((ext) => filepath.endsWith(ext));
}

export async function processSidecars({
	db,
	sessionId,
	cropMetadataId,
	imageFileId,
	file,
	sidecars
}: {
	db: DatabaseHandle;
	sessionId: string;
	cropMetadataId: string;
	imageFileId: string;
	file: File;
	sidecars: File[];
}) {
	const session = await db.get('Session', sessionId).then((s) => DB.Schemas.Session.assert(s));

	// debugger;
	// To store default sidecar filepaths for imported metadata
	const protocols = new Map<string, DB.Protocol>();

	const protocol = await db
		.get('Protocol', session.protocol)
		.then((p) => DB.Schemas.Protocol.assert(p));

	protocols.set(protocol.id, protocol);

	type ExtractionPlanItem<T extends MetadataType> = {
		metadataId: string;
		type: T;
		query: Extract<
			Extract<DB.Metadata, { type: NoInfer<T> }>['infer'],
			{ sidecar: unknown }
		>['sidecar']['query'];
		filepath: string;
	};

	const extractionPlan: Array<{ [T in MetadataType]: ExtractionPlanItem<T> }[MetadataType]> = [];

	const metadataOfProtocol = await Promise.all(
		protocol.metadata.map(async (id) =>
			db.get(
				'Metadata',
				// Resolve imports
				protocol.importedMetadata.find((imp) => imp.target === id)?.source || id
			)
		)
	).then((ms) => ms.map((m) => DB.Schemas.Metadata.assert(m)));

	for (const m of metadataOfProtocol) {
		if (!m.infer) continue;
		if (!('sidecar' in m.infer)) continue;

		const config = m.infer.sidecar;

		// resolve improts, used to get the proper default sidecar filepath
		const importedFrom = namespaceOfMetadataId(
			protocol.importedMetadata.find((imp) => imp.target === m.id)?.source
		);

		if (importedFrom && !protocols.has(importedFrom)) {
			const parentProtocol = await db.get('Protocol', importedFrom);
			if (!parentProtocol)
				throw new Error(
					`Protocol ${protocol.id} inherits from unknown protocol ${importedFrom}`
				);

			protocols.set(importedFrom, DB.Schemas.Protocol.assert(parentProtocol));
		}

		const filepath =
			config.filepath ||
			protocols.get(importedFrom ?? '')?.sidecars?.filepath ||
			protocol.sidecars?.filepath;

		if (!filepath)
			throw new Error(
				`Metadata ${m.id} requires a sidecar, but no filepath is defined either in the metadata or in the protocol's default sidecars configuration`
			);

		const resolvedFilepath = filepath.render({ filepath: file.name });

		// @ts-expect-error m.type and m...query are not correlated, need to see if we can fix this
		extractionPlan.push({
			metadataId: m.id,
			filepath: resolvedFilepath,
			type: m.type,
			query: m.infer.sidecar.query
		});
	}

	// The crop metadata should be the first to be extracted since it'll create new images. These new images will not receive prior metadata values from other sidecars

	extractionPlan.sort(compareBy(({ metadataId }) => (metadataId === cropMetadataId ? -1 : 0)));

	const errors: Array<{
		metadataId: string;
		filename: string;
		error: unknown;
		data: unknown;
		context: unknown;
	}> = [];

	for (const [i, item] of extractionPlan.entries()) {
		const isLast = i === extractionPlan.length - 1;

		const sidecar = sidecars.find((f) => f.name === item.filepath);
		if (!sidecar) {
			console.warn(`Sidecar file ${item.filepath} not found for metadata ${item.metadataId}`);
			return;
		}

		const context = {
			sidecarfile: {
				name: sidecar.name,
				lastModified: sidecar.lastModified
			}
		};

		console.debug(`Sidecar: ${item.metadataId} <- ${item.query.toJSON()} <- ${sidecar.name}`);

		const content = await sidecar.text();

		let json: unknown;

		if (sidecar.name.endsWith('.json')) {
			json = JSONC.parse(content);
		} else if (sidecar.name.endsWith('.xml') || sidecar.name.endsWith('.xmp')) {
			json = xmlToJson(content);
		} else if (sidecar.name.endsWith('.yaml') || sidecar.name.endsWith('.yml')) {
			json = YAML.parse(content);
		} else {
			throw new Error(
				`Unsupported sidecar file format for file ${sidecar.name}: must be .json or .xml`
			);
		}

		if (item.type === 'file') {
			const file = await item.query.evaluate(json, context).catch((e) => {
				errors.push({ metadataId: item.metadataId, error: e, data: json, context });
			});

			if (!file) continue;

			const ref = DB.generateId('MetadataValueFile');
			await db.put('MetadataValueFile', {
				id: ref,
				filename: file.name,
				contentType: file.type,
				size: file.size,
				lastModifiedAt: new Date(file.lastModified).toISOString(),
				sessionId: session.id,
				bytes: await file.arrayBuffer()
			});

			await storeMetadataValue({
				db,
				updateReactiveState: isLast,
				metadataId: item.metadataId,
				sessionId: session.id,
				type: item.type,
				subjectId: imageFileId,
				value: ref
			});
		} else if (item.type === 'boundingbox') {
			const boxes = await item.query.evaluate(json, context).catch((e) => {
				errors.push({ metadataId: item.metadataId, error: e, data: json, context });
			});

			if (!boxes) continue;

			// put highest score box first
			boxes.sort(compareBy((box) => -box.score));

			if (item.metadataId === cropMetadataId) {
				// If this is the crop metadata, we create one image per box instead of storing non-optimal boxes as alternatives

				const imageFile = await db.get('ImageFile', imageFileId);

				if (!imageFile) {
					throw new Error(`ImageFile with id ${imageFileId} not found`);
				}

				for (const [i, { score, ...box }] of boxes.entries()) {
					const isLastBox = i === boxes.length - 1;

					const newImageId = await db.put('Image', {
						addedAt: new Date().toISOString(),
						contentType: imageFile.contentType,
						dimensions: imageFile.dimensions,
						fileId: imageFile.id,
						filename: imageFile.filename,
						// Here we replace any existing Image objects related to the current ImageFile. This is ok because sidecar inference is meant to be done on-import, so we don't have any meaningful Image objects yet.
						id: imageId(imageFile.id, i),
						sessionId: session.id,
						boundingBoxesAnalyzed: true,
						metadataErrors: {},
						metadata: {}
					});

					await storeMetadataValue({
						db,
						metadataId: item.metadataId,
						sessionId: session.id,
						type: item.type,
						subjectId: newImageId,
						value: box,
						confidence: score,
						updateReactiveState: isLast && isLastBox
					});
				}
			} else {
				const [{ score, ...coords }, ...alternatives] = boxes;

				await storeMetadataValue({
					db,
					updateReactiveState: isLast,
					metadataId: item.metadataId,
					sessionId: session.id,
					type: item.type,
					subjectId: imageFileId,
					value: coords,
					confidence: score,
					alternatives: alternatives.map(({ score, ...coords }) => ({
						value: coords,
						confidence: score
					}))
				});
			}
		} else {
			const value = await item.query.evaluate(json, context).catch((e) => {
				errors.push({
					filename: sidecar.name,
					data: json,
					context,
					metadataId: item.metadataId,
					error: e
				});

				return undefined;
			});

			if (value === undefined) continue;

			await storeMetadataValue({
				db,
				updateReactiveState: isLast,
				metadataId: item.metadataId,
				sessionId: session.id,
				type: item.type,
				subjectId: imageFileId,
				value
			});
		}
	}

	if (errors.length > 0) {
		console.error('Errors occurred while processing sidecars:', errors);
		throw new Error(
			errors
				.map((e) =>
					errorMessage(
						e.error,
						`Impossible de traiter ${e.metadataId} depuis ${e.filename}`
					)
				)
				.join('\n')
		);
	}
}

/**
 * ```xml
 * <foo>
 *   <bar spam="eggs">baz</bar>
 *   <bar spam="eggs2">
 *     <bacon>quux</bacon>
 *   </bar>
 * </foo>
 * ```
 * becomes
 * ```json
 * {
 *   "foo": {
 *     "bar": [
 *       {
 *         "@spam": "eggs",
 *         "#text": "baz"
 *       },
 *       {
 *         "@spam": "eggs2",
 *         "bacon": {
 *           "#text": "quux"
 *         }
 *       }
 *     ]
 *   }
 * }
 * ```
 * @param xml xml string
 */
function xmlToJson(
	xml: string,
	config: { textProperty: string; attributePrefix: string } = {
		textProperty: '#text',
		attributePrefix: '@'
	}
): unknown {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, 'application/xml');

	function nodeToObject(node: Element, root: boolean): unknown {
		const obj: Record<string, unknown> = {};

		if (root) {
			return {
				[node.tagName]: nodeToObject(node, false)
			};
		}

		// attributes
		for (const attr of node.attributes) {
			obj[config.attributePrefix + attr.name] = attr.value;
		}

		// child nodes
		for (const child of node.children) {
			const childObj = nodeToObject(child, false);
			if (child.tagName in obj) {
				if (!Array.isArray(obj[child.tagName])) {
					obj[child.tagName] = [obj[child.tagName], childObj];
				} else {
					obj[child.tagName].push(childObj);
				}
			} else {
				obj[child.tagName] = childObj;
			}
		}

		const nodes = [...node.childNodes];

		// text content: concatenate text from all immediate children text nodes
		const text = nodes
			.filter((n) => n.nodeType === Node.TEXT_NODE)
			.map((n) => n.textContent)
			.join('')
			.trim();

		// If object only has text content, return the text directly instead of an object
		if (
			text &&
			node.attributes.length === 0 &&
			nodes.every((n) => n.nodeType !== Node.ELEMENT_NODE)
		) {
			return text;
		}

		if (text) obj[config.textProperty] = text;

		return obj;
	}

	return nodeToObject(doc.documentElement, true);
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	// Tests for xmlToJson
	describe('xmlToJson', () => {
		test('converts XML to JSON', () => {
			const xml = `
				<foo>
					<bar spam="eggs">baz</bar>
					<bar spam="eggs2">
						<bacon>quux</bacon>
						<bacon>quux2</bacon>
					</bar>
					<bar spam="eggs3">
						<bacon>quux</bacon>
						<other>quux2</other>
						buzz
					</bar>
				</foo>
			`;

			expect(xmlToJson(xml)).toStrictEqual({
				foo: {
					bar: [
						{
							'@spam': 'eggs',
							'#text': 'baz'
						},
						{
							'@spam': 'eggs2',
							bacon: ['quux', 'quux2']
						},
						{
							'@spam': 'eggs3',
							'#text': 'buzz',
							bacon: 'quux',
							other: 'quux2'
						}
					]
				}
			});

			expect(
				xmlToJson(xml, { textProperty: '__value__', attributePrefix: '$' })
			).toStrictEqual({
				foo: {
					bar: [
						{
							$spam: 'eggs',
							__value__: 'baz'
						},
						{
							$spam: 'eggs2',
							bacon: ['quux', 'quux2']
						},
						{
							$spam: 'eggs3',
							__value__: 'buzz',
							bacon: 'quux',
							other: 'quux2'
						}
					]
				}
			});
		});

		test('converts a photo file XMP sidecar', () => {
			const xml = `
		<?xpacket begin="?" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.4-c002 1.000000, 0000/00/00-00:00:00        ">
   <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description rdf:about=""
            xmlns:xmp="http://ns.adobe.com/xap/1.0/">
         <xmp:CreatorTool>Picasa</xmp:CreatorTool>
      </rdf:Description>
      <rdf:Description rdf:about=""
            xmlns:mwg-rs="http://www.metadataworkinggroup.com/schemas/regions/"
            xmlns:stDim="http://ns.adobe.com/xap/1.0/sType/Dimensions#"
            xmlns:stArea="http://ns.adobe.com/xmp/sType/Area#">
         <mwg-rs:Regions rdf:parseType="Resource">
            <mwg-rs:AppliedToDimensions rdf:parseType="Resource">
               <stDim:w>912</stDim:w>
               <stDim:h>687</stDim:h>
               <stDim:unit>pixel</stDim:unit>
            </mwg-rs:AppliedToDimensions>
            <mwg-rs:RegionList>
               <rdf:Bag>
                  <rdf:li rdf:parseType="Resource">
                     <mwg-rs:Type></mwg-rs:Type>
                     <mwg-rs:Area rdf:parseType="Resource">
                        <stArea:x>0.680921052631579</stArea:x>
                        <stArea:y>0.3537117903930131</stArea:y>
                        <stArea:h>0.4264919941775837</stArea:h>
                        <stArea:w>0.32127192982456143</stArea:w>
                        <stArea:unit>normalized</stArea:unit>
                     </mwg-rs:Area>
                  </rdf:li>
               </rdf:Bag>
            </mwg-rs:RegionList>
         </mwg-rs:Regions>
      </rdf:Description>
      <rdf:Description rdf:about=""
            xmlns:exif="http://ns.adobe.com/exif/1.0/">
         <exif:PixelXDimension>912</exif:PixelXDimension>
         <exif:PixelYDimension>687</exif:PixelYDimension>
         <exif:ExifVersion>0220</exif:ExifVersion>
      </rdf:Description>
   </rdf:RDF>
</x:xmpmeta>

<!-- whitespace padding -->
				
<?xpacket end="w"?>	
			
			`;

			expect(xmlToJson(xml)).toMatchInlineSnapshot(`
				{
				  "x:xmpmeta": {
				    "@x:xmptk": "Adobe XMP Core 5.4-c002 1.000000, 0000/00/00-00:00:00        ",
				    "@xmlns:x": "adobe:ns:meta/",
				    "rdf:RDF": {
				      "@xmlns:rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
				      "rdf:Description": [
				        {
				          "@rdf:about": "",
				          "@xmlns:xmp": "http://ns.adobe.com/xap/1.0/",
				          "xmp:CreatorTool": "Picasa",
				        },
				        {
				          "@rdf:about": "",
				          "@xmlns:mwg-rs": "http://www.metadataworkinggroup.com/schemas/regions/",
				          "@xmlns:stArea": "http://ns.adobe.com/xmp/sType/Area#",
				          "@xmlns:stDim": "http://ns.adobe.com/xap/1.0/sType/Dimensions#",
				          "mwg-rs:Regions": {
				            "@rdf:parseType": "Resource",
				            "mwg-rs:AppliedToDimensions": {
				              "@rdf:parseType": "Resource",
				              "stDim:h": "687",
				              "stDim:unit": "pixel",
				              "stDim:w": "912",
				            },
				            "mwg-rs:RegionList": {
				              "rdf:Bag": {
				                "rdf:li": {
				                  "@rdf:parseType": "Resource",
				                  "mwg-rs:Area": {
				                    "@rdf:parseType": "Resource",
				                    "stArea:h": "0.4264919941775837",
				                    "stArea:unit": "normalized",
				                    "stArea:w": "0.32127192982456143",
				                    "stArea:x": "0.680921052631579",
				                    "stArea:y": "0.3537117903930131",
				                  },
				                  "mwg-rs:Type": {},
				                },
				              },
				            },
				          },
				        },
				        {
				          "@rdf:about": "",
				          "@xmlns:exif": "http://ns.adobe.com/exif/1.0/",
				          "exif:ExifVersion": "0220",
				          "exif:PixelXDimension": "912",
				          "exif:PixelYDimension": "687",
				        },
				      ],
				    },
				  },
				}
			`);
		});
	});
}
