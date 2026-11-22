import { BirdNetClassmapping } from './birdnet.js';
import { matchCladedName, Option, Specializer } from './modules.js';

export class Birds implements Specializer {
	name = 'birds' as const;
	protocolId = 'io.github.cigaleapp.base.birds';

	birdnet: BirdNetClassmapping;

	/** Include eveyrthing from the birdnet model even if its not a bird */
	explicit = new Set<{ clade: string; name: string }>();

	constructor() {
		this.birdnet = new BirdNetClassmapping();
	}

	async init() {
		for await (const { name, clade } of this.birdnet.scan()) {
			this.explicit.add({ name, clade });
		}
	}

	include({ name, clade, parents = [] }: Option): boolean {
		return (
			this.explicit.has({ name, clade }) ||
			parents.some(matchCladedName({ clade: 'class', name: 'Aves' }))
		);
	}
}
