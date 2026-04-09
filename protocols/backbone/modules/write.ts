import { ExportedProtocol } from '../../../src/lib/schemas/protocols.js';
import { Module } from '../module.ts';
import { here } from '../utils.ts';

export default function (
	/** Relative to /protocols/backbone */
	destination: string
): Module<(typeof ExportedProtocol)['inferIn'] | null> {
	const file = here(destination);

	return {
		name: 'Write',
		data: null,
		async totalSteps() {
			return 1;
		},
		async prepare(protocol) {
			this.data = protocol;
		},
		async *run() {
			yield 1;
		},
		async finish() {
			await file.write(JSON.stringify(this.data));
			await Bun.$`bunx prettier -w ${file}`;
		},
		apply() {}
	};
}
