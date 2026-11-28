import { addMonths } from 'date-fns';

import { Option } from '../lib/modules.js';
import { ClassmappingNameProvider, NeuralNetworkDatasource } from './neural.js';

export class SmallCollemboles extends ClassmappingNameProvider<{ speciesName: string }> {
	name = 'small-collemboles' as const;
	model = new SmallCollembolesModel();

	option(line: { speciesName: string }) {
		return { clade: 'species', name: line.speciesName };
	}
}

export class FrenchArthro extends ClassmappingNameProvider<{
	speciesName: string;
	gbifKey: string;
}> {
	name = 'frencharthro' as const;
	model = new FrenchArthroModel();

	option(line: { speciesName: string; gbifKey: string }) {
		return {
			clade: 'species',
			name: line.speciesName,
			extras: [
				{
					priority: 1,
					extra: {
						extraKeys: [line.gbifKey],
					},
				},
			],
		} satisfies Omit<Option, 'provenance'>;
	}
}

export class SmallCollembolesModel extends NeuralNetworkDatasource<{ speciesName: string }> {
	name = 'small-collemboles' as const;

	url = 'https://raw.githubusercontent.com/edgaremy/small-collomboles/main/class_mapping.txt';

	expiration = (now: Date) => addMonths(now, 1);

	parseClassmappingLine(line: string) {
		return { speciesName: line };
	}
}

export class FrenchArthroModel extends NeuralNetworkDatasource<{
	gbifKey: string;
	speciesName: string;
}> {
	csvKeys: undefined | string[];

	name = 'frencharthro' as const;

	url =
		'https://huggingface.co/edgaremy/convnextv2_base.frencharthro-24k/resolve/main/class-names.csv';

	expiration = (now: Date) => addMonths(now, 1);

	parseClassmappingLine(line: string): { gbifKey: string; speciesName: string } | undefined {
		const cells = line.split(',');
		if (!this.csvKeys) {
			this.csvKeys = cells;
			return;
		}

		return {
			speciesName: this.byColumn(cells, 'speciesName'),
			gbifKey: this.byColumn(cells, 'speciesKey'),
		};
	}

	byColumn(row: string[], column: string) {
		if (!this.csvKeys) throw new Error(`CSV file has no header`);

		const index = this.csvKeys.indexOf(column);
		if (index === -1) {
			throw new Error(
				`CSV classmapping has no ${column} column. Check header: ${JSON.stringify(this.csvKeys)}`
			);
		}

		return row[index];
	}
}
