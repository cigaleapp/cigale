import type { Module } from '../module.ts';
import { huggingface, MODELS } from './huggingface.ts';

const module: Module<{ classes: string[] }> = {
	name: 'Lighten',
	data: { classes: [] },
	async totalSteps() {
		return 1;
	},
	async prepare() {
		this.data.classes = await fetch(
			huggingface(
				'classifier',
				MODELS.classifiers['Collemboles (~80 classes)'].scope,
				'classmapping'
			)
		)
			.then((res) => res.text())
			.then((text) =>
				text
					.split('\n')
					.map((line) => line.trim())
					.filter(Boolean)
					.map(Number.parseInt)
					.filter((n) => !Number.isNaN(n))
					.map((n) => n.toString())
			);
	},
	async *run() {
		yield 1;
	},
	apply(protocol) {
		protocol.id += '.light';

		const kept = new Set<string>(this.data.classes);
		if (protocol.metadata.species.type !== 'enum') throw 'species is not enum';

		for (const [i, option] of protocol.metadata.species.options!.entries()) {
			if (!kept.has(option.key)) {
				protocol.metadata.species.options!.splice(i, 1)
			}
		}
	}
};

export default module;
