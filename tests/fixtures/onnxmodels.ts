import { execFileSync } from 'node:child_process';
import type { BrowserContext, Page } from '@playwright/test';
import type { NeuralBoundingBoxInference, NeuralEnumInference } from '$lib/schemas/neural.js';

import { nanoid } from 'nanoid';

import { mockUrl } from '$e2e/utils/core.js';

type ModelConfig =
	(typeof NeuralEnumInference)['inferIn'] | (typeof NeuralBoundingBoxInference)['inferIn'];

export type ONNXModelsFixture = {
	/** Returns a URL string */
	serve: <T extends ModelConfig>(
		config: Omit<T, 'model'> & { model: number[] }
	) => `https://example.com/onnx/${string}`;

	/** Returns a local filepath */
	make: <T extends ModelConfig>(config: Omit<T, 'model'> & { model: number[] }) => ArrayBuffer;

	/** Used to more easily declare the model in a protocol: declare a neural inference as usual, wrap it in a call to this method, and specify an array of numbers for the output layer instead of an url. */
	declare: <T extends ModelConfig>(
		config: Omit<T, 'model'> & { model: number[] }
	) => T & { model: `https://example.com/onnx/${string}` };
};

export async function onnxmodels(
	{
		context,
		page,
	}: {
		context: BrowserContext;
		page: Page;
	},
	use: (fixture: ONNXModelsFixture) => Promise<void>
) {
	await use({
		make({ input: { height, width }, output, model }) {
			if (output?.name !== 'output') {
				throw new Error("output.name must be set to 'output'");
			}

			return execFileSync(
				'uv',
				[
					'run',
					'--with',
					'numpy',
					'--with',
					'onnx',
					'tests/utils/create-static-onnx-model.py',
					'--shape',
					'3',
					width,
					height,
					'--scores',
					...model,
				].map(String)
			).buffer;
		},
		serve(config) {
			const url = `https://example.com/onnx/${nanoid()}` as const;

			void mockUrl(page, context, url, {
				body: Buffer.from(this.make(config)),
			});

			return url;
		},
		// @ts-expect-error TODO fix
		declare(config) {
			return {
				...config,
				model: this.serve(config),
			};
		},
	});
}
