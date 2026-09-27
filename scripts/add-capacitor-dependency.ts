/// <reference types="@types/node" />

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const packages = process.argv.slice(2);

const nativeCodeVersionFile = 'android/.native-code-version';

spawnSync('bun', ['add', ...packages], { stdio: 'inherit' });
spawnSync('bun', ['cap', 'sync'], { stdio: 'inherit' });

const newVersion = Number(readFileSync(nativeCodeVersionFile).toString().trim()) + 1;

console.info(`Setting ${nativeCodeVersionFile} to ${newVersion}`);

writeFileSync(nativeCodeVersionFile, String(newVersion));
