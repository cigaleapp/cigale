import { execFileSync } from 'node:child_process';
import type { NeuralBoundingBoxInference, NeuralEnumInference } from '$lib/schemas/neural.js';

import { http, HttpResponse } from 'msw';
import { nanoid } from 'nanoid';

type ModelConfig =
	| (typeof NeuralEnumInference)['inferIn']
	| (typeof NeuralBoundingBoxInference)['inferIn'];

export type ONNXModelsFixture = {
	/** Returns a URL string */
	make: <T extends ModelConfig>(
		config: Omit<T, 'model'> & { model: number[] }
	) => `https://example.com/onnx/${string}`;

	/** Used to more easily declare the model in a protocol: declare a neural inference as usual, wrap it in a call to this method, and specify an array of numbers for the output layer instead of an url. */
	declare: <T extends ModelConfig>(
		config: Omit<T, 'model'> & { model: number[] }
	) => T & { model: `https://example.com/onnx/${string}` };
};

export async function onnxmodels(
	{
		network,
	}: {
		network: import('@msw/playwright').NetworkFixture;
	},
	use: (fixture: ONNXModelsFixture) => Promise<void>
) {
	await use({
		make({ input: { height, width }, output, model }) {
			if (output?.name !== 'output') {
				throw new Error("output.name must be set to 'output'");
			}

			const bytes = execFileSync('uv', [
				'run',
				'--with',
				'numpy',
				'--with',
				'onnx',
				'tests/utils/create-static-onnx-model.py',
				'--shape',
				'3',
				String(height),
				String(width),
				'--scores',
				...model.map(String),
			]);

			const url = `https://example.com/onnx/${nanoid()}` as const;

			network.use(http.get(url, () => HttpResponse.arrayBuffer(bytes.buffer)));

			return url;
		},
		// @ts-expect-error TODO fix
		declare(config) {
			return {
				...config,
				model: this.make(config),
			};
		},
	});
}
