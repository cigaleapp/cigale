import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { dequal } from 'dequal';

import { tryCache } from './caching.js';

export function pathToAsset(datasource: string, query: string, filename: string) {
	return path.join('assets', datasource, query, filename);
}

export type DatasourceName =
	'gbif' | 'jj' | 'gslides' | 'idmybee' | 'andrena-morphogroups' | 'iucn' | 'birdnet' | `debug-${string}`;

/**
 * Defines caching for a single external source, that could be used multiple times by different modules.
 * For example, the GBIF Datasource is both used as a Identifier (GBIF IDs) and as a Taxonomy (we use their taxonomic tree)
 */
export abstract class Datasource<
	Query extends string = string,
	Params extends DataRequestParams<Query> = DataRequestParams<Query>,
	Responses extends Record<Query, unknown> = Record<Query, unknown>,
> {
	/** Name of the datasource. Used to construct the path to the cache file. */
	abstract name: DatasourceName;

	/** Initial loading when the data source is first instantiated. Needs to be idempotent. */
	abstract init(): Promise<void>;

	abstract requests: DataRequests<Query, Params, Responses>;

	abstract expirations: {
		file: (now: Date) => Date;
		entry: (now: Date, query: Query) => Date;
	};

	async one<Q extends SingleQueries<Query, Params, Responses>>(
		query: Q,
		params: Params[Q]
	): Promise<Responses[Q]> {
		const [response] = await this._request(query, [params], { bulk: false });
		return response as Responses[Q];
	}

	async many<Q extends BulkQueries<Query, Params, Responses>>(
		query: Q,
		params: Params[Q] extends unknown[] ? Params[Q] : never
	): Promise<Responses[Q][]> {
		return this._request(query, params, { bulk: true });
	}

	async _request<Q extends Query>(
		query: Q,
		params: unknown[],
		{ bulk }: { bulk: boolean }
	): Promise<Responses[Q][]> {
		await this.init?.();

		return tryCache(this.name, {
			selector: { query, paramslist: params },
			expirations: this.expirations,
			compute: async () => this.requests[query]((bulk ? params : params[0]) as Params[Q]),
		});
	}
}

export class ResponseWithFiles<R> {
	response: R;
	files: File[];
	/** Map filenames to sha1 base64 hashes */
	hashes?: Map<string, string>;

	constructor({ response, files = [] }: { response: R; files?: File[] }) {
		this.response = response;
		this.files = files;
	}

	async writeAssets(datasource: string, query: string) {
		this.hashes ??= new Map();
		const sha1 = new Uint8Array(20);

		for (const file of this.files) {
			const bytes = new Uint8Array(await file.arrayBuffer());

			mkdirSync(path.dirname(pathToAsset(datasource, query, file.name)), { recursive: true });
			writeFileSync(pathToAsset(datasource, query, file.name), bytes);

			Bun.SHA1.hash(bytes, sha1);
			this.hashes.set(file.name, sha1.toBase64());
		}
	}

	async prepareForCache(datasource: string, query: string) {
		await this.writeAssets(datasource, query);

		return this.files.map((file) => ({
			filename: file.name,
			sha1: this.hashes!.get(file.name)!,
		}));
	}
}

export class MultipleResponses<R, P> {
	responses: Array<[P, R]>;

	constructor(init: Array<[P, R]> = []) {
		this.responses = init;
	}

	push(params: P, response: R) {
		this.responses.push([params, response]);
	}

	ordered(order: P[]): Array<R | undefined> {
		return order.map((param) => this.responses.find(([p]) => dequal(p, param))?.[1]);
	}
}

export type DataRequestParams<Query extends string = string> = Record<Query, unknown>;

/** Handling a request from a module, by first trying to hit the cache, and if it fails, hitting the network/whatever. Response, if it was a cache miss, is saved to cache. */
export type DataRequests<
	Query extends string = string,
	Params extends DataRequestParams<Query> = DataRequestParams<Query>,
	Responses extends Record<Query, unknown> = Record<Query, unknown>,
> = {
	[Q in Query]: (
		params: Params[Q]
	) => Promise<
		Params[Q] extends Array<any>
			? Responses[Q] | ResponseWithFiles<Responses[Q]> | MultipleResponses<Responses[Q], Params[Q][number]>
			: Responses[Q] | ResponseWithFiles<Responses[Q]>
	>;
};

export type BulkQueries<
	Query extends string = string,
	Params extends DataRequestParams<Query> = DataRequestParams<Query>,
	_Responses extends Record<Query, unknown> = Record<Query, unknown>,
> = { [Q in Query]: Params[Q] extends any[] ? Q : never }[Query];

export type SingleQueries<
	Query extends string = string,
	Params extends DataRequestParams<Query> = DataRequestParams<Query>,
	_Responses extends Record<Query, unknown> = Record<Query, unknown>,
> = { [Q in Query]: Params[Q] extends any[] ? never : Q }[Query];
