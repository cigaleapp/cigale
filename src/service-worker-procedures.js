/**
 * @import { ProceduresMap } from './lib/swarp.js';
 */

import { Schemas } from '$lib/database';
import { type } from 'arktype';

export const PROCEDURES = /** @type {const} @satisfies {ProceduresMap} */ ({
	loadModel: {
		input: type({
			request: Schemas.HTTPRequest,
			task: '"classification" | "detection"',
			'webgpu?': 'boolean'
		}),
		progress: type({
			total: 'number',
			transferred: 'number',
			speed: 'number',
			eta: 'number'
		}),
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
					name: 'string',
					shape: Schemas.ModelDetectionOutputShape
				}
			}
		}),
		progress: type({}),
		success: type({
			boxes: type(['number', 'number', 'number', 'number']).array(),
			scores: type.number.array()
		})
	},
	classify: {
		input: type({
			fileId: 'string',
			'webgpu?': 'boolean',
			taskSettings: {
				input: Schemas.ModelInput,
				output: { name: 'string' }
			}
		}),
		progress: type({}),
		success: type({
			scores: type.number.array()
		})
	}
});
