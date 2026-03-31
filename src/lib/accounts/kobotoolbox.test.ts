import 'urlpattern-polyfill';

import { beforeEach, describe, expect, test, vi } from 'vitest';

import data from '$e2e/fixtures/http/kobotoolbox/asset-data.json' with { type: 'json' };
import asset from '$e2e/fixtures/http/kobotoolbox/asset.json' with { type: 'json' };

import Provider from './kobotoolbox.js';

const MOCK_TOKEN = 'da98ec4ef4ea681cfaef1cae68c4fae64cfae64f6ae4cfe6a1fc6e';

beforeEach(() => {
	global.fetch = vi.fn((corsedUrl: string | URL | RequestInfo, init?: RequestInit) => {
		const url = corsedUrl.toString().replace(/^https:\/\/cors\.gwen\.works\//, '');

		const respond = ({
			route,
			response,
		}: {
			route: string;
			response: object | ((match: URLPatternResult) => object);
		}) => {
			const match = new URLPattern(route).exec(url);

			if (!match) return undefined;

			if (new Headers(init?.headers ?? {}).get('Authorization') !== `Token ${MOCK_TOKEN}`) {
				return Promise.resolve({
					status: 401,
					ok: false,
					json: Promise.resolve({
						detail: 'Jeton invalide.',
					}),
				});
			}

			const resp = typeof response === 'function' ? response(match) : response;

			return Promise.resolve({
				status: 200,
				ok: true,
				json: Promise.resolve(resp),
			});
		};

		return (
			respond({
				route: 'https://kf.kobotoolbox.org/api/v2/assets/:id',
				response: asset,
			}) ??
			respond({
				route: 'https://kf.kobotoolbox.org/api/v2/assets/:id/data',
				response: data,
			}) ??
			respond({
				route: 'https://kf.kobotoolbox.org/me/',
				response: {}, //  TODO
			}) ??
			fetch(corsedUrl, init)
		);
	});
});

test('.tokenPageURL', () => {
	expect(Provider.tokenPageURL('eu.kobotoolbox.org').href).toEqual(
		'https://eu.kobotoolbox.org/token/'
	);
});

test('.domainOfProfileURL', () => {
	expect(Provider.domainOfProfileURL('https://kc.kobotoolbox.org/gwennlbh')).toEqual(
		'kf.kobotoolbox.org'
	);
});

describe('.checkAuth', () => {
	test('valid', async () => {
		expect(await Provider.checkAuth({ server: 'kf.kobotoolbox.org', token: MOCK_TOKEN })).toBe(
			true
		);
	});
	test('invalid token', async () => {
		expect(
			await Provider.checkAuth({
				server: 'kf.kobotoolbox.org',
				token: MOCK_TOKEN + 'Dérisoire',
			})
		).toBe(false);
	});
});
