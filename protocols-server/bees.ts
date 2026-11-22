import * as idmybee from './idmybee';
import { IDMyBeeSpecies } from './idmybee';
import { matchCladedName, Option, Specializer } from './modules';

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

export class Bees extends idmybee.WithSDD implements Specializer {
	protocolId = PROTOCOL_ID;
	name = 'bees' as const;

	explicit = new Set<{ clade: string; name: string }>();

	async init() {
		const species = new IDMyBeeSpecies();
		for await (const tx of species.scan()) {
			this.explicit.add(tx);
		}
	}

	include({ name, clade, parents = [] }: Option) {
		return (
			this.explicit.has({ name, clade }) ||
			BEE_FAMILIES.some((name) => parents.some(matchCladedName({ clade: 'family', name })))
		);
	}
}
