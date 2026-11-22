class Progress {
	total = 0;
	done = 0;
	phaseName = '';

	maxPhaseLength = 10;

	lastWrite: number | undefined;

	ongoing: string[] = [];

	constructor() {}

	log(...parts: unknown[]) {
		this.clear();
		// eslint-disable-next-line no-console
		console.log(...parts);
		this.draw();
	}

	phase(phase: string, total: number) {
		this.phaseName = phase;
		this.total = total;
		this.done = 0;
	}

	increment(by = 1) {
		if (by < 0) throw new Error(`cant increment by ${by}`);
		this.done += by;
		this.redraw();
	}

	set(progress: number) {
		if (progress < 0) throw new Error(`cant set progress to ${progress}`);
		this.done = progress;
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
		this.lastWrite = performance.now();
	}

	redrawDue() {
		if (!this.lastWrite) return true;
		const elapsed = performance.now() - this.lastWrite;
		return elapsed > 50;
	}

	draw() {
		this.clear();
		const width = 30;

		const scaled = (max: number) =>
			this.total ? Math.floor((this.done / this.total) * max) : 0;

		const phase = this.phaseName.slice(0, this.maxPhaseLength).padEnd(this.maxPhaseLength);

		const filled = scaled(width);
		const empty = Math.max(0, width - filled);
		const bar = '='.repeat(filled) + ' '.repeat(empty);

		const percentage = `${scaled(100).toString().padStart(3)}%`;

		const counter = `${this.done}/${this.total}`;

		const tasks = this.ongoing.join(', ');

		const osc94 = `\x1b]9;4;1;${scaled(100)}\x1b\x5c`;

		process.stdout.write(
			`${phase} ${percentage} ${bar} ${counter}` + (tasks ? `: ${tasks}` : '') + osc94
		);
	}

	clear() {
		process.stdout.write('\x1b[1K\r');
	}

	stop() {
		process.stdout.write(`\x1b]9;4;0\x1b\x5c`);
		this.clear();
	}
}

export const progress = new Progress();

const colors = {
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	dim: '\x1b[2m',
	reset: '\x1b[0m',
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
