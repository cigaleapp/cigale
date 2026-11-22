import { IDMyBeeSpecies } from './idmybee';
import { CladedName, matchCladedName, Option, Specializer } from './modules';

export const PROTOCOL_ID = 'io.gihtub.cigaleapp.base.bees' as const;
type PROTOCOL_ID = typeof PROTOCOL_ID;

const BEE_FAMILIES = [
	'Andrenidae',
	'Apidae',
	'Colletidae',
	'Halictidae',
	'Megachilidae',
	'Melittidae',
	'Stenotritidae',
];

export class Bees implements Specializer {
	protocolId = PROTOCOL_ID;
	name = 'bees' as const;

	explicit: CladedName[] = [];

	async init() {
		const species = new IDMyBeeSpecies();
		for await (const tx of species.scan()) {
			this.explicit.push(tx);
		}
	}

	include({ name, clade, parents = [] }: Option) {
		return (
			this.explicit.some(matchCladedName({ name, clade })) ||
			BEE_FAMILIES.some((name) => parents.some(matchCladedName({ clade: 'family', name })))
		);
	}
}
