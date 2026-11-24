/// <reference types="@types/bun" />
import { renameSync, writeFileSync } from 'node:fs';

import * as eta from 'arrival-time';
import { minutesToMilliseconds } from 'date-fns';

class Progress {
	total = 0;
	done = 0;
	phaseName = '';

	maxPhaseLength = 10;

	lastWrite: number | undefined;
	lastDrawnStep = -1;
	lastDrawnAt: number | undefined;

	ongoing: string[] = [];

	eta = new eta.Estimation();

	constructor() {}

	log(...parts: unknown[]) {
		this.clear();
		// eslint-disable-next-line no-console
		console.log(...parts);
		if (colorsSupported) this.draw();
	}

	updateEta() {
		this.eta.update(this.done, this.total);
	}

	phase(phase: string, total: number) {
		this.phaseName = phase;
		this.total = total;
		this.done = 0;
		this.lastDrawnStep = -1;
		this.eta.reset();
		this.updateEta();
	}

	increment(by = 1) {
		if (by < 0) throw new Error(`cant increment by ${by}`);
		this.done += by;
		this.updateEta();
		this.redraw();
	}

	set(progress: number) {
		if (progress < 0) throw new Error(`cant set progress to ${progress}`);
		this.done = progress;
		this.updateEta();
		this.redraw();
	}

	/** Add to this.ongoing */
	start(task: string) {
		this.ongoing.push(task);
	}

	/** Remove to this.ongoing */
	finish(task: string) {
		this.ongoing = this.ongoing.filter((t) => t !== task);
	}

	redraw() {
		if (!this.redrawDue()) return;
		this.draw();

		this.lastDrawnStep = this.progress(this.refreshCount);
		this.lastDrawnAt = performance.now();
	}

	/** Additional refreshes distributed evenly along the progress */
	get refreshCount() {
		return colorsSupported ? 1 : 10;
	}

	get refreshEveryMs() {
		return colorsSupported ? 50 : minutesToMilliseconds(10);
	}

	redrawDue() {
		if (this.progress(this.refreshCount) !== this.lastDrawnStep) return true;

		if (!this.lastWrite) return true;

		const elapsed = performance.now() - this.lastWrite;

		return elapsed > this.refreshEveryMs;
	}

	progress(max: number) {
		return this.total ? Math.floor((this.done / this.total) * max) : 0;
	}

	/**
	 * Get a progress percentage, rounded
	 */
	get percentage() {
		return this.progress(100);
	}

	/** Everything this class stores, for external consumers (e.g. the progress file) */
	snapshot() {
		return {
			phase: this.phaseName,
			total: this.total,
			done: this.done,
			percentage: this.percentage,
			ongoing: [...this.ongoing],
			eta: formatDuration(this.eta.estimate()),
		};
	}

	draw() {
		this.clear();
		const width = 30;

		const phase = this.phaseName.slice(0, this.maxPhaseLength).padEnd(this.maxPhaseLength);

		const filled = this.progress(width);
		const empty = Math.max(0, width - filled);
		const bar = '='.repeat(filled) + ' '.repeat(empty);

		const percentage = `${this.percentage.toString().padStart(3)}%`;

		const counter = `${this.done}/${this.total}`;

		const tasks = this.ongoing.join(', ');

		const osc94 = colorsSupported ? `\x1b]9;4;1;${this.percentage}\x1b\x5c` : '';

		// non-TTY: each update is its own line (no in-place redraw)
		const eol = colorsSupported ? '' : '\n';

		// non-TTY: prefix with a short timestamp so log lines are time-ordered
		const timestamp = colorsSupported ? '' : `${new Date().toTimeString().slice(0, 8)} `;

		process.stdout.write(
			`${timestamp}${phase} ${percentage} ${bar} ${counter}` +
				(tasks ? `: ${tasks}` : '') +
				osc94 +
				eol
		);

		this.lastWrite = performance.now();
	}

	clear() {
		if (colorsSupported) process.stdout.write('\x1b[1K\r');
	}

	stop() {
		if (colorsSupported) process.stdout.write(`\x1b]9;4;0\x1b\x5c`);
		this.clear();
	}
}

export const progress = new Progress();

/**
 * Colors (and terminal escape sequences) are only used when the output is a
 * TTY and the user hasn't opted out via NO_COLOR. On CI, PaaS logs, etc. the
 * output stays plain and readable.
 */
const colorsSupported = process.stdout.isTTY === true && !('NO_COLOR' in process.env);

const colors = colorsSupported
	? {
			yellow: '\x1b[33m',
			red: '\x1b[31m',
			dim: '\x1b[2m',
			reset: '\x1b[0m',
		}
	: {
			yellow: '',
			red: '',
			dim: '',
			reset: '',
		};

function colorize(parts: unknown[], color: string): unknown[] {
	return parts.map((p) => (typeof p === 'string' ? `${color}${p}${colors.reset}` : p));
}

class Logger {
	lastTimedLog: number | undefined;

	warn(...parts: unknown[]) {
		progress.log(...colorize(parts, colors.yellow));
	}
	error(...parts: unknown[]) {
		progress.log(...colorize(parts, colors.red));
	}
	/** logger.info with timing info (diff with last logger.timed call) */
	timed(...parts: unknown[]) {
		if (!this.lastTimedLog) {
			this.lastTimedLog = performance.now();
			progress.log(...parts);
			return;
		}

		const diff = performance.now() - this.lastTimedLog;
		progress.log(`${colors.dim}+${formatDuration(diff)}${colors.reset}`, ...parts);
		this.lastTimedLog = performance.now();
	}
	info(...parts: unknown[]) {
		progress.log(...parts);
	}
	debug(...parts: unknown[]) {
		progress.log(...parts);
	}
}

export const logger = new Logger();

/**
 * Progress file: when PROGRESS_FILE=true, a snapshot of the progress state is
 * written to PROGRESS_FILE (default: progress.json in the CWD) every
 * PROGRESS_FILE_REFRESH_MS (default: 10s), so the server can expose it via
 * GET /api/regenerate. Writes are atomic (write to .tmp, then rename).
 */
const progressFileEnabled = process.env.PROGRESS_FILE === 'true';
const progressFilePath = process.env.PROGRESS_FILE_PATH ?? 'progress.json';
const progressFileRefreshMs = Number(process.env.PROGRESS_FILE_REFRESH_MS ?? 10_000);

let progressFileTimer: ReturnType<typeof setInterval> | undefined;

function writeProgressFile() {
	try {
		const tmp = `${progressFilePath}.tmp`;
		writeFileSync(
			tmp,
			JSON.stringify({ ...progress.snapshot(), updatedAt: new Date().toISOString() }, null, 2)
		);
		renameSync(tmp, progressFilePath);
	} catch (err) {
		logger.error(`Failed to write progress file ${progressFilePath}:`, err);
	}
}

/** Start writing the progress file (no-op unless PROGRESS_FILE=true) */
export function startProgressFile() {
	if (!progressFileEnabled || progressFileTimer) return;
	writeProgressFile();
	progressFileTimer = setInterval(writeProgressFile, progressFileRefreshMs);
	progressFileTimer.unref?.();
}

/** Stop writing the progress file and write a final snapshot */
export function stopProgressFile() {
	if (!progressFileTimer) return;
	clearInterval(progressFileTimer);
	progressFileTimer = undefined;
	writeProgressFile();
}

/** Formats a duration in ms: <1s → "123ms", <1min → "1.23s", <1h → "2m 34s", else → "1h 5m" */
function formatDuration(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	const s = ms / 1000;
	if (s < 60) return `${s.toFixed(2)}s`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}min ${Math.round(s % 60)}s`;
	const h = Math.floor(m / 60);
	return `${h}h ${m % 60}min`;
}
