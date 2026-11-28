import { readFileSync } from 'node:fs';
import type { ExportedProtocol } from '../../src/lib/schemas/protocols.js';
import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';
import { ms } from 'convert';
import YAML from 'yaml';

import { RealPaths } from '../filepaths.js';
import { pickFiles } from './core.js';

/**
 * Must already be on the /protocols management page
 * @param tweaks modify (in-place) the protocol before importing
 * @param options
 * @param options.wait wait for the protocol to appear in the list after importing (default: true)
 */
export async function importProtocol(
	page: Page,
	protocol: RealPaths.Absolute<RealPaths.Protocols> | typeof ExportedProtocol.inferIn,
	tweaks?: (protocol: typeof ExportedProtocol.inferIn) => void,
	options: { wait?: boolean } = { wait: true }
) {
	let protocolData: typeof ExportedProtocol.inferIn;
	if (typeof protocol === 'string' && protocol.endsWith('.json')) {
		protocolData = JSON.parse(readFileSync(protocol, 'utf-8'));
	} else if (typeof protocol === 'string') {
		protocolData = YAML.parse(readFileSync(protocol, 'utf-8'));
	} else {
		protocolData = protocol;
	}

	tweaks?.(protocolData);

	let file: File;
	if (typeof protocol === 'string' && protocol.endsWith('.json')) {
		file = new File([JSON.stringify(protocolData)], protocol, { type: 'application/json' });
	} else if (typeof protocol === 'string') {
		file = new File([YAML.stringify(protocolData)], protocol, { type: 'application/x-yaml' });
	} else {
		file = new File([JSON.stringify(protocolData)], `${protocolData.id}.cigaleprotocol.json`, {
			type: 'application/json',
		});
	}

	const importButton = page.getByRole('button', { name: 'Importer' });
	await pickFiles(importButton, file);

	if (options.wait) {
		await expect.soft(importButton).toBeDisabled();
		await expect.soft(importButton).not.toBeDisabled({
			timeout: ms('2min'),
		});

		const entry = page
			.getByRole('main')
			.getByRole('listitem')
			.getByRole('code')
			.getByText(protocolData.id);

		await expect(entry).toBeVisible({ timeout: ms('10s') });

		await expect
			.soft(entry.getByRole('button', { name: 'Installer' }))
			.not.toBeVisible({ timeout: ms('10s') });
	}
}
