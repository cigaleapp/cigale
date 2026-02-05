/**
 * @import { ProceduresMap } from 'swarpc';
 */

import { type } from 'arktype';

import { Schemas } from '$lib/database.js';
import { NodeProvenance } from '$lib/file-tree.js';

export const PROCEDURES = /** @type {const} @satisfies {ProceduresMap} */ ({
	init: {
		input: type({
			databaseName: 'string',
			databaseRevision: 'number.integer >= 1'
		}),
		progress: type('undefined'),
		success: type('undefined')
	},
	loadModel: {
		input: type({
			model: 'TypedArray.Uint8',
			'classmapping?': 'string | undefined',
			task: '"classification" | "detection"',
			'webgpu?': 'boolean',
			inferenceSessionId: 'string > 1'
		}),
		progress: type('undefined'),
		success: type('true')
	},
	inferenceSessionId: {
		input: type('"classification" | "detection"'),
		progress: type('undefined'),
		success: type('string | null')
	},
	inferBoundingBoxes: {
		input: type({
			fileId: 'string',
			webgpu: 'boolean = false',
			taskSettings: {
				input: Schemas.ModelInput,
				output: {
					'name?': 'string',
					shape: Schemas.ModelDetectionOutputShape
				}
			}
		}),
		progress: type({}),
		success: type({
			boxes: type(['number', 'number', 'number', 'number']).array(),
			scores: 'number[]'
		})
	},
	classify: {
		input: type({
			imageId: 'string',
			'webgpu?': 'boolean',
			metadataIds: {
				cropbox: 'string',
				target: 'string'
			},
			taskSettings: {
				input: Schemas.ModelInput,
				'output?': { name: 'string' }
			}
		}),
		progress: type({}),
		success: type({
			scores: 'number[]'
		})
	},
	importProtocol: {
		input: type({
			contents: 'string',
			isJSON: 'boolean = false'
		}),
		progress: type({
			phase: type.enumerated(
				'parsing',
				'filtering-builtin-metadata',
				'input-validation',
				'write-protocol',
				'write-metadata',
				'write-metadata-options',
				'output-validation'
			),
			'detail?': 'string'
		}),
		success: type({
			id: 'string',
			name: 'string',
			'version?': 'number | undefined',
			iconsToPreload: 'string[]'
		})
	},
	/**
	 * Returns ZIP bytes (if format is zip)
	 * or a series of writeFile events (if format is folder)
	 */
	generateResultsExport: {
		input: type({
			/** ID of the session */
			sessionId: 'string',
			include: type.enumerated('croppedonly', 'full', 'metadataonly'),
			cropPadding: /^\d+(px|%)$/,
			jsonSchemaURL: 'string.url.parse',
			format: '"zip" | "folder"'
		}),
		progress: type.or(
			{ event: '"progress"', data: 'number' },
			{ event: '"warning"', data: type.or(['"exif-write-error"', { filename: 'string' }]) },
			{
				event: '"writeFile"',
				data: {
					filepath: 'string',
					contents: type.or('string', ['instanceof', Uint8Array])
				}
			}
		),
		success: type('ArrayBuffer')
	},
	previewResultsZip: {
		input: type({
			sessionId: 'string',
			include: type.enumerated('croppedonly', 'full', 'metadataonly')
		}),
		progress: type('undefined'),
		success: type.scope({ NodeProvenance }).type({
			'[NodeProvenance]': 'string[]'
		})
	},
	estimateResultsZipSize: {
		input: type({
			sessionId: 'string',
			include: type.enumerated('croppedonly', 'full', 'metadataonly'),
			cropPadding: /^\d+(px|%)$/
		}),
		progress: type('undefined'),
		success: type({
			uncompressed: ['number.integer >= 0', '@', 'bytes'],
			compressed: ['number.integer >= 0', '@', 'bytes, estimated']
		})
	},
	diffProtocolWithRemote: {
		input: type({ protocolId: 'string' }),
		progress: type('0 <= number <= 1'),
		success: type({
			dirty: 'boolean',
			changes: type
				.or(
					{ path: '(number|string)[]', type: '"CREATE"', value: 'unknown' },
					{
						path: '(number|string)[]',
						type: '"CHANGE"',
						oldValue: 'unknown',
						value: 'unknown'
					},
					{ path: '(number|string)[]', type: '"REMOVE"', oldValue: 'unknown' }
				)
				.array()
		})
	}
});
