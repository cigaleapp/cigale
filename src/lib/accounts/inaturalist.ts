import type { Account, LoginData } from './types.js';
import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { RuntimeValue } from '$lib/schemas/metadata.js';
import type { FetchProgressData } from 'fetch-progress';

import { scope, Type } from 'arktype';
import * as dates from 'date-fns';
import { addYears, isFuture } from 'date-fns';
import fetchProgress from 'fetch-progress';
import { nanoid } from 'nanoid';

import { Tables } from '$lib/database.js';
import { Channel } from '$lib/iterables.js';
import { addValueLabels } from '$lib/metadata/display.js';
import { mergeMetadataFromImagesAndObservations } from '$lib/metadata/merging.js';
import { resolveMetadataImport } from '$lib/metadata/namespacing.js';
import { Clade, CLADES } from '$lib/schemas/common.js';
import { metadataOptionId } from '$lib/schemas/metadata.js';
import { withProtocolMetadata } from '$lib/schemas/results.js';
import { accessBytes } from '$lib/storage/utils.js';
import { compareBy, corsfix, omit, sum } from '$lib/utils.js';

const type = scope({
	ID: 'number.integer > 0',
	Fields: ['string', '|', ['object.json', '=>', toRison]],
}).type;

/*
 * Metadata option ID → iNaturalist taxon ID
 */
const GBIF_TO_INAT_TAXON = new Map<string, number>();

export default class Provider implements Account {
	static auth = 'oauth' as const;
	static capabilities = ['upload', 'media'] as const;

	static displayName = 'iNaturalist';
	static logoURL = new URL(
		corsfix('https://upload.wikimedia.org/wikipedia/en/7/76/INaturalist_logo.png')
	);

	// XXX: DONT MERGE
	static APP_ID = 'TODO';

	username: string = '';
	displayName: string = '';
	avatarURL: URL | undefined = undefined;
	id: string | undefined = undefined;
	db: DatabaseHandle;

	#tokens: { access: string | undefined; refresh: string | undefined };
	#tokenExpiresAt: Date | undefined;

	#abortSignal: AbortSignal | undefined;

	constructor(db: DatabaseHandle, token: string | undefined, refreshToken: string | undefined) {
		this.#tokens = { access: token, refresh: refreshToken };
		this.db = db;
	}

	static async servers() {
		return [];
	}

	static compatibleWith(protocol: DB.Protocol|undefined) {
		return Boolean(protocol?.remote?.inaturalist)
	}

	armAbort(signal: AbortSignal): void {
		this.#abortSignal = signal;
	}

	#tokenValid(): boolean {
		if (!this.#tokenExpiresAt) return false;
		if (!this.#tokens.access) return false;
		if (!dates.isValid(this.#tokenExpiresAt)) return false;
		return isFuture(this.#tokenExpiresAt);
	}

	async #refreshToken() {
		if (!this.#tokens.refresh) {
			return false;
		}

		const response = await fetch(
			`https://www.inaturalist.org/oauth/token?${new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: this.#tokens.refresh,
				client_id: Provider.APP_ID,
			})}`
		);

		if (!response.ok) return false;

		const data = await response.json();

		this.#tokens.access = data.access_token;
		this.#tokens.refresh = data.refresh_token;
		this.#tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

		return true;
	}

	static async login(db: DatabaseHandle, data: LoginData) {
		if (!data.oauth) throw new Error('No oauth login data provided');

		const redirectUri = import.meta.env.webOrigin + '/oauth/callback/inaturalist/';

		switch (data.oauth.phase) {
			case 'authorization': {
				const codeVerifier = nanoid();
				localStorage.setItem('inaturalist_code_verifier', codeVerifier);

				const url = new URL(
					'https://www.inaturalist.org/oauth/authorize' +
						new URLSearchParams({
							client_id: Provider.APP_ID,
							response_type: 'code_challenge',
							code_challenge_method: 'S256',
							code_challenge: codeVerifier,
							redirect_uri: redirectUri,
						})
				);

				window.location.href = url.toString();

				break;
			}
			case 'token': {
				const codeVerifier = localStorage.getItem('inaturalist_code_verifier');
				if (!codeVerifier) throw new Error('No code verifier stored');

				const response = await fetch('https://www.inaturalist.org/oauth/token', {
					method: 'POST',
					body: JSON.stringify({
						client_id: Provider.APP_ID,
						code: data.oauth.authorizationCode,
						redirect_uri: redirectUri,
						grant_type: 'authorization_code',
						code_verifier: codeVerifier,
					}),
				});

				if (!response.ok) {
					throw new Error(
						`Impossible de se connecter à iNaturalist: ${await response.text()}`
					);
				}

				const { access_token } = Provider.OauthTokenResponse.assert(await response.json());

				const instance = new Provider(db, access_token, undefined);

				instance.#tokenExpiresAt = addYears(new Date(), 1);

				const {
					results: [me],
				} = await instance.#request('GET /users/me', {}, undefined);

				return {
					type: 'inaturalist' as const,
					displayName: me.name,
					username: me.login,
					avatarURL: me.icon_url,
					profileURL: `https://www.inaturalist.org/users/${me.id}`,
					userId: me.id,
					refreshToken: undefined,
					accessToken: access_token,
				};
			}
		}
	}

	async *upload(protocol: DB.Protocol, session: DB.Session) {
		// FIXME: find a way to still have nice progress reporting but don't load all cropped images into ram before uploading them?

		const { projectId, cropMetadataId } = this.#protocolConfig(protocol);

		await this.#joinProject(projectId);

		const observations = await this.db
			.getAllFromIndex('Observation', 'sessionId', session.id)
			.then((os) => os.map((observation) => Tables.Observation.assert(observation)));

		const images = await this.db
			.getAllFromIndex('Image', 'sessionId', session.id)
			.then((images) => images.map((image) => Tables.Image.assert(image)));

		const progress = (action: string, done?: number, total?: number, unit?: string) => ({
			message: 'progress' as const,
			action,
			unit,
			...(done !== undefined && total !== undefined ? { done, total } : {}),
		});

		yield progress('Création des observations');

		const files = await this.db
			.getAllFromIndex('ImageFile', 'sessionId', session.id)
			.then((files) => files.map((file) => Tables.ImageFile.assert(file)));

		/** keys are iNat observation ID */
		const inatObs = new Map<
			string,
			Array<{
				image: DB.Image;
				file: DB.ImageFile;
			}>
		>();

		for (const [i, obs] of observations.entries()) {
			const observationImages = images.filter((image) => obs.images.includes(image.id));
			const uuid = await this.#createObservation(protocol, session, obs, observationImages);

			inatObs.set(
				uuid,
				files.filter((file) => observationImages.some((image) => image.fileId === file.id))
			);

			yield progress('Création des observations', i + 1, images.length);
		}

		/** iNat observation ID → Cropped images to upload to that observation */
		const crops: Array<{ observationId: string; photo: File }> = [];

		yield progress('Recadrage des photos');

		const total = sum(inatObs.values().map((items) => items.length));
		let done = 0;

		const cropPadding = session.exportCropPadding ?? protocol.crop?.padding ?? '0px';

		for (const [uuid, items] of inatObs) {
			for (const item of items) {
				const cropbox = await this.#findCropBox(protocol, item.image);
				if (cropbox) {
					const original = await accessBytes('ImageFile', item.file);
					const { croppedBlob } = await cropImage(
						original,
						item.file.contentType,
						cropbox,
						cropPadding
					);

					crops.push({
						observationId: uuid,
						photo: new File([croppedBlob], item.file.filename),
					});
				}

				yield progress('Recadrage des photos', ++done, total);
			}
		}

		yield progress('Upload des photos');

		let doneBytes = 0;
		const totalBytes = sum(crops.map(({ photo }) => photo.size));

		// XXX: DONT MERGE
		// TODO: crop photos
		for (const { observationId, photo } of crops) {
			for await (const { done } of this.#uploadObservationPhoto(
				protocol,
				observationId,
				photo
			)) {
				doneBytes += done;
				yield progress('Upload des photos', doneBytes, totalBytes);
			}
		}
	}

	async *#uploadObservationPhoto(protocol: DB.Protocol, uuid: string, file: DB.ImageFile) {
		const updates = new Channel<{ done: number; total: number }>();

		this.#request(
			'POST /observation_photos',
			{},
			{
				'observation_photo[observation_id]': uuid,
				file: new File([await accessBytes('ImageFile', file)], file.filename),
			},
			({ transferred, total }) => updates.push({ done: transferred, total })
		);

		yield* updates;
	}

	async #createObservation(
		protocol: DB.Protocol,
		session: DB.Session,
		observation: DB.Observation,
		images: DB.Image[]
	) {
		const { projectId } = this.#protocolConfig(protocol);

		const metadata = mergeMetadataFromImagesAndObservations({
			definitions: await this.#metadataDefs(protocol),
			observations: [observation],
			images,
		});

		const taxonId = await this.#findTaxonId(protocol, metadata);
		const location = (await this.#findGeolocation(protocol, session, metadata)) ?? {};
		const date = await this.#findObservationDate(protocol, session, metadata);
		// TODO: figure out why API seems to only allow setting ONE project field for POST /observations
		const fields = await this.#findObservationFields(protocol, session, metadata);

		const {
			results: [created],
		} = await this.#request(
			'POST /observations',
			{},
			{
				observation: {
					project_id: projectId,
					time_zone: Temporal.Now.timeZoneId(),
					taxon_id: taxonId,
					observed_on_string: date ?? new Date(),
					description: await this.#computeDescription(
						protocol,
						session,
						observation,
						images
					),
					...location,
					observation_field_values_attributes: fields.map((field) => ({
						observation_field_id: field.id,
						value: field.value,
					})),
				},
			}
		);

		return created.uuid;
	}

	async #computeDescription(
		protocol: DB.Protocol,
		session: DB.Session,
		observation: DB.Observation,
		images: DB.Image[]
	) {
		const template = protocol.remote?.inaturalist?.observations?.description;
		if (!template) return '';

		const intoPayload = async (subject: { metadata?: DB.MetadataValues; addedAt?: Date }) => {
			return withProtocolMetadata(protocol, {
				...omit(subject, 'metadataOverrides'),
				...('addedAt' in subject && subject.addedAt instanceof Date
					? { addedAt: subject.addedAt.toISOString() }
					: {}),
				metadata: await addValueLabels(this.db, null, subject.metadata),
			});
		};

		return template.render({
			session: await intoPayload(session),
			images: await Promise.all(images.map(async (image) => intoPayload(image))),
			observation: {
				...(await intoPayload(observation)),
				...(await intoPayload({
					metadata: mergeMetadataFromImagesAndObservations({
						definitions: await this.#metadataDefs(protocol),
						observations: [observation],
						images,
					}),
				})),
			},
		});
	}

	/** [project id, field name] → field id */
	#observationFieldsByName = new Map<[number, string], number>();
	async #findObservationFields(
		protocol: DB.Protocol,
		session: DB.Session,
		mergedMetadata: DB.MetadataValues,
		{ recurse } = { recurse: true }
	): Promise<Array<{ value: string; id: number }>> {
		const { projectId } = this.#protocolConfig(protocol);

		const metadataValues = { ...session.metadata, ...mergedMetadata };

		const fields = await this.#metadataDefs(
			protocol,
			'string',
			'boolean',
			'float',
			'integer'
		).then((defs) =>
			defs
				.filter((def) => def.inaturalist?.projectField && def.id in metadataValues)
				.map((def) => ({
					value: String(metadataValues[def.id]?.value ?? ''),
					id: this.#observationFieldsByName.get([
						projectId,
						def.inaturalist!.projectField!,
					]),
				}))
		);

		if (recurse && fields.some((field) => field.id === undefined)) {
			const {
				results: [project],
			} = await this.#request('GET /projects/:id', { id: projectId }, undefined);

			for (const field of project.project_observation_fields) {
				this.#observationFieldsByName.set(
					[projectId, field.observation_field.name],
					field.id
				);
			}

			return this.#findObservationFields(protocol, session, mergedMetadata, {
				recurse: false,
			});
		}

		return fields.filter((field) => field.id !== undefined);
	}

	async #findGeolocation(
		protocol: DB.Protocol,
		session: DB.Session,
		mergedMetadata: DB.MetadataValues
	) {
		const metadataValues = { ...session.metadata, ...mergedMetadata };

		const metadata = (await this.#metadataDefs(protocol, 'location')).find(
			(metadata) => metadata.inaturalist === 'observed at' && metadata.id in metadataValues
		);

		if (!metadata) return;

		return metadataValues[metadata.id]?.value as RuntimeValue<'location'> | undefined;
	}

	async #findObservationDate(
		protocol: DB.Protocol,
		session: DB.Session,
		mergedMetadata: DB.MetadataValues
	) {
		const metadataValues = { ...session.metadata, ...mergedMetadata };

		const metadata = (await this.#metadataDefs(protocol, 'date')).find(
			(metadata) => metadata.inaturalist === 'observed on' && metadata.id in metadataValues
		);

		if (!metadata) return;

		return metadataValues[metadata.id]?.value as RuntimeValue<'date'> | undefined;
	}

	async #findTaxonId(protocol: DB.Protocol, metadataValues: DB.MetadataValues) {
		// Find most specific clade that has a value for that image

		const metadata = (await this.#metadataDefs(protocol, 'enum'))
			// Has a clade defined
			.filter((metadata) => metadata.inaturalist?.taxon?.rank)
			// Sort by most specific clade first
			.toSorted(
				compareBy((metadata) =>
					CLADES.toReversed().indexOf(metadata.inaturalist!.taxon!.rank!)
				)
			)
			// Find first that has a value in the image
			.find((metadata) => metadata.id in metadataValues);

		if (!metadata) return;

		const rank = metadata.inaturalist!.taxon!.rank;

		const gbifKey = metadataOptionId(metadata.id, metadataValues[metadataId]?.value ?? '');

		if (GBIF_TO_INAT_TAXON.has(gbifKey)) {
			return GBIF_TO_INAT_TAXON.get(gbifKey);
		}

		const option = await this.db.get('MetadataOption', gbifKey);
		if (!option) return;

		const search = await this.#request('GET /taxa', {
			q: option.label,
			rank: [rank],
		});

		const inatId = search.results.find(
			(result) => result.name === option.label && result.rank === rank
		)?.id;

		if (!inatId) throw new Error(`Species ${option.label} does not exist on iNaturalist`);

		GBIF_TO_INAT_TAXON.set(gbifKey, inatId);

		return inatId;
	}

	async #joinProject(projectId: number) {
		const { results } = await this.#request('GET /projects/:id', { id: projectId }, undefined);

		const [project] = results;

		if (project.membership_model === 'inviteonly') {
			return;
		}

		const already = await this.#request(
			'GET /projects/:id/membership',
			{ id: projectId },
			undefined
		);

		if (already.total_results > 0) return;

		await this.#request('POST /projects/:id/membership', { id: projectId }, undefined);
	}

	async #findCropBox(protocol: DB.Protocol, image: DB.Image) {
		const defs = await this.#metadataDefs('boundingbox');
		const def = defs.find((def) => def.inaturalist === 'crop');

		if (!def) {
			throw new Error(
				'Le protocole ne définit aucune métadonnée servant de recadrage pour iNaturalist. Une métadonnée de type boundingbox doit avoir "inaturalist: crop".'
			);
		}

		return image.metadata[def.id]?.value;
	}

	/** Keyed by protocol id */
	#_metadataDefs: Record<string, DB.Metadata[]> = {};
	async #metadataDefs<T extends DB.MetadataType>(
		protocol: DB.Protocol,
		...types: T[]
	): Promise<Extract<DB.Metadata, { type: T }>[]> {
		if (!(protocol.id in this.#_metadataDefs)) {
			const ids = protocol.metadata.map((id) => resolveMetadataImport(protocol, id));

			const defs = await Promise.all(ids.map(async (id) => this.db.get('Metadata', id)));

			this.#_metadataDefs[protocol.id] = defs.map((def) => Tables.Metadata.assert(def));
		}

		return this.#_metadataDefs[protocol.id].filter(
			(def) => types.length === 0 || (types as string[]).includes(def.type)
		);
	}

	#protocolConfig(protocol: DB.Protocol) {
		if (!protocol.remote?.inaturalist)
			throw new Error('Ce protocole ne supporte pas iNaturalist');

		const config = protocol.remote.inaturalist;

		return { projectId: config.project };
	}

	async #request<R extends keyof typeof Provider.requests>(
		name: R,
		params: ExtractMethod<R>['params'] & (typeof Provider.requests)[R]['query']['inferIn'],
		body: (typeof Provider.requests)[R]['body']['inferIn'] = undefined,
		onProgress?: (data: FetchProgressData) => void
	): Promise<(typeof Provider.requests)[R]['response']['inferOut']> {
		if (!this.#tokenValid()) {
			await this.#refreshToken();
		}

		let [method, path] = name.split(' ') as [ExtractMethod<R>['method'], string];

		for (const [key, value] of Object.entries(params)) {
			path = path.replaceAll(new RegExp(`:${key}($|/)`, 'g'), value.toString());
		}

		const spec = Provider.requests[name];

		const headers = new Headers();
		const query = new URLSearchParams();

		if (!spec.query.allows(undefined)) {
			for (const [k, v] of Object.entries(spec.query.assert(params) ?? {})) {
				query.set(k, v);
			}
		}

		headers.set('Authorization', `Bearer ${this.#tokens.access}`);

		let encodedBody: string | FormData | undefined = undefined;

		if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
			if (!spec.response.allows(undefined)) {
				body.fields ??= toInaturalistFields(spec.response);
			}

			if (spec.body.meta.encoding === 'multipart') {
				headers.set('Content-Type', 'multipart/form-data');
				encodedBody = new FormData();
				for (const [key, value] of Object.entries(spec.body.assert(body)!)) {
					if (value instanceof Blob || value instanceof File) {
						encodedBody.append(key, value);
					} else if (value !== undefined && value !== null) {
						encodedBody.append(key, value.toString());
					}
				}
			} else if (!spec.body.allows(undefined)) {
				headers.set('Content-Type', 'application/json');
				encodedBody = JSON.stringify(spec.body.assert(body));
			}
		}

		if (!spec.response.allows(undefined)) {
			headers.set('Accept', 'application/json');

			query.set('fields', toRison(toInaturalistFields(spec.response)));
		}

		const response = await fetch(`https://api.inaturalist.org/v2${path}?${query}`, {
			method,
			headers,
			body: encodedBody ?? null,
		}).then(fetchProgress({ onProgress: onProgress ?? (() => {}) }));

		if (!response.ok) {
			throw new Error(await response.text());
		}

		if (spec.response.allows(undefined)) return;

		return spec.response.assert(await response.json());
	}

	static OauthTokenResponse = type({
		access_token: 'string',
		token_type: '"bearer"',
		//    "expires_in": null,
		//    "refresh_token":null,
		scope: '"write"',
	});

	static Paginated = type('<T>', {
		total_results: 'number.integer',
		page: 'number.integer',
		per_page: 'number.integer',
		results: 'T[]',
	});

	static requests = {
		'POST /annotations': {
			body: type({
				fields: 'Fields',
				// TODO
				resource_type: type.enumerated(''),
				resource_id: 'string',
				controlled_attribute_id: 'ID',
				controlled_value_id: 'ID',
			}),
			query: type({}),
			response: Provider.Paginated({
				controlled_attribute: {
					id: 'ID',
					label: 'string',
				},
				controlled_value: {
					id: 'ID',
					label: 'string',
				},
			}),
		},
		'DELETE /authorized_applications/:id': {
			body: type.undefined,
			query: type({}),
			response: type.undefined,
		},
		'GET /controlled_terms': {
			body: type.undefined,
			query: type({}),
			response: Provider.Paginated({
				id: 'ID',
				label: 'string',
				values: 'string[]',
				labels: [{ id: 'ID', label: 'string' }, '[]'],
			}),
		},
		'POST /identifications': {
			body: type({
				// TODO: figure out what this is, not sure if its the fields selection thing
				'fields?': 'Fields',
				identification: {
					/** Comments/notes i guess? */
					body: 'string',
					observation_id: 'string.uuid',
					taxon_id: 'ID',
					vision: 'boolean',
					disagreement: 'boolean',
					nominate: 'boolean',
				},
			}),
			query: type({}),
			response: Provider.Paginated({
				id: 'ID',
			}),
		},
		'DELETE /identifications/:uuid': {
			body: type.undefined,
			query: type({}),
			response: type.undefined,
		},
		'POST /observation_photos': {
			body: type({
				'observation_photo[observation_id]': 'string.uuid',
				'observation_photo[uuid]?': 'string.uuid',
				'observation_photo[position]?': 'number.integer >= 0',
				file: 'File',
				'fields?': 'Fields',
			}).configure({ encoding: 'multipart' }),
			query: type({}),
			response: type.undefined,
		},
		'DELETE /observation_photos/:uuid': {
			body: type.undefined,
			query: type({}),
			response: type.undefined,
		},
		'POST /observations': {
			body: type({
				'fields?': 'Fields',
				observation: {
					description: 'string',
					latitude: 'number',
					longitude: 'number',
					location_is_exact: 'boolean',
					project_id: 'ID',
					// site_id: 'ID',
					taxon_id: 'ID',
					time_zone: 'string',
					// TODO: is this a datestring ?
					observed_on_string: [
						'Date',
						'=>',
						(date) => dates.format(date, 'yyyy-MM-dd HH:mm:ss'),
					],
					// TODO: api docs says this is a simple object, but shouldnt it be an array of objects? so that you can set more than one field... idk

					observation_field_values_attributes: [
						{
							observation_field_id: 'ID',
							value: 'string',
						},
						'[]',
					],

					// TODO
					// geoprivacy: "null |"
				},
			}),
			query: type({}),
			response: Provider.Paginated({
				id: 'ID',
				uuid: 'string.uuid',
			}),
		},
		'PUT /observations/:uuid': {
			body: type({
				'fields?': 'Fields',
				ignore_photos: 'boolean = true',
				observation: {
					description: 'string',
					latitude: 'number',
					longitude: 'number',
					location_is_exact: 'boolean',
					project_id: 'ID',
					site_id: 'ID',
					taxon_id: 'ID',
					time_zone: 'string',
					// TODO
					// geoprivacy: "null | "
				},
			}),
			query: type({}),
			response: type.undefined,
		},
		'DELETE /observations/:uuid': {
			body: type.undefined,
			query: type({}),
			response: type.undefined,
		},
		'GET /projects/:id': {
			body: type.undefined,
			query: type({}),
			response: Provider.Paginated({
				membership_model: type.enumerated('inviteonly', 'open'),
				project_observation_fields: [
					{
						id: 'ID',
						position: 'number.integer >= 0',
						required: 'boolean',
						observation_field: {
							// TODO: is it comma-separated?
							// allowed_values: '""',
							// TODO: other values?
							// datatype: "'text'"

							name: 'string',
						},
					},
					'[]',
				],
			}),
		},
		'GET /projects/:id/membership': {
			body: type.undefined,
			query: type({}),
			response: Provider.Paginated({
				// TODO: get values of enum
				role: 'string',
			}),
		},
		'POST /projects/:id/membership': {
			body: type.undefined,
			query: type({}),
			response: type.undefined,
		},
		'GET /taxa': {
			body: type.undefined,
			query: type({
				q: 'string',
				rank: Clade.array().pipe((ranks) => ranks.join(',')),
			}),
			response: Provider.Paginated({
				id: 'ID',
				uuid: 'string.uuid',
				rank: 'string',
				name: 'string',
			}),
		},
		'GET /users/me': {
			body: type.undefined,
			query: type({}),
			response: Provider.Paginated({
				id: 'ID',
				uuid: 'string.uuid',
				name: 'string',
				login: 'string',
				icon_url: 'string.url | ""',
			}),
		},
	} as const;
}

type Risonable = string | number | boolean | null | Risonable[] | { [key: string]: Risonable };

/**
 * @see https://api.inaturalist.org/v2/docs/#/Projects/get_projects__id_:~:text=have%20two%20options:-,RISON,-You%20can%20encode
 * @see https://github.com/w33ble/rison-node
 */
function toRison(obj: Risonable): string {
	switch (typeof obj) {
		case 'string':
			return JSON.stringify(obj);
		case 'number':
			return obj.toString();
		case 'boolean':
			return obj ? '!t' : '!f';
		case 'object': {
			if (Array.isArray(obj)) {
				return `!(${obj.map(toRison).join(',')})`;
			}
			if (obj === null) {
				return '!n';
			}

			return (
				'(' +
				Object.entries(obj)
					.map(([key, value]) => `${key}:${toRison(value)}`)
					.join(',') +
				')'
			);
		}
	}
}

function toInaturalistFields(schema: { json: Type['json'] }) {
	const structure = schema.json;

	if (typeof structure !== 'object') throw 'invalid structure';
	if (Array.isArray(structure)) throw 'invalid structure';

	if (structure.proto === 'Array') {
		return toInaturalistFields({ json: structure.sequence });
	}

	if (structure.domain !== 'object') throw `invalid structure, domain is ${structure.domain}`;

	type TreeOfTrue = { [key: string]: true | TreeOfTrue };
	const out: TreeOfTrue = {};

	for (const field of structure.required) {
		try {
			out[field.key] = toInaturalistFields({ json: field.value });
		} catch {
			out[field.key] = true;
		}
	}

	return out;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('toInaturalistFields', () => {
		expect(
			toInaturalistFields(
				type({
					foo: 'string',
					bar: [
						{
							baz: 'number',
							quux: 'string.url',
						},
						'[]',
					],
				})
			)
		).toMatchObject({
			foo: true,
			bar: {
				baz: true,
				quux: true,
			},
		});
	});
}

//  Thanks to https://dev.to/bytimo/useful-types-extract-route-params-with-typescript-5fhn
type ExtractParam<Path, NextPart> = Path extends `:${infer Param}`
	? Record<Param, string | number> & NextPart
	: NextPart;

type ExtractParams<Path> = Path extends `${infer Segment}/${infer Rest}`
	? ExtractParam<Segment, ExtractParams<Rest>>
	: ExtractParam<Path, {}>;

type ExtractMethod<Spec> = Spec extends `${infer M} ${infer Rest}`
	? { method: M; path: Rest; params: ExtractParams<Rest> }
	: never;
