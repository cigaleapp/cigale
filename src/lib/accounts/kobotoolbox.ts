import type { DatabaseHandle } from '../idb.svelte.js';
import type { Account, AuthenticationMethod, LoginData } from '$lib/accounts/types.js';
import type * as DB from '$lib/database.js';
import type { MetadataRecordValue, RuntimeValue } from '$lib/schemas/metadata.js';

import { Type, type } from 'arktype';
import * as date from 'date-fns';

import { Schemas } from '$lib/database.js';
import { resolveMetadataImport } from '$lib/metadata/imports.js';
import { protocolMetadataValues } from '$lib/metadata/namespacing.js';
import { serializeMetadataValue } from '$lib/metadata/serializing.js';
import { metadataOptionsKeyRange } from '$lib/metadata/storage.js';
import { MIMEType, NamespacedMetadataID } from '$lib/schemas/common.js';
import { removeNamespaceFromMetadataId, splitMetadataId } from '$lib/schemas/metadata.js';
import { SessionRemoteID } from '$lib/schemas/sessions.js';
import { ensureArray, mapValues } from '$lib/utils.js';

export default class Provider implements Account {
	static id = 'kobotoolbox' as const;
	static servers = [
		{ domain: 'kf.kobotoolbox.org', name: 'Global' },
		{ domain: 'eu.kobotoolbox.org', name: 'Europe' },
	] as const;
	static auth = 'token' as const satisfies AuthenticationMethod;
	static capabilities = ['sessions'] as const;
	static displayName = 'KoboToolbox';
	static logoURL = new URL('https://avatars.githubusercontent.com/u/5543677?s=280&v=4');

	#token: string;
	username: string;
	displayName: string;
	avatarURL: URL | undefined;
	domain: (typeof Provider.servers)[number]['domain'];
	db: DatabaseHandle;
	/** Database ID of the account */
	id: string | undefined;

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

	static tokenPageURL(server: string): URL {
		return new URL('/token/', 'https://' + server);
	}

	static domainOfProfileURL(
		profileURL: string | URL
	): (typeof Provider.servers)[number]['domain'] {
		switch (new URL(profileURL).hostname) {
			case 'kc.kobotoolbox.org':
				return 'kf.kobotoolbox.org';
			case 'kc-eu.kobotoolbox.org':
				return 'eu.kobotoolbox.org';
			default:
				throw new Error(`Profile is on a unknown KoboToolbox server: ${profileURL}`);
		}
	}

	#cache: Map<SessionRemoteID, (typeof Provider.ProjectDataResponse)['infer']> = new Map();

	constructor(
		db: DatabaseHandle,
		{
			token,
			username,
			displayName,
			avatarURL,
			domain,
			id,
		}: {
			token: string;
			domain: (typeof Provider.servers)[number]['domain'];
			username?: string;
			displayName?: string;
			avatarURL?: URL | undefined;
			id?: string | undefined;
		}
	) {
		this.#token = token;
		this.username = username ?? '';
		this.domain = domain;
		this.displayName = displayName ?? '';
		this.avatarURL = avatarURL;
		this.db = db;
		this.id = id;
	}

	static async checkAuth({
		server,
		token,
	}: LoginData<(typeof Provider.servers)[number]['domain']>) {
		if (!token) return 'Token vide';

		const response = await new Provider(undefined!, { token, domain: server }).fetch(
			`https://${server}/me/`
		);

		if (response.ok) return undefined;

		return response.text();
	}

	static fromDatabase(
		db: DatabaseHandle,
		account: Pick<
			DB.Account,
			'token' | 'profileURL' | 'username' | 'type' | 'displayName' | 'avatarURL' | 'id'
		>
	) {
		if (account.type !== 'kobotoolbox') throw new Error('Invalid account type');

		return new Provider(db, {
			token: account.token,
			domain: Provider.domainOfProfileURL(account.profileURL),
			username: account.username,
			displayName: account.displayName,
			avatarURL: account.avatarURL,
			id: account.id,
		});
	}

	static async login(
		db: DatabaseHandle,
		{ token, server }: LoginData<(typeof Provider.servers)[number]['domain']>
	) {
		if (!token) throw new Error('No login data provided');

		const me = await new Provider(db, { domain: server, token }).json(
			'GET',
			'v2',
			'/me/',
			Provider.MeResponse
		);

		// Enforce a 200px thumbnail
		me.gravatar.searchParams.set('s', '200');

		return {
			type: 'kobotoolbox' as const,
			token,
			username: me.username,
			displayName:
				(me.first_name || me.last_name
					? `${me.first_name} ${me.last_name}`
					: me.extra_details.name) || me.username,
			avatarURL: me.gravatar.href,
			profileURL: me.projects_url.href,
		};
	}

	async logout() {}

	async *sessions({ cursor = undefined, limit = 40, mine = false } = {}) {
		const yielded = new Set<string>();
		let total = 0;

		for (const p of await this.db.getAll('Protocol')) {
			const protocol = Schemas.Protocol.assert(p);
			if (!protocol.remote?.kobocollect) continue;

			const assetUid = this.#projectAssetUid(protocol.remote.kobocollect.form);

			const project = await this.json(
				'GET',
				'v2',
				`/api/v2/assets/${assetUid}`,
				Provider.ProjectResponse
			);

			const response = await this.json(
				'GET',
				'v2',
				`/api/v2/assets/${assetUid}/data?${new URLSearchParams({
					limit: limit.toString(),
					offset: cursor ? (new URL(cursor).searchParams.get('offset') ?? '0') : '0',
					query: JSON.stringify({
						_submitted_by: mine ? this.username : undefined,
					}),
					sort: JSON.stringify({
						_submission_time: -1,
					}),
				})}`,
				Provider.PaginatedResponse(Provider.ProjectDataResponse)
			);

			total += response.results.length;
			yield { total };

			for (const result of response.results) {
				const gid = this.#SessionRemoteID(assetUid, result._id);
				this.#cache.set(gid, result);

				const thumbFields = ensureArray(protocol.remote?.kobocollect?.thumbnails ?? []).map(
					(field) =>
						this.#columnByNameOrLabel(project, {
							both: field,
						})
				);

				const thumbs = result._attachments.filter(
					(a) =>
						a.mimetype.startsWith('image/') &&
						thumbFields.some((field) => field?.$xpath === a.question_xpath) &&
						!a.is_deleted
				);

				const metadata = await this.#rowToMetadata(protocol, project, result);

				let name = 'Sans nom';

				try {
					name = protocol.remote.kobocollect.title.render({
						survey: result,
						session: {
							metadata,
							protocolMetadata: protocolMetadataValues('session', protocol, metadata),
						},
					});
				} catch (error) {
					console.error(error);
				}

				if (yielded.has(gid)) continue;

				yielded.add(gid);
				yield {
					id: gid,
					name,
					page: new URL(
						`https://${this.v2domain}/api/v2/assets/${assetUid}/data/${result._id}/enketo/redirect/view`
					),
					protocol: protocol.id,
					submittedAt: result._submission_time,
					submittedBy: result._submitted_by,
					nextCursor: response.next ?? undefined,
					filesCount: result._attachments.length,
					imagesCount: 0,
					thumbnails: thumbs.map((thumb) => thumb.download_small_url),
				};
			}
		}
	}

	async thumbnail(url: URL) {
		return this.fetch(url)
			.then((response) => response.blob())
			.then((blob) => new URL(URL.createObjectURL(blob)));
	}

	async session(protocol: DB.Protocol, id: SessionRemoteID) {
		if (!protocol.remote?.kobocollect)
			throw new Error("This protocol doesn't support KoboToolbox remote sessions");

		const project = await this.#fetchProject(id);
		const row = await this.#fetchData(id);

		const { url: submissionUrl } = await this.json(
			'GET',
			'v2',
			`${id}/enketo/view`,
			type({ url: 'string.url' })
		);

		const metadata = await this.#rowToMetadata(protocol, project, row);
		let name = 'Sans nom';

		console.info(
			'Metadata computed from KoboToolbox fields:',
			mapValues(metadata, ({ value }) => value)
		);

		try {
			name = protocol.remote.kobocollect.title.render({
				survey: row,
				session: {
					metadata,
					protocolMetadata: protocolMetadataValues('session', protocol, metadata),
				},
			});
		} catch (error) {
			console.error(error);
		}

		return {
			remoteId: id,
			protocol: protocol.id,
			name,
			createdAt: row._submission_time.toISOString(),
			description: `Créée sur KoboCollect. Voir ${submissionUrl}`,
			openedAt: new Date().toISOString(),
			metadata: mapValues(metadata, ({ value, ...rest }) => ({
				...rest,
				value: serializeMetadataValue(value),
			})),
			inferenceModels: {},
			group: {
				global: { field: 'none', tolerances: { dates: 'day', decimal: 'unit' } } as const,
			},
			sort: {
				global: { field: 'name', direction: 'asc' } as const,
			},
			fullscreenClassifier: {
				layout: 'top-bottom' as const,
			},
		};
	}

	async items() {
		return {
			observations: [],
			images: [],
			files: [],
		};
	}

	async *files(protocol: DB.Protocol, id: SessionRemoteID) {
		const project = await this.#fetchProject(id);
		const row = await this.#fetchData(id);

		for (const metadataId of protocol.sessionMetadata) {
			const def = await this.db
				.get('Metadata', resolveMetadataImport(protocol, metadataId))
				.then((raw) => (raw ? Schemas.Metadata.assert(raw) : undefined));

			if (!def) continue;
			if (def.type !== 'file') continue;

			const column = this.#columnOfMetadata(project, def);
			if (!column) continue;

			const attachment = this.#findAttachment({ column, attachments: row._attachments });
			if (!attachment) continue;

			const file = await this.fetch(attachment.download_url);
			const bytes = await file.arrayBuffer();

			yield {
				// TODO: support attaching download_url here
				id: this.#compositeFileId(project, row, attachment),
				bytes,
				contentType: attachment.mimetype,
				filename: attachment.media_file_basename,
				size: bytes.byteLength,
				// kobocollect doesn't store it...
				lastModifiedAt: row._submission_time.toISOString(),
			};
		}
	}

	async upload(): Promise<{ remoteID?: SessionRemoteID; page?: URL }> {
		throw new Error('Not implemented');
	}

	#compositeFileId(
		project: (typeof Provider.ProjectResponse)['infer'],
		row: (typeof Provider.ProjectDataResponse)['infer'],
		attachment: (typeof Provider.ProjectDataResponse)['infer']['_attachments'][number]
	) {
		return `${this.domain}__${project.uid}__${row._id}__${attachment.uid}`;
	}

	async #rowToMetadata(
		protocol: DB.Protocol,
		project: (typeof Provider.ProjectResponse)['infer'],
		row: (typeof Provider.ProjectDataResponse)['infer']
	) {
		const metadataValues: Record<
			NamespacedMetadataID,
			(typeof MetadataRecordValue)['inferIn']
		> = {};

		for (const id of protocol.sessionMetadata) {
			const def = await this.db
				.get('Metadata', resolveMetadataImport(protocol, id))
				.then((raw) => (raw ? Schemas.Metadata.assert(raw) : undefined));

			if (!def) continue;

			const column = this.#columnOfMetadata(project, def);
			if (!column) continue;

			const value = column.$xpath in row ? row[column.$xpath]?.toString() : undefined;

			if (!value) continue;

			switch (def.type) {
				case 'enum': {
					const option = await this.#parseEnumCell(def, value);
					if (!option) continue;

					metadataValues[def.id] = { value: option.key, alternatives: {} };
					break;
				}
				case 'file': {
					const file = this.#findAttachment({
						column,
						attachments: row._attachments,
					});

					if (!file) continue;

					metadataValues[def.id] = {
						value: this.#compositeFileId(project, row, file),
						alternatives: {},
					};
					break;
				}
				default: {
					const parsed = this.#parseKobocollectCell(def, value);
					if (parsed === undefined) continue;

					metadataValues[def.id] = {
						value: parsed instanceof Date ? parsed.toISOString() : parsed,
						alternatives: {},
					};
					break;
				}
			}
		}

		return metadataValues;
	}

	async #fetchProject(id: SessionRemoteID) {
		// TODO cache this too
		return this.json(
			'GET',
			'v2',
			`/api/v2/assets/${this.#parseSessionRemoteID(id).assetUid}`,
			Provider.ProjectResponse
		);
	}

	async #fetchData(id: SessionRemoteID) {
		const response =
			this.#cache.get(id) ?? (await this.json('GET', 'v2', id, Provider.ProjectDataResponse));

		this.#cache.set(id, response);

		return response;
	}

	#findAttachment({
		column,
		attachments,
	}: {
		attachments: (typeof Provider.ProjectDataResponse)['infer']['_attachments'];
		column: { $xpath: string };
	}) {
		return attachments.find((a) => a.question_xpath === column.$xpath && !a.is_deleted);
	}

	async #parseEnumCell(metadata: DB.Metadata & { type: 'enum' }, serializedValue: string) {
		const { namespace, id } = splitMetadataId(metadata.id);
		const options = await this.db.getAll(
			'MetadataOption',
			metadataOptionsKeyRange(namespace, id)
		);

		return options.find((option) => serializedValue === (option.kobocollect ?? option.key));
	}

	#columnOfMetadata(project: (typeof Provider.ProjectResponse)['infer'], metadata: DB.Metadata) {
		return this.#columnByNameOrLabel(project, {
			name: removeNamespaceFromMetadataId(metadata.id),
			label: metadata.label,
			both: metadata.kobocollect
				? Array.isArray(metadata.kobocollect)
					? metadata.kobocollect
					: typeof metadata.kobocollect === 'string'
						? [metadata.kobocollect]
						: Array.isArray(metadata.kobocollect.list)
							? metadata.kobocollect.list
							: [metadata.kobocollect.list]
				: undefined,
		});
	}

	#columnByNameOrLabel(
		project: (typeof Provider.ProjectResponse)['infer'],
		{
			name,
			label,
			both,
		}: {
			name?: undefined | string | Array<string | undefined>;
			label?: undefined | string | Array<string | undefined>;
			both?: undefined | string | Array<string | undefined>;
		}
	) {
		return project.content.survey.find(
			(field) =>
				matchesName(field, both ?? name ?? []) || matchesLabel(field, both ?? label ?? [])
		);
	}

	#parseKobocollectCell<T extends DB.MetadataType>(
		metadata: DB.Metadata & { type: T },
		serializedValue: string
	): RuntimeValue<T> {
		switch (metadata.type) {
			case 'string':
				return serializedValue;
			case 'integer':
				return Number.parseInt(serializedValue);
			case 'float':
				return Number.parseFloat(serializedValue);
			case 'enum': {
				throw new Error('enum-type metadata should not be handled by parseKobocollectCell');
			}

			case 'boolean': {
				const isOK = serializedValue === 'OK';

				if (!metadata.kobocollect) return isOK;
				if (typeof metadata.kobocollect === 'string') return isOK;
				if (Array.isArray(metadata.kobocollect)) return isOK;

				if ('choice' in metadata.kobocollect) {
					const choices = ensureArray(metadata.kobocollect.choice);
					return serializedValue.split(' ').some((value) => choices.includes(value));
				}

				return ensureArray(metadata.kobocollect.true).includes(serializedValue);
			}

			case 'location': {
				const components = serializedValue
					.split(' ')
					.map(Number.parseFloat)
					.filter((x) => !Number.isNaN(x));

				if (components.length !== 4)
					throw new Error(
						`Invalid GPS point serialization: '${serializedValue}' doesn't have four space-separated numbers`
					);

				const [latitude, longitude, _, __] = components;

				return { latitude, longitude };
			}

			case 'boundingbox': {
				// TODO validate
				return JSON.parse(serializedValue) as RuntimeValue<'boundingbox'>;
			}

			case 'date': {
				return date.parseISO(serializedValue);
			}

			case 'file': {
				throw new Error('file metadata should not be handled by parseKobocollectCell');
			}
		}
	}

	#SessionRemoteID(assetUid: string, dataId: string | number) {
		return SessionRemoteID.assert(`/api/v2/assets/${assetUid}/data/${dataId}`);
	}

	#parseSessionRemoteID(id: SessionRemoteID): { assetUid: string; dataId: string } {
		const [_, _api, _v2, _assets, assetUid, _data, dataId] = id.split('/');
		return { assetUid, dataId };
	}

	#projectAssetUid(href: string): string {
		const url = new URL(href);
		if (!url.hash.startsWith('#/forms/'))
			throw new Error(`Invalid form URL '${url}': must contain #/forms/...`);

		const id = url.hash.split('/').at(2);

		if (!id)
			throw new Error(`Invalid form URL '${url}': must be of the form #/forms/ID HERE/(...)`);

		return id;
	}

	async json<Response extends Type>(
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		version: 'v1' | 'v2',
		path: string,
		responseSchema: Response,
		init?: RequestInit
	) {
		const response = await this.fetch(
			new URL(path, `https://${version === 'v1' ? this.v1domain : this.v2domain}`),
			{
				method,
				headers: {
					Accept: 'application/json',
				},
				...init,
			}
		);

		if (!response.ok)
			throw new Error('Impossible de se connecter à KoboToolbox: ' + (await response.text()));

		return responseSchema.assert(await response.json());
	}

	async fetch(url: URL | string, init: RequestInit = {}) {
		init.headers = {
			Authorization: `Token ${this.#token}`,
			...init.headers,
		};

		return fetch(`https://cors.gwen.works/${url.toString()}`, init);
	}

	static PaginatedResponse = type('<T>', {
		count: 'number.integer',
		next: 'string.url | null',
		results: 'T[]',
	});

	static ProjectDataResponse = type({
		'[string]': 'unknown',
		_id: 'number.integer',
		__version__: 'string',
		_xform_id_string: 'string',
		_uuid: 'string',
		_status: type('string').as<'submitted_via_web' | (string & {})>(),
		_geolocation: ['number|null', 'number|null'],
		_submission_time: 'string.date.iso.parse',
		_submitted_by: 'string|null',
		'meta/instanceID': 'string',
		_attachments: type({
			download_url: 'string.url.parse',
			download_large_url: 'string.url.parse',
			download_medium_url: 'string.url.parse',
			download_small_url: 'string.url.parse',
			mimetype: MIMEType,
			filename: 'string',
			media_file_basename: 'string',
			question_xpath: 'string',
			uid: 'string',
			'is_deleted?': 'boolean',
		}).array(),
	});

	static ProjectResponse = type({
		name: 'string',
		uid: 'string',
		version_id: 'string',
		deployment__uuid: 'string',
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
				'name?': 'string',
				type: type('string').as<
					| 'datetime'
					| 'decimal'
					| 'end'
					| 'geopoint'
					| 'image'
					| 'integer'
					| 'select_multiple'
					| 'select_one'
					| 'start'
					| 'text'
					| 'username'
					| (string & {})
				>(),
				'required?': 'boolean',
				$xpath: 'string',
				$kuid: 'string',
				'label?': 'string[]',
				$autoname: 'string',
				'select_from_list_name?': 'string',
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

function matchesName(
	subject: { $autovalue: string; name?: string } | { $autoname: string; name?: string },
	name: string | Array<string | undefined>
) {
	const subj = subject.name || ('$autovalue' in subject ? subject.$autovalue : subject.$autoname);
	const candidates = ensureArray(name).map((c) => c?.trim().toLowerCase());
	return candidates.includes(subj.trim().toLowerCase());
}

function matchesLabel(
	subject: { label?: string | string[] },
	label: string | Array<string | undefined>
) {
	if (!subject.label) return false;

	const subj = ensureArray(subject.label)[0];
	const candidates = ensureArray(label).map((c) => c?.trim().toLowerCase());

	return candidates.includes(subj.trim().toLowerCase());
}
