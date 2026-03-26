import type { DatabaseHandle } from '../idb.svelte.js';
import type { Account } from '$lib/accounts/types.js';
import type * as DB from '$lib/database.js';
import type { RuntimeValue } from '$lib/schemas/metadata.js';

import { Type, type } from 'arktype';
import * as date from 'date-fns';

import { Schemas } from '$lib/database.js';
import { resolveMetadataImport } from '$lib/metadata/imports.js';
import { metadataOptionsKeyRange } from '$lib/metadata/storage.js';
import { switchOnMetadataType } from '$lib/metadata/types.js';
import { MIMEType, NamespacedMetadataID } from '$lib/schemas/common.js';
import { removeNamespaceFromMetadataId, splitMetadataId } from '$lib/schemas/metadata.js';
import { SessionRemoteID } from '$lib/schemas/sessions.js';
import { mapValues } from '$lib/utils.js';

const ServerDomain = type.enumerated('kf.kobotoolbox.org', 'eu.kobotoolbox.org');
type ServerDomain = (typeof ServerDomain)['infer'];

export type LoginData = {
	token: string;
	server: ServerDomain;
};

export class Provider implements Account {
	#token: string;
	username: string;
	domain: ServerDomain;
	db: DatabaseHandle;

	#cache: Map<SessionRemoteID, (typeof Provider.ProjectDataResponse)['infer']> = new Map();

	constructor(
		db: DatabaseHandle,
		{
			token,
			username,
			domain,
			db,
		}: {
			token: string;
			username: string;
			domain: ServerDomain;
		}
	) {
		this.#token = token;
		this.username = username;
		this.domain = domain;
		this.db = db;
	}

	static logoURL = new URL('https://avatars.githubusercontent.com/u/5543677?s=280&v=4');

	static fromDatabase(
		db: DatabaseHandle,
		account: Pick<DB.Account, 'token' | 'profileURL' | 'username' | 'type'>
	) {
		if (account.type !== 'kobocollect') throw new Error('Invalid account type');

		return new Provider(db, {
			token: account.token,
			domain: ServerDomain.assert(account.profileURL.hostname),
			username: account.username,
		});
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

	projectAssetUid(href: string): string {
		const url = new URL(href);
		if (!url.hash.startsWith('#/forms/'))
			throw new Error(`Invalid form URL '${url}': must contain #/forms/...`);

		const id = url.hash.split('/').at(2);

		if (!id)
			throw new Error(`Invalid form URL '${url}': must be of the form #/forms/ID HERE/(...)`);

		return id;
	}

	get tokenURL(): URL {
		return new URL('/token/', 'https://' + this.domain);
	}

	static async login(db: DatabaseHandle, data: LoginData) {
		const account = new Provider(db, {
			token: data.token,
			domain: data.server,
			username: '',
		});

		const me = await account.json('GET', 'v2', '/me/', Provider.MeResponse);

		return {
			username: me.username,
			displayName:
				(me.first_name || me.last_name
					? `${me.first_name} ${me.last_name}`
					: me.extra_details.name) || me.username,
			avatarURL: me.gravatar.href,
			profileURL: me.projects_url.href,
			type: 'kobocollect' as const,
			token: data.token,
		};
	}

	#SessionRemoteID(assetUid: string, dataId: string) {
		return SessionRemoteID.assert(`/api/v2/assets/${assetUid}/data/${result.id}`);
	}

	#parseSessionRemoteID(id: SessionRemoteID): { assetUid: string; dataId: string } {
		const [_, _api, _v2, _assets, assetUid, _data, dataId] = id.split('/');
		return { assetUid, dataId };
	}

	async logout() {}

	async *sessions(protocol: DB.Protocol, { cursor, limit } = { cursor: undefined, limit: 10 }) {
		if (!protocol.remote?.kobocollect) return { ...[], nextCursor: undefined };

		const assetUid = this.projectAssetUid(protocol.remote.kobocollect.form);

		const response = await this.json(
			'GET',
			'v2',
			`/api/v2/assets/${assetUid}/data?${new URLSearchParams({
				limit: limit.toString(),
				offset: cursor ? (new URL(cursor).searchParams.get('offset') ?? '0') : '0',
			})}`,
			Provider.PaginatedResponse(Provider.ProjectDataResponse)
		);

		for (const result of response.results) {
			const gid = this.#SessionRemoteID(assetUid, result._id);
			this.#cache.set(gid, result);

			yield {
				id: gid,
				name: protocol.remote.kobocollect.title.render(result as Record<string, string>),
				submittedAt: result._submission_time,
				thumbnails: [],
				nextCursor: response.next ?? undefined,
			};
		}
	}

	sessionRemotePage(_id: SessionRemoteID) {
		// TODO
		return undefined;
	}

	async session(
		protocol: DB.Protocol,
		id: SessionRemoteID
	): Promise<Omit<DB.Session, 'id' | 'account'>> {
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

		const metadataValues: Record<NamespacedMetadataID, RuntimeValue> = {};

		for (const id of protocol.sessionMetadata) {
			const def = await this.db
				.get('Metadata', resolveMetadataImport(protocol, id))
				.then((raw) => (raw ? Schemas.Metadata.assert(raw) : undefined));

			if (!def) continue;

			const column = this.#columnOfMetadata(project, def);
			if (!column) continue;

			const value =
				column.$xpath in row
					? // @ts-expect-error can't figure out how to type additional properties with ArkType
						row[column.$xpath]?.toString()
					: undefined;

			if (!value) continue;

			switch (def.type) {
				case 'enum': {
					const option = await this.#parseEnumCell(def, value);
					if (!option) continue;

					metadataValues[def.id] = option.key;
					break;
				}
				case 'file': {
					const file = await this.#findAttachment({
						column,
						attachments: row._attachments,
					});

					if (!file) continue;

					metadataValues[def.id] = file.uid;
					break;
				}
				default: {
					const parsed = this.#parseKobocollectCell(def, value);
					if (parsed === undefined) continue;

					metadataValues[def.id] = parsed;
					break;
				}
			}
		}

		return {
			remoteId: id,
			createdAt: row._submission_time.toISOString(),
			description: `Créée sur KoboCollect. Voir ${submissionUrl}`,
			name: protocol.remote.kobocollect.title.render(row),
			openedAt: new Date().toISOString(),
			metadata: mapValues(metadataValues, (value) => ({
				value,
				confidence: 1,
				alternatives: {},
				confirmed: true,
				manuallyModified: true,
				isDefault: false,
			})),
			inferenceModels: {},
			group: {
				global: { field: 'none', tolerances: { dates: 'day', decimal: 'unit' } },
			},
			sort: {
				global: { field: 'name', direction: 'asc' },
			},
			fullscreenClassifier: {
				layout: 'top-bottom',
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
				id: `${this.domain}__${project.uid}__${row._id}__${attachment.uid}`,
				bytes,
				contentType: attachment.mimetype,
				filename: attachment.media_file_basename,
				size: bytes.byteLength,
				// kobocollect doesn't store it...
				lastModifiedAt: row._submission_time.toISOString(),
			};
		}
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
		return project.content.survey.find((field) => {
			// We can have an explicit empty string, which can be used to explicitly exclude a metadata from kobocollect equivalence
			const explicit = metadata.kobocollect
				? typeof metadata.kobocollect === 'string'
					? metadata.kobocollect
					: metadata.kobocollect.list
				: undefined;

			return (
				matchesName(field, explicit ?? removeNamespaceFromMetadataId(metadata.id)) ||
				matchesLabel(field, explicit ?? metadata.label)
			);
		});
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
				if (!metadata.kobocollect || typeof metadata.kobocollect === 'string')
					return serializedValue === 'OK';

				if ('choice' in metadata.kobocollect) {
					return serializedValue.split(' ').includes(metadata.kobocollect.choice);
				}

				return serializedValue === metadata.kobocollect.true;
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

	// TODO: do we keep this?
	async upload(session: DB.Session) {
		const { tables, ...idb } = await import('../idb.svelte.js');
		const instanceId = crypto.randomUUID();

		const filepartBoundaryName = (fileid: string) => `file-part-${fileid}`;

		const files: Record<NamespacedMetadataID, DB.MetadataValueFile | undefined> = {};

		const selectedOptions: Record<NamespacedMetadataID, DB.MetadataEnumVariant | undefined> =
			{};

		const project = await this.json(
			'GET',
			'v2',
			`/api/v2/assets/${this.projectAssetUid}/`,
			Provider.ProjectResponse
		);

		const uuid = project.deployment__uuid;

		let xmlFields = '';

		const metadatas = await tables.Metadata.getMany(Object.keys(session.metadata));
		const protocol = await tables.Protocol.get(session.protocol);
		if (!protocol) throw new Error(`Protocole ${session.protocol} introuvable`);

		for (const field of project.content.survey) {
			// We can have multiple matches if we have a single kobocollect select_many that maps from multiple boolean values with the same .kobocollect.list
			const candidates = metadatas.filter((metadata) => {
				const matchables = {
					label: (override?: string) => matchesLabel(field, override ?? metadata.label),
					name: (override?: string) =>
						matchesName(field, override ?? removeNamespaceFromMetadataId(metadata.id)),
				};

				if (metadata.kobocollect && typeof metadata.kobocollect === 'string') {
					return (
						matchables.label(metadata.kobocollect) ||
						matchables.name(metadata.kobocollect)
					);
				}

				if (metadata.kobocollect && typeof metadata.kobocollect !== 'string') {
					return (
						matchables.label(metadata.kobocollect.list) ||
						matchables.name(metadata.kobocollect.list)
					);
				}

				return matchables.label() || matchables.name();
			});

			if (candidates.length === 0) {
				xmlFields += `<${field.$xpath}/>\n`;
				console.warn(
					`${field.label} (${field.$xpath}) has no associated metadata, searched in`,
					metadatas
				);
				continue;
			}

			// So that we can get the metadata of a value by its index, useful within switchOnMetadataType(...) cuz it can only take an array of RuntimeValue's
			const metadatasOfValues = candidates.filter(
				({ id }) => session.metadata[id]?.value !== undefined
			);
			const values = metadatasOfValues.map(({ id }) => session.metadata[id]!.value!);

			if (values.length === 0) {
				xmlFields += `<${field.$xpath}/>\n`;
				continue;
			}

			for (const [i, { id, type }] of metadatasOfValues.entries()) {
				if (type === 'enum') {
					if (!values[i]) {
						selectedOptions[id] = undefined;
						continue;
					}

					selectedOptions[id] = await idb.get(
						'MetadataOption',
						`${resolveMetadataImport(protocol, id)}:${values[i]}`
					);
				}
				if (type === 'file') {
					if (!values[i]) {
						files[id] = undefined;
						continue;
					}

					files[id] = await idb.get('MetadataValueFile', values[i].toString());
				}
			}

			const serialized = switchOnMetadataType<string | undefined>(
				candidates[0].type,
				values,
				{
					boolean(...values) {
						const serialized = values.map((value, i) => {
							const { kobocollect } = metadatasOfValues[i];
							if (!kobocollect || typeof kobocollect === 'string') {
								return value ? 'OK' : undefined;
							}

							if ('true' in kobocollect) {
								return value ? kobocollect.true : kobocollect.false;
							}

							return project.content.choices.find((choice) => {
								choice.list_name === field.select_from_list_name! &&
									(matchesName(choice, kobocollect.choice) ||
										matchesLabel(choice, kobocollect.choice));
							});
						});

						if (serialized.every((s) => s === undefined)) return undefined;

						return serialized.join(' ');
					},
					enum() {
						// Only boolean can have multiple metadata values for a single kobo field
						const metadata = metadatasOfValues[0];
						if (!metadata) return undefined;
						const option = selectedOptions[metadata.id];
						if (!option) return undefined;

						const choice = project.content.choices.find((choice) => {
							choice.list_name === field.select_from_list_name! &&
								(matchesName(choice, option.kobocollect ?? option.key) ||
									matchesLabel(choice, option.kobocollect ?? option.label));
						});

						return choice?.name || choice?.$autovalue;
					},
					date(value) {
						const iso = value.toISOString();
						if (field.type === 'date') return iso.split('T').at(0)!;
						return iso;
					},
					location({ latitude, longitude }) {
						return `${latitude} ${longitude} 0 0`;
					},
					string: (value) => value,
					float: (value) => value.toString(),
					integer: (value) => value.toString(),
					boundingbox: (value) => JSON.stringify(value),
					file: (value) => filepartBoundaryName(value),
				}
			);

			if (serialized === undefined) xmlFields += `<${field.$xpath}/>`;
			else xmlFields += `<${field.$xpath}>${serialized}</${field.$xpath}>`;
		}

		// Many thanks to https://github.com/DRC-UA/kobo-sdk/blob/main/src/v1/KoboClientV1Submission.ts

		const xml = `<${project.uid} id=${project.uid} version="1 (2021-03-25 18:06:48)">
			<formhub><uuid>${uuid}</uuid></formhub>
			<__version__>${project.version_id}</__version>
			<meta>
				<instanceID>uuid:${instanceId}</instanceID>
			</meta>
			${xmlFields}
		</${project.uid}>`;

		const formdata = new FormData();

		formdata.append(
			'xml_submission_file',
			new File([xml], uuid, {
				type: 'application/xml',
			})
		);

		for (const file of Object.values(files)) {
			if (!file) continue;
			formdata.append(
				filepartBoundaryName(file.id),
				new File([file.bytes], file.filename, {
					type: file.contentType,
				})
			);
		}

		const response = await this.json(
			'POST',
			'v1',
			'/v1/submissions',
			type({
				'message?': 'string',
				'formid?': 'string',
				'encrypted?': 'boolean',
				'instanceID?': 'string',
				'submissionDate?': 'string',
				'markedAsCompleteDate?': 'string',
				'error?': 'string',
			}),
			{
				body: formdata,
			}
		);

		if (response.error) throw new Error(response.error);

		return {
			remoteID: SessionRemoteID.assert(response.instanceID),
		};
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

	get loggedIn() {
		return Boolean(this.#token);
	}

	static PaginatedResponse = type('<T>', {
		count: 'number.integer',
		next: 'string.url | null',
		results: 'T[]',
	});

	static ProjectDataResponse = type({
		_id: 'number.integer',
		__version__: 'string',
		_xform_id_string: 'string',
		_uuid: 'string',
		_status: type('string').as<'submitted_via_web' | (string & {})>(),
		_geolocation: ['number|null', 'number|null'],
		_submission_time: 'string.date.iso.parse',
		_submitted_by: 'string',
		'meta/instanceID': 'string',
		_attachments: type({
			download_url: 'string.url',
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
				required: 'boolean',
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
	name: string
) {
	const subj = subject.name || ('$autovalue' in subject ? subject.$autovalue : subject.$autoname);
	return subj.trim().toLowerCase() === name.trim().toLowerCase();
}

function matchesLabel(subject: { label?: string | string[] }, label: string) {
	if (!subject.label) return false;

	const subj = Array.isArray(subject.label) ? subject.label[0] : subject.label;

	return subj.trim().toLowerCase() === label.trim().toLowerCase();
}
