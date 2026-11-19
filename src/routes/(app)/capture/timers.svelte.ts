import type { CaptureDevice } from './device.svelte.js';
import type { CaptureTimer, CaptureTimersMessageTemplate } from '$lib/schemas/protocols';
import type { SfxName } from '$lib/sound.js';

import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { KeepAwake } from '@capawesome/capacitor-keep-awake';
import { ms } from 'convert';

import { formatDurationShort } from '$lib/date';
import { getSettings } from '$lib/settings.svelte';
import { sfx as _sfx } from '$lib/sound.js';
import { uiState } from '$lib/uistate.svelte.js';
import { switchValue } from '$lib/utils';

type TimerConfig = (typeof CaptureTimer)['infer'];

export class DeviceTimer {
	#configIndex: number | null = null;

	allConfigs = $derived(uiState.currentProtocol?.capture?.timers ?? []);
	availableConfigs = $state<TimerConfig[]>([]);
	config = $state<TimerConfig>();

	constructor(public device: CaptureDevice) {}

	switchConfig(type: 'photo' | 'sound', index: number | null | undefined) {
		this.timer?.stop();
		this.#configIndex = index ?? null;
		this.availableConfigs = this.allConfigs.filter((config) => config.for.includes(type));
		this.config = this.availableConfigs[this.#configIndex ?? -1];

		if (this.config) {
			this.device.resetShootingPhase();
		} else {
			this.device.setShootingPhase('inert');
		}

		this.device.floatingmsg.set('Timer', this.config?.name ?? 'Aucun');
	}

	timer = $derived.by(() => {
		if (!this.config) return;

		const device = this.device;

		function sfx(name: SfxName) {
			if (getSettings().timerSounds && device.canEmitSfx) {
				_sfx(name);
			}
		}

		return new Timer(this.config, {
			onstart(t) {
				device.setShootingPhase('timer-running');
				device.floatingmsg.set('Timer', t.formatMessage(t.config.messages.start));
				void Haptics.impact({ style: ImpactStyle.Heavy });

				// At start of timer, being a recording (sound/video mode)
				// but don't snap a picture (photo mode)
				if (t.config.shoot === 'on-timer' && device.type !== 'photo') {
					device.recordOrCapture(t.config.duration);
				}
			},
			async onlap(t) {
				device.floatingmsg.set('Timer', t.formatMessage(t.config.messages.lap));

				if (t.config.shoot === 'on-timer') {
					device.recordOrCapture(t.config.duration);
				} else {
					sfx('timer-lap');
				}

				void Haptics.impact({ style: ImpactStyle.Medium });
			},
			async onfinished(t) {
				if (t.config.shoot === 'on-timer') {
					device.recordOrCapture(t.config.duration);
				}

				sfx('timer-finished');
				device.setShootingPhase('after-timer');
				await Haptics.impact({ style: ImpactStyle.Heavy });

				device.runCaptureInferences('after-timer');

				device.floatingmsg.set('Timer', t.formatMessage(t.config.messages.end));
				device.setShootingPhase('done');
			},
		});
	});
}

export class Timer {
	totalDuration = 0;
	recordDuration = $state(0);
	elapsedTotal = $state(0);
	elapsedLap = $state(0);
	laps = $state(0);
	started = $state(false);
	/** Will start once the hour range (timer's within property) is active */
	armed = $state(false);
	paused = $state(false);

	globalProgress = $derived(Math.max(0, this.elapsedTotal / (this.totalDuration || 1)));
	remainingTotal = $derived(Math.max(0, this.totalDuration - this.elapsedTotal));

	lapProgress = $derived(Math.max(0, this.elapsedLap / this.lapDuration));

	recordDurationProportion = $derived(Math.max(0, this.recordDuration / this.lapDuration));

	#handle: NodeJS.Timeout | number | undefined;

	constructor(
		public config: (typeof CaptureTimer)['infer'],
		private callbacks?: {
			onstart: (t: Timer) => void;
			onlap: (t: Timer) => void;
			onfinished: (t: Timer) => void;
		}
	) {
		const duration = config.during ?? config.within?.duration();

		if (!duration) {
			throw new Error(
				`Capture timer is invalid: neither capture.timers.during nor capture.timers.within is set`
			);
		}

		this.totalDuration = duration;
		this.recordDuration = config.duration ?? 0;

		if (config.every && config.every > this.totalDuration) {
			throw new Error(
				`Capture timer is invalid: capture.timers.every (${config.every}ms) is longer than capture.timers.during (${config.during}ms)`
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
			this.config.every ?? Infinity,
			this.totalDuration / (this.config.count || 1)
		);
	}

	get lapsTotalCount() {
		return Math.ceil(this.totalDuration / this.lapDuration);
	}

	get timeResolution() {
		if (this.lapDuration <= ms('1h')) return ms('10ms');
		if (this.lapDuration <= ms('7h')) return ms('500ms');
		return ms('30s');
	}

	withinRange() {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		return this.config.within?.within(new Date()) ?? true;
	}

	formatMessage(template: (typeof CaptureTimersMessageTemplate)['infer']) {
		try {
			return template.render({
				laps: {
					totalCount: this.lapsTotalCount,
					currentRemainingMs: this.elapsedLap,
					doneCount: this.laps,
					currentNo: this.laps + 1,
					remainingCount: Math.max(0, this.lapsTotalCount - this.laps),
				},
				total: {
					durationMs: this.totalDuration,
					remainingMs: Math.max(0, this.totalDuration - this.elapsedTotal),
				},
			});
		} catch (e) {
			console.error(`formatMessage with template failed`, template, e);
			return '';
		}
	}

	start() {
		let checkpoint = performance.now();
		this.armed = true;
		this.#handle = setInterval(() => {
			if (!this.withinRange()) {
				return;
			}

			if (!this.started) {
				this.callbacks?.onstart(this);
				this.started = true;
			}

			const now = performance.now();
			const elapsed = now - checkpoint;
			checkpoint = now;

			this.elapsedTotal += elapsed;
			this.elapsedLap += elapsed;

			if (this.elapsedTotal >= this.totalDuration) {
				this.started = false;
				clearTimeout(this.#handle);
				void this.callbacks?.onfinished(this);
				return;
			}

			if (this.elapsedLap >= this.lapDuration || !this.withinRange()) {
				this.elapsedLap = 0;
				this.laps++;
				void this.callbacks?.onlap?.(this);
			}
		}, this.timeResolution);

		void KeepAwake.keepAwake();
	}

	stop() {
		clearTimeout(this.#handle);
		void KeepAwake.allowSleep();
	}

	pause() {
		this.stop();
		this.paused = true;
	}

	resume() {
		this.paused = false;
		this.start();
	}

	togglePause() {
		if (this.paused) {
			this.resume();
		} else {
			this.pause();
		}
	}

	reset() {
		this.started = false;
		this.elapsedTotal = 0;
		this.elapsedLap = 0;
		this.laps = 0;
		void KeepAwake.allowSleep();
	}

	restart() {
		this.stop();
		this.callbacks?.onfinished(this);
		this.reset();
		this.start();
	}
}

export function displayTimerConfig(config: (typeof CaptureTimer)['infer']) {
	let lap = '';
	let total = '';

	const shootmode = switchValue(config.shoot, {
		manually: '',
		'on-timer': '[A]',
	});

	const duration = (ms: number) => formatDurationShort(getSettings().language, ms);

	if (config.count) lap += `${config.count}×`;
	lap += config.duration ? duration(config.duration) : '1';
	if (config.every) lap += `/${duration(config.every)}`;

	if (config.during) total += duration(config.during);
	if (config.within) total += config.within.toString();

	if (lap && total) return `${shootmode} ${lap} (${total})`;
	return total || lap;
}
