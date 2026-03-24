import type * as DB from '$lib/database.js';

import { Type, type } from 'arktype';
import { nanoid } from 'nanoid';

import { resolveMetadataImport } from './metadata/imports.js';
import { switchOnMetadataType } from './metadata/types.js';
import { NamespacedMetadataID, URLString } from './schemas/common.js';
import { removeNamespaceFromMetadataId } from './schemas/metadata.js';
import { entries } from './utils.js';

interface Account {
	logoURL: URL;
	login(): Promise<{ username: string; displayName: string; avatarURL: URL; profileURL: URL }>;
	logout(): Promise<void>;
	loggedIn: boolean;
	upload(session: DB.Session): Promise<URL | undefined>;
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

export class KoboToolbox implements Account {
	#token: string | undefined;
	#formURL: URL;

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
		const { tables, ...idb } = await import('./idb.svelte.js');
		const instanceId = crypto.randomUUID();

		const filepartBoundaryName = (fileid: string) => `file-part-${fileid}`;

		const files: Record<NamespacedMetadataID, DB.MetadataValueFile | undefined> = {};

		const selectedOptions: Record<NamespacedMetadataID, DB.MetadataEnumVariant | undefined> =
			{};

		const project = await this.fetch(
			'GET',
			'v2',
			`/api/v2/assets/${this.projectAssetUid}/`,
			KoboToolbox.ProjectResponse
		);

		const uuid = project.deployment__uuid;

		let xmlFields = '';

		const metadatas = await tables.Metadata.getMany(Object.keys(session.metadata));
		const protocol = await tables.Protocol.get(session.protocol);
		if (!protocol) throw new Error(`Protocole ${session.protocol} introuvable`);

		for (const field of project.content.survey) {
			// We can have multiple matches if we have a single kobocollect select_many that maps from multiple boolean values with the same .kobocollect.list
			const candidates = metadatas.filter((metadata) => {
				const label = field.label?.at(0)?.trim();

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

		const response = await this.fetch(
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

		return undefined;
	}

	async fetch<Response extends Type>(
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		version: 'v1' | 'v2',
		path: string,
		responseSchema: Response,
		init?: RequestInit
	) {
		const response = await fetch(
			new URL(path, version === 'v1' ? this.v1domain : this.v2domain),
			{
				method,
				headers: {
					Accept: 'application/json',
					Authorization: `Token ${this.#token}`,
				},
				...init,
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
