/// <reference types="@types/bun" />

import { execFileSync } from 'node:child_process';

// Waits for the protocols server's options regeneration to finish, exposing
// the progress as a GitHub check run. Run from CI:
//
//   SERVER_URL=... JOB_STARTED_AT=... TOTAL_WAIT_MINUTES=120 \
//     bun run protocols-server/scripts/wait-regeneration.ts
//
// Only trusts regeneration runs that started after JOB_STARTED_AT, because
// right after an app restart the server may still serve the previous run's
// status and logs. Exits 0 when the current run finished, 1 otherwise.

const serverUrl = process.env.SERVER_URL;
const jobStartedAt = process.env.JOB_STARTED_AT;
const repo = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
const totalWaitMinutes = Number(process.env.TOTAL_WAIT_MINUTES ?? 120);

if (!serverUrl) throw new Error('SERVER_URL is required');
if (!jobStartedAt) throw new Error('JOB_STARTED_AT is required');
if (!repo) throw new Error('GITHUB_REPOSITORY is required');
if (!sha) throw new Error('GITHUB_SHA is required');

const jobStart = Date.parse(jobStartedAt);
if (Number.isNaN(jobStart)) throw new Error(`Invalid JOB_STARTED_AT: ${jobStartedAt}`);

type RegenProgress = {
	phase: string;
	total: number;
	done: number;
	percentage: number;
	ongoing: string[];
	eta: string;
};

type RegenState = {
	state: 'idle' | 'running' | 'done' | 'error';
	exitCode?: number;
	startedAt?: string;
	finishedAt?: string;
	progress: RegenProgress | null;
	logs_url: string;
};

// All API bodies are passed as JSON on stdin so that values containing
// special characters (%, —, quotes, ...) never go through a shell.
function ghApi(method: 'POST' | 'PATCH', path: string, body: unknown): string {
	return execFileSync('gh', ['api', '-X', method, path, '--input', '-'], {
		encoding: 'utf8',
		input: JSON.stringify(body),
	});
}

async function fetchStatus(): Promise<RegenState> {
	const res = await fetch(`${serverUrl}/api/regenerate`);
	if (!res.ok) throw new Error(`GET /api/regenerate failed: ${res.status} ${res.statusText}`);
	return (await res.json()) as RegenState;
}

function isCurrent(startedAt: string | undefined): boolean {
	return startedAt !== undefined && Date.parse(startedAt) >= jobStart;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

console.log('Waiting for options regeneration to complete...');

// Expose the regeneration progress as a GitHub check run, updated on every
// poll.
const checkRunId = JSON.parse(ghApi('POST', `repos/${repo}/check-runs`, {
	name: 'Regeneration progress',
	head_sha: sha,
	details_url: serverUrl,
	output: {
		title: 'Regenerating options',
		summary: 'Waiting for regeneration to start...',
	},
})).id as number;

let status = '';
let current = false;
for (let i = 0; i < totalWaitMinutes; i++) {
	const state = await fetchStatus();
	status = state.state;
	current = isCurrent(state.startedAt);
	if (current) {
		const p = state.progress;
		const tasks = p?.ongoing.join(', ');
		console.log(`${p?.percentage ?? 0}% ${p?.phase ?? ''}: ${tasks ?? ''}`);
		ghApi('PATCH', `repos/${repo}/check-runs/${checkRunId}`, {
			output: {
				title: `Regenerating: ${p?.phase ?? ''} (${p?.percentage ?? 0}%)`,
				summary: `**${p?.percentage ?? 0}%** — ${p?.phase ?? ''}${tasks ? ` — ${tasks}` : ''} (ETA: ${p?.eta ?? '?'})`,
			},
		});
	} else {
		console.log(`No new run yet (last run started: ${state.startedAt ?? 'never'}); waiting...`);
		ghApi('PATCH', `repos/${repo}/check-runs/${checkRunId}`, {
			output: {
				title: 'Waiting for regeneration to start',
				summary: `The app has not started a new regeneration run since the job began (last run: ${state.startedAt ?? 'none'}).`,
			},
		});
	}
	if (current && (status === 'done' || status === 'error')) break;
	await sleep(60_000);
}

console.log('Final status:');
const final = await fetchStatus();
console.log(JSON.stringify(final, null, 2));
status = final.state;
current = isCurrent(final.startedAt);

console.log('Logs:');
const logsRes = await fetch(final.logs_url);
if (!logsRes.ok) throw new Error(`GET ${final.logs_url} failed: ${logsRes.status}`);
console.log(await logsRes.text());

let conclusion: 'success' | 'failure';
let title: string;
if (current && status === 'done') {
	conclusion = 'success';
	title = 'Regeneration complete';
} else if (current) {
	conclusion = 'failure';
	title = `Regeneration did not complete (state: ${status})`;
} else {
	conclusion = 'failure';
	title = 'Regeneration did not start after app restart';
}

ghApi('PATCH', `repos/${repo}/check-runs/${checkRunId}`, {
	status: 'completed',
	conclusion,
	output: {
		title,
		summary: `Final state: ${status} — Logs: ${final.logs_url}`,
	},
});

process.exit(conclusion === 'success' ? 0 : 1);
