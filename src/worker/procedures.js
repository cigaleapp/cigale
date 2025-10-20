/**
 * @import { ProceduresMap } from 'swarpc';
 */

import { type } from 'arktype';

import { Schemas } from '$lib/database.js';

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
			protocolId: 'string',
			request: Schemas.HTTPRequest,
			'classmapping?': Schemas.HTTPRequest,
			task: '"classification" | "detection"',
			'webgpu?': 'boolean'
		}),
		progress: type('0 <= number <= 1'),
		success: type('true')
	},
	isModelLoaded: {
		input: type('"classification" | "detection"'),
		progress: type({}),
		success: type('boolean')
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
			'version?': 'number | undefined'
		})
	},
	generateResultsZip: {
		input: type({
			protocolId: 'string',
			include: type.enumerated('croppedonly', 'full', 'metadataonly'),
			cropPadding: /^\d+(px|%)$/,
			jsonSchemaURL: 'string.url.parse'
		}),
		progress: type
			.or(
				{ progress: 'number' },
				{ warning: type.or(['"exif-write-error"', { filename: 'string' }]) }
			)
			.pipe((o) =>
				'progress' in o
					? { progress: o.progress, warning: undefined }
					: { progress: undefined, warning: o.warning }
			),
		success: type('ArrayBuffer')
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
