import { Datasource, DatasourceName, NoParams } from '../lib/datasource.ts';
import { ModuleName, NameProvider, Option, Specializer } from '../lib/modules.ts';

export abstract class ClassmappingSpecializer<Line> implements Specializer {
	abstract name: ModuleName;
	abstract model: NeuralNetworkDatasource<Line>;
	abstract protocolId: string;

	lines: Line[] | undefined;

	async init() {
		if (this.lines) return;
		const { lines } = await this.model.one('classmapping', {});
		this.lines = lines;
	}

	abstract also(option: Option): boolean;

	abstract compare(option: Option, line: Line): boolean;

	include(option: Option): boolean {
		return this.also(option) || this.lines!.some((line) => this.compare(option, line));
	}
}

export abstract class ClassmappingNameProvider<Line> implements NameProvider {
	abstract name: ModuleName;
	abstract model: NeuralNetworkDatasource<Line>;

	abstract option(line: Line): Omit<Option, 'provenance'>;

	async *scan() {
		const { lines } = await this.model.one('classmapping', {});
		for (const line of lines) {
			yield this.option(line);
		}
	}
}

export abstract class NeuralNetworkDatasource<ClassmappingLine> extends Datasource<
	'classmapping',
	{ classmapping: NoParams },
	{ classmapping: { lines: ClassmappingLine[] } }
> {
	abstract name: DatasourceName;

	// 'https://huggingface.co/edgaremy/andrena-classifier/resolve/main/class-mapping-grouped.txt?download=true';

	abstract url: string;

	abstract parseClassmappingLine(line: string): ClassmappingLine | undefined;

	async init() {}

	abstract expiration: (now: Date) => Date;

	get expirations() {
		return {
			file: (now: Date) => this.expiration(now),
			entry: (now: Date) => this.expiration(now),
		};
	}

	requests = {
		classmapping: async () => {
			const response = await fetch(this.url);
			const text = await response.text();
			if (!response.ok) throw new Error(text);

			return {
				lines: text
					.split(/\r?\n/)
					.filter((line) => line.trim())
					.map((line) => this.parseClassmappingLine(line))
					.filter((o) => o !== undefined),
			};
		},
	};
}
