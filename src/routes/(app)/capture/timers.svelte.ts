import type { CaptureTimersMessageTemplate } from '$lib/schemas/protocols';

import { ms } from 'convert';

export class Timer {
	totalDuration = 0;
	elapsedTotal = $state(0);
	elapsedLap = $state(0);
	laps = $state(0);
	started = $state(false);

	globalProgress = $derived(this.elapsedTotal / (this.totalDuration || 1));
	remainingTotal = $derived(this.totalDuration - this.elapsedTotal);

	#handle: NodeJS.Timeout | number | undefined;

	constructor(
		private timings: {
			every?: number | undefined;
			during: number;
			count?: number | undefined;
		},
		private callbacks?: {
			onstart: (t: Timer) => void;
			onlap: (t: Timer) => void;
			onfinished: (t: Timer) => void;
		}
	) {
		this.totalDuration = timings.during;

		if (timings.every && timings.every > timings.during) {
			throw new Error(
				`Capture timer is invalid: capture.timers.every (${timings.every}ms) is longer than capture.timers.during (${timings.during}ms)`
			);
		}

		if (this.lapDuration >= Infinity) {
			throw new Error('Capture timer configuration would lead to infinite laps');
		}

		if (this.lapDuration <= ms('100ms')) {
			throw new Error('Capture timer configuration would lead to laps of less than 100ms');
		}
	}

	get lapDuration() {
		return Math.min(
			this.timings.every ?? Infinity,
			this.timings.during / (this.timings.count || 1)
		);
	}

	get lapsTotalCount() {
		return Math.ceil(this.totalDuration / this.lapDuration);
	}

	get timeResolution() {
		if (this.lapDuration <= ms('1s')) return ms('10ms');
		if (this.lapDuration <= ms('1h')) return ms('500ms');
		return ms('30s');
	}

	formatMessage(template: (typeof CaptureTimersMessageTemplate)['infer']) {
		try {
			return template.render({
				laps: {
					totalCount: this.lapsTotalCount,
					currentRemainingMs: this.elapsedLap,
					doneCount: this.laps,
					remainingCount: this.lapsTotalCount - this.laps,
				},
				total: {
					durationMs: this.timings.during,
					remainingMs: this.timings.during - this.elapsedTotal,
				},
			});
		} catch (e) {
			console.error(`formatMessage with template failed`, template, e);
			return '';
		}
	}

	start() {
		this.started = true;
		this.callbacks?.onstart(this);
		this.#handle = setInterval(() => {
			this.elapsedTotal += this.timeResolution;
			this.elapsedLap += this.timeResolution;

			if (this.elapsedLap >= this.lapDuration) {
				this.elapsedLap = 0;
				this.laps++;
				this.callbacks?.onlap?.(this);
			}

			if (this.elapsedTotal >= this.timings.during) {
				this.started = false;
				clearTimeout(this.#handle);
				this.callbacks?.onfinished(this);
			}
		}, this.timeResolution);
	}

	stop() {
		clearTimeout(this.#handle);
	}

	reset() {
		this.started = false;
		this.elapsedTotal = 0;
		this.elapsedLap = 0;
		this.laps = 0;
	}

	restart() {
		this.stop();
		this.callbacks?.onfinished(this);
		this.reset();
		this.start();
	}
}
