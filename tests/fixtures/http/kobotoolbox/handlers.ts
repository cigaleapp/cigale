import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { SessionRemoteID } from '$lib/schemas/sessions.js';
import type { HttpRequestResolverExtras, RequestHandlerOptions, ResponseResolver } from 'msw';

import { http, HttpResponse } from 'msw';

import { FixturePaths } from '$e2e/filepaths.js';
import { logexpr } from '$lib/utils.js';

import data5 from './asset-data-limit-5.json' with { type: 'json' };
import dataOne from './asset-data-single.json' with { type: 'json' };
import data40 from './asset-data.json' with { type: 'json' };
import asset from './asset.json' with { type: 'json' };
import me from './me.json' with { type: 'json' };

export const MOCK_TOKEN = 'da98ec4ef4ea681cfaef1cae68c4fae64cfae64f6ae4cfe6a1fc6e';
export const MOCK_SESSION_REMOTEID_NOTFOUND_DATA_ID = '42066667';
const MOCK_SESSION_REMOTEID_ASSET_ID = 'a3kVqAFEJwnHFcFc7PpWj4';
const MOCK_SESSION_REMOTEID_DATA_ID = '709547383';

export const MOCK_SESSION_REMOTEID = (dataid = MOCK_SESSION_REMOTEID_DATA_ID) =>
	`/api/v2/assets/${MOCK_SESSION_REMOTEID_ASSET_ID}/data/${dataid}/` as SessionRemoteID;

const RESPONSES = {
	invalid: HttpResponse.json({ detail: 'Jeton invalide.' }, { status: 401 }),
	notfound: HttpResponse.json({ detail: 'Not found.' }, { status: 404 }),
};

export const handlers = [
	get('/**', ({ params, request: { headers } }) => {
		if (params.server !== 'kf') return RESPONSES.invalid;
		if (headers.get('Authorization') !== `Token ${MOCK_TOKEN}`) return RESPONSES.invalid;
	}),
	get('/me/', () => HttpResponse.json(me)),
	post('/login{/}?', () => HttpResponse.json(me)),
	get('/api/v2/assets/:id/**', ({ params }) => {
		if (params.id !== MOCK_SESSION_REMOTEID_ASSET_ID) return;
	}),
	get('/api/v2/assets/:id', () => HttpResponse.json(asset)),
	get<{ dataid: string }>('/api/v2/assets/:id/data/:dataid{/}?', ({ params }) => {
		if (params.dataid === MOCK_SESSION_REMOTEID_NOTFOUND_DATA_ID) return RESPONSES.notfound;
		return HttpResponse.json(dataOne);
	}),
	get('/api/v2/assets/:id/data', ({ request }) => {
		const url = new URL(request.url);
		return HttpResponse.json(url.searchParams.get('limit') === '5' ? data5 : data40);
	}),
	get<{ dataid: string }>('/api/v2/assets/:id/data/:dataid/enketo/view', () =>
		HttpResponse.json({
			url: 'https://ee.kobotoolbox.org/view/103e4931120464df0cebb60b35df43b6?instance_id=c2983a5e-fd4c-4032-9b07-50d3e0b8db5f&return_url=false',
			version_uid: 'vomChPkx3JLXdErzdUjMYd',
		})
	),
	get<{ size: string }>('/api/v2/assets/*/data/*/attachments/*/:size/', () =>
		logexpr(
			'attachment mock',
			HttpResponse.arrayBuffer(
				readFileSync(path.join(FixturePaths.root, 'cyan.jpeg' as FixturePaths.Any)).buffer,
				{
					headers: { 'Content-Type': 'image/jpeg' },
				}
			)
		)
	),
];

function get<ExtraParams extends Record<string, any> = BaseParams>(
	...[route, resolver, options]: CorsedHandlerArgs<ExtraParams>
) {
	return http.get<BaseParams & ExtraParams>(
		'https://cors.gwen.works/https\\://:server.kobotoolbox.org' + route,
		resolver,
		options
	);
}

function post<P extends Record<string, any> = BaseParams>(
	...[route, resolver, options]: CorsedHandlerArgs<P>
) {
	return http.post<BaseParams & P>(
		'https://cors.gwen.works/https\\://:server.kobotoolbox.org' + route,
		resolver,
		options
	);
}

type BaseParams = { id: string; server: string };

type CorsedHandlerArgs<P extends Record<string, any> = BaseParams> = [
	route: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	resolver: ResponseResolver<HttpRequestResolverExtras<P & BaseParams>, any, any>,
	options?: RequestHandlerOptions,
];
