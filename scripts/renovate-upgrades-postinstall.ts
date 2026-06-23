/// <reference types="@types/node" />

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { sh } from './utils.ts';

const { GITHUB_REPOSITORY, GITHUB_REF_NAME, PR_NUMBER, GITHUB_HEAD_REF } = process.env;
console.info(process.env)

const repo = GITHUB_REPOSITORY as `${string}/${string}`;
const branch = GITHUB_HEAD_REF || sh('git branch --show-current');
const number = Number(PR_NUMBER ?? GITHUB_REF_NAME?.replace('/merge', '') ?? '');

console.info(`Current branch is ${branch}`);
console.info(`Current PR is #${number}`);

await task('Capacitor', 'capacitor-', 'capgo-', 'capawesome-', async () => {
	// Can't use bun cap update because generated files are missing without first build.
	// So we shim an empty built webapp (just index.html) and run cap sync instead

	mkdirSync('public');
	writeFileSync('public/index.html', 'bonjour :)');

	sh('$ bun cap sync');

	const changed = await fetch(`https://api.github.com/repos/${repo}/pulls/${number}/files`)
		.then((r) => r.json() as Promise<Array<{ filename: string }>>)
		.then((files) => files.map((file) => file.filename));

	if (!changed.includes('android/.native-code-version')) {
		console.info('+ android/.native-code-version');
		const version = Number(readFileSync('android/.native-code-version', { encoding: 'utf-8' }));
		writeFileSync('android/.native-code-version', (version + 1).toString());
	}
});

await task('Wuchale', 'wuchale', async () => {
	Array.from({ length: 10 }).forEach(() => sh('$ bun wuchale'));
});

async function task(
	...[name, ...rest]: [name: string, ...branches: string[], run: () => Promise<void>]
) {
	if (!rest.some((b) => typeof b === 'string' && branch.startsWith(`renovate/${b}`))) return;

	console.info(`Running task ${name}`);

	const action = rest.at(-1);
	if (!action || typeof action === 'string')
		throw new Error('Last task() argument should be the action');

	await action();
}
