import { readFileSync } from 'node:fs';
import type { ExportedProtocol } from '../../src/lib/schemas/protocols.js';
import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';
import { ms } from 'convert';
import YAML from 'yaml';

import { ExamplePaths, RealPaths } from '../filepaths.js';

/**
 * Must already be on the /protocols management page
 * @param tweaks modify (in-place) the protocol before importing
 * @param options
 * @param options.wait wait for the protocol to appear in the list after importing (default: true)
 */
export async function importProtocol(
	page: Page,
	protocol:
		| ExamplePaths.Absolute<ExamplePaths.Protocols>
		| RealPaths.Absolute<RealPaths.Protocols>
		| typeof ExportedProtocol.inferIn,
	tweaks?: (protocol: typeof ExportedProtocol.inferIn) => void,
	options: { wait?: boolean } = { wait: true }
) {
	const utf8 = new TextEncoder();
	const fileChooser = page.waitForEvent('filechooser');

	await page
		.getByRole('button', {
			name: 'Importer',
		})
		.click();

	let protocolData: typeof ExportedProtocol.inferIn;
	if (typeof protocol === 'string' && protocol.endsWith('.json')) {
		protocolData = JSON.parse(readFileSync(protocol, 'utf-8'));
	} else if (typeof protocol === 'string') {
		protocolData = YAML.parse(readFileSync(protocol, 'utf-8'));
	} else {
		protocolData = protocol;
	}

	tweaks?.(protocolData);

	async function setFile(name: string, mime: string, content: string) {
		await fileChooser.then((chooser) =>
			chooser.setFiles({
				name,
				mimeType: mime,
				buffer: Buffer.from(utf8.encode(content)),
			})
		);
	}

	if (typeof protocol === 'string' && protocol.endsWith('.json')) {
		await setFile(protocol, 'application/json', JSON.stringify(protocolData));
	} else if (typeof protocol === 'string') {
		await setFile(protocol, 'application/x-yaml', YAML.stringify(protocolData));
	} else {
		await setFile(
			`${protocolData.id}.cigaleprotocol.json`,
			'application/json',
			JSON.stringify(protocolData)
		);
	}

	if (options.wait) {
		await expect
			.soft(
				page
					.getByRole('main')
					.getByRole('listitem')
					.getByRole('code')
					.getByText(protocolData.id)
			)
			.toBeVisible({ timeout: ms('30s') });
	}
}
