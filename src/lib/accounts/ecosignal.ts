import type { Account, AuthenticationMethod, LoginData } from './types.js';
import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { MetadataValue, MetadataValues, RuntimeValue } from '$lib/schemas/metadata.js';

import { ArkErrors, Type, type } from 'arktype';
import * as dates from 'date-fns';
import { differenceInSeconds, isPast } from 'date-fns';
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
import { accessBytes, createBytes } from '$lib/storage/utils.js';
import { safeJSONParse, sleep, throwError, transformObject } from '$lib/utils.js';

type DBIn = {
	[table in keyof typeof DB.Tables]: (typeof DB.Tables)[table]['inferIn'];
};

export default class Provider implements Account {
	static id = 'ecosignal' as const;
	static servers = [{ domain: 'http://localhost:8889', name: 'Local' }];

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
		const config = protocol.remote?.ecosignal;
		if (!config)
			throw new Error(`Protocol ${protocol.id} does not support EcoSignal remote sessions`);

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

	async upload(
		protocol: DB.Protocol,
		session: DB.Session,
		setProgress: (message: string, done?: number, total?: number) => void
	) {
		const config = protocol.remote?.ecosignal;
		if (!config)
			throw new Error(`Le protocole ${protocol.id} ne supporte pas les sessions EcoSignal`);

		const cropMetadataId = resolveMetadataImport(
			protocol,
			ensureNamespacedMetadataId(config.crop, protocol.id)
		);

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

		setProgress('Création de la collection');

		if (!collectionId) {
			const created = await this.json(
				'POST',
				'v1',
				'collections',
				Provider.ResponseBase('number.integer'),
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

			// TODO: set the collectionId lol
			collectionId = created.data;
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

		const images = await this.db.getAllFromIndex('Image', 'sessionId', session.id);
		const observations = await this.db.getAllFromIndex('Observation', 'sessionId', session.id);
		const files = await this.db.getAllFromIndex('ImageFile', 'sessionId', session.id);

		setProgress('Création des médias');

		const batchId = await this.json(
			'POST',
			'v1',
			'file-upload-batches',
			Provider.ResponseBase({ batch_id: 'string' }).pipe((r) => r.data.batch_id)
		);

		for (const [i, file] of files.map((f) => Tables.ImageFile.assert(f)).entries()) {
			setProgress('Création des médias', i, files.length);

			let mediaId: number | undefined;

			// TODO: add remote id on ImageFile to avoid using the filename
			const existingMediaId = async () =>
				await this.json('GET', 'v1', 'media', this.MediaResponse, {
					project_id: config.project,
					collection_id: collectionId,
					filename: this.#conformFilename(file.filename),
					order_by: 'creation_date',
					order_dir: 'desc',
				})
					.catch(() => undefined)
					.then(
						(existing) =>
							existing?.data.find(
								(m) => m.filename === this.#conformFilename(file.filename)
							)?.media_id
					);

			mediaId = await existingMediaId();

			// TODO: parallelize?

			setProgress('Upload du fichier');

			const { data: upload } = await this.json(
				'POST',
				'v1',
				`file-upload-batches/${batchId}/chunks`,
				Provider.ResponseBase({ file_upload_id: 'number.integer' }),
				{},
				Provider.FileUploadBatchChunkPayload,
				{
					filename: this.#conformFilename(file.filename),
					chunk_index: 0,
					total_chunks: 1,
					collection_id: collectionId,
					media_type: 'photo',
					file: new File(
						[await accessBytes('ImageFile', file)],
						this.#conformFilename(file.filename),
						{
							type: file.contentType,
						}
					),
				}
			);

			await sleep(2e3);

			while (!(await this.#fileUploadIsDone(batchId, file.filename))) {
				await sleep(500 /* ms */);
			}

			const fileImages = images.filter((image) => image.fileId === file.id);
			const fileObservations = observations.filter((obs) =>
				fileImages.some((img) => obs.images.includes(img.id))
			);

			if (fileObservations.length > 1) {
				throw new Error(
					"Certains fichiers sont dans plusieurs observations à la fois. Cette session n'est pas (pour l'instant) compatible avec EcoSignal"
				);
			}

			const observation = fileObservations.map((o) => Tables.Observation.assert(o)).at(0);

			const mediaUpdateData = {
				// TODO: get merged metadata value of all file's images shot_at date
				// get which metadata to use via protocol export settings (images.mtime)
				// date_time:
				note: observation
					? this.#compoundMetadataToSinglelineField(
							undefined,
							observation.metadataOverrides
						)
					: null,
			};

			setProgress("Upload de l'observation");

			if (mediaId) {
				await this.json(
					'PATCH',
					'v1',
					`media/${mediaId}`,
					type.unknown,
					{ project_id: config.project },
					Provider.MediaUpdatePayload,
					mediaUpdateData
				);
			} else {
				const { data: creation } = await this.json(
					'POST',
					'v1',
					'media',
					Provider.ResponseBase({ queue_id: 'number' }),
					{ project_id: config.project },
					Provider.MediaCreatePayload,
					{
						collection_id: collectionId,
						file_upload_ids: [upload.file_upload_id],
						date_time: observation?.addedAt ?? new Date(),
						...mediaUpdateData,
					}
				);

				while (!(await this.#queueIsDone(config.project, creation.queue_id, file))) {
					await sleep(500);
				}

				mediaId = await existingMediaId();
			}

			if (!mediaId) {
				console.error('Couldnt upload, skipping to next', file);
				continue;
			}

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

			setProgress('Création des annotations');

			for (const [i, image] of fileImages.map((i) => Tables.Image.assert(i)).entries()) {
				setProgress('Création des annotations', i, fileImages.length);

				const box = image.metadata[cropMetadataId];
				if (!box) continue;
				if (!hasRuntimeType('boundingbox', box.value)) continue;

				const id = parseImageId(image.id);

				// Find boxes that also exist on EcoSignal
				// for these, use the most recently modified one

				const existing = existingAnnotations.find(
					(ann) => ann.annotation_id === id.subindex
				);

				if (!existing) {
					await this.json(
						'POST',
						'v1',
						'annotations',
						type.unknown,
						{ project_id: config.project },
						Provider.AnnotationCreatePayload,
						{
							media_id: mediaId,
							...this.#toEcoSignalBoxCoords(box.value, file),
							uncertain: box.confidence < 1 && !box.confirmed,
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
						{
							...this.#toEcoSignalBoxCoords(box.value, file),
							uncertain: box.confidence < 1 && !box.confirmed,
						}
					);
				}
			}
		}
	}

	#conformFilename(filename: string): string {
		return filename.toLowerCase();
	}

	async #fileUploadIsDone(batchId: string, filename: string) {
		const { data: status } = await this.json(
			'GET',
			'v1',
			`file-upload-batches/${batchId}/files/${this.#conformFilename(filename)}`,
			Provider.FileUploadBatchResponse
		);

		if (!status.exists)
			throw new Error(`File ${this.#conformFilename(filename)} not found in batch`);

		return status.uploaded_chunks >= 1;
	}

	async #queueIsDone(projectId: number, queueId: number, file: DB.ImageFile) {
		const { data } = await this.json('GET', 'v1', `queues/${queueId}`, Provider.QueueResponse, {
			project_id: projectId,
		});

		switch (data.status) {
			case 'completed':
				return true;
			case 'warning': {
				console.warn(
					`Warning returned by EcoSignal for upload of ${file.filename}: ${data.warning ?? '(None)'}`
				);
				return true;
			}
			case 'error':
				throw new Error(
					`Impossible d'uploader ${file.filename}: ${data.error ?? 'Erreur inattendue'}`
				);
			default:
				return false;
		}
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
		const scaled = coordsScaler({
			x: file.dimensions.width,
			y: file.dimensions.height,
		})(box);

		return {
			min_x: scaled.x - scaled.w / 2,
			min_y: scaled.y - scaled.h / 2,
			max_x: scaled.x + scaled.w / 2,
			max_y: scaled.y + scaled.h / 2,
		};
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

	async fetch(
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		/** When passing a URL, the API route prefix (/api/v1) and domain wont be added */
		pathname: string | URL,
		queryParams: Record<string, unknown> = {},
		init: RequestInit = {}
	) {
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

		this.#lastRequestSentAt = new Date();
		return fetch(url, init);
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
					metadata: transformObject(metadata, (key, value) => {
						return [key, serializeMetadataFullValue(value)];
					}),
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
		can_write_audio: 'boolean',
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
		'media_type?': 'string | null',
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
		media_id: 'number.integer',
		min_x: 'number',
		max_x: 'number',
		min_y: 'number',
		max_y: 'number',
		'sound_id?': 'number.integer | null',
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
}
