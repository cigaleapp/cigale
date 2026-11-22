import { BirdNetClassmapping } from './birdnet';
import { Option, Specializer } from './modules';

export class Birds implements Specializer {
	name = 'birds' as const;
	protocolId = 'io.github.cigaleapp.base.birds';

	birdnet: BirdNetClassmapping;

	/** Include eveyrthing from the birdnet model even if its not a bird */
	explicit = new Set<string>();

	constructor() {
		this.birdnet = new BirdNetClassmapping();
	}

	async init() {
		for await (const { name } of this.birdnet.scan()) {
			this.explicit.add(name);
		}
	}

	include({ name, parents = [] }: Option): boolean {
		const names = new Set([name, ...parents.map((p) => p.name)]);

		if (!this.explicit.isDisjointFrom(names)) return true;

		return parents.some((parent) => parent.clade === 'class' && parent.name === 'Aves');
	}
}

declare global {
	interface Set<T> {
		/**
		 * The isDisjointFrom() method of Set instances takes a set and returns a boolean indicating if this set has no elements in common with the given set.
		 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isDisjointFrom
		 */
		isDisjointFrom(other: Iterable<T>): boolean;
	}
}
