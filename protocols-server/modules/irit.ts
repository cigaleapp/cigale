import { NameProvider } from '../lib/modules.js';
import { ExportedProtocol } from '../lib/types.js';

/** Species names from the classmappings of IRIT models */
export class IRITModels implements NameProvider {
	name = 'irit' as const;

	constructor(public corpus: 'full' | 'light') {}

	baseUrl =
		'https://raw.githubusercontent.com/cigaleapp/cigale/4765709abf053f607ff8e5a040b29ff3aca7edbc';

	get protocol() {
		switch (this.corpus) {
			case 'full':
				return `${this.baseUrl}/examples/arthropods.cigaleprotocol.json`;
			case 'light':
				return `${this.baseUrl}/examples/arthropods.light.cigaleprotocol.json`;
		}
	}

	async *scan() {
		const protocol = (await fetch(this.protocol).then((res) => res.json())) as ExportedProtocol;
		const options = protocol.metadata[`${protocol.id}__species`].options;

		if (!options) {
			throw new Error(
				`${this.protocol} doesnt have options declared for its species metadata`
			);
		}

		for (const { label } of options) {
			yield { clade: 'species', name: label };
		}
	}
}
