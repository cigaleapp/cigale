import { addYears } from 'date-fns';

import { Datasource, NameProvider } from './modules';
import { logger } from './progress';

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

			yield { clade, name };
		}
	}
}

type ZenodoFile = {
	record: `https://zenodo.org/records/${number}`;
	file: string;
};

class BirdNetZenodo extends Datasource<
	'classmapping',
	{ classmapping: ZenodoFile },
	{ classmapping: Array<{ idx: number; sci_name: string }> }
> {
	name = 'birdnet' as const;

	expirations = {
		file: (now: Date) => addYears(now, 1),
		entry: (now: Date) => addYears(now, 1),
	};

	async init() {}

	requests = {
		classmapping: async ({ record, file }: ZenodoFile) => {
			const response = await fetch(`${record}/files/${file}?download=1`);
			const text = await response.text();
			if (!response.ok) throw new Error(text);

			return [...parseCsv(text, 'idx', 'sci_name')].map((row) => ({
				...row,
				idx: Number.parseInt(row.idx),
			}));
		},
	};
}

function* parseCsv<C extends string>(
	text: string,
	/** Column names to keep */
	...columns: C[]
): Iterable<Record<C, string>> {
	const [header, ...rows] = text.split('\n');

	const sep = header.includes(';') ? ';' : ',';

	const index = header
		.split(sep)
		.map((name, i) => ({ name, i }))
		.filter((cell) => columns.includes(cell.name as C));

	for (const row of rows) {
		if (!row.trim()) continue;

		const cells = row.trim().split(sep);

		yield Object.fromEntries(
			index.map((column) => [column.name, cells[column.i]] as const)
		) as Record<C, string>;
	}
}
