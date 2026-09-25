import type EcoSignal from '$e2e/../src/lib/accounts/ecosignal.js';
import type { StrictRequest } from 'msw';

import {
	addMilliseconds,
	differenceInMilliseconds,
	differenceInSeconds,
	hoursToSeconds,
} from 'date-fns';
import { http, HttpResponse } from 'msw';
import { nanoid } from 'nanoid';

export const MOCK_TOKEN = 'hougreiohgermijogreojigremijogre';
export const MOCK_CREDS = { username: 'hello', password: 'hahahaha' };

export const MOCK_DOMAIN = 'https://ecosignal.example.com';

const QUEUE_PROCESSING_SPEED_MS = 500;
const CHUNK_UPLOAD_SPEED_MB_PER_SECOND = 0.9;

declare namespace Resource {
	type Collection = (typeof EcoSignal.CollectionResponse)['inferIn']['data'];
	type Site = (typeof EcoSignal.SitesResponse)['inferIn']['data'][number];
	type Media = (typeof EcoSignal.MediaResponse)['inferIn']['data'];
	type Annotation = (typeof EcoSignal.AnnotationsAllResponse)['inferIn']['data'][number];
	type Review = (typeof EcoSignal.ReviewsResponse)['inferIn']['data'][number];
	type Label = (typeof EcoSignal.LabelsResponse)['inferIn']['data'][number];
}

declare namespace Creation {
	type Collection = (typeof EcoSignal.CollectionCreatePayload)['infer'];
	type Site = (typeof EcoSignal.SiteCreatePayload)['infer'];
	type Media = (typeof EcoSignal.MediaCreatePayload)['infer'];
	type Annotation = (typeof EcoSignal.AnnotationCreatePayload)['infer'];
	type Label = (typeof EcoSignal.LabelCreatePayload)['infer'];
}

declare namespace Updates {
	type Collection = (typeof EcoSignal.CollectionUpdatePayload)['infer'];
	type Site = (typeof EcoSignal.SiteUpdatePayload)['infer'];
	type Media = (typeof EcoSignal.MediaUpdatePayload)['infer'];
	type Annotation = (typeof EcoSignal.AnnotationUpdatePayload)['infer'];
}

declare namespace Misc {
	type MediaLabelsPayload = (typeof EcoSignal.MediaLabelsPayload)['infer'];
	type FileChunkUpload = (typeof EcoSignal.FileUploadBatchChunkPayload)['infer'];
}

const u = (path: `/${string}`) => `${MOCK_DOMAIN}/api/v1${path}`;

const r = (data: unknown, overrides?: Record<string, unknown>) =>
	HttpResponse.json(
		{
			code: 200,
			message: 'ok',
			data,
			meta: {
				timestamp: '2026-09-17T17:43:29Z',
				version: '1.0',
				request_id: 'req_35617bdc66864bd0b0db0f29455f1b9b',
			},
			...(overrides ?? {}),
		},
		{
			status: Number(overrides?.code ?? 200),
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		}
	);

const paginated =
	(data: unknown[]) =>
	({ request }: { request: Request }) => {
		const { page, page_size = 20 } = Object.fromEntries(
			new URLSearchParams(new URL(request.url).searchParams)
				.entries()
				.map(([key, value]) => [key, Number(value)])
		);

		return r(data.slice((page - 1) * page_size, page * page_size), {
			page_info: {
				total: data.length,
				page,
				page_size,
				total_pages: Math.ceil(data.length / page_size),
			},
		});
	};

const query =
	<T>(make: (params: Record<string, string>) => T) =>
	({ request }: { request: Request }) => {
		const params = Object.fromEntries(new URL(request.url).searchParams.entries());

		return make(params);
	};

const NOTAUTHED = r(null, { message: 'Not authenticated', code: 401 });
const NOTFOUND = (resource: string) => r(null, { message: `${resource} not found`, code: 404 });

type ResourceName = RemoveSuffix<keyof State['repository'], 's'>;

class State {
	fileUploads = {} as Array<{
		id: number;
		created: Date;
		batchId: string;
		filename: string;
		chunkIndex: number;
		totalChunks: number;
		collectionId: number;
		blob: Blob;
	}>;

	queues = [] as Array<{
		id: number;
		created: Date;
		fids: number[];
	}>;

	mediaBlobs = new Map<number, File>();

	constructor() {}

	repository: {
		collections: Resource.Collection[];
		sites: (Resource.Site & { collection_ids: number[] })[];
		medias: Resource.Media[];
		annotations: Resource.Annotation[];
		reviews: Resource.Review[];
		labels: Resource.Label[];
	} = {
		collections: [],
		sites: [],
		medias: [],
		annotations: [],
		reviews: [],
		labels: [],
	};

	reset() {
		for (const resource of Object.keys(this.repository) as Array<keyof State['repository']>) {
			this.repository[resource] = [];
		}

		this.fileUploads = [];
		this.queues = [];
		this.mediaBlobs.clear();
	}

	nextId<R extends ResourceName>(resource: R) {
		return this.repository[`${resource}s`].length + 1;
	}

	find<R extends ResourceName>(
		resource: R,
		id: number | string
	): (typeof this.repository)[`${R}s`][number] | undefined {
		return this.repository[`${resource}s`].find((r) => r[`${resource}_id`].toString() === id);
	}

	one<R extends ResourceName>(resource: R) {
		return (data: { params: { id: string } }) => {
			const found = this.find(resource, data.params.id);
			return found ? r(found) : NOTFOUND(resource);
		};
	}

	update<R extends ResourceName>(resource: R) {
		return async (data: {
			request: StrictRequest<Partial<State['repository'][`${R}s`][number]>>;
			params: { id: string };
		}) => {
			const patch = await data.request.clone().json();
			const found = this.find(resource, data.params.id);
			if (!found) return NOTFOUND(resource);

			this.repository[`${resource}s`] = this.repository[`${resource}s`].map((resource) => ({
				...resource,
				...(resource[`${resource}_id`] === data.params.id ? patch : {}),
			}));
		};
	}

	chunkSent(
		batchId: string,
		{
			filename,
			chunkIndex,
			totalChunks,
			collectionId,
			blob,
		}: {
			filename: string;
			chunkIndex: number;
			totalChunks: number;
			collectionId: number;
			blob: Blob;
		}
	) {
		const existingFile = this.fileUploads.find((fu) => fu.filename === filename);

		const nextId = largestPlusOne(this.fileUploads.map((u) => u.id));

		const id = existingFile?.id ?? nextId;

		this.fileUploads.push({
			id,
			batchId,
			collectionId,
			created: new Date(),
			filename,
			chunkIndex,
			totalChunks,
			blob,
		});

		return { file_upload_id: id };
	}

	existingChunks(batchId: string, filename: string) {
		return mockstate.fileUploads.filter(
			(fu) => fu.filename === filename && fu.batchId === batchId
		);
	}

	uploadedChunks(batchId: string, filename: string) {
		return this.existingChunks(batchId, filename).filter(
			(fu) =>
				differenceInSeconds(new Date(), fu.created) >=
				fu.blob.size / (CHUNK_UPLOAD_SPEED_MB_PER_SECOND * 1e6)
		);
	}

	mediaEnqueued(fids: number[]) {
		for (const fid of fids) {
			const fu = this.fileUploads.find((fu) => fu.id === fid);
			if (!fu) return r(null, { message: 'File does not exist' });

			const uploaded =
				this.fileUploads.filter((fu) => fu.id === fid).length >= fu.totalChunks;
			if (!uploaded) return r(null, { message: 'File upload is not finished yet' });
		}

		const id = largestPlusOne(this.queues.map((q) => q.id));

		this.queues.push({
			created: new Date(),
			id,
			fids,
		});

		console.log('Queue', this.queues);

		return r({ queue_id: id });
	}
}

export const mockstate = new State();

export const handlers = [
	http.post(u('/auth-tokens'), async ({ request }) => {
		const { username, password } = Object.fromEntries(
			new URLSearchParams((await request.clone().text()) ?? '').entries()
		);

		if (username !== MOCK_CREDS.username || password !== MOCK_CREDS.password)
			return r(null, { message: 'Incorrect username or password', code: 400 });

		return HttpResponse.json({
			access_token: MOCK_TOKEN,
			token_type: 'bearer',
			expires_in: hoursToSeconds(8),
			session_idle_timeout_seconds: 0,
		});
	}),
	http.all(u('/**'), ({ request }) => {
		console.log('[EcoSignal] mocking', request.url);
		if (request.headers.get('Authorization') !== `Bearer ${MOCK_TOKEN}`) return NOTAUTHED;
	}),
	http.delete(u('/current-user'), () => HttpResponse.text('', { status: 200 })),
	http.get(u('/current-user'), () =>
		r({
			user_id: 1,
			username: MOCK_CREDS.username,
			name: 'Hello World',
			email: 'hello@example.com',
			orcid: '',
			color: '#c0ffee',
			active: true,
			can_write_audio: true,
		})
	),

	http.get(u('/collections'), paginated(mockstate.repository.collections)),
	http.get(u('/collections/:id'), mockstate.one('collection')),
	http.patch<{ id: string }, Updates.Collection>(
		u('/collections/:id'),
		mockstate.update('collection')
	),
	http.post<{}, Creation.Collection>(u('/collections'), async ({ request }) => {
		const data = await request.clone().json();
		const collection_id = mockstate.nextId('collection');

		mockstate.repository.collections.push({
			description: null,
			...data,
			collection_id,
			creator_id: 1,
			creator_name: 'Hello World',
			creation_date: new Date().toISOString(),
			project_ids: [1],
		});

		return r({ collection_id });
	}),

	http.get(u('/sites'), paginated(mockstate.repository.sites)),
	http.get(u('/sites/:id'), mockstate.one('site')),
	http.patch<{ id: string }, Updates.Site>(u('/sites/:id'), mockstate.update('site')),
	http.post<{}, Creation.Site>(u('/sites'), async ({ request }) => {
		const data = await request.clone().json();
		const site_id = mockstate.nextId('site');

		mockstate.repository.sites.push({
			collection_ids: [],
			longitude: null,
			latitude: null,
			...data,
			site_id,
			uuid: nanoid(),
			creator_id: 1,
			creator_name: 'Hello World',
			creation_date: new Date().toISOString(),
		});

		return r({ site_id });
	}),

	http.get(u('/labels'), () => r(mockstate.repository.labels)),
	http.post<{}, Creation.Label>(u('/labels'), async ({ request }) => {
		const data = await request.clone().json();
		const label_id = mockstate.nextId('label');

		mockstate.repository.labels.push({
			type: 'private',
			...data,
			label_id,
			creator_id: 1,
			creation_date: new Date().toISOString(),
		});

		return r({ label_id });
	}),

	http.get(u('/media'), paginated(mockstate.repository.medias)),
	http.get(u('/media/:id'), mockstate.one('media')),
	http.patch<{ id: string }, Updates.Media>(u('/media/:id'), mockstate.update('media')),
	http.post<{}, { file_upload_ids: number[] }>(u('/media'), async ({ request }) => {
		const { file_upload_ids } = await request.clone().json();

		setTimeout(
			() => {
				void (async () => {
					for (const fid of file_upload_ids) {
						const fu = mockstate.fileUploads.find((u) => u.id === fid);
						if (!fu) continue;

						const fus = mockstate.fileUploads.filter((u) => u.id === fid);
						const bufs = [] as Uint8Array[];

						for (const fu of fus) {
							bufs.push(new Uint8Array(await fu.blob.arrayBuffer()));
						}

						const content = new Uint8Array(
							bufs.reduce((size, buf) => size + buf.byteLength, 0)
						);

						let offset = 0;
						for (const buf of bufs) {
							content.set(buf, offset);
							offset += buf.byteLength;
						}

						const id = mockstate.nextId('media');

						mockstate.mediaBlobs.set(
							id,
							new File([content], fu.filename, {
								type: fu.blob.type,
							})
						);

						mockstate.repository.medias.push({
							audio_url: null,
							filename: fu.filename,
							name: fu.filename,
							note: null,
							date_time: new Date().toISOString(),
							media_id: id,
							uuid: nanoid(),
							media_type: 'photo',
							is_metadata: false,
							size_b: content.byteLength,
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
							creation_date: new Date().toISOString(),
							collection_id: fu.collectionId,
							collection_name: mockstate.find('collection', fu.collectionId)!.name,
							project_id: 1,
							project_name: 'Demo project',
							media_url: `/api/v1/media/${id}/content`,
							// TODO: faire des previews?
							previews: [],
							photo_setting: {
								exposure_ms: null,
								aperture: null,
								iso: null,
							},
							labels: [],
							// TODO
							image_width: null,
							image_height: null,
						});
					}
				})();
			},
			(QUEUE_PROCESSING_SPEED_MS - 100) * file_upload_ids.length
		);

		return mockstate.mediaEnqueued(file_upload_ids);
	}),

	http.put<{}, Misc.MediaLabelsPayload>(u('/media-labels'), async ({ request }) => {
		const data = await request.clone().json();

		const label = mockstate.find('label', data.label_id);
		if (!label) return NOTFOUND('label');

		mockstate.repository.medias = mockstate.repository.medias.map((media) => {
			if (!data.media_ids.includes(media.media_id)) return media;
			return {
				...media,
				labels: [label.name],
			};
		});

		return r({ success: data.media_ids, failed: [] });
	}),

	http.get(
		u('/annotations/all'),
		query(({ media_id }) =>
			r(
				mockstate.repository.annotations.filter(
					(ann) => ann.media_id.toString() === media_id
				)
			)
		)
	),

	http.patch<{ id: string }, Updates.Annotation>(
		u('/annotations/:id'),
		mockstate.update('annotation')
	),

	http.post<{}, Creation.Annotation>(u('/annotations'), async ({ request }) => {
		const data = await request.clone().json();
		const annotation_id = mockstate.nextId('annotation');
		const media = mockstate.find('media', data.media_id);

		if (!media) return NOTFOUND('Media');

		mockstate.repository.annotations.push({
			object_type: null,
			comments: null,
			...data,
			annotation_id,
			uuid: nanoid(),
			creation_date: new Date().toISOString(),
			media_name: media.name,
		});

		return r({ annotation_id });
	}),

	http.get(u('/reviews'), paginated(mockstate.repository.reviews)),
	http.post(u('/file-upload-batches'), () => r({ batch_id: nanoid() })),
	http.post<{ id: string }, Misc.FileChunkUpload>(
		u('/file-upload-batches/:id/chunks'),
		async ({ params, request }) => {
			// const { chunk_index, total_chunks, filename, collection_id,  } = await request.clone().formData();
			const form = await request.clone().formData();

			const chunkIndex = Number(form.get('chunk_index')!);
			const totalChunks = Number(form.get('total_chunks')!);
			const collectionId = Number(form.get('collection_id')!);
			const filename = form.get('filename')! as string;
			const blob = form.get('file')! as Blob;

			if (!collectionId) throw new Error('unimplemented');

			return r(
				mockstate.chunkSent(params.id, {
					filename,
					chunkIndex,
					totalChunks,
					collectionId,
					blob,
				})
			);
		}
	),
	http.get<{ batch: string; file: string }>(
		u('/file-upload-batches/:batch/files/:file'),
		({ params }) => {
			const ofFile = mockstate.existingChunks(params.batch, params.file);
			const done = mockstate.uploadedChunks(params.batch, params.file);

			return r({
				filename: params.file,
				uploaded_chunks: done.length,
				uploaded_indices: done.map((fu) => fu.chunkIndex),
				exists: ofFile.length > 0,
			});
		}
	),
	http.get<{ id: string }>(u('/queues/:id'), ({ params }) => {
		const queue = mockstate.queues.find((q) => q.id.toString() === params.id);
		if (!queue) return NOTFOUND('Queue');

		const elapsed = differenceInMilliseconds(new Date(), queue.created);
		const total = queue.fids.length;
		const processedCount = Math.max(total, Math.floor(elapsed / QUEUE_PROCESSING_SPEED_MS));

		return r({
			queue_id: queue.id,
			status: processedCount >= total ? 'completed' : 'running',
			progress: processedCount / total,
			completed: processedCount,
			total: total,
			error: null,
			warning: null,
			type: 'media_creation',
			message: null,
			start_time: queue.created.toISOString(),
			stop_time: addMilliseconds(queue.created, processedCount * QUEUE_PROCESSING_SPEED_MS),
		});
	}),

	http.put<{}, { site_ids: number[]; collection_ids: number[] }>(
		u('/sites/collections'),
		async ({ request }) => {
			const data = await request.clone().json();

			mockstate.repository.sites = mockstate.repository.sites.map((site) => ({
				...site,
				// TODO: i think??? it replaces
				// but we never use ecosignal's sites to download data anyways
				// since its all stored in generic session metadata too
				collection_ids: data.site_ids.includes(site.site_id)
					? data.collection_ids
					: site.collection_ids,
			}));

			return r({});
		}
	),

	http.get<{ id: string }>(u('/media/:id/content'), async ({ params }) => {
		const blob = mockstate.mediaBlobs.get(Number(params.id));
		if (!blob) return NOTFOUND('Media');

		return HttpResponse.arrayBuffer(await blob.arrayBuffer(), {
			headers: {
				'Content-Type': blob.type,
			},
		});
	}),

	http.all(u('/**'), () => HttpResponse.text('Not Found', { status: 404 })),
];

type RemoveSuffix<T extends string, S extends string> = T extends `${infer P}${S}` ? P : never;

function largestPlusOne(numbers: number[]) {
	if (numbers.length === 0) return 1;
	return Math.max(...numbers) + 1;
}
