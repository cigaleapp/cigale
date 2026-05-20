import type { Account, AuthenticationMethod, LoginData } from './types.js';
import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { SessionRemoteID } from '$lib/schemas/sessions.js';

import * as arctic from 'arctic';
import { ArkErrors, type } from 'arktype';
import { isFuture } from 'date-fns';

import { resolve } from '$lib/paths.js';
import { corsfix } from '$lib/utils.js';

// TODO: needs device flow instead since we do'nt have CORS for token exchange bruh....

const CLIENT_ID =
	// XXX: DONT MERGE
	import.meta.env.cigaleGithubAppClientId || 'Iv23liByvibJlE0bA6t7';
// import.meta.env.cigaleGithubAppClientId ?? 'CIGALE_GITHUB_APP_CLIENT_ID env variable not set';

/**
 * Github does not allow omitting the client_secret in the OAuth flow (even with PKCE), so we purposefully publish a "public" client_secret, and we use PKCE to ensure security.
 * @see https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app#client-secrets
 *
 * This is still better than doing a device flow, see https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app#dont-enable-device-flow-without-reason
 */
const CLIENT_SECRET =
	import.meta.env.cigaleGithubAppPublicClientSecret ||
	// XXX: DONT MERGE
	'6eeb2c8b8d77634cb07affc4650d7640491a19b2';
// 'CIGALE_GITHUB_APP_PUBLIC_CLIENT_SECRET env variable not set';

export default class Provider implements Account {
	static id = 'github' as const;

	static auth = 'oauth' as const satisfies AuthenticationMethod;
	static capabilities = ['report'] as const;
	static displayName = 'GitHub';
	static logoURL = new URL('https://github.githubassets.com/favicons/favicon.svg');

	// XXX: arctic.GitHub has no PKCE support it seems
	#client: arctic.OAuth2Client | undefined = undefined;

	#refreshToken: string;
	#token: string;
	#tokenExpiresAt: Date;
	username: string;
	displayName: string;
	avatarURL: URL | undefined;
	db: DatabaseHandle;
	/** Database ID of the account */
	id: string | undefined;

	get client() {
		this.#client ??= Provider.#getClient();
		return this.#client;
	}

	static authorizeURL(): URL {
		const state = arctic.generateState();
		const codeVerifier = arctic.generateCodeVerifier();

		localStorage.setItem('github_oauth_state', state);
		localStorage.setItem('github_oauth_code_verifier', codeVerifier);

		const url = Provider.#getClient().createAuthorizationURLWithPKCE(
			'https://github.com/login/oauth/authorize',
			state,
			arctic.CodeChallengeMethod.S256,
			codeVerifier,
			['read:user', 'user:email', 'repo']
		);

		// const url = Provider.#getClient().createAuthorizationURL(state, [
		// 	'read:user',
		// 	'user:email',
		// 	'repo',
		// ]);

		return url;
	}

	constructor(
		db: DatabaseHandle,
		{
			token,
			tokenExpiresAt,
			refreshToken,
			username,
			displayName,
			avatarURL,
			id,
		}: {
			token: string;
			tokenExpiresAt: Date;
			refreshToken: string;
			username?: string;
			displayName?: string;
			avatarURL?: URL | undefined;
			id?: string | undefined;
		}
	) {
		this.#token = token;
		this.#tokenExpiresAt = tokenExpiresAt;
		this.#refreshToken = refreshToken;

		this.username = username ?? '';
		this.displayName = displayName ?? '';
		this.avatarURL = avatarURL;
		this.db = db;
		this.id = id;
	}

	thumbnail(url: URL): Promise<URL> {
		throw new Error('Method not implemented.');
	}

	toJSON() {
		return {
			token: this.#token,
			tokenExpiresAt: this.#tokenExpiresAt.toISOString(),
			refreshToken: this.#refreshToken,
			username: this.username,
			displayName: this.displayName,
			db: this.db,
			id: this.id,
		};
	}

	static async checkAuth({ token }: LoginData) {
		if (!token) return false;
		const response = await Provider.#request(token, '/user');
		return response.ok;
	}

	static fromDatabase(
		db: DatabaseHandle,
		account: Pick<
			Extract<DB.Account, { type: 'github' }>,
			| 'token'
			| 'tokenExpiresAt'
			| 'refreshToken'
			| 'username'
			| 'displayName'
			| 'avatarURL'
			| 'id'
			| 'type'
		>
	) {
		if (account.type !== 'github') {
			throw new Error(`Invalid account type: ${account.type}`);
		}

		return new Provider(db, {
			token: account.token,
			tokenExpiresAt: new Date(account.tokenExpiresAt),
			refreshToken: account.refreshToken,
			username: account.username,
			displayName: account.displayName,
			avatarURL: account.avatarURL ? new URL(account.avatarURL) : undefined,
			id: account.id,
		});
	}

	static async login(
		_db: DatabaseHandle,
		{ oauth }: LoginData
	): Promise<
		Omit<Extract<(typeof DB.Schemas.Account)['inferIn'], { type: 'github' }>, 'addedAt'>
	> {
		const client = Provider.#getClient();
		if (!oauth) throw new Error('OAuth data is required for GitHub login');

		const { authorizationCode, state, codeVerifier } = oauth;

		const validState = localStorage.getItem('github_oauth_state');
		if (state !== validState) {
			throw new Error('Invalid state parameter');
		}

		// const tokens = await client.validateAuthorizationCode(
		// 	// 'https://github.com/login/oauth/access_token',
		// 	authorizationCode,
		// 	// codeVerifier
		// );

		const tokens = await fetch(corsfix('https://github.com/login/oauth/access_token'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
				Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
			},
			body: new URLSearchParams({
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
				code: authorizationCode,
				code_verifier: codeVerifier,
			}),
		}).then((res) => res.json());

		const response = await Provider.#request(tokens.accessToken(), '/user');
		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
		}

		const user = type({
			login: 'string',
			avatar_url: 'string.url',
			name: 'string',
			html_url: 'string.url',
			id: ['number', '=>', String],
		})(await response.json());

		if (user instanceof ArkErrors) {
			throw user;
		}

		localStorage.removeItem('github_oauth_state');
		localStorage.removeItem('github_oauth_code_verifier');

		return {
			type: 'github',
			id: user.id,
			token: tokens.accessToken(),
			tokenExpiresAt: tokens.accessTokenExpiresAt().toISOString(),
			refreshToken: tokens.refreshToken(),
			username: user.login,
			displayName: user.name,
			avatarURL: user.avatar_url,
			profileURL: user.html_url,
		};
	}

	async logout() {
		this.#tokenExpiresAt = new Date();
		await fetch(`https://api.github.com/applications/${CLIENT_ID}/token`, {
			method: 'DELETE',
			headers: {
				Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
			},
			body: JSON.stringify({
				access_token: this.#token,
			}),
		});
	}

	async *sessions() {
		throw new Error('Not implemented');
	}

	async session(): Promise<Omit<(typeof DB.Schemas.Session)['inferIn'], 'account'>> {
		throw new Error('Not implemented');
	}

	async items() {
		return {
			observations: [],
			images: [],
			files: [],
		};
	}

	async *files() {
		throw new Error('Not implemented');
	}

	async upload(): Promise<{ remoteID?: SessionRemoteID; page?: URL }> {
		throw new Error('Not implemented');
	}

	async withToken(closure: (token: string) => Promise<void>) {
		if (isFuture(this.#tokenExpiresAt)) {
			const tokens = await this.client.refreshAccessToken(
				// 'https://github.com/login/oauth/access_token',
				this.#refreshToken
				// ['repo', 'read:user', 'user:email']
			);

			this.#token = tokens.accessToken();
			this.#tokenExpiresAt = tokens.accessTokenExpiresAt();
			this.#refreshToken = tokens.refreshToken();
		}

		await closure(this.#token);
	}

	async #json(url: `/${string}`, options?: Omit<RequestInit, 'headers'>) {
		const response = await this.#req(url, options);
		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
		}
		return response.json();
	}

	async #req(url: `/${string}`, options?: Omit<RequestInit, 'headers'>) {
		return Provider.#request(this.#token, url, options);
	}

	static async #request(
		token: string,
		url: `/${string}`,
		options?: Omit<RequestInit, 'headers'>
	) {
		return fetch(`https://api.github.com${url}`, {
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	}

	static #getClient() {
		return new arctic.OAuth2Client(
			CLIENT_ID,
			CLIENT_SECRET,
			new URL(resolve('/accounts/github/callback/'), window.location.href).toString()
		);
	}
}
