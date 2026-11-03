import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

/**
 * Source code of idb-opfs
 */
const idbopfs = readFileSync('node_modules/idb-opfs/dist/index.mjs', {
	encoding: 'utf8',
});

export async function mockOPFSOnWebWorkers(page: Page) {
	const isWebkit = page.context().browser()?.browserType().name() === 'webkit';

	if (!isWebkit) return;

	console.debug('Will mock OPFS in web workers');

	// Since opfs-mock is in-memory-backed, the web worker's opfs state is not shared
	// with the main thread. we need to do a indexeddb-backed opfs state...
	const mockOpfs = async ({ idbopfs: source }: { idbopfs: string }) => {
		console.debug('Mocking OPFS in web worker');

		const blob = new Blob([source], { type: 'application/javascript' });
		const url = URL.createObjectURL(blob);
		const idbopfs: typeof import('idb-opfs') = await import(url);
		URL.revokeObjectURL(url);

		await idbopfs.mockOPFS({ debug: true });
	};

	// Wait for opfs to be mocked on the web worker before continuing
	await new Promise<void>((resolve, reject) => {
		page.on(
			'worker',
			async (worker) =>
				await worker.evaluate(mockOpfs, { idbopfs }).then(resolve).catch(reject)
		);
	});

	// Also mock on future workers just in case
	page.on('worker', async (worker) => worker.evaluate(mockOpfs, { idbopfs }));
}
