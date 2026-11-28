import { BirdNetClassmapping } from '../modules/birdnet.js';
import { CladedName, matchCladedName, Option, Specializer } from '../lib/modules.js';

export class Birds implements Specializer {
	name = 'birds' as const;
	protocolId = 'io.github.cigaleapp.base.birds';

	birdnet: BirdNetClassmapping;

	/** Include eveyrthing from the birdnet model even if its not a bird */
	explicit: CladedName[] = [];

	constructor() {
		this.birdnet = new BirdNetClassmapping();
	}

	async init() {
		for await (const { name, clade } of this.birdnet.scan()) {
			this.explicit.push({ name, clade });
		}
	}

	include({ name, clade, parents = [] }: Option): boolean {
		return (
			this.explicit.some(matchCladedName({ name, clade })) ||
			parents.some(matchCladedName({ clade: 'class', name: 'Aves' }))
		);
	}
}
