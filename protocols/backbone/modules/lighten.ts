import type { Module } from '../module.ts';

const module: Module = {
	name: 'Lighten',
	priority: 0,
	async totalSteps() {
		return 4;
	},
	async *run() {
		await new Promise((resolve) => setTimeout(resolve, 500));
		yield { done: 1, total: 4 };
		await new Promise((resolve) => setTimeout(resolve, 500));
		yield { done: 2, total: 4 };
		await new Promise((resolve) => setTimeout(resolve, 1_000));
		yield { done: 3, total: 4 };
		await new Promise((resolve) => setTimeout(resolve, 500));
		yield { done: 4, total: 4 };
	},
	apply(protocol) {
		protocol.authors.push({ name: this.name });
	}
};

export default module;
