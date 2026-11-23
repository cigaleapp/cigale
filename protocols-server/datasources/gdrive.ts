import { readFileSync } from 'node:fs';

import { addDays, addWeeks } from 'date-fns';
import { JWT } from 'google-auth-library';
import { drive_v3, google } from 'googleapis';
import { Jimp } from 'jimp';
import { JSDOM } from 'jsdom';
// @ts-ignore untyped module
import odt from 'odt2html';
import { pdfToPng } from 'pdf-to-png-converter';
import Turndown from 'turndown';

import { Datasource, ResponseWithFiles } from '../lib/datasource.js';

export class GoogleDrive extends Datasource<
	'files' | 'slide',
	{
		files: {};
		slide: { name: string; clade: string };
	},
	{
		files: {
			files: Array<{ id: string; name: string }>;
		};
		slide: null | {
			description: string;
			learnMore: string;
			images: Array<{
				filename: string;
			}>;
		};
	}
> {
	name = 'gslides' as const;

	folderId = folderIdFromUrl(
		'https://drive.google.com/drive/folders/1Ms9yPFd5kt1OYUx-6gwe8nlz2EGhJBLd'
	);

	drive: drive_v3.Drive;

	expirations = {
		file: (now: Date) => addWeeks(now, 2),
		entry: (now: Date, query: 'files' | 'slide') => {
			switch (query) {
				case 'files':
					return addDays(now, 1);
				case 'slide':
					return addWeeks(now, 1);
			}
		},
	};

	constructor() {
		super();

		const keys = JSON.parse(readFileSync('google-drive-key.json').toString()) as {
			client_email: string;
			private_key: string;
		};

		google.options({
			auth: new JWT({
				email: keys.client_email,
				key: keys.private_key,
				scopes: ['https://www.googleapis.com/auth/drive.readonly'],
			}),
		});

		this.drive = google.drive('v3');
	}

	async init() {}

	requests = {
		files: async () => {
			const response = await this.drive.files.list({
				q: `'${this.folderId}' in parents and mimeType = 'application/vnd.google-apps.presentation'`,
			});

			const files =
				response.data.files
					?.filter((f) => Boolean(f.name))
					.sort((a, b) => a.name!.localeCompare(b.name!))
					.map((f) => ({ name: f.name!.trim(), id: f.id! })) ?? [];

			return { files };
		},

		slide: async ({ name, clade }: { name: string; clade: string }) => {
			const { files } = await this.one('files', {});
			const filename = clade === 'genus' ? `${name} sp` : name;
			const file = files.find((f) => f.name.trim() === filename);
			if (!file) return null;

			const odp = (await this.drive.files.export(
				{
					fileId: file.id,
					mimeType: 'application/vnd.oasis.opendocument.presentation',
				},
				{
					responseType: 'arraybuffer',
				}
			)) as { data: ArrayBuffer };

			const html = await odt
				.toHTML({
					path: Buffer.from(odp.data),
					trim: true,
					openFilters: {
						// Remove comments (see #308). For some reason, returning null doesnt work, so we turn it into a <slides-comment> tag and let Turndown remove it
						'officeooo:annotation': (n: { name: string }) => ({
							xml: n.name,
							html: 'slides-comment',
						}),
						'draw:page': (n: { attributes: Record<string, string>; name: string }) => ({
							xml: n.name,
							html: 'section',
							attrs: [{ name: 'data-page', value: n.attributes['draw:name'] }],
						}),
						'text:s': (n: { name: string }) => ({
							xml: n.name,
							html: 'span',
							attrs: [{ name: 'data-is-whitespace', value: 'true' }],
						}),
					},
				})
				.then((html: string) => {
					const doc = new JSDOM(html).window.document;
					// Recover whitespace from text:s tags
					doc.querySelectorAll('span[data-is-whitespace]').forEach((node) => {
						node.innerHTML += ' ';
					});
					return doc;
				});

			const pages = new Map(
				[...html.querySelectorAll('section[data-page]')]
					.filter((node) => /^page\d+$/.test(node.dataset.page))
					.map((node) => [Number.parseInt(node.dataset.page.replace('page', '')), node])
			);

			const imagePageNumbers = new Set(
				[...pages.entries()]
					.filter(([, node]) => node.querySelector('img') !== null)
					.map(([num]) => num)
			);

			if (!imagePageNumbers.size) {
				// log('No image found in slides');
			}

			const textPages = [...pages.entries()]
				.filter(([num]) => !imagePageNumbers.has(num))
				.map(([, node]) => node);

			// log('Exporting to PDF');
			const pdf = (await this.drive.files.export(
				{
					fileId: file.id,
					mimeType: 'application/pdf',
				},
				{
					responseType: 'arraybuffer',
				}
			)) as { data: ArrayBuffer };

			// log(`Converting slides ${[...imagePageNumbers].join(', ')} to images`);
			const images = await pdfToPng(pdf.data, {
				pagesToProcess: [...imagePageNumbers],
				viewportScale: 4,
			})
				.then((results) =>
					Promise.all(
						results
							.filter((r) => r.kind === 'content')
							.map((r) => r.content)
							.filter((content) => content !== undefined)
							.map(async (content) => Jimp.fromBuffer(content))
					)
				)
				.then((images) =>
					images.map((image) => {
						const { width, height } = image.bitmap;
						let cropbox = {
							start: { x: 0, y: 0, found: false },
							end: { x: width, y: height, found: false },
						};

						const isBackground = (x: number, y: number) =>
							image.getPixelColor(x, y) === 0xffffffff;

						// Get first and last columns that are not all-background
						for (let x = 0; x < width; x++) {
							if (
								!cropbox.start.found &&
								range(height).some((y) => !isBackground(x, y))
							) {
								cropbox.start.x = x;
								cropbox.start.found = true;
							}

							if (
								!cropbox.end.found &&
								range(height).some((y) => !isBackground(width - x - 1, y))
							) {
								cropbox.end.x = width - x - 1;
								cropbox.end.found = true;
							}
						}

						cropbox.start.found = false;
						cropbox.end.found = false;

						// Get first and last rows that are not all-background
						for (let y = 0; y < height; y++) {
							if (
								!cropbox.start.found &&
								range(width).some((x) => !isBackground(x, y))
							) {
								cropbox.start.y = y;
								cropbox.start.found = true;
							}

							if (
								!cropbox.end.found &&
								range(width).some((x) => !isBackground(x, height - y - 1))
							) {
								cropbox.end.y = height - y - 1;
								cropbox.end.found = true;
							}
						}

						// const logbox = ({ start, end }) =>
						// 	`(${start.x} ${start.y}) -> (${end.x} ${end.y})`;

						// log(
						// 	`Cropping image to ${cc.blue}${logbox(cropbox)}${cc.reset} from ${cc.cyan}(0 0) -> (${width} ${height})${cc.reset}`
						// );

						return image.crop({
							x: cropbox.start.x,
							y: cropbox.start.y,
							w: cropbox.end.x - cropbox.start.x,
							h: cropbox.end.y - cropbox.start.y,
						});
					})
				);

			// log('Extracting description');

			const description = textPages.map(htmlToMarkdown).join('\n\n');

			const links = Object.fromEntries(
				textPages
					.flatMap((node) => [...node.querySelectorAll('a')])
					.map((node) => [node.textContent, node.href] as const)
					.filter(([text]) => text && text !== ' ')
			);

			const learnMore =
				links.INPN ?? links.LMDI ?? links.GBIF ?? Object.values(links)[0] ?? undefined;

			const attached: File[] = [];

			for (const [i, image] of images.entries()) {
				const bytes = await image.getBuffer('image/png');

				attached.push(
					new File([bytes.buffer as ArrayBuffer], `${file.name}_${i}.png`, {
						type: 'image/png',
					})
				);
			}

			return new ResponseWithFiles({
				files: attached,
				response: {
					description,
					learnMore,
					images: attached.map((f) => ({ filename: f.name })),
				},
			});
		},
	};
}

const _tdown = new Turndown();
_tdown.remove('slides-comment' as unknown as import('turndown').Filter);
function htmlToMarkdown(html: string) {
	return _tdown.turndown(html);
}

function folderIdFromUrl(url: string) {
	const id = new URL(url).pathname.split('/').at(-1);

	if (!id || !/\w+/.test(id)) {
		throw new Error(`Invalid Folder ID: ${id}`);
	}

	return id;
}

/**
 * Semi-open range [start=0, end)
 */
export function range(startOrEnd: number, end?: number): number[] {
	if (end === undefined) {
		return Array.from({ length: startOrEnd }, (_, i) => i);
	}
	return Array.from({ length: end - startOrEnd }, (_, i) => i + startOrEnd);
}
