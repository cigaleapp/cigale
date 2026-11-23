import { addMonths } from 'date-fns';

import { NeuralNetworkDatasource } from '../modules/neural.ts';
import { Xper3 } from './xper3.ts';

export abstract class WithSDD {
	dataset: Xper3;

	constructor() {
		const sddurl = process.env.IDMYBEE_SDD_URL;
		if (!sddurl)
			throw new Error(
				`IDMyBee needs the SDD URL, set environment variable IDMYBEE_SDD_URL to the SDD (XML file)`
			);

		this.dataset = new Xper3('idmybee', new URL(sddurl));
	}

	async init() {
		await this.dataset.init();
	}
}

export type AndrenaModelClassmapping = Array<{
	genus: string;
	subname: string;
	species: string;
	groups: string[];
}>;

export class AndrenaModel extends NeuralNetworkDatasource<AndrenaModelClassmapping[number]> {
	name = 'andrena-morphogroups' as const;

	// 'https://huggingface.co/edgaremy/andrena-classifier/resolve/main/class-mapping-grouped.txt?download=true';

	url =
		'https://huggingface.co/api/resolve-cache/models/edgaremy/andrena-classifier/193b4ac01dbb37d71ff68a5530ff102257ea9e31/species_to_morphogroups.csv?download=true';

	expiration = (now: Date) => addMonths(now, 6);

	parseClassmappingLine(line: string) {
		if (!line.startsWith('Andrena,')) return;

		const [genus, subname, ...groups] = line.split(',').filter(Boolean);

		return {
			genus,
			subname,
			groups,
			species: `${genus} ${subname}`,
		};
	}
}
