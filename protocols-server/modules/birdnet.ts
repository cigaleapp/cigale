import { BirdNetZenodo } from '../datasources/birdnet.js';
import { NameProvider } from '../lib/modules.js';
import { logger } from '../lib/progress.js';

export class BirdNetClassmapping implements NameProvider {
	name = 'birdnet' as const;

	zenodo: BirdNetZenodo;

	constructor() {
		this.zenodo = new BirdNetZenodo();
	}

	async *scan() {
		for (const row of await this.zenodo.one('classmapping', {
			record: 'https://zenodo.org/records/20703646',
			file: 'BirdNET+_V3.0-preview3.1_Global_11K_Labels.csv',
		})) {
			const name = row.sci_name
				.replace(/ \(Domestic type\)$/, '')
				.replace(/ f\. domestica$/, '')
				.replace(/^(\w+ \w+) x \w+$/, '$1');

			const wordcount = name.split(' ').length;

			const clade = { 1: 'genus', 2: 'species', 3: 'subspecies' }[wordcount];

			if (!clade) {
				logger.warn(`skipping ${row.sci_name} because its clade is unclear`);
				continue;
			}

			// Also guess it as a family if it ends with "ae"

			if (clade === 'genus' && name.endsWith('ae')) {
				yield { clade: 'family', name };
			}

			yield {
				clade,
				name,
				extras: [
					{
						priority: 1,
						extra: {
							extraKeys: [`birdnet:${row.id}`],
						},
					},
				],
			};
		}
	}
}
