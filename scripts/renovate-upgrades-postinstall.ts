/// <reference types="@types/node" />

/**
 * Things to run on Renovate upgrade PRs
 * Workaround cuz Renovate's postUpgradeTasks feature is paid
 * See #1815
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const branch =
	process.env.GITHUB_HEAD_REF || execSync('git branch --show', { encoding: 'utf8' }).trim();

const branches = ['renovate/capacitor-', 'renovate/capgo-', 'renovate/capawesome-'];

if (!branches.some((b) => branch.startsWith(b))) {
	console.info('branch prefixes: ', branches);
	console.info(`Current branch is ${branch}, exiting.`);
	process.exit(0);
}

console.info('$ bun cap sync');
execSync('bun cap sync');

const changed = execSync('gh pr diff --name-only', { encoding: 'utf8' }).trim().split('\n');

if (!changed.includes('android/.native-code-version')) {
	console.info('+ android/.native-code-version');
	const version = Number(readFileSync('android/.native-code-version', { encoding: 'utf-8' }));
	writeFileSync('android/.native-code-version', (version + 1).toString());
}
