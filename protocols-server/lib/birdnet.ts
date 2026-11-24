import { addYears } from 'date-fns';

import { Datasource } from './datasource.ts';

type ZenodoFile = {
	record: `https://zenodo.org/records/${number}`;
	file: string;
};

export class BirdNetZenodo extends Datasource<
	'classmapping',
	{ classmapping: ZenodoFile },
	{ classmapping: Array<{ idx: number; sci_name: string; id: string }> }
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

			return [...parseCsv(text, 'idx', 'sci_name', 'id')].map((row) => ({
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
