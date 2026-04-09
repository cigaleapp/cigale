import 'fake-indexeddb/auto';
import 'urlpattern-polyfill';

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import {
	handlers as kobotoolboxApiMockHandlers,
	MOCK_SESSION_REMOTEID,
	MOCK_SESSION_REMOTEID_NOTFOUND_DATA_ID,
	MOCK_TOKEN,
} from '$e2e/fixtures/http/kobotoolbox/handlers.js';
import * as DB from '$lib/database.js';
import { openDatabase } from '$lib/idb.svelte.js';

import Provider from './kobotoolbox.js';

const kobotoolboxApiMock = setupServer(...kobotoolboxApiMockHandlers);

beforeAll(() => {
	kobotoolboxApiMock.listen();
});

beforeEach(() => {
	vi.setSystemTime('2026-04-09T09:09:17.500Z');
});

afterEach(() => {
	kobotoolboxApiMock.resetHandlers();
});

afterAll(() => {
	kobotoolboxApiMock.close();
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
				// @ts-expect-error type is purposely wrong
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
		await expect(
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
		await expect(
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
			await expect(
				acc.session(prot, MOCK_SESSION_REMOTEID())
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

			await expect(
				acc.session(prot, MOCK_SESSION_REMOTEID(MOCK_SESSION_REMOTEID_NOTFOUND_DATA_ID))
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`[Error: Impossible de se connecter à KoboToolbox: {"detail":"Not found."}]`
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

			await expect(acc.session(prot, MOCK_SESSION_REMOTEID())).resolves
				.toMatchInlineSnapshot(`
				{
				  "createdAt": "2026-03-28T13:55:19.000Z",
				  "description": "Créée sur KoboToolbox. Voir https://ee.kobotoolbox.org/view/103e4931120464df0cebb60b35df43b6?instance_id=c2983a5e-fd4c-4032-9b07-50d3e0b8db5f&return_url=false",
				  "fullscreenClassifier": {
				    "layout": "top-bottom",
				  },
				  "group": {
				    "global": {
				      "field": "none",
				      "tolerances": {
				        "dates": "day",
				        "decimal": "unit",
				      },
				    },
				  },
				  "inferenceModels": {},
				  "metadata": {},
				  "name": "Static title",
				  "openedAt": "2026-04-09T09:09:17.500Z",
				  "protocol": "with.kobo",
				  "remoteId": "/api/v2/assets/a3kVqAFEJwnHFcFc7PpWj4/data/709547383/",
				  "sort": {
				    "global": {
				      "direction": "asc",
				      "field": "name",
				    },
				  },
				}
			`);
		});
	});
});
