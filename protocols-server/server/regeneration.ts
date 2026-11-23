import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Subprocess } from 'bun';
import { DATA_DIR, PROGRESS_FILE } from './config.js';

export type RegenStatus = {
	state: 'idle' | 'running' | 'done' | 'error';
	exitCode?: number;
	startedAt?: string;
	finishedAt?: string;
};

let regenProcess: Subprocess | null = null;
let regenStatus: RegenStatus = { state: 'idle' };

export function getRegenStatus(): RegenStatus {
	return regenStatus;
}

// The regeneration process (spawned with cwd: DATA_DIR) writes a progress
// snapshot to this file when PROGRESS_FILE=true.
export function readProgress(): unknown {
	try {
		return JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
	} catch {
		return null;
	}
}

export function regenerate(): boolean {
	if (regenStatus.state === 'running') {
		return false;
	}
	const startedAt = new Date().toISOString();
	regenStatus = { state: 'running', startedAt };
	regenProcess = Bun.spawn(['bun', 'run', path.join(import.meta.dir, '..', 'main.ts')], {
		cwd: DATA_DIR,
		stdout: 'inherit',
		stderr: 'inherit',
		env: { ...process.env },
	});
	regenProcess.exited.then((code) => {
		regenStatus = {
			state: code === 0 ? 'done' : 'error',
			exitCode: code,
			startedAt,
			finishedAt: new Date().toISOString(),
		};
		regenProcess = null;
	});
	return true;
}
