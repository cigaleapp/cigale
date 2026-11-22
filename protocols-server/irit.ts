import example from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import light from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { NameProvider } from './modules.js';

/** Species names from the classmappings of IRIT models */
export class IRITModels implements NameProvider {
	name = 'irit' as const;

	constructor(public corpus: 'full' | 'light') {}

	get protocol() {
		switch (this.corpus) {
			case 'full':
				return example;
			case 'light':
				return light;
		}
	}

	async *scan() {
		// @ts-expect-error json import too large to be typed
		for (const option of this.protocol.metadata[`${this.protocol.id}__species`].options) {
			yield { clade: 'species', name: option.label };
		}
	}
}

