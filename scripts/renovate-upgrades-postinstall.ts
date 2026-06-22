/// <reference types="@types/node" />

import { readFileSync, writeFileSync } from 'node:fs';

import { sh, shLines } from './utils.ts';

const branch = process.env.GITHUB_HEAD_REF || sh('git branch --show-current');

const branches = ['renovate/capacitor-', 'renovate/capgo-', 'renovate/capawesome-'];

if (!branches.some((b) => branch.startsWith(b))) {
	console.info('branch prefixes: ', branches);
	console.info(`Current branch is ${branch}, exiting.`);
	process.exit(0);
}

sh('$ bun cap update');

const changed = shLines('gh pr diff --name-only');

if (!changed.includes('android/.native-code-version')) {
	console.info('+ android/.native-code-version');
	const version = Number(readFileSync('android/.native-code-version', { encoding: 'utf-8' }));
	writeFileSync('android/.native-code-version', (version + 1).toString());
}
