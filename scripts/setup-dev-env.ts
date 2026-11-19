// TODO: create vscode settings from example if none exist
/// <reference types="@types/bun" />

import path from 'node:path';
import { exit } from 'node:process';

const vscode = path.join(import.meta.dir, '..', '.vscode');

const example = Bun.file(path.join(vscode, 'settings.example.json'));
const personal = Bun.file(path.join(vscode, 'settings.json'));

if (await personal.exists()) exit(0);

console.info(`Creating your vscode settings from ${example.name} at ${personal.name}`);

await personal.write(await example.text());
