import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Subprocess } from 'bun';
import { ms } from 'convert';

import config from './config.ts';

export type RegenStatus = {
	state: 'idle' | 'running' | 'done' | 'error';
	exitCode?: number;
	startedAt?: string;
	finishedAt?: string;
};

let regenProcess: Subprocess | null = null;
let regenStatus: RegenStatus = { state: 'idle' };

// Rolling buffer of the last lines of the regeneration process's
// stdout+stderr, exposed via GET /api/regeneration/log.txt.
let regenLog: string[] = [];

export function getRegenStatus(): RegenStatus {
	return regenStatus;
}

// The last LOG_MAX_LINES lines of the most recent (or current) regeneration
// run, or null when no run has happened yet.
export function readRegenLog(): string | null {
	return regenLog.length > 0 ? regenLog.join('\n') + '\n' : null;
}

function appendLogLine(line: string) {
	regenLog.push(line);
	if (regenLog.length > config.LOG_MAX_LINES) {
		regenLog.splice(0, regenLog.length - config.LOG_MAX_LINES);
	}
}

// Feed a stream of the child's output into the log buffer, splitting on
// newlines and keeping a partial-line carry-over between chunks. The raw
// bytes are also passed through to the server's own stdout/stderr so the
// container logs keep showing the regeneration output as before.
function pipeToLog(
	stream: ReadableStream<Uint8Array>,
	prefix: string,
	target: { write(chunk: Uint8Array): unknown }
): Promise<void> {
	const decoder = new TextDecoder();
	let pending = '';
	const reader = stream.getReader();
	return (async () => {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			target.write(value);
			pending += decoder.decode(value, { stream: true });
			const lines = pending.split('\n');
			pending = lines.pop() ?? '';
			for (const line of lines) {
				appendLogLine(prefix + line);
			}
		}
		// Flush any trailing bytes (e.g. a multi-byte char split across chunks).
		pending += decoder.decode();
		if (pending !== '') {
			appendLogLine(prefix + pending);
		}
	})().catch((err) => {
		console.error('Failed to read regeneration process output:', err);
	});
}

// The regeneration process (spawned with cwd: DATA_DIR) writes a progress
// snapshot to this file when PROGRESS_FILE=true.
export function readProgress(): unknown {
	try {
		return JSON.parse(readFileSync(config.PROGRESS_FILE, 'utf8'));
	} catch {
		return null;
	}
}

/**
 * Sends SIGINT to the ongoing regen process
 * and waits for it to exit.
 */
export async function cancelRegeneration(): Promise<boolean> {
	if (!regenProcess) return false;

	regenProcess.kill('SIGINT');

	const maxWaitMs = ms('1min');

	for (let waited = 0; waited < maxWaitMs; waited += 500) {
		await new Promise((res) => setTimeout(res, 500));
		if (regenProcess.killed) return true;
	}

	// Force kill

	regenProcess.kill();

	for (let waited = 0; waited < maxWaitMs; waited += 500) {
		await new Promise((res) => setTimeout(res, 500));
		if (regenProcess.killed) return true;
	}

	return false;
}

export function regenerate(): boolean {
	if (regenStatus.state === 'running') {
		return false;
	}
	const startedAt = new Date().toISOString();
	regenStatus = { state: 'running', startedAt };
	regenLog = [];
	regenProcess = Bun.spawn(['bun', 'run', path.join(import.meta.dir, '..', 'main.ts')], {
		cwd: config.DATA_DIR,
		stdout: 'pipe',
		stderr: 'pipe',
		env: { ...process.env },
	});
	const stdoutDone = pipeToLog(regenProcess.stdout, '', process.stdout);
	const stderrDone = pipeToLog(regenProcess.stderr, '[stderr] ', process.stderr);
	regenProcess.exited.then(async (code) => {
		// Wait for the output to be fully drained so the log is complete
		// before the status flips to done/error.
		await Promise.all([stdoutDone, stderrDone]);
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
