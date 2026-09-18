import type { Account, AuthenticationMethod, LoginData } from './types.js';
import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { MetadataValue, RuntimeValue } from '$lib/schemas/metadata.js';

import { ArkErrors, type, Type } from 'arktype';
import { RateLimit } from 'async-sema';
import * as dates from 'date-fns';
import { differenceInSeconds, isPast } from 'date-fns';
import { chunk } from 'es-toolkit';
import { isDeckGlMouseEvent } from 'svelte-maplibre';
import * as YAML from 'yaml';

import { coordsScaler } from '$lib/BoundingBoxes.svelte.js';
import { generateId, Schemas, Tables } from '$lib/database.js';
import { imageFileId, imageId, parseImageId } from '$lib/images.js';
import { boundingBoxResolver } from '$lib/inference_utils.js';
import { resolveMetadataImport } from '$lib/metadata/namespacing.js';
import { serializeMetadataFullValue, serializeMetadataValue } from '$lib/metadata/serializing.js';
import { hasRuntimeType } from '$lib/metadata/types.js';
import { fallbackObservationLabel } from '$lib/observations.js';
import {
	ensureNamespacedMetadataId,
	MetadataRecord,
	removeNamespaceFromMetadataId,
} from '$lib/schemas/metadata.js';
import { SessionRemoteID } from '$lib/schemas/sessions.js';
import { byteSizeOfObject, createBytes, streamBytes } from '$lib/storage/utils.js';
import {
	clamp,
	concurrently,
	ensureArray,
	isLocalhost,
	mapValues,
	nonnull,
	poll,
	safeJSONParse,
	sum,
	switchValue,
	throwError,
	transformObject,
	unique,
} from '$lib/utils.js';

type DBIn = {
	[table in keyof typeof DB.Tables]: (typeof DB.Tables)[table]['inferIn'];
};

export default class Provider implements Account {
	static id = 'ecosignal' as const;

	static auth = 'password' as const satisfies AuthenticationMethod;
	static capabilities = ['sessions', 'upload'] as const;
	static displayName = 'EcoSignal';
	static logoURL = new URL(
		'https://raw.githubusercontent.com/LiuDilongNJ/eco-signal/ddbd474a30fe4bf82770aef4c292c3ac6ef46765/frontend/public/images/ecosignal_favicon.svg'
	);

	#token: string | undefined;
	#tokenExpiresAt: Date | undefined;
	#tokenIdleDuration: { seconds: number } | undefined;
	#lastRequestSentAt: Date | undefined;

	MAX_REQUESTS_PER_SECOND = {
		read: 50,
		write: 30,
		heavyWrite: 10,
	};

	rateLimiters: Record<keyof typeof this.MAX_REQUESTS_PER_SECOND, ReturnType<typeof RateLimit>>;

	#password: string;
	username: string;
	userId: number;
	displayName: string;
	avatarURL: URL | undefined;
	domain: string;
	color: string;
	db: DatabaseHandle;
	id: string | undefined;

	#cache = new Map<SessionRemoteID, (typeof this.MediaResponse)['infer']>();

	#abortSignal: AbortSignal | undefined;

	/** Label name → ID */
	#labelIds = new Map<string, number | undefined>();

	constructor(
		db: DatabaseHandle,
		{
			password,
			username,
			displayName,
			userId,
			avatarURL,
			domain,
			id,
			color,
		}: {
			password: string;
			domain: string;
			username?: string;
			userId: number;
			displayName?: string;
			avatarURL?: URL | undefined;
			id?: string | undefined;
			color?: string;
		}
	) {
		this.#password = password;
		this.username = username ?? '';
		this.userId = userId ?? '';
		this.domain = domain;
		this.displayName = displayName ?? '';
		this.avatarURL = avatarURL;
		this.db = db;
		this.id = id;
		this.color = color ?? '';
		this.#abortSignal = undefined;

		this.rateLimiters = mapValues(this.MAX_REQUESTS_PER_SECOND, RateLimit);
	}

	armAbort(signal: AbortSignal) {
		this.#abortSignal = signal;
	}

	static async servers(db: DatabaseHandle) {
		const protocols = await db.getAll('Protocol');
		const domains: Array<{ name?: string; domain: string }> = protocols
			.map((p) => Tables.Protocol.assert(p))
			.flatMap((p) => {
				const domains = p.remote?.ecosignal?.domains;
				if (!domains) return [];
				if (typeof domains === 'string') return [{ domain: domains }];
				if (Array.isArray(domains)) return domains.map((domain) => ({ domain }));
				return Object.entries(domains).map(([name, domain]) => ({ name, domain }));
			});

		if (isLocalhost()) {
			domains.push({
				name: 'Local dev',
				domain: 'http://localhost:8889',
			});
		}

		return unique(domains, ({ domain }) => domain);
	}

	toJSON() {
		return {
			password: this.#password,
			username: this.username,
			userId: this.userId,
			domain: this.domain,
			displayName: this.displayName,
			color: this.color,
			db: this.db,
			id: this.id,
		};
	}

	static compatibleWith(protocol: DB.Protocol | undefined) {
		return Boolean(protocol?.remote?.ecosignal);
	}

	static async checkAuth({ server, password }: LoginData<string>) {
		if (!password) return 'Identifiants non fournis';

		const provider = new Provider(undefined!, {
			password: password.password,
			username: password.username,
			domain: server,
			userId: 0,
		});

		const response = await provider.fetch('GET', 'current-user');

		if (response.ok) return undefined;
		return response.text();
	}

	static fromDatabase(db: DatabaseHandle, account: DB.Account) {
		if (account.type !== 'ecosignal') throw new Error('Invalid account type');
		return new Provider(db, {
			password: account.password,
			domain: account.domain,
			username: account.username,
			displayName: account.displayName,
			avatarURL: account.avatarURL,
			userId: account.userId,
			color: account.color,
			id: account.id,
		});
	}

	static async login(db: DatabaseHandle, { server, password }: LoginData<string>) {
		if (!password) throw new Error('No login data provided');

		const provider = new Provider(db, { domain: server, ...password, userId: 0 });

		const { data: me } = await provider.json('GET', 'v1', 'current-user', Provider.MeResponse);

		return {
			type: 'ecosignal' as const,
			password: password.password,
			username: me.username,
			displayName: me.name,
			userId: me.user_id,
			domain: server,
			color: me.color,
			avatarURL: undefined,
			profileURL: undefined,
		};
	}

	async logout() {
		const response = await this.fetch('DELETE', 'auth-tokens/current');

		if (!response.ok) {
			throw new Error(`Impossible de se déconnecter de EcoSignal: ${await response.text()}`);
		}
	}

	async *sessions({ cursor = '', limit = 40, mine = false } = {}) {
		const yielded = new Set<string>();
		let total = 0;

		for (const p of await this.db.getAll('Protocol')) {
			const protocol = Schemas.Protocol.assert(p);
			if (!protocol.remote?.ecosignal) continue;
			const config = protocol.remote.ecosignal;

			// const project = await this.json(
			// 	'GET',
			// 	'v1',
			// 	`projects/${config.project}`,
			// 	Provider.ProjectResponse
			// );

			const collections = await this.json(
				'GET',
				'v1',
				'collections',
				Provider.CollectionsResponse,
				{
					page_size: Math.min(limit, 100),
					page: this.#pageNumberOfCursor(cursor),
					creator_id: mine ? this.userId : undefined,
					order_by: 'creation_date',
					order_dir: 'desc',
				}
			);

			total += collections.data.length;
			yield { total };

			for (const collection of collections.data) {
				const gid = this.#sessionRemoteID(collection.collection_id);

				if (yielded.has(gid)) continue;

				// Fetch IDs for media of first 3 photos for thumbnails
				const media = await this.json('GET', 'v1', 'media', this.MediaResponse, {
					page: 1,
					page_size: 3,
					project_id: config.project,
					collection_id: collection.collection_id,
					media_type: 'photo',
					order_by: 'date_time',
					order_dir: 'desc',
				});

				yielded.add(gid);
				yield {
					id: gid,
					name: collection.name,
					page: new URL(
						`${this.domain}/dashboard/${config.project}?tab=media&collection=${collection.collection_id}`
					),
					protocol: protocol.id,
					submittedAt: collection.creation_date,
					submittedBy: collection.creator_name,
					nextCursor: cursor
						? this.#nextCursor(cursor)
						: this.#createCursor(`collections/${collection.collection_id}`, 1),
					// TODO: media that maps to file metadata
					filesCount: 0,
					imagesCount: media.page_info.total,
					thumbnails: media.data.map(
						(image) => image.previews[0]?.url ?? image.media_url
					),
				};
			}
		}
	}

	async thumbnail(url: URL) {
		return this.fetch('GET', url)
			.then((response) => response.blob())
			.then((blob) => new URL(URL.createObjectURL(blob)));
	}

	async session(protocol: DB.Protocol, id: SessionRemoteID) {
		if (!protocol.remote?.ecosignal) {
			throw new Error("This protocol doesn't support EcoSignal remote sessions");
		}

		const { collectionId } =
			this.#parseSessionRemoteID(id) ??
			throwError(
				`Invalid remote session ID ${JSON.stringify(id)} for a EcoSignal remote session`
			);

		const { data: collection } = await this.json(
			'GET',
			'v1',
			`collections/${collectionId}`,
			Provider.CollectionResponse
		);

		return {
			remoteId: id,
			protocol: protocol.id,
			name: collection.name,
			createdAt: collection.creation_date.toISOString(),
			description: collection.description.free,
			openedAt: new Date().toISOString(),
			metadata: collection.description.metadata ?? {},
			neuralModels: {},
			group: {
				global: { field: 'none', tolerances: { dates: 'day', decimal: 'unit' } } as const,
			},
			sort: {
				global: { field: 'name', direction: 'asc' } as const,
			},
		};
	}

	async *files() {}

	async items(protocol: DB.Protocol, session: DB.Session, onProgress: (message: string) => void) {
		const { config } = this.#protocolEcosignalConfig(protocol);

		if (!session.remoteId) throw new Error(`This session isn't linked to a remote session`);

		const cropMetadataId = resolveMetadataImport(
			protocol,
			ensureNamespacedMetadataId(config.crop, protocol.id)
		);

		const { collectionId } =
			this.#parseSessionRemoteID(session.remoteId) ??
			throwError(`Invalid remote session ID for EcoSignal: ${session.remoteId}`);

		type Page = (typeof this.MediaResponse)['infer'];
		type Media = Page['data'][number] & {
			file: (typeof DB.Tables.ImageFile)['inferIn'];
			annotations: Array<
				(typeof Provider.AnnotationsAllResponse)['infer']['data'][number] & {
					reviews: (typeof Provider.ReviewsResponse)['infer']['data'];
				}
			>;
		};

		let page: Page | undefined;
		let media = [] as Media[];

		let done = 0;
		while (!page || page.page_info.page < page.page_info.total_pages) {
			page = await this.json('GET', 'v1', 'media', this.MediaResponse, {
				page: (page?.page_info.page ?? 0) + 1,
				project_id: config.project,
				collection_id: collectionId,
				media_type: 'photo',
			});

			for (const image of page.data) {
				done++;
				onProgress(`Images (${done}/${page.page_info.total})…`);

				const gid = image.media_url.toString();

				// TODO: maybe check hashes to make sure image hasnt changed on EcoSignal ?
				let file = await this.db.getFromIndex('ImageFile', 'remoteId', gid);

				if (!file) {
					const blob = await this.fetch('GET', image.media_url).then((response) =>
						response.blob()
					);

					// TODO: ask to add this (instead of having to analyze the file),
					const { width, height } = await createImageBitmap(blob);

					const created = await createBytes('ImageFile', {
						// TODO: ask to make sure EcoSignal guarantees uniqueness accross collections
						filename: image.filename,
						sessionId: session.id,
						bytes: await blob.arrayBuffer(),
						type: blob.type as `image/${string}`,
					});

					file = {
						...created,
						id: imageFileId(),
						remoteId: gid,
						sessionId: session.id,
						contentType: blob.type,
						dimensions: { width, height },
					};

					if (image.previews[0]?.url) {
						const blob = await this.fetch('GET', image.previews[0].url).then(
							(response) => response.blob()
						);

						const { width, height } = await createImageBitmap(blob);

						const created = await createBytes('ImagePreviewFile', {
							filename: image.filename,
							sessionId: session.id,
							bytes: await blob.arrayBuffer(),
							type: blob.type as `image/${string}`,
						});

						await this.db.put('ImagePreviewFile', {
							...created,
							id: file.id,
							remoteId: gid,
							sessionId: session.id,
							contentType: blob.type,
							dimensions: { width, height },
						});
					} else {
						console.warn(
							`EcoSignal image ${image.media_url} has no associated preview, not creating ImagePreviewFile!`,
							image
						);
					}
				}

				const { data: annotations } = await this.json(
					'GET',
					'v1',
					'annotations/all',
					Provider.AnnotationsAllResponse,
					{
						project_id: config.project,
						collection_id: collectionId,
						media_id: image.media_id,
					}
				);

				// TODO: ask ecosignal for ability to filter by media_id to avoid this N+1 problem
				const reviews = await Promise.allSettled(
					annotations.map(async (ann) =>
						this.json('GET', 'v1', 'reviews', Provider.ReviewsResponse, {
							project_id: config.project,
							collection_id: collectionId,
							annotation_id: ann.annotation_id,
							order_by: 'creation_date',
							order_dir: 'desc',
							// We consider that the latest review IS the truth about confirmed status
							page_size: 1,
						})
					)
				).then((results) =>
					results.flatMap((result) =>
						result.status === 'fulfilled' ? result.value.data : []
					)
				);

				media.push({
					...image,
					file,
					annotations: annotations.map((ann) => ({
						...ann,
						reviews: reviews.filter(
							(review) => review.annotation_id === ann.annotation_id
						),
					})),
				});
			}
		}

		onProgress('Images (finalisation)…');

		return {
			files: media.map(({ file }) => file),
			observations: media.map(
				(image) =>
					({
						id: generateId('Observation'),
						sessionId: session.id,
						label: fallbackObservationLabel([image]),
						addedAt: image.creation_date.toISOString(),
						metadataOverrides: transformObject(
							image.note?.metadata ?? {},
							(key, value) => {
								if (value.value === null) return undefined;

								const fullkey = resolveMetadataImport(
									protocol,
									ensureNamespacedMetadataId(key, protocol.id)
								);

								return [fullkey, serializeMetadataFullValue(value)];
							}
						),
						images: image.annotations.map((ann) =>
							imageId(image.file.id, ann.annotation_id)
						),
					}) satisfies DBIn['Observation']
			),
			images: media.flatMap((image) => {
				if (image.annotations.length > 0) {
					return image.annotations.map((ann) => {
						const box = this.#resolveBoundingBox(ann, image.file);

						return {
							id: imageId(image.file.id, ann.annotation_id),
							filename: image.filename,
							addedAt: ann.creation_date.toISOString(),
							dimensions: image.file.dimensions,
							boundingBoxesAnalyzed: true,
							contentType: image.file.contentType,
							fileId: image.file.id,
							sessionId: session.id,
							metadata: {
								...transformObject(ann.comments?.metadata ?? {}, (key, value) => {
									if (value.value === null) return undefined;

									const fullkey = resolveMetadataImport(
										protocol,
										ensureNamespacedMetadataId(key, protocol.id)
									);

									return [fullkey, serializeMetadataFullValue(value)];
								}),

								[cropMetadataId]: serializeMetadataFullValue({
									...box,
									alternatives: [],
									manuallyModified: true,
									isDefault: false,
									confirmed: ann.reviews.some(
										(r) => r.status_name === config.confirmedStatus
									),
									confidences: {
										[serializeMetadataValue(box.value)]: box.confidence,
									},
								}),
							},
						} satisfies DBIn['Image'];
					});
				} else {
					return [
						{
							id: imageId(image.file.id, 0),
							filename: image.filename,
							addedAt: image.creation_date.toISOString(),
							dimensions: image.file.dimensions,
							// Runs our analysis on images added to EcoSignal outside of Cigale
							boundingBoxesAnalyzed: Boolean(
								config.label && image.labels.includes(config.label)
							),
							contentType: image.file.contentType,
							fileId: image.file.id,
							sessionId: session.id,
							metadata: {},
						} satisfies DBIn['Image'],
					];
				}
			}),
		};
	}

	async *upload(protocol: DB.Protocol, session: DB.Session) {
		/** Prefix action with > to indent, and with = to not indent */
		function progressUpdate(
			action: string,
			done?: number,
			total?: number,
			unit?: 'bytes' | undefined
		) {
			return { indent: false, message: 'progress', action, done, total, unit };
		}

		let siteId: number | undefined = undefined;
		for await (const update of this.#resolveSite(protocol, session)) {
			if (update.phase === 'done') {
				siteId = update.siteId;
			} else {
				yield progressUpdate(
					switchValue(update.phase, {
						search: 'Recherche du site',
						creating: 'Création du site',
						updating: 'Mise à jour du site',
					}),
					update.done ?? 0,
					update.total ?? 0
				);
			}
		}

		yield progressUpdate(
			session.remoteId ? 'Mise à jour de la collection' : 'Création de la collection'
		);

		let collectionId = await this.#setCollection(protocol, session);

		yield { message: 'session-id', remoteId: this.#sessionRemoteID(collectionId) };

		if (siteId) {
			yield progressUpdate('Association de la collection au site');
			await this.#linkCollectionToSite(protocol, collectionId, siteId);
		}

		const files = await this.db
			.getAllFromIndex('ImageFile', 'sessionId', session.id)
			.then((files) => files.map((f) => Tables.ImageFile.assert(f)));

		type Upload = {
			file: DB.ImageFile;
			mediaId: number | undefined;
			fileUploadId: number | undefined;
		};

		/** Filename → (info) */
		const uploads = new Map<string, Upload>(
			files.map((file) => [
				file.filename,
				{ file, mediaId: undefined, fileUploadId: undefined },
			])
		);

		yield progressUpdate('Scan des médias existants');

		for await (const { done, total, page } of this.#existingMedia({
			protocol,
			collectionId,
			filenamesToCheck: uploads,
		})) {
			// otherwise its creates a dupe message since total=0 means no progress bar
			if (total > 0) yield progressUpdate('Scan des médias existants', done, total);

			for (const media of page) {
				const file = files.find((f) => f.filename === media.filename);
				if (!file) continue;
				uploads.set(media.filename, {
					mediaId: media.media_id,
					file,
					fileUploadId: undefined,
				});
			}
		}

		yield progressUpdate('Upload des fichiers');

		const batchId = await this.json(
			'POST',
			'v1',
			'file-upload-batches',
			Provider.ResponseBase({ batch_id: 'string' }).pipe((r) => r.data.batch_id)
		);

		let done = 0;
		const self = this;

		const toUpload = [...uploads.values()].filter((u) => !u.mediaId).map((u) => u.file);

		const fileSizes = new Map(
			await Promise.all(
				toUpload.map(
					async (file) =>
						[file.filename, await byteSizeOfObject('ImageFile', file)] as const
				)
			)
		);

		const uploadedSizes = new Map(toUpload.map((file) => [file.filename, 0]));

		const totalSizeToUpload = sum(fileSizes.values());

		for (const filebatch of chunk(toUpload, 3)) {
			for await (const { input: file, output } of concurrently(
				filebatch,
				async function* (file) {
					yield* self.#uploadImageFile({ protocol, collectionId, batchId, file });
				}
			)) {
				uploadedSizes.set(file.filename, output.doneBytes);

				yield progressUpdate(
					'Upload des fichiers',
					// done + output.done / output.total,
					// files.length
					sum(uploadedSizes.values()),
					totalSizeToUpload,
					'bytes'
				);

				if (output.done >= output.total) {
					uploads.set(file.filename, {
						file,
						mediaId: undefined,
						fileUploadId: output.fileUploadId,
					});
				}
			}
		}

		console.debug('Creating media from uploads', uploads);

		const fileUploadIds = [...uploads.values()].map((u) => u.fileUploadId).filter(nonnull);
		const total = fileUploadIds.length;

		if (fileUploadIds.length > 0) {
			yield progressUpdate('Création des médias');

			for await (const { done, progress } of this.#createMedia({
				collectionId,
				protocol,
				fileUploadIds,
			})) {
				if (done) {
					yield progressUpdate('Création des médias', total, total);
				} else if (progress) {
					yield progressUpdate('Création des médias', progress.completed, progress.total);
				}
			}
		}

		yield progressUpdate('Scan des nouveaux médias');

		for await (const { done, total, page } of this.#existingMedia({
			protocol,
			collectionId,
			filenamesToCheck: new Set(toUpload.map((f) => f.filename)),
		})) {
			// otherwise its creates a dupe message since total=0 means no progress bar
			if (total > 0) yield progressUpdate('Scan des nouveaux médias', done, total);

			for (const media of page) {
				const file = files.find((f) => f.filename === media.filename);
				if (!file) continue;

				uploads.set(media.filename, {
					file,
					mediaId: media.media_id,
					fileUploadId: uploads.get(media.filename)?.fileUploadId,
				});
			}
		}

		yield progressUpdate(`Ajout du label ${this.#fromCigaleLabelName(protocol)}`);

		for await (const { name, done, total } of this.#setMediaLabels({
			protocol,
			mediaIds: [...uploads.values()].map((u) => u.mediaId).filter(nonnull),
		})) {
			yield progressUpdate(`Ajout du label ${name}`, done, total);
		}

		yield progressUpdate('Création des annotations');

		done = 0;
		for await (const { output } of concurrently(
			[...uploads.values()],
			async function* (upload) {
				yield* self.#setAnnotations({
					protocol,
					sessionId: session.id,
					collectionId,
					...upload,
				});
			}
		)) {
			if (output.done === output.total) {
				yield progressUpdate('Création des annotations', ++done, uploads.size);
			}
		}
	}

	async *#resolveSite(protocol: DB.Protocol, session: DB.Session) {
		const { siteNameMetadata, config, siteLocationMetadata } =
			this.#protocolEcosignalConfig(protocol);

		console.log(config, siteNameMetadata);

		if (!config.sites) return;

		if (!siteNameMetadata) {
			throw new Error(
				`Métadonnée ${config.sites.name.metadata} introuvable. Contacte les responsables du protocole ${protocol.name}`
			);
		}

		const name = session.metadata[siteNameMetadata]?.value?.toString();
		if (!name) {
			const def = await this.db.get('Metadata', siteNameMetadata);
			throw new Error(`Site non renseigné: remplir ${def?.label || siteNameMetadata}`);
		}

		let sites = [] as Array<{ site_id: number; name: string; creator_id: number }>;

		const matches = (site: (typeof sites)[number]) =>
			site.name === name && (config.sites.protect ? site.creator_id === this.userId : true);

		let page_info = { page: 0, total_pages: 1 };

		while (!sites.some(matches) && page_info.page < page_info.total_pages) {
			yield {
				phase: 'search' as const,
				done: page_info.page,
				total: page_info.total_pages,
			};

			({ data: sites, page_info } = await this.json(
				'GET',
				'v1',
				'sites',
				Provider.SitesResponse,
				{
					project_id: config.project,
					name,
					page: page_info.page + 1,
				}
			));
		}

		yield {
			phase: 'search' as const,
			done: page_info.page,
			total: page_info.page,
		};

		const existing = sites.find(matches);

		if (!existing && !config.sites.create) {
			throw new Error(
				config.sites.protect
					? `Site ${name} non trouvé à ton nom, crée-le sur ${this.domain} directement`
					: `Site ${name} non trouvé, demande à l'équipe de le créer`
			);
		}

		const ensureLocationType = (value: RuntimeValue | undefined) =>
			value === undefined ? undefined : hasRuntimeType('location', value) ? value : undefined;

		const location = siteLocationMetadata
			? ensureLocationType(session.metadata[siteLocationMetadata]?.value)
			: undefined;

		const siteData = location
			? {
					name,
					location_method: 'coordinates' as const,
					...location,
				}
			: {
					name,
					location_method: 'administrative' as const,
					gadm0_gid: config.sites.location.fallback,
				};

		if (!existing) {
			// TODO: support "detail" on ProgressTree for messages that dont have progress info (put in grey text at same place as div.counts), and use it for site search (=site name), site creation/update (=site name), collection update (=session name),

			yield { phase: 'creating' as const };

			const { data: created } = await this.json(
				'POST',
				'v1',
				'sites',
				Provider.SiteCreateResponse,
				{},
				Provider.SiteCreatePayload,
				{
					project_id: config.project,
					...siteData,
				}
			);

			yield { phase: 'done' as const, siteId: created.site_id };
		} else {
			yield { phase: 'updating' as const };

			await this.json(
				'PATCH',
				'v1',
				`sites/${existing.site_id}`,
				type.unknown,
				{},
				Provider.SiteUpdatePayload,
				siteData
			);

			yield { phase: 'done' as const, siteId: existing.site_id };
		}
	}

	async #linkCollectionToSite(
		protocol: DB.Protocol,
		collectionId: number,
		siteId: number | undefined
	) {
		if (siteId === undefined) return;

		const { config } = this.#protocolEcosignalConfig(protocol);

		// TODO: ask for a API route to just link another collection to a site
		// currently, by my reading of ecosignal's source, adding a new link to a collection that already exists can cause duplicate DB records? (tho maybe theres a unicity enforced at the pgsql level idk)
		// regardless, this asks us to retrieve ALL collection links to the site just to add one, since if we can manage a collection or a project, any collection not mention in the PUT request will be removed

		const { data: already } = await this.json(
			'GET',
			'v1',
			`sites/${siteId}/collection-options`,
			Provider.SiteCollectionsResponse,
			{
				project_id: config.project,
			}
		);

		await this.json(
			'PUT',
			'v1',
			'sites/collections',
			type.unknown,
			{
				project_id: config.project,
			},
			Provider.SiteCollectionLinkPayload,
			{
				site_ids: [siteId],
				collection_ids: [
					...already.current_project.collections.map((c) => c.collection_id),
					collectionId,
				],
			}
		);
	}

	async #setCollection(protocol: DB.Protocol, session: DB.Session) {
		const { config } = this.#protocolEcosignalConfig(protocol);

		let collectionId: number | undefined;

		if (session.remoteId) {
			const existingCollection = await this.json(
				'GET',
				'v1',
				`collections/${this.#parseSessionRemoteID(session.remoteId).collectionId}`,
				Provider.CollectionResponse
			).catch(() => undefined);

			collectionId = existingCollection?.data.collection_id;
		}

		if (!collectionId) {
			const created = await this.json(
				'POST',
				'v1',
				'collections',
				Provider.ResponseBase({ collection_id: 'number.integer' }),
				{
					project_id: config.project,
				},
				Provider.CollectionCreatePayload,
				{
					name: session.name,
					description: this.#compoundMetadataToMultilineField(
						session.description,
						session.metadata
					),
				}
			);

			collectionId = created.data.collection_id;
		} else {
			await this.json(
				'PATCH',
				'v1',
				`collections/${collectionId}`,
				type.unknown,
				{},
				Provider.CollectionUpdatePayload,
				{
					name: session.name,
					description: this.#compoundMetadataToMultilineField(
						session.description,
						session.metadata
					),
				}
			);
		}

		return collectionId;
	}

	async *#existingMedia({
		protocol,
		collectionId,
		/** Filenames to check for existence of. This allows not iterating thru all pages if we can */
		filenamesToCheck,
	}: {
		protocol: DB.Protocol;
		collectionId: number;
		filenamesToCheck: Set<string> | Map<string, unknown>;
	}) {
		const unseen = structuredClone(filenamesToCheck);

		const { config } = this.#protocolEcosignalConfig(protocol);

		const query = async (page = 1) =>
			await this.json('GET', 'v1', 'media', this.MediaResponse, {
				project_id: config.project,
				collection_id: collectionId,
				order_by: 'creation_date',
				order_dir: 'desc',
				page,
			});

		let { page_info, data } = await query();

		let done = data.length;
		const total = page_info.total;

		data.forEach((media) => unseen.delete(media.filename));

		yield { done, total, page: data };

		while (unseen.size > 0 && page_info.page < page_info.total_pages) {
			({ data, page_info } = await query(page_info.page + 1));

			done += data.length;
			data.forEach((media) => unseen.delete(media.filename));

			yield { done, total, page: data };
		}

		yield { done: total, total, page: [] };
	}

	async *#setMediaLabels({ protocol, mediaIds }: { protocol: DB.Protocol; mediaIds: number[] }) {
		const name = this.#fromCigaleLabelName(protocol);

		yield { name, done: 0, total: mediaIds.length };

		if (mediaIds.length === 0) return;

		const { config } = this.#protocolEcosignalConfig(protocol);
		const id = await this.#fromCigaleLabelId(protocol);

		const { data } = await this.json(
			'PUT',
			'v1',
			'media-labels',
			Provider.MediaLabelsResponse,
			{ project_id: config.project },
			Provider.MediaLabelsPayload,
			{
				label_id: id,
				media_ids: mediaIds,
			}
		);

		if (data.failed.length > 0) {
			console.warn(`Could not set label ${id} on the following media IDs`, data.failed);
		}

		yield { name, done: data.succeeded.length, total: data.succeeded.length };
	}

	async *#setAnnotations({
		file,
		protocol,
		sessionId,
		collectionId,
		mediaId,
	}: {
		file: DB.ImageFile;
		protocol: DB.Protocol;
		sessionId: string;
		collectionId: number;
		mediaId?: number | undefined;
	}) {
		const { config, cropMetadataId } = this.#protocolEcosignalConfig(protocol);

		const images = await this.db.getAllFromIndex('Image', 'sessionId', sessionId);
		const observations = await this.db.getAllFromIndex('Observation', 'sessionId', sessionId);

		const fileImages = images
			.filter((image) => image.fileId === file.id)
			.map((i) => Tables.Image.assert(i));

		const fileObservations = observations
			.filter((obs) => fileImages.some((img) => obs.images.includes(img.id)))
			.map((o) => Tables.Observation.assert(o));

		if (fileObservations.length > 1) {
			// throw new Error(
			// 	`Le ficher ${file.filename} est dans plusieurs observations à la fois (${fileObservations.map((o) => o.label).join(', ')}). Cette session n'est pas (pour l'instant) compatible avec EcoSignal`
			// );
			console.warn(
				`File ${file.filename} has multiple observations, using first one`,
				fileObservations
			);
		}

		const observation = fileObservations.at(0);

		mediaId ??= await this.#existingMediaId(protocol, collectionId, file);

		if (!mediaId) {
			console.error('Couldnt upload, skipping to next', file);
			return;
		}

		await this.json(
			'PATCH',
			'v1',
			`media/${mediaId}`,
			type.unknown,
			{ project_id: config.project },
			Provider.MediaUpdatePayload,
			{
				date_time: observation?.addedAt ?? new Date(),

				note: observation
					? this.#compoundMetadataToSinglelineField(
							undefined,
							observation.metadataOverrides
						)
					: null,
			}
		);

		const { data: existingAnnotations } = await this.json(
			'GET',
			'v1',
			'annotations/all',
			Provider.AnnotationsAllResponse,
			{
				project_id: config.project,
				collection_id: collectionId,
				media_id: mediaId,
			}
		);

		for (const [i, image] of fileImages.entries()) {
			yield { done: i, total: fileImages.length };

			const box = image.metadata[cropMetadataId];
			if (!box) continue;
			if (!hasRuntimeType('boundingbox', box.value)) continue;

			const id = parseImageId(image.id);

			// Find boxes that also exist on EcoSignal
			// for these, use the most recently modified one

			const existing = existingAnnotations.find(
				(ann) =>
					ann.annotation_id === id.subindex ||
					this.#boxMatchesWithAnnotation(
						file,
						box.value as RuntimeValue<'boundingbox'>,
						ann
					)
			);

			const annotationData = {
				...this.#toEcoSignalBoxCoords(box.value, file),
				uncertain: box.confidence < 1 && !box.confirmed,
				comments: this.#compoundMetadataToSinglelineField(box.confidence, image.metadata),
			};

			if (!existing) {
				await this.json(
					'POST',
					'v1',
					'annotations',
					type.unknown,
					{},
					Provider.AnnotationCreatePayload,
					{
						project_id: config.project,
						media_id: mediaId,
						object_type: 'organism',
						...annotationData,
					}
				);
			} else {
				await this.json(
					'PATCH',
					'v1',
					`annotations/${existing.annotation_id}`,
					type.unknown,
					{ project_id: config.project },
					Provider.AnnotationUpdatePayload,
					annotationData
				);
			}
		}

		yield { done: fileImages.length, total: fileImages.length };
	}

	async *#createMedia({
		fileUploadIds,
		collectionId,
		protocol,
	}: {
		protocol: DB.Protocol;
		fileUploadIds: number[];
		collectionId: number;
	}) {
		if (fileUploadIds.length === 0) {
			yield { done: true };
			return;
		}

		const { config } = this.#protocolEcosignalConfig(protocol);

		const { data: creation } = await this.json(
			'POST',
			'v1',
			'media',
			Provider.ResponseBase({ queue_id: 'number' }),
			{ project_id: config.project },
			Provider.MediaCreatePayload,
			{
				collection_id: collectionId,
				file_upload_ids: fileUploadIds,
				// XXX: corrected when PATCHing the media
				date_time: new Date(),
				// date_time: observation?.addedAt ?? new Date(),
				media_type: 'photo',
				// ...mediaData,
			}
		);

		const self = this;
		for await (const queue of poll(
			200,
			async () => self.#mediaQueueStatus(config.project, creation.queue_id),
			(queue) => queue.done
		)) {
			yield queue;
		}
	}

	async *#uploadImageFile({
		collectionId,
		batchId,
		file,
	}: {
		protocol: DB.Protocol;
		collectionId: number;
		batchId: string;
		file: DB.ImageFile;
	}) {
		let fileUploadId: number | undefined;
		let totalChunks = 0;

		/** chunk index → size in bytes */
		const chunkSizes = new Map<number, number>();

		for await (const chunk of streamBytes('ImageFile', file, 2e6)) {
			totalChunks = chunk.total;
			chunkSizes.set(chunk.index, chunk.bytes.byteLength);

			const { data } = await this.json(
				'POST',
				'v1',
				`file-upload-batches/${batchId}/chunks`,
				Provider.ResponseBase({ 'file_upload_id?': 'number.integer' }),
				{},
				Provider.FileUploadBatchChunkPayload,
				{
					filename: this.#conformFilename(file.filename),
					chunk_index: chunk.index,
					total_chunks: chunk.total,
					collection_id: collectionId,
					media_type: 'photo',
					file: new File([chunk.bytes], this.#conformFilename(file.filename), {
						type: file.contentType,
					}),
				}
			);

			if (data.file_upload_id) fileUploadId = data.file_upload_id;
		}

		for await (const status of poll(
			500,
			async () => this.#fileUploadStatus(batchId, file.filename),
			(status) => status.uploaded_chunks >= totalChunks
		)) {
			yield {
				done: status.uploaded_chunks,
				total: totalChunks,
				doneBytes: sum(status.uploaded_indices.map((i) => chunkSizes.get(i) ?? 0)),
				fileUploadId,
			};
		}
	}

	#conformFilename(filename: string): string {
		return filename;
	}

	// TODO: add remote id on ImageFile to avoid using the filename
	async #existingMediaId(protocol: DB.Protocol, collectionId: number, file: DB.ImageFile) {
		const { config } = this.#protocolEcosignalConfig(protocol);

		return await this.json('GET', 'v1', 'media', this.MediaResponse, {
			project_id: config.project,
			collection_id: collectionId,
			filename: this.#conformFilename(file.filename),
			order_by: 'creation_date',
			order_dir: 'desc',
		})
			.catch(() => undefined)
			.then(
				(existing) =>
					existing?.data.find((m) => m.filename === this.#conformFilename(file.filename))
						?.media_id
			);
	}

	async #fileUploadStatus(batchId: string, filename: string) {
		const { data: status } = await this.json(
			'GET',
			'v1',
			`file-upload-batches/${batchId}/files/${this.#conformFilename(filename)}`,
			Provider.FileUploadBatchResponse
		);

		if (!status.exists)
			throw new Error(`File ${this.#conformFilename(filename)} not found in batch`);

		return status;
	}

	async #mediaQueueStatus(projectId: number, queueId: number) {
		const { data } = await this.json('GET', 'v1', `queues/${queueId}`, Provider.QueueResponse, {
			project_id: projectId,
		});

		switch (data.status) {
			case 'completed':
				return { done: true };
			case 'warning': {
				console.warn(
					`Warning returned by EcoSignal for uploads of queue ${queueId}: ${data.warning ?? '(None)'}`
				);
				return { done: true };
			}
			case 'error':
				throw new Error(`Impossible d'uploader: ${data.error ?? 'Erreur inattendue'}`);
			case 'running':
				return { done: false, progress: data };
			default:
				return { done: false };
		}
	}

	#fromCigaleLabelName(protocol: DB.Protocol) {
		const { config } = this.#protocolEcosignalConfig(protocol);
		return config.label ?? 'from-cigale';
	}

	async #fromCigaleLabelId(protocol: DB.Protocol) {
		const { config } = this.#protocolEcosignalConfig(protocol);
		const name = this.#fromCigaleLabelName(protocol);
		const cached = this.#labelIds.get(name);
		if (cached) return cached;

		const { data: labels } = await this.json('GET', 'v1', 'labels', Provider.LabelsResponse);

		const label =
			labels.find((label) => label.name === name) ??
			throwError(
				`Label EcoSignal "${name}" introuvable. Demande à un administrateur de ${this.server} de le crééer.`
			);

		this.#labelIds.set(name, label.label_id);

		return label.label_id;
	}

	#protocolEcosignalConfig(protocol: DB.Protocol) {
		const config = protocol.remote?.ecosignal;
		if (!config)
			throw new Error(`Le protocole ${protocol.id} ne supporte pas les sessions EcoSignal`);

		const metadataId = (key: string | undefined) =>
			key
				? resolveMetadataImport(protocol, ensureNamespacedMetadataId(key, protocol.id))
				: undefined;

		const domains = ensureArray(config.domains);

		return {
			config,
			domains,
			cropMetadataId: metadataId(config.crop),
			siteLocationMetadata: metadataId(config.sites?.location.metadata),
			siteNameMetadata: metadataId(config.sites?.name.metadata),
		};
	}

	#boundingBoxResolver = boundingBoxResolver(['sx', 'ex', 'sy', 'ey', 'score']);
	#resolveBoundingBox(
		ann: (typeof Provider.AnnotationsAllResponse)['infer']['data'][number],
		file: DBIn['ImageFile']
	) {
		const { score, ...coords } = this.#boundingBoxResolver(0, [
			ann.min_x,
			ann.max_x,
			ann.min_y,
			ann.max_y,
			ann.comments?.boxConfidence ?? 1,
		]);

		return {
			confidence: score,
			value: coordsScaler({
				x: 1 / file.dimensions.width,
				y: 1 / file.dimensions.height,
			})(coords),
		};
	}

	#toEcoSignalBoxCoords(
		box: RuntimeValue<'boundingbox'>,
		file: Pick<DBIn['ImageFile'], 'dimensions'>
	) {
		const { width, height } = file.dimensions;

		const scaled = coordsScaler({
			x: width,
			y: height,
		})(box);

		return {
			min_x: clamp(scaled.x - scaled.w / 2, 0, width),
			min_y: clamp(scaled.y - scaled.h / 2, 0, height),
			max_x: clamp(scaled.x + scaled.w / 2, 0, width),
			max_y: clamp(scaled.y + scaled.h / 2, 0, height),
		};
	}

	#boxMatchesWithAnnotation(
		file: Pick<DBIn['ImageFile'], 'dimensions'>,
		box: RuntimeValue<'boundingbox'>,
		annotation: (typeof Provider.AnnotationsAllResponse)['infer']['data'][number]
	) {
		const converted = this.#toEcoSignalBoxCoords(box, file);

		for (const coord of ['min_x', 'min_y', 'max_x', 'max_y']) {
			if (Math.round(converted[coord] - annotation[coord]) !== 0) {
				return false;
			}
		}

		return true;
	}

	#nextCursor(cursor: string): string {
		const parsed = this.#parseCursor(cursor);
		if (!parsed) throw new Error('Cannot get next cursor of empty cursor');

		return this.#createCursor(parsed.pathname, parsed.page + 1);
	}

	#parseCursor(cursor: string | undefined): undefined | { page: number; pathname: string } {
		if (!cursor) return undefined;
		const { pathname, searchParams } = new URL(cursor);

		return {
			pathname: pathname.replace(/^\/api\/v1\//, ''),

			page: Number.parseInt(searchParams.get('page') ?? '1'),
		};
	}

	#createCursor(pathname: string, page: number) {
		return new URL(`${this.domain}/api/v1/${pathname}?page=${page}`).toString();
	}

	#pageNumberOfCursor(cursor: string | undefined): number {
		return this.#parseCursor(cursor)?.page ?? 1;
	}

	#sessionRemoteID(collectionId: number) {
		return SessionRemoteID.assert(`/api/v1/collections/${collectionId}`);
	}

	#parseSessionRemoteID(id: SessionRemoteID): { collectionId: number } {
		return {
			collectionId: Number.parseInt(
				id.split('/').at(-1) ?? throwError('Session remote ID is empty')
			),
		};
	}

	async json<Response extends Type, Request extends Type>(
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		_version: 'v1',
		path: string,
		responseSchema: Response,
		queryParams?: Record<string, unknown>,
		bodySchema?: Request,
		body?: Request['inferIn'],
		init?: RequestInit
	): Promise<Response['infer']> {
		const headers = new Headers(init?.headers ?? []);
		const isFormData = bodySchema?.meta.encoding === 'multipart';

		let encodedBody: string | FormData | undefined;

		if (body && bodySchema && method !== 'GET') {
			if (isFormData) {
				encodedBody = new FormData();
				for (const [key, value] of Object.entries(bodySchema.assert(body))) {
					if (value instanceof Blob) {
						encodedBody.append(key, value);
					} else if (value !== undefined && value !== null) {
						encodedBody.append(key, value.toString());
					}
				}
			} else {
				encodedBody = JSON.stringify(bodySchema.assert(body));
				headers.set('Content-Type', 'application/json');
			}
		}

		if (!headers.has('Accept')) {
			headers.set('Accept', 'application/json');
		}

		const response = await this.fetch(method, path, queryParams, {
			...init,
			body: encodedBody ?? null,
			headers,
		});

		if (!response.ok) {
			throw new Error('Impossible de communiquer avec EcoSignal: ' + (await response.text()));
		}

		const data = responseSchema(await response.json());

		if (data instanceof ArkErrors) {
			throw new Error('Données invalides envoyées par EcoSignal: ' + data.summary);
		}

		return data;
	}

	async ratelimit(req: Request) {
		if (['GET', 'OPTIONS'].includes(req.method)) {
			return this.rateLimiters.read();
		}

		if (req.headers.get('Content-Type')?.startsWith('multipart/form-data')) {
			return this.rateLimiters.heavyWrite();
		}

		return this.rateLimiters.write();
	}

	async fetch(
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		/** When passing a URL, the API route prefix (/api/v1) and domain wont be added */
		pathname: string | URL,
		queryParams: Record<string, unknown> = {},
		init: RequestInit = {}
	) {
		this.#maybeAbort();

		await this.#refreshToken();

		init.method = method;
		init.headers = new Headers(init.headers);
		init.headers.set('Authorization', `Bearer ${this.#token}`);

		let url =
			typeof pathname === 'string'
				? `${this.domain}/api/v1/${pathname}`
				: pathname.toString();

		if (Object.keys(queryParams).length > 0) {
			url +=
				'?' +
				new URLSearchParams(
					transformObject(queryParams, (key, value) => {
						if (value === undefined) return undefined;
						return [key, String(value)];
					})
				);
		}

		const request = new Request(url, init);

		this.#maybeAbort();

		await this.ratelimit(request);

		this.#maybeAbort();

		this.#lastRequestSentAt = new Date();
		return fetch(request);
	}

	async #refreshToken() {
		if (this.#token && this.#tokenIsValid()) return;

		const login = await fetch(`${this.domain}/api/v1/auth-tokens`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: new URLSearchParams({
				grant_type: 'password',
				username: this.username,
				password: this.#password,
			}),
		});

		if (!login.ok) {
			throw new Error(`Impossible de s'identifier à EcoSignal: ${await login.text()}`);
		}

		const tokens = await login.json();

		this.#token = tokens.access_token;
		this.#tokenIdleDuration =
			tokens.session_idle_timeout_seconds > 0
				? { seconds: tokens.session_idle_timeout_seconds }
				: undefined;
		this.#tokenExpiresAt =
			tokens.expires_in > 0 ? new Date(Date.now() + tokens.expires_in * 1e3) : undefined;
	}

	#tokenIsValid() {
		if (!this.#token) return false;
		if (this.#tokenExpiresAt && isPast(this.#tokenExpiresAt)) return false;
		if (
			this.#tokenIdleDuration &&
			differenceInSeconds(this.#lastRequestSentAt ?? new Date(), new Date()) >
				this.#tokenIdleDuration.seconds
		)
			return false;
		return true;
	}

	#maybeAbort() {
		this.#abortSignal?.throwIfAborted();
	}

	static SINGLE_LINE_COMPOUND_FIELD_PREFIX = 'DONT EDIT, cigale metadata: ';

	static MetadataFieldSingleLinePayload = type({
		'boxConfidence?': '0 <= number <= 1 | undefined',
		metadata: MetadataRecord(type.string),
	});

	#compoundMetadataToSinglelineField(
		boxConfidence: number | undefined,
		metadata: DB.MetadataValues
	) {
		return (
			Provider.SINGLE_LINE_COMPOUND_FIELD_PREFIX +
			JSON.stringify(
				Provider.MetadataFieldSingleLinePayload.assert({
					boxConfidence,
					metadata: {},
					// TODO: wait for https://github.com/LiuDilongNJ/eco-signal/issues/102
					// metadata: transformObject(metadata, (key, value) => {
					// 	return [key, serializeMetadataFullValue(value)];
					// }),
				})
			)
		);
	}

	static MetadataFieldSingleline = type('string | null', '=>', (raw) => {
		if (!raw) return;

		const prefix = Provider.SINGLE_LINE_COMPOUND_FIELD_PREFIX;
		if (raw.startsWith(prefix)) {
			const parsed = safeJSONParse(raw.replace(new RegExp('^' + prefix), ''));
			if (!parsed) return;

			const validated = Provider.MetadataFieldSingleLinePayload(parsed);

			if (!(validated instanceof ArkErrors)) return validated;
		}

		// TODO: a way to store the raw note somewhere
		return;
	});

	static MULTI_LINE_COMPOUND_FIELD_PREFIX = '<pre><code># Cigale metadata:\n';
	static MULTI_LINE_COMPOUND_FIELD_SUFFIX = '</code></pre>';

	static MetadataFieldMultilinePayload = type({ metadata: MetadataRecord(type.string) });

	#compoundMetadataToMultilineField(notes: string, metadata: DB.MetadataValues) {
		return (
			notes +
			'\n\n' +
			Provider.MULTI_LINE_COMPOUND_FIELD_PREFIX +
			YAML.stringify(
				Provider.MetadataFieldMultilinePayload.in({
					metadata: transformObject(metadata, (key, value) => {
						const serialized = serializeMetadataFullValue(
							value
						) as (typeof MetadataValue)['inferIn'];

						// Clean up fields that have defaults
						if (!serialized.isDefault) delete serialized.isDefault;
						if (!serialized.confirmed) delete serialized.confirmed;
						if (!serialized.manuallyModified) delete serialized.manuallyModified;
						if (serialized.alternatives && !serialized.alternatives.length)
							delete serialized.alternatives;

						return [removeNamespaceFromMetadataId(key), serialized];
					}),
				})
			) +
			Provider.MULTI_LINE_COMPOUND_FIELD_SUFFIX
		);
	}

	static DateInput = type('Date', '=>', (date) => dates.format(date, 'yyyy-MM-dd HH:mm:ss'));

	static MetadataFieldMultiline = type('string', '=>', (raw) => {
		const withMetadata = new RegExp(
			`^(?<before>.+?)\\s*${RegExp.escape(this.MULTI_LINE_COMPOUND_FIELD_PREFIX)}(?<metadata>.+?)${RegExp.escape(this.MULTI_LINE_COMPOUND_FIELD_SUFFIX)}$`
		);

		const match = raw.match(withMetadata);
		if (!match?.groups) return { free: raw, metadata: undefined };

		const metadata = Provider.MetadataFieldMultilinePayload(
			YAML.parse(match.groups.metadata) ?? {}
		);

		return {
			free: match.groups.before,
			metadata: metadata instanceof ArkErrors ? undefined : metadata,
		};
	});

	static ResponseBase = type('<data>', {
		code: 'number',
		message: 'string',
		data: 'data',
		meta: {
			timestamp: 'string.date.iso',
			version: 'string',
			request_id: 'string',
		},
	});

	// TODO: Reuse ResponseBase
	static ResponsePaginated = type('<item>', {
		code: 'number',
		message: 'string',
		data: 'item[]',
		meta: {
			timestamp: 'string.date.iso',
			version: 'string',
			request_id: 'string',
		},
		page_info: {
			total: 'number.integer',
			page: 'number.integer',
			page_size: 'number.integer',
			total_pages: 'number.integer',
		},
	});

	static MeResponse = Provider.ResponseBase({
		user_id: 'number',
		username: 'string',
		name: 'string',
		email: 'string.email',
		orcid: 'string',
		color: 'string',
		active: 'boolean',
		can_write_audio: 'boolean = false',
	});

	static ProjectResponse = Provider.ResponseBase({
		project_id: 'number',
		uuid: 'string',
		name: 'string',
		url: 'string',
		picture_id: 'number | ""',
		description: 'string',
		description_short: 'string',
		public: 'boolean',
		archive: 'boolean',
		creator_id: 'number | ""',
		creator_name: 'string',
		picture_url: 'string.url | ""',
	});

	static CollectionsResponse = Provider.ResponsePaginated({
		collection_id: 'number',
		uuid: 'string',
		name: 'string',
		description: 'string',
		external_media_url: 'string.url | ""',
		project_url: 'string.url | ""',
		creator_id: 'number',
		creator_name: 'string',
		creation_date: 'string.date.parse',
		project_ids: 'number[]',
	});

	static CollectionResponse = Provider.ResponseBase({
		collection_id: 'number',
		name: 'string',
		creator_id: 'number',
		creator_name: 'string',
		creation_date: 'string.date.parse',
		project_ids: 'number[]',
		description: Provider.MetadataFieldMultiline,
	});

	static CollectionCreatePayload = type({
		name: 'string <= 100',
		'doi?': 'string|null',
		'description?': 'string|null',
		'sphere?': 'string|null',
		'external_media_url?': 'string.url|null',
		'project_url?': 'string.url|null',
		'public_access?': 'boolean',
		'public_tags?': 'boolean',
	});

	static CollectionUpdatePayload = Provider.CollectionCreatePayload.partial();

	ToFullURL = type('string', '=>', (path) => new URL(this.domain + path));

	MediaResponse = Provider.ResponsePaginated({
		media_id: 'number',
		filename: 'string',
		name: 'string',
		date_time: 'string.date.parse',
		creation_date: 'string.date.parse',
		uuid: 'string',
		media_url: this.ToFullURL,
		previews: [{ url: this.ToFullURL }, '[]'],
		note: Provider.MetadataFieldSingleline,
		labels: 'string[]',
	});

	static MediaCreatePayload = type({
		collection_id: 'number.integer',
		file_upload_ids: 'number.integer[] >= 1',
		'creator_id?': 'number.integer | null',
		'date_time?': Provider.DateInput,
		'filename_prefix?': 'string | null',
		'date_from_filename?': 'boolean',
		'site_id?': 'number.integer | null',
		'sensor_id?': 'number.integer | null',
		'license_id?': 'number.integer | null',
		'medium?': 'string | null',
		// see https://github.com/LiuDilongNJ/eco-signal/issues/121
		// 'media_type?': 'string | null',
		media_type: '"audio" | "photo"',
		'recording_gain_db?': 'number.integer | null',
		'duty_cycle_recording?': 'number.integer | null',
		'duty_cycle_period?': 'number.integer | null',
		'note?': 'string | null',
		'doi?': 'string | null',
	});

	static MediaUpdatePayload = Provider.MediaCreatePayload.omit(
		'collection_id',
		'file_upload_ids',
		'filename_prefix'
	).partial();

	static FileUploadBatchChunkPayload = type({
		filename: 'string',
		'media_type?': '"audio" | "photo"',
		chunk_index: 'number.integer >= 0',
		total_chunks: 'number.integer >= 1',
		'collection_id?': 'number.integer',
		file: 'Blob',
	}).configure({
		encoding: 'multipart',
	});

	static AnnotationsAllResponse = Provider.ResponseBase([
		{
			annotation_id: 'number',
			uuid: 'string',
			media_id: 'number',
			media_name: 'string',
			min_x: 'number >= 0',
			min_y: 'number >= 0',
			max_x: 'number >= 0',
			max_y: 'number >= 0',
			object_type: 'string',
			creation_date: 'string.date.parse',
			comments: Provider.MetadataFieldSingleline,
		},
		'[]',
	]);

	static AnnotationCreatePayload = type({
		project_id: 'number.integer', // got a validation error when testing
		media_id: 'number.integer',
		min_x: 'number',
		max_x: 'number',
		min_y: 'number',
		max_y: 'number',
		'sound_id?': 'number.integer | null',
		/** Required for photo media */
		'object_type?': 'string | null',
		'reference?': 'boolean',
		'comments?': 'string | null',
		'taxon_id?': 'number.integer | null',
		'uncertain?': 'boolean | null',
		'sound_distance_m?': 'number.integer | null',
		'distance_not_estimable?': '(boolean | null)',
		'individual_num?': 'number.integer | null',
		'creator_type?': 'string',
		'confidence?': 'number | null',
		'animal_sound_type?': 'string | null',
	});

	static AnnotationUpdatePayload = Provider.AnnotationCreatePayload.partial();

	static ReviewsResponse = Provider.ResponsePaginated({
		annotation_id: 'number',
		status_name: 'string',
	});

	static FileUploadBatchResponse = Provider.ResponseBase({
		filename: 'string',
		uploaded_chunks: 'number.integer',
		uploaded_indices: 'number.integer[]',
		exists: 'boolean',
	});

	static QueueResponse = Provider.ResponseBase({
		queue_id: 'number.integer',
		status: type.enumerated('pending', 'running', 'completed', 'error', 'warning'),
		progress: 'number',
		completed: 'number.integer',
		total: 'number.integer',
		'error?': 'string | null',
		'warning?': 'string | null',
		type: 'string',
		'message?': 'string | null',
		'start_time?': 'string.date.parse | null',
		'stop_time?': 'string.date.parse | null',
	});

	static LabelsResponse = Provider.ResponseBase([
		{
			name: 'string',
			label_id: 'number.integer',
			creator_id: 'number.integer',
			type: 'string',
			creation_date: 'string.date',
		},
		'[]',
	]);

	static MediaLabelsResponse = Provider.ResponseBase({
		succeeded: 'number.integer[]',
		failed: 'number.integer[]',
	});

	static MediaLabelsPayload = type({
		media_ids: 'number.integer[]',
		label_id: 'number.integer',
	});

	static SiteCreatePayload = type({
		name: 'string',
		location_method: '"coordinates"|"administrative"',
		'longitude?': 'number | null',
		'latitude?': 'number | null',
		'topography_m?': 'number | null',
		'freshwater_depth_m?': 'number | null',
		'realm_id?': 'number.integer | null',
		'biome_id?': 'number.integer | null',
		'functional_type_id?': 'number.integer | null',
		'iho_id?': 'number.integer | null',
		'gadm0_gid?': 'string | null',
		'gadm1_gid?': 'string | null',
		'gadm2_gid?': 'string | null',
		'collection_id?': 'number.integer | null',
		'project_id?': 'number.integer | null',
	});

	static SiteCreateResponse = Provider.ResponseBase({
		site_id: 'number.integer',
	});

	static SiteUpdatePayload = Provider.SiteCreatePayload.omit(
		'collection_id',
		'project_id'
	).partial();

	static SitesResponse = Provider.ResponsePaginated({
		site_id: 'number.integer',
		uuid: 'string',
		name: 'string',
		longitude: 'number | null',
		latitude: 'number | null',
		// iho_longitude:
		// iho_latitude:
		// topography_m:
		// freshwater_depth_m:
		// realm_id:
		// realm_name:
		// biome_id:
		// biome_name:
		// functional_type_id:
		// functional_type_name:
		// iho:
		// gadm0:
		// gadm1:
		// gadm2:
		// gadm0:
		// gadm1_gid:
		// gadm2_gid:
		creator_id: 'number.integer',
		creator_name: 'string',
		creation_date: 'string.date.parse',
		// collection_ids:
		// capabilities: {
		// 	edit: true,
		// 	delete: true,
		// 	link: true,
		// },
	});

	static SiteCollectionsResponse = Provider.ResponseBase({
		current_project: {
			project_id: 'number.integer',
			project_name: 'string',
			collections: [
				{
					collection_id: 'number.integer',
				},
				'[]',
			],
		},
	});

	static SiteCollectionLinkPayload = type({
		site_ids: 'number.integer[] >= 1',
		'project_ids?': 'number.integer[]',
		collection_ids: 'number.integer[]',
	});
}
