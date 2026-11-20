import { Datasource, Datasources, Identifier, Option } from './modules';

type GbifParams = {
	parents: {
		id: string;
	};
	id: {
		clade: string;
		name: string;
	};
};

type GbifResponses = {
	parents: Array<{
		clade: string;
		name: string;
		id: string;
	}>;
	id: string;
};

export class GBIF implements Datasource<'parents' | 'id', GbifParams, GbifResponses> {
	name = 'gbif' as const;

	async request<Q extends 'parents' | 'id'>(query: Q, params: GbifParams[Q]) {
		// TODO
	}
}

export class GBIFID implements Identifier {
	name = "gbif-id" as const
	needs = ["gbif"] as const

	async identify(data: Datasources, option: Option)  {
		if (option.id) return option.id
		return await data.gbif.request(option.name)
	}

}
