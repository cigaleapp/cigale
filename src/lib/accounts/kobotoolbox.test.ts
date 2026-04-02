import 'urlpattern-polyfill';
import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, test, vi } from 'vitest';

import data5 from '$e2e/fixtures/http/kobotoolbox/asset-data-limit-5.json' with { type: 'json' };
import dataOne from '$e2e/fixtures/http/kobotoolbox/asset-data-single.json' with { type: 'json' };
import data40 from '$e2e/fixtures/http/kobotoolbox/asset-data.json' with { type: 'json' };
import asset from '$e2e/fixtures/http/kobotoolbox/asset.json' with { type: 'json' };
import me from '$e2e/fixtures/http/kobotoolbox/me.json' with { type: 'json' };
import * as DB from '$lib/database.js';
import { openDatabase } from '$lib/idb.svelte.js';
import { SessionRemoteID } from '$lib/schemas/sessions.js';

import Provider from './kobotoolbox.js';

const MOCK_TOKEN = 'da98ec4ef4ea681cfaef1cae68c4fae64cfae64f6ae4cfe6a1fc6e';
const MOCK_SESSION_REMOTEID = SessionRemoteID.assert(
	`/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/709547383/`
);
const MOCK_SESSION_REMOTEID_NOTFOUND = SessionRemoteID.assert(
	`/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/42066667/`
);

beforeEach(() => {
	const _originalFetch = global.fetch;
	global.fetch = vi.fn((corsedUrl: string | URL | RequestInfo, init?: RequestInit) => {
		const url = corsedUrl.toString().replace(/^https:\/\/cors\.gwen\.works\//, '');

		const respond = ({
			route,
			response,
		}: {
			route: string;
			response: object | ((match: URLPatternResult, url: URL) => object);
		}) => {
			const match = new URLPattern(route).exec(url);

			if (!match) return undefined;

			if (
				new Headers(init?.headers ?? {}).get('Authorization') !== `Token ${MOCK_TOKEN}` ||
				match.hostname.groups.server !== 'kf'
			) {
				return Promise.resolve(
					new Response(JSON.stringify({ detail: 'Jeton invalide.' }), {
						headers: { 'Content-Type': 'application/json' },
						status: 401,
					})
				);
			}

			const resp = typeof response === 'function' ? response(match, new URL(url)) : response;

			return Promise.resolve(
				new Response(JSON.stringify(resp), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);
		};

		return (
			respond({
				route: 'https://:server.kobotoolbox.org/api/v2/assets/:id',
				response: asset,
			}) ??
			respond({
				route: 'https://:server.kobotoolbox.org/api/v2/assets/:id/data',
				response: (_, url) => (url.searchParams.get('limit') === '5' ? data5 : data40),
			}) ??
			respond({
				route: 'https://:server.kobotoolbox.org/api/v2/assets/:id/data/:dataid{/}?',
				response: dataOne,
			}) ??
			respond({
				route: 'https://:server.kobotoolbox.org/api/v2/assets/:id/data/:dataid/enketo/view',
				response: {
					url: 'https://ee.kobotoolbox.org/view/103e4931120464df0cebb60b35df43b6?instance_id=c2983a5e-fd4c-4032-9b07-50d3e0b8db5f&return_url=false',
					version_uid: 'vomChPkx3JLXdErzdUjMYd',
				},
			}) ??
			respond({
				route: 'https://:server.kobotoolbox.org/me/',
				response: me,
			}) ??
			_originalFetch(corsedUrl, init)
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
		expect(
			await Provider.checkAuth({ server: 'kf.kobotoolbox.org', token: MOCK_TOKEN })
		).toBeUndefined();
	});

	test('invalid token', async () => {
		expect(
			await Provider.checkAuth({
				server: 'kf.kobotoolbox.org',
				token: MOCK_TOKEN + 'Dérisoire',
			})
		).toMatchInlineSnapshot(`"{"detail":"Jeton invalide."}"`);
	});

	test('invalid server', async () => {
		await expect(
			Provider.checkAuth({
				server: 'example.org',
				token: MOCK_TOKEN,
			})
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[TraversalError: must be "eu.kobotoolbox.org" or "kf.kobotoolbox.org" (was "example.org")]`
		);
	});
});

describe('.fromDatabase', () => {
	test('valid account', () => {
		expect(
			Provider.fromDatabase(undefined!, {
				type: 'kobotoolbox',
				token: MOCK_TOKEN,
				username: 'big_yahu',
				displayName: 'Big Yahu',
				avatarURL: new URL('https://example.com/test.png'),
				profileURL: new URL('https://kc-eu.kobotoolbox.org/big_yahu'),
				id: 'quoicoubeh',
			})
		).toMatchInlineSnapshot(`
			{
			  "db": undefined,
			  "displayName": "Big Yahu",
			  "domain": "eu.kobotoolbox.org",
			  "id": "quoicoubeh",
			  "token": "${MOCK_TOKEN}",
			  "username": "big_yahu",
			}
		`);
	});

	test('invalid type', () => {
		expect(() =>
			Provider.fromDatabase(undefined!, {
				type: 'inaturalist',
				token: MOCK_TOKEN,
				username: 'big_yahu',
				displayName: 'Big Yahu',
				avatarURL: new URL('https://example.com/test.png'),
				profileURL: new URL('https://kc-eu.kobotoolbox.org/big_yahu'),
				id: 'quoicoubeh',
			})
		).toThrowErrorMatchingInlineSnapshot(`[Error: Invalid account type]`);
	});
});

describe('.login', () => {
	test('valid account', async () => {
		const db = await openDatabase();
		expect(
			await Provider.login(db, {
				token: MOCK_TOKEN,
				server: 'kf.kobotoolbox.org',
			})
		).toMatchInlineSnapshot(`
			{
			  "avatarURL": "https://www.gravatar.com/avatar/ef0da0f0f03e400ffd7ce59603db2e62?s=200",
			  "displayName": "Gwenn Le Bihan",
			  "profileURL": "https://kc.kobotoolbox.org/gwennlbh",
			  "token": "${MOCK_TOKEN}",
			  "type": "kobotoolbox",
			  "username": "gwennlbh",
			}
		`);
	});

	test('invalid token', async () => {
		const db = await openDatabase();
		expect(
			Provider.login(db, {
				token: MOCK_TOKEN + 'Dérisoire',
				server: 'kf.kobotoolbox.org',
			})
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Impossible de se connecter à KoboToolbox: {"detail":"Jeton invalide."}]`
		);
	});

	test('wrong server', async () => {
		const db = await openDatabase();
		expect(
			Provider.login(db, {
				token: MOCK_TOKEN,
				server: 'eu.kobotoolbox.org',
			})
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Impossible de se connecter à KoboToolbox: {"detail":"Jeton invalide."}]`
		);
	});
});

describe('db-dependent', () => {
	async function setupProtocols(
		...protocols: Array<Pick<(typeof DB.Schemas.Protocol)['inferIn'], 'id' | 'remote'>>
	) {
		const db = await openDatabase();
		for (const p of protocols) {
			await db.add('Protocol', {
				...p,
				name: `Testing protocol #${p.id}`,
				description: '',
				authors: [],
				metadata: [],
			});
		}

		return db;
	}

	async function getAccount(id = '_default') {
		const db = await openDatabase();
		const acc = DB.Schemas.Account.assert(await db.get('Account', id));
		return Provider.fromDatabase(db, acc);
	}

	beforeEach(async () => {
		const db = await openDatabase();
		await db.clear('Protocol');
		await db.clear('Metadata');
		await db.clear('MetadataOption');
		await db.clear('Account');
		await db.add('Account', {
			id: '_default',
			avatarURL: 'https://www.gravatar.com/avatar/ef0da0f0f03e400ffd7ce59603db2e62?s=200',
			displayName: 'Gwenn Le Bihan',
			profileURL: 'https://kc.kobotoolbox.org/gwennlbh',
			token: MOCK_TOKEN,
			type: 'kobotoolbox',
			username: 'gwennlbh',
		});
	});

	describe('.sessions', () => {
		test('with no kobo protocols', async () => {
			await setupProtocols({ id: 'without.kobo' });
			const account = await getAccount();

			const iterations = await Array.fromAsync(account.sessions());
			expect(iterations).toMatchObject([]);
		});

		test('with static titles', async () => {
			await setupProtocols(
				{ id: 'without.kobo' },
				{
					id: 'with.kobo',
					remote: {
						kobocollect: {
							form: 'https://kf.kobotoolbox.org/#/forms/a3kVqAFEJwnHFcFc7PpWj4/summary',
							title: 'Static title',
							thumbnails: [''],
						},
					},
				}
			);

			const account = await getAccount();

			const iterations = await Array.fromAsync(account.sessions({ limit: 5 }));
			expect(iterations).toMatchInlineSnapshot(`
			[
			  {
			    "total": 5,
			  },
			  {
			    "filesCount": 3,
			    "id": "/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/709547383",
			    "imagesCount": 0,
			    "name": "Static title",
			    "nextCursor": "https://kf.kobotoolbox.org/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/?limit=5&sort=%7B%22_submission_time%22%3A+-1%7D&start=5",
			    "page": "https://kf.kobotoolbox.org/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/709547383/enketo/redirect/view",
			    "protocol": "with.kobo",
			    "submittedAt": 2026-03-28T13:55:19.000Z,
			    "submittedBy": "gwennlbh",
			    "thumbnails": [],
			  },
			  {
			    "filesCount": 3,
			    "id": "/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/570002381",
			    "imagesCount": 0,
			    "name": "Static title",
			    "nextCursor": "https://kf.kobotoolbox.org/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/?limit=5&sort=%7B%22_submission_time%22%3A+-1%7D&start=5",
			    "page": "https://kf.kobotoolbox.org/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/570002381/enketo/redirect/view",
			    "protocol": "with.kobo",
			    "submittedAt": 2025-09-30T11:16:31.000Z,
			    "submittedBy": "elodie_massol",
			    "thumbnails": [],
			  },
			  {
			    "filesCount": 3,
			    "id": "/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/569513024",
			    "imagesCount": 0,
			    "name": "Static title",
			    "nextCursor": "https://kf.kobotoolbox.org/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/?limit=5&sort=%7B%22_submission_time%22%3A+-1%7D&start=5",
			    "page": "https://kf.kobotoolbox.org/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/569513024/enketo/redirect/view",
			    "protocol": "with.kobo",
			    "submittedAt": 2025-09-29T17:17:21.000Z,
			    "submittedBy": "elodie_massol",
			    "thumbnails": [],
			  },
			  {
			    "filesCount": 3,
			    "id": "/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/569479409",
			    "imagesCount": 0,
			    "name": "Static title",
			    "nextCursor": "https://kf.kobotoolbox.org/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/?limit=5&sort=%7B%22_submission_time%22%3A+-1%7D&start=5",
			    "page": "https://kf.kobotoolbox.org/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/569479409/enketo/redirect/view",
			    "protocol": "with.kobo",
			    "submittedAt": 2025-09-29T16:33:31.000Z,
			    "submittedBy": "elodie_massol",
			    "thumbnails": [],
			  },
			  {
			    "filesCount": 3,
			    "id": "/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/569469537",
			    "imagesCount": 0,
			    "name": "Static title",
			    "nextCursor": "https://kf.kobotoolbox.org/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/?limit=5&sort=%7B%22_submission_time%22%3A+-1%7D&start=5",
			    "page": "https://kf.kobotoolbox.org/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/569469537/enketo/redirect/view",
			    "protocol": "with.kobo",
			    "submittedAt": 2025-09-29T16:20:58.000Z,
			    "submittedBy": "elodie_massol",
			    "thumbnails": [],
			  },
			]
		`);
		});
	});

	describe('.session', () => {
		test('non-kobo protocol', async () => {
			const db = await setupProtocols({ id: 'not.kobo' });
			const acc = await getAccount();
			const prot = DB.Schemas.Protocol.assert(await db.get('Protocol', 'not.kobo'));
			expect(
				acc.session(prot, MOCK_SESSION_REMOTEID)
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`[Error: This protocol doesn't support KoboToolbox remote sessions]`
			);
		});

		test('not found data id', async () => {
			const db = await setupProtocols(
				{ id: 'not.kobo' },

				{
					id: 'with.kobo',
					remote: {
						kobocollect: {
							form: 'https://kf.kobotoolbox.org/#/forms/a3kVqAFEJwnHFcFc7PpWj4/summary',
							title: 'Static title',
							thumbnails: [''],
						},
					},
				}
			);
			const acc = await getAccount();
			const prot = DB.Schemas.Protocol.assert(await db.get('Protocol', 'with.kobo'));

			expect(
				acc.session(prot, MOCK_SESSION_REMOTEID_NOTFOUND)
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`[Error: Impossible de se connecter à KoboToolbox: {"detail":"Invalid token."}]`
			);
		});

		test('valid id', async () => {
			const db = await setupProtocols(
				{ id: 'not.kobo' },

				{
					id: 'with.kobo',
					remote: {
						kobocollect: {
							form: 'https://kf.kobotoolbox.org/#/forms/a3kVqAFEJwnHFcFc7PpWj4/summary',
							title: 'Static title',
							thumbnails: [''],
						},
					},
				}
			);
			const acc = await getAccount();
			const prot = DB.Schemas.Protocol.assert(await db.get('Protocol', 'with.kobo'));

			expect(acc.session(prot, MOCK_SESSION_REMOTEID)).resolves.toMatchInlineSnapshot();
		});
	});
});
