import type * as DB from '$lib/database.js';

import { Type, type } from 'arktype';
import { KoboClient } from 'kobo-sdk';

import { URLString } from './schemas/common.js';

interface Account {
	logoURL: URL;
	login(): Promise<{ username: string; displayName: string; avatarURL: URL; profileURL: URL }>;
	logout(): Promise<void>;
	loggedIn: boolean;
	upload(session: DB.Session): Promise<void>;
}

export class KoboToolbox implements Account {
	#token: string | undefined;
	#formURL: URL;
	#sdk: KoboClient | undefined;

	logoURL = new URL('https://avatars.githubusercontent.com/u/5543677?s=280&v=4');

	static ServerDomain = type.enumerated('kf.kobotoolbox.org', 'eu.kobotoolbox.org');

	constructor(formUrl: URL) {
		if (!formUrl.hash.startsWith('#/forms/'))
			throw new Error(`Invalid form URL '${formUrl}': must contain #/forms/...`);
		this.#formURL = formUrl;
	}

	get domain(): typeof KoboToolbox.ServerDomain.infer {
		return KoboToolbox.ServerDomain.assert(this.#formURL.hostname);
	}

	get v2domain(): string {
		return this.domain;
	}

	get v1domain(): string {
		switch (this.domain) {
			case 'eu.kobotoolbox.org':
				return 'kc-eu.kobotoolbox.org';
			case 'kf.kobotoolbox.org':
				return 'kc.kobotoolbox.org';
		}
	}

	get projectAssetUid(): string {
		return this.#formURL.hash.split('/').at(2) ?? '';
	}

	get tokenURL(): URL {
		return new URL('/token/', 'https://' + this.domain);
	}

	set token(token: string) {
		this.#token = token;
	}

	async login() {
		if (!this.#token) throw new Error('Token not set');

		const me = await this.fetch('GET', 'v2', '/me/', KoboToolbox.MeResponse);

		this.#sdk = new KoboClient({
			urlv1: `https://${this.v1domain}`,
			urlv2: `https://${this.v2domain}`,
			token: this.#token,
		});

		return {
			username: me.username,
			displayName:
				(me.first_name || me.last_name
					? `${me.first_name} ${me.last_name}`
					: me.extra_details.name) || me.username,
			avatarURL: me.gravatar,
			profileURL: me.projects_url,
		};
	}

	async logout() {
		this.#token = undefined;
	}

	async upload(session: DB.Session) {
		const project = await this.fetch(
			'GET',
			'v2',
			`/api/v2/assets/${this.projectAssetUid}/`,
			KoboToolbox.ProjectResponse
		);

		const enketoId = project.deployment__links.url.pathname.split('/')[0];
	}

	async fetch<Response extends Type>(
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		version: 'v1' | 'v2',
		path: string,
		responseSchema: Response
	) {
		const response = await fetch(
			new URL(path, version === 'v1' ? this.v1domain : this.v2domain),
			{
				method,
				headers: {
					Accept: 'application/json',
					Authorization: `Token ${this.#token}`,
				},
			}
		);

		if (!response.ok)
			throw new Error('Impossible de se connecter à KoboToolbox: ' + (await response.text()));

		return responseSchema.assert(await response.json());
	}

	get loggedIn() {
		return Boolean(this.#token);
	}

	static ProjectResponse = type({
		name: 'string',
		uid: 'string',
		deployment__links: {
			url: 'string.url.parse',
		},
		deployment__active: 'boolean',
		settings: {
			description: 'string',
		},
		content: {
			schema: type.enumerated('1'),
			survey: type({
				name: 'string',
				type: type.enumerated('start', 'end', 'select_one'),
				required: 'boolean',
				$xpath: 'string',
				$kuid: 'string',
				'label?': 'string[]',
				$autoname: 'string',
				'select_list_from_name?': 'string',
			}).array(),
			choices: type({
				name: 'string',
				$kuid: 'string',
				label: 'string[]',
				list_name: 'string',
				$autovalue: 'string',
			}).array(),
		},
		effective_permissions: type({
			codename: type.enumerated(
				'change_asset',
				'delete_asset',
				'change_submissions',
				'validate_submissions',
				'add_submissions',
				'view_submissions',
				'manage_asset',
				'view_asset',
				'delete_submissions'
			),
		}).array(),
	});

	static MeResponse = type({
		username: 'string',
		first_name: 'string',
		last_name: 'string',
		email: 'string',
		server_time: 'string.date.iso.parse',
		date_joined: 'string.date.iso.parse',
		projects_url: 'string.url.parse',
		gravatar: 'string.url.parse',
		last_login: 'string.date.iso.parse',
		extra_details: {
			name: 'string',
			sector: 'string',
			country: '3 <= string <= 3',
			organization: 'string',
			last_ui_language: '2 <= string <= 2',
			organization_type: 'string',
			organization_website: 'string',
			newsletter_subscription: 'boolean',
			require_auth: 'boolean',
		},
		git_rev: 'boolean',
		social_accounts: 'Array',
		validated_password: 'boolean',
		accepted_tos: 'boolean',
		organization: {
			url: 'string.url.parse',
			name: 'string',
			uid: 'string',
		},
		extra_details__uid: 'string',
	});
}
