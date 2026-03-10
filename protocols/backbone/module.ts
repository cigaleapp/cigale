import { Estimation as ETA } from 'arrival-time';
import { formatDistanceToNowStrict, intervalToDuration, isValid as isValidDate } from 'date-fns';

import type { ExportedProtocol } from '../../src/lib/schemas/protocols.js';

export type Module<T extends unknown = unknown> = {
	/**
	 * Data private to the module
	 */
	data: T;

	/**
	 * Name of the module
	 */
	name: string;

	/**
	 * Returns the total number of steps that will be done
	 * in this module.
	 *
	 * Can be updated later on
	 *
	 * Called once to initalize global progress reporting
	 */
	totalSteps(protocol: (typeof ExportedProtocol)['inferIn']): Promise<number>;

	/**
	 * Runs before any progress updates
	 */
	prepare?(protocol: (typeof ExportedProtocol)['inferIn']): Promise<void>;

	/**
	 * Yields on every progress update
	 */
	run(): AsyncGenerator<{ done: number; total: number } | number>;

	/**
	 * Runs after all progress updates
	 */

	finish?(): Promise<void>;

	/**
	 * Apply results to the protocol
	 */
	apply(protocol: (typeof ExportedProtocol)['inferIn']): void;
};

export async function run(base: (typeof ExportedProtocol)['inferIn'], ...tree: Array<Module[]>) {
	const protocol = structuredClone(base);

	const progress = new WithProgress();

	progress.log('Base', '    ', `Using ${protocol.id}`);

	for (const row of tree) {
		await progress.init(protocol, row);

		await Promise.all(row.map(runWithProgress));

		for (const module of row) {
			module.apply(protocol);
		}
	}

	async function runWithProgress(module: Module) {
		await progress.run(protocol, module);
	}
}

export class WithProgress {
	totals = {} as Record<string, number>;
	dones = {} as Record<string, number>;
	eta = new ETA({ total: 1 });

	constructor() {
		this.eta.update(0);
	}

	async init(protocol: (typeof ExportedProtocol)['inferIn'], modules: Module[]) {
		await Promise.all(
			modules.map(async (module) => {
				this.#update(module.name, 0, await module.totalSteps(protocol));
			})
		);
	}

	get total() {
		return Object.values(this.totals).reduce((cur, acc) => cur + acc, 0) || 1;
	}
	get done() {
		return Object.values(this.dones).reduce((cur, acc) => cur + acc, 0);
	}

	#update(module: string, done: number, total: number) {
		this.dones[module] = done;
		this.totals[module] = total;
		this.eta.update(this.done, this.total);
	}

	log(moduleName: string, ...text: string[]) {
		const endsAt = new Date(Date.now() + this.eta.estimate());
		const duration = isValidDate(endsAt)
			? intervalToDuration({
					start: new Date(),
					end: endsAt
				})
			: undefined;

		console.log(
			Math.round((this.done / this.total) * 100)
				.toString()
				.padStart(3) + '%',

			duration
				? (duration.hours ?? 0) > 0
					? duration.hours!.toString().padStart(2) + 'h'
					: (duration.minutes ?? 0) > 0
						? duration.minutes!.toString().padStart(2) + 'm'
						: (duration.seconds ?? 0) > 0
							? duration.seconds!.toString().padStart(2) + 's'
							: '   '
				: '   ',

			'[' + moduleName.padEnd(20) + ']',

			...text
		);
	}

	async run(protocol: (typeof ExportedProtocol)['inferIn'], module: Module) {
		const onProgress = async (done: number, total: number) => {
			this.#update(module.name, done, total);
		};

		let total = this.totals[module.name] ?? 1;
		let done = 0;

		const log = (...text: string[]) =>
			this.log(
				module.name,
				Math.round((done / total) * 100)
					.toString()
					.padStart(3) + '%',

				...text
			);

		log('Initialize');

		await onProgress(done, total);

		const eta = new ETA({ total });
		eta.update(done);

		await module.prepare?.(protocol);

		for await (const progress of module.run()) {
			if (typeof progress === 'number') {
				done = progress;
			} else {
				total = progress.total;
				done = progress.done;
			}

			eta.update(done, total);
			await onProgress(done, total);

			const endsAt = new Date(Date.now() + eta.estimate());

			log(
				isValidDate(endsAt)
					? formatDistanceToNowStrict(endsAt, {
							addSuffix: true
						})
					: ''
			);
		}

		log('Finishing');

		await module.finish?.();

		await onProgress(total, total);
	}
}
