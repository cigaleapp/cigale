import { CladedName, compareCladedNames, matchCladedName, Option } from '../lib/modules.js';
import { FrenchArthroModel, SmallCollembolesModel } from '../modules/irit.js';
import { ClassmappingSpecializer } from '../modules/neural.js';

export class Arthropods extends ClassmappingSpecializer<{ speciesName: string; gbifKey: string }> {
	name = 'arthropods' as const;
	protocolId = 'io.github.cigaleapp.base.arthropods';
	model = new FrenchArthroModel();
	also = matchCladedName({ clade: 'phylum', name: 'Arthropoda' });

	compare(
		{ extras = [], ...cladedname }: Option,
		line: { speciesName: string; gbifKey: string }
	): boolean {
		if (compareSpeciesName(cladedname, line)) return true;

		return extras.some(({ extra }) => extra.extraKeys?.includes(line.gbifKey));
	}
}

export class Springtails extends ClassmappingSpecializer<{ speciesName: string }> {
	name = 'springtails' as const;
	protocolId = 'io.github.cigaleapp.base.springtails';
	model = new SmallCollembolesModel();
	also = matchCladedName({ clade: 'class', name: 'Collembola' });
	compare = compareSpeciesName;
}

function compareSpeciesName(option: CladedName, line: { speciesName: string }): boolean {
	return compareCladedNames(option, { clade: 'species', name: line.speciesName });
}
