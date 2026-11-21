class Progress {
	total = 0;
	done = 0;
	phaseName = '';

	maxPhaseLength = 10;

	lastWrite: number | undefined;

	constructor() {}

	log(...parts: unknown[]) {
		this.clear();
		console.log(...parts);
		this.draw();
	}

	phase(phase: string, total: number) {
		this.phaseName = phase;
		this.total = total;
		this.done = 0;
	}

	increment() {
		this.done++;
		this.redraw();
	}

	set(progress: number) {
		this.done = progress;
		this.redraw();
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
		const empty = width - filled;
		const bar = '='.repeat(filled) + ' '.repeat(empty);

		const percentage = `${scaled(100).toString().padStart(3)}%`;

		const counter = `${this.done}/${this.total}`;

		const osc94 = `\x1b]9;4;1;${scaled(100)}\x1b\x5c`;

		process.stdout.write(`${phase} ${percentage} ${bar} ${counter}` + osc94);
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

// TODO: colors
class Logger {
	warn(...parts: unknown[]) {
		progress.log(...parts);
	}
	error(...parts: unknown[]) {
		progress.log(...parts);
	}
	info(...parts: unknown[]) {
		progress.log(...parts);
	}
	debug(...parts: unknown[]) {
		progress.log(...parts);
	}
}

export const logger = new Logger();
