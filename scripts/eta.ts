import { intervalToDuration } from 'date-fns';

export class EtaCalculator {
	private lastSteps: number[] = [];
	private maxSteps: number;
	private totalSteps: number;
	private lastStepTime: number = performance.now();

	constructor({ averageOver, totalSteps }: { averageOver: number; totalSteps: number }) {
		this.maxSteps = averageOver;
		this.totalSteps = totalSteps;
	}

	step(count = 1): void {
		const currentTime = performance.now();
		const durationSeconds = (currentTime - this.lastStepTime) / 1000;
		this.lastStepTime = currentTime;
		for (let i = 0; i < count; i++) this.addStep(durationSeconds / count);
	}

	msSinceLastStep(): number {
		return performance.now() - this.lastStepTime;
	}

	private addStep(durationSeconds: number) {
		this.lastSteps.push(durationSeconds);
		if (this.lastSteps.length > this.maxSteps) {
			this.lastSteps.shift();
		}
	}

	private getAverage(): number {
		const sum = this.lastSteps.reduce((a, b) => a + b, 0);
		return sum / this.lastSteps.length;
	}

	seconds(stepsDone: number): number {
		return this.getAverage() * (this.totalSteps - stepsDone);
	}

	display(stepsDone: number): string {
		const {
			hours = 0,
			minutes = 0,
			seconds = 0
		} = intervalToDuration({
			start: 0,
			end: this.seconds(stepsDone) * 1000
		});

		const formatPart = (n: number) => n.toString().padStart(2, '0');

		if (hours === 0) {
			return `${formatPart(minutes)}m${formatPart(seconds)}`;
		}

		return `${formatPart(hours)}h${formatPart(minutes)}`;
	}
}
