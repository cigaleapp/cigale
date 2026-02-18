import path from 'node:path';
import type { Page } from '@playwright/test';

import type { ExportedProtocol } from '../../src/lib/schemas/protocols.js';
import { ExamplePaths } from '../filepaths.js';

/**
 * Must already be on the /protocols management page
 */
export async function importProtocol(
	page: Page,
	protocol: ExamplePaths.Protocols | typeof ExportedProtocol.inferIn
) {
	const utf8 = new TextEncoder();
	const fileChooser = page.waitForEvent('filechooser');

	await page
		.getByRole('button', {
			name: 'Importer'
		})
		.click();

	await fileChooser.then((chooser) =>
		chooser.setFiles(
			typeof protocol === 'string'
				? path.join(ExamplePaths.root, protocol)
				: {
						name: `${protocol.id}.cigaleprotocol.json`,
						mimeType: 'application/json',
						buffer: Buffer.from(utf8.encode(JSON.stringify(protocol)))
					}
		)
	);
}
