import 'fake-indexeddb/auto';
import 'urlpattern-polyfill';
import 'opfs-mock';

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

// Adjust this import path to wherever handlers.ts actually lives in the repo
// (mirroring the kobotoolbox fixtures at $e2e/fixtures/http/kobotoolbox/handlers.js).
import {
	handlers as ecosignalApiMockHandlers,
	MOCK_CREDS,
	MOCK_DOMAIN,
	mockstate,
} from '$e2e/fixtures/http/ecosignal/handlers.js';
import * as DB from '$lib/database.js';
import { openDatabase } from '$lib/idb.svelte.js';

import Ecosignal from './ecosignal.js';

const ecosignalApiMock = setupServer(...ecosignalApiMockHandlers);

beforeAll(() => {
	ecosignalApiMock.listen();
});

afterEach(() => {
	ecosignalApiMock.resetHandlers();
	mockstate.reset();
});

afterAll(() => {
	ecosignalApiMock.close();
});

function createProvider(overrides: Partial<Record<'username' | 'password', string>> = {}) {
	return new Ecosignal(undefined!, {
		domain: MOCK_DOMAIN,
		username: MOCK_CREDS.username,
		password: MOCK_CREDS.password,
		userId: 1,
		...overrides,
	});
}

test('.compatibleWith', () => {
	expect(Ecosignal.compatibleWith({ remote: { ecosignal: {} } } as never)).toBe(true);
	expect(Ecosignal.compatibleWith({ remote: {} } as never)).toBe(false);
	expect(Ecosignal.compatibleWith(undefined)).toBe(false);
});

describe('#sessionPage', () => {
	// Pure: no network or db access, so no msw/mockstate/fake-indexeddb needed.
	// resolveMetadataImportBare('crop', 'with.ecosignal') → 'with.ecosignal__crop'
	// when the protocol has no importedMetadata, per namespacing.ts.

	test('builds the dashboard URL for a linked session', () => {
		const provider = createProvider();
		const protocol = {
			id: 'with.ecosignal',
			remote: { ecosignal: { domains: MOCK_DOMAIN, project: 7, crop: 'crop' } },
		} as never;
		const session = { remoteId: '/api/v1/collections/42' } as never;

		expect(provider.sessionPage(protocol, session)?.href).toBe(
			`${MOCK_DOMAIN}/dashboard/7?tab=media&collection=42`
		);
	});

	test('throws when the protocol has no ecosignal remote (and the session is linked)', () => {
		const provider = createProvider();
		const protocol = { id: 'without.ecosignal' } as never;
		const session = { remoteId: '/api/v1/collections/42' } as never;

		expect(() => provider.sessionPage(protocol, session)).toThrowError(
			/ne supporte pas les sessions EcoSignal/
		);
	});

	test('returns undefined when the session has no remoteId', () => {
		const provider = createProvider();
		const protocol = {
			id: 'with.ecosignal',
			remote: { ecosignal: { domains: MOCK_DOMAIN, project: 7, crop: 'crop' } },
		} as never;

		expect(provider.sessionPage(protocol, { remoteId: undefined } as never)).toBeUndefined();
	});
});

describe('.checkAuth', () => {
	test('valid', async () => {
		expect(
			await Ecosignal.checkAuth({ server: MOCK_DOMAIN, password: MOCK_CREDS })
		).toBeUndefined();
	});

	test('invalid credentials', async () => {
		await expect(
			Ecosignal.checkAuth({
				server: MOCK_DOMAIN,
				password: { username: MOCK_CREDS.username, password: 'wrong-password' },
			})
		).rejects.toThrowError(/Impossible de s'identifier/);
	});

	test('no credentials given', async () => {
		expect(await Ecosignal.checkAuth({ server: MOCK_DOMAIN, password: undefined })).toBe(
			'Identifiants non fournis'
		);
	});
});

describe('.fromDatabase', () => {
	test('valid account', () => {
		const account = Ecosignal.fromDatabase(undefined!, {
			type: 'ecosignal',
			password: MOCK_CREDS.password,
			username: MOCK_CREDS.username,
			displayName: 'Big Yahu',
			avatarURL: new URL('https://example.com/test.png'),
			profileURL: new URL(`${MOCK_DOMAIN}/big_yahu`),
			userId: 42,
			domain: MOCK_DOMAIN,
			color: '#c0ffee',
			id: 'quoicoubeh',
		});

		expect(account).toBeInstanceOf(Ecosignal);
		expect(account).toMatchObject({
			username: MOCK_CREDS.username,
			displayName: 'Big Yahu',
			userId: 42,
			domain: MOCK_DOMAIN,
			color: '#c0ffee',
			id: 'quoicoubeh',
		});
	});

	test('invalid type', () => {
		expect(() =>
			Ecosignal.fromDatabase(undefined!, {
				// @ts-expect-error type is purposely wrong
				type: 'kobotoolbox',
				token: 'irrelevant',
				username: MOCK_CREDS.username,
				displayName: 'Big Yahu',
				avatarURL: new URL('https://example.com/test.png'),
				profileURL: new URL(`${MOCK_DOMAIN}/big_yahu`),
				id: 'quoicoubeh',
			})
		).toThrowError('Invalid account type');
	});
});

describe('.login', () => {
	test('valid account', async () => {
		const db = await openDatabase();

		const account = await Ecosignal.login(db, { server: MOCK_DOMAIN, password: MOCK_CREDS });

		expect(account).toMatchObject({
			type: 'ecosignal',
			username: MOCK_CREDS.username,
			displayName: 'Hello World',
			userId: 1,
			domain: MOCK_DOMAIN,
			color: '#c0ffee',
		});
	});

	test('invalid credentials', async () => {
		const db = await openDatabase();

		await expect(
			Ecosignal.login(db, {
				server: MOCK_DOMAIN,
				password: { username: MOCK_CREDS.username, password: 'wrong-password' },
			})
		).rejects.toThrowError(/Impossible de s'identifier/);
	});

	test('no login data provided', async () => {
		const db = await openDatabase();

		await expect(
			Ecosignal.login(db, { server: MOCK_DOMAIN, password: undefined })
		).rejects.toThrowError('No login data provided');
	});
});

test('.logout', async () => {
	// handlers.ts registers no DELETE handler for auth-tokens/current, so the
	// request falls through to its generic 404 catch-all and logout() rejects.
	// Update this once a matching handler exists.
	const provider = createProvider();
	await expect(provider.logout()).rejects.toThrowError(/Impossible de se déconnecter/);
});

describe('#fetch / #json (token lifecycle)', () => {
	test('authenticates lazily and attaches a bearer token to protected routes', async () => {
		const provider = createProvider();

		const response = await provider.fetch('GET', 'current-user');

		expect(response.ok).toBe(true);
		expect((await response.json()).data.username).toBe(MOCK_CREDS.username);
	});

	test('reuses the cached token instead of re-authenticating on every call', async () => {
		let authRequests = 0;
		const trackAuthRequests = ({ request }: { request: Request }) => {
			if (new URL(request.url).pathname.endsWith('/auth-tokens')) authRequests++;
		};

		ecosignalApiMock.events.on('request:start', trackAuthRequests);

		try {
			const provider = createProvider();
			await provider.fetch('GET', 'current-user');
			await provider.fetch('GET', 'current-user');

			expect(authRequests).toBe(1);
		} finally {
			ecosignalApiMock.events.removeListener('request:start', trackAuthRequests);
		}
	});

	test('rejects immediately once the abort signal has already fired', async () => {
		const provider = createProvider();
		const controller = new AbortController();

		provider.armAbort(controller.signal);
		controller.abort();

		await expect(provider.fetch('GET', 'current-user')).rejects.toThrow();
	});

	test('json() parses a well-formed response against the given schema', async () => {
		const { data } = await createProvider().json(
			'GET',
			'v1',
			'current-user',
			Ecosignal.MeResponse
		);

		expect(data.username).toBe(MOCK_CREDS.username);
		expect(data.color).toBe('#c0ffee');
	});

	test('json() throws a French error on an API error payload', async () => {
		// /collections/999 doesn't exist in mockstate, and the mocked 404 body
		// lacks the `detail` field required by Provider.ResponseError, so the
		// generic "impossible de communiquer" branch fires.
		await expect(
			createProvider().json('GET', 'v1', 'collections/999', Ecosignal.CollectionResponse)
		).rejects.toThrowError(/Impossible de communiquer avec EcoSignal/);
	});

	test('json() throws a validation error when the response does not match the schema', async () => {
		await expect(
			createProvider().json('GET', 'v1', 'current-user', Ecosignal.CollectionResponse)
		).rejects.toThrowError(/Données invalides envoyées par EcoSignal/);
	});

	test('json() creates a collection and returns its id', async () => {
		const CollectionCreateResponse = Ecosignal.ResponseBase({
			collection_id: 'number.integer',
		});

		const { data } = await createProvider().json(
			'POST',
			'v1',
			'collections',
			CollectionCreateResponse,
			{},
			Ecosignal.CollectionCreatePayload,
			{ name: 'My Collection' }
		);

		expect(data.collection_id).toBe(1);
		expect(mockstate.repository.collections).toMatchObject([{ name: 'My Collection' }]);
	});
});

describe('db-dependent', () => {
	/** @param protocols Minimal protocol fixtures; `remote.ecosignal` follows the
	 * exact schema in protocols.js (domains, project, crop are required; sites,
	 * label, confirmedStatus are optional/defaulted). */
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
		const acc = DB.Schemas.Account.and({ type: '"ecosignal"' }).assert(
			await db.get('Account', id)
		);
		return Ecosignal.fromDatabase(db, acc);
	}

	beforeEach(async () => {
		const db = await openDatabase();
		await db.clear('Protocol');
		await db.clear('Metadata');
		await db.clear('Account');
		await db.add('Account', {
			id: '_default',
			username: MOCK_CREDS.username,
			displayName: 'Hello World',
			avatarURL: undefined,
			profileURL: undefined,
			type: 'ecosignal',
			password: MOCK_CREDS.password,
			domain: MOCK_DOMAIN,
			userId: 1,
			color: '#c0ffee',
		});
	});

	describe('.servers', () => {
		// NB: Provider.servers() also pushes a "Local dev" entry when
		// isLocalhost() is true; this asserts a subset rather than the full list
		// so it stays correct regardless of that check's result in this environment.
		test('collects declared ecosignal domains from every protocol', async () => {
			const db = await setupProtocols(
				{ id: 'no-remote' },
				{
					id: 'single-domain',
					remote: { ecosignal: { domains: MOCK_DOMAIN, project: 1, crop: 'crop' } },
				},
				{
					id: 'named-domains',
					remote: {
						ecosignal: {
							domains: { Production: 'https://prod.ecosignal.example.com' },
							project: 2,
							crop: 'crop',
						},
					},
				}
			);

			const servers = await Ecosignal.servers(db);

			expect(servers).toEqual(
				expect.arrayContaining([
					{ domain: MOCK_DOMAIN },
					{ name: 'Production', domain: 'https://prod.ecosignal.example.com' },
				])
			);
		});
	});

	describe('.sessions', () => {
		test('with no ecosignal protocols', async () => {
			await setupProtocols({ id: 'without.ecosignal' });
			const account = await getAccount();

			const iterations = await Array.fromAsync(account.sessions());
			expect(iterations).toMatchObject([]);
		});

		test('lists collections as sessions', async () => {
			await setupProtocols(
				{ id: 'without.ecosignal' },
				{
					id: 'with.ecosignal',
					remote: {
						ecosignal: {
							domains: MOCK_DOMAIN,
							project: 1,
							crop: 'crop',
						},
					},
				}
			);

			mockstate.repository.collections.push({
				collection_id: 42,
				uuid: 'collection-uuid-1',
				name: 'Test collection',
				description: 'A description',
				external_media_url: '',
				project_url: '',
				creator_id: 1,
				creator_name: 'Hello World',
				creation_date: '2026-03-01T10:00:00Z',
				project_ids: [1],
			});

			mockstate.repository.medias.push({
				media_id: 501,
				filename: 'photo1.jpg',
				name: 'photo1.jpg',
				date_time: '2026-03-01T09:00:00Z',
				creation_date: '2026-03-01T09:05:00Z',
				uuid: 'media-uuid-1',
				media_url: '/api/v1/media/501/content',
				previews: [],
				note: null,
				labels: [],
				size_b: 12345,
			});

			const account = await getAccount();
			const iterations = await Array.fromAsync(account.sessions());

			expect(iterations).toMatchObject([
				{ total: 1 },
				{
					id: '/api/v1/collections/42',
					name: 'Test collection',
					protocol: 'with.ecosignal',
					submittedBy: 'Hello World',
					mediaCount: 1,
					nextCursor: `${MOCK_DOMAIN}/api/v1/collections/42?page=1`,
				},
			]);

			// thumbnails are URL instances (ToFullURL), compare by href
			expect(iterations[1].thumbnails.map((u: URL) => u.href)).toEqual([
				`${MOCK_DOMAIN}/api/v1/media/501/content`,
			]);
			expect(iterations[1].page.href).toBe(
				`${MOCK_DOMAIN}/dashboard/1?tab=media&collection=42`
			);
		});
	});

	describe('.upload', () => {
		// upload() takes `protocol`/`session` directly as parameters (it doesn't
		// re-fetch or re-validate them from the db), so plain fixture objects are
		// enough here — no need to write them into fake-indexeddb first.
		const protocolNoSites = {
			id: 'with.ecosignal',
			name: 'Test protocol',
			sessionMetadata: [],
			remote: { ecosignal: { domains: MOCK_DOMAIN, project: 1, crop: 'crop' } },
		} as never;

		function makeSession(
			overrides: Partial<{ id: string; remoteId: string | undefined }> = {}
		) {
			return {
				id: 'session-1',
				remoteId: undefined,
				name: 'My session',
				description: 'A test session',
				metadata: {},
				...overrides,
			} as never;
		}

		test('creates a new collection when the session has no remoteId yet', async () => {
			const account = await getAccount();

			const events = await Array.fromAsync(account.upload(protocolNoSites, makeSession()));

			expect(events).toContainEqual(
				expect.objectContaining({
					message: 'session-id',
					remoteId: '/api/v1/collections/1',
				})
			);
			expect(mockstate.repository.collections).toHaveLength(1);
			expect(mockstate.repository.collections[0]).toMatchObject({ name: 'My session' });
			expect(mockstate.repository.collections[0].description).toContain('A test session');
		});

		// This one currently fails against handlers.ts: mockstate.update() never
		// returns a response (no `return r(...)` at the end, unlike `.one()`), so
		// per the http.all(u('/**'), …) fallthrough pattern used elsewhere in that
		// file, PATCH /collections/:id falls through to the generic 404 handler.
		// #setCollection()'s `this.json('PATCH', …)` then throws on that 404.
		// This documents the current (likely unintended) behaviour; once
		// mockstate.update() is fixed to actually apply the patch and return the
		// updated record, this should be rewritten to assert a successful update.
		test('currently fails to update an existing collection (handlers.ts bug)', async () => {
			mockstate.repository.collections.push({
				collection_id: 7,
				name: 'Old name',
				creator_id: 1,
				creator_name: 'Hello World',
				creation_date: '2026-03-01T10:00:00Z',
				project_ids: [1],
				description: 'Old description',
			});

			const account = await getAccount();
			const session = makeSession({ remoteId: '/api/v1/collections/7' });

			await expect(Array.fromAsync(account.upload(protocolNoSites, session))).rejects.toThrow(
				/Impossible de communiquer avec EcoSignal/
			);
		});

		test('creates a missing site and links it to the collection', async () => {
			const protocolWithSites = {
				id: 'with.ecosignal',
				name: 'Test protocol',
				sessionMetadata: [],
				remote: {
					ecosignal: {
						domains: MOCK_DOMAIN,
						project: 1,
						crop: 'crop',
						sites: {
							create: true,
							protect: false,
							name: { metadata: 'siteName', fallback: 'My Site' },
							location: { fallback: 'FRA' },
						},
					},
				},
			} as never;

			const account = await getAccount();

			await Array.fromAsync(account.upload(protocolWithSites, makeSession()));

			expect(mockstate.repository.sites).toHaveLength(1);
			expect(mockstate.repository.sites[0]).toMatchObject({
				name: 'My Site',
				location_method: 'administrative',
				gadm0_gid: 'FRA',
				collection_ids: [1],
			});
		});
	});

	describe('.download / .sync', () => {
		// These two exercise createBytes() ($lib/storage/utils.js) and
		// imageFileId() ($lib/images.js), whose implementations weren't available
		// when writing this — the assertions below assume they behave as a
		// straightforward "store these bytes, give me an id back" pair. If either
		// touches browser-only storage (OPFS, etc.) instead of something
		// fake-indexeddb/Node can handle, these two tests will need adjusting.
		// image_width/image_height are set explicitly and previews are left empty
		// specifically to avoid calling createImageBitmap(), which isn't
		// available in a plain Node test environment.

		function seedDownloadableCollection() {
			mockstate.repository.collections.push({
				collection_id: 42,
				name: 'Downloaded collection',
				creator_id: 1,
				creator_name: 'Hello World',
				creation_date: '2026-03-01T10:00:00Z',
				project_ids: [1],
				description: 'A description',
			});

			mockstate.repository.medias.push({
				media_id: 501,
				filename: 'photo1.jpg',
				name: 'photo1.jpg',
				note: null,
				date_time: '2026-03-01T09:00:00Z',
				uuid: 'media-uuid-1',
				media_type: 'photo',
				is_metadata: false,
				size_b: 4,
				md5_hash: null,
				uploader_id: null,
				uploader_name: null,
				creator_id: null,
				creator_name: null,
				site_id: null,
				site_name: null,
				sensor_id: null,
				sensor_name: null,
				license_id: null,
				license_name: null,
				creation_date: '2026-03-01T09:05:00Z',
				collection_id: 42,
				collection_name: 'Downloaded collection',
				project_id: 1,
				project_name: 'Demo project',
				audio_url: null,
				media_url: '/api/v1/media/501/content',
				previews: [],
				photo_setting: { exposure_ms: null, aperture: null, iso: null },
				labels: [],
				image_width: 800,
				image_height: 600,
			});

			mockstate.mediaBlobs.set(
				501,
				new File([new Uint8Array([1, 2, 3, 4])], 'photo1.jpg', { type: 'image/jpeg' })
			);
		}

		test('.download downloads a single photo into a new local session', async () => {
			await setupProtocols(
				{ id: 'not.ecosignal' },
				{
					id: 'with.ecosignal',
					remote: { ecosignal: { domains: MOCK_DOMAIN, project: 1, crop: 'crop' } },
				}
			);
			seedDownloadableCollection();

			const db = await openDatabase();
			const protocol = DB.Schemas.Protocol.assert(await db.get('Protocol', 'with.ecosignal'));
			const account = await getAccount();

			let databaseId: string | undefined;
			for await (const event of account.download(
				protocol,
				'/api/v1/collections/42' as never
			)) {
				if (event.message === 'session-id') databaseId = event.databaseId;
			}

			expect(databaseId).toBeTruthy();

			const session = await db.get('Session', databaseId!);
			expect(session).toMatchObject({
				name: 'Downloaded collection',
				protocol: 'with.ecosignal',
				remoteId: '/api/v1/collections/42',
			});

			const images = await db.getAllFromIndex('Image', 'sessionId', databaseId!);
			expect(images).toHaveLength(1);
			expect(images[0]).toMatchObject({ filename: 'photo1.jpg' });
		});

		test('.sync replaces stale local data for an already-downloaded session', async () => {
			await setupProtocols({
				id: 'with.ecosignal',
				remote: { ecosignal: { domains: MOCK_DOMAIN, project: 1, crop: 'crop' } },
			});
			seedDownloadableCollection();

			const db = await openDatabase();
			const protocol = DB.Schemas.Protocol.assert(await db.get('Protocol', 'with.ecosignal'));
			const account = await getAccount();

			let databaseId: string | undefined;
			for await (const event of account.download(
				protocol,
				'/api/v1/collections/42' as never
			)) {
				if (event.message === 'session-id') databaseId = event.databaseId;
			}

			// Simulate stale local data left over from a previous, different sync.
			await db.add('Image', {
				id: 'stale-image',
				addedAt: new Date().toISOString(),
				sessionId: databaseId!,
				fileId: 'stale-file',
				filename: 'stale.jpg',
				dimensions: { width: 1, height: 1 },
				contentType: 'image/jpeg',
				boundingBoxesAnalyzed: false,
				metadata: {},
			});

			const session = await db.get('Session', databaseId!);
			for await (const _ of account.sync(protocol, session)) {
				// drain
			}

			const images = await db.getAllFromIndex('Image', 'sessionId', databaseId!);
			expect(images.find((i) => i.id === 'stale-image')).toBeUndefined();
			expect(images).toHaveLength(1);
			expect(images[0]).toMatchObject({ filename: 'photo1.jpg' });
		});
	});
});
