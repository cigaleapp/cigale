import type * as DB from '#lib/database.js';

import example from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import light from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { Option, Specializer } from './modules.js';

export class Insects implements Specializer {
	name = 'insects' as const;
	protocolId = 'io.github.cigaleapp.base.insects';

	async init() {}

	include(option: Option): boolean {
		// @ts-ignore protocol is sometimes too large to have its type inferred
		const options = example.metadata[`${example.id}__${option.clade}`]?.options as
			undefined | DB.MetadataEnumVariant[];

		if (!options) return false;

		return options.some((opt) => opt.label === option.name);
	}
}

export class Collembola implements Specializer {
	name = 'collembola' as const;
	protocolId = 'io.github.cigaleapp.base.collembola';

	async init() {}

	include(option: Option): boolean {
		// @ts-ignore protocol is sometimes too large to have its type inferred
		const options = light.metadata[`${light.id}__${option.clade}`]?.options as
			undefined | DB.MetadataEnumVariant[];

		if (!options) return false;

		return options.some((opt) => opt.label === option.name);
	}
}
