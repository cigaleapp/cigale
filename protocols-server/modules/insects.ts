import { ModuleName, Option, Specializer } from '../lib/modules.js';
import { ExportedProtocol, MetadataEnumVariant } from '../lib/types.js';
import { IRITModels } from './irit.js';

abstract class SpecializeFromOldProtocol implements Specializer {
	abstract name: ModuleName;
	abstract protocolId: string;
	abstract scope: 'full' | 'light';

	protocol: ExportedProtocol | undefined;

	async init() {
		const url = new IRITModels(this.scope).protocol;
		this.protocol = await fetch(url).then((r) => r.json());
	}

	include(option: Option): boolean {
		// @ts-ignore protocol is sometimes too large to have its type inferred
		const options = this.protocol.metadata[`${this.protocol.id}__${option.clade}`]?.options as
			undefined | MetadataEnumVariant[];

		if (!options) return false;

		return options.some((opt) => opt.label === option.name);
	}
}

export class Insects extends SpecializeFromOldProtocol {
	name = 'insects' as const;
	protocolId = 'io.github.cigaleapp.base.insects';
	scope = 'full' as const;
}

export class Collembola extends SpecializeFromOldProtocol {
	name = 'collembola' as const;
	protocolId = 'io.github.cigaleapp.base.collembola';
	scope = 'light' as const;
}
