import example from '../../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import { NameProvider } from './modules';

/** Species names from the classmappings of IRIT models */
export class IRITModels implements NameProvider {
	name = 'irit' as const;

	async *scan() {
		for (const option of example.metadata[`${example.id}__species`].options) {
			yield { clade: 'species', name: option.label };
		}
	}
}
