/// <reference types="@types/bun" />

import { IUCNArchive, IUCNDataset, STATUSES } from '../datasources/iucn.js';
import { Enricher, Option } from '../lib/modules.js';

export class IUCN implements Enricher {
	name = 'iucn' as const;

	archive: IUCNArchive;
	dataset: IUCNDataset | undefined;

	chunksize = 1;

	constructor() {
		this.archive = new IUCNArchive();
	}

	async init() {
		this.dataset = await this.archive.one('index', {});
	}

	available(option: Option): boolean {
		if (option.clade !== 'species') return false;
		return option.name in this.dataset!.byName;
	}

	//  TODO: see if we can batch this up
	async *enrich(options: Option[]) {
		for (const { name, id } of options) {
			if (!id) continue;
			const status = this.dataset!.byName[name];
			if (!status) continue;

			yield {
				id,
				priority: 2,
				extra: {
					cascade: {
						conservation_status: STATUSES[status],
					},
				},
			};
		}
	}
}
