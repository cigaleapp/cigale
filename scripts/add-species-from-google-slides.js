import { readFileSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { Jimp } from 'jimp';
import { JSDOM } from 'jsdom';
import odt from 'odt2html';
import { pdfToPng } from 'pdf-to-png-converter';
import { x } from 'tinyexec';
import Turndown from 'turndown';

import keys from '../google-drive-key.json' with { type: 'json' };
import { decodePhoto, photoChanged, range } from './utils.js';

await mkdir(path.join(import.meta.dirname, '../examples/arthropods.cigaleprotocol.images'), {
	recursive: true
});

const _tdown = new Turndown();
_tdown.remove('slides-comment');
/** @param {string} html  */
function htmlToMarkdown(html) {
	return _tdown.turndown(html);
}

// ANSI control sequences
const cc = {
	clearline: '\x1b[2K',
	red: '\x1b[31m',
	reset: '\x1b[0m',
	dim: '\x1b[2m',
	blue: '\x1b[34m',
	bold: '\x1b[1m',
	yellow: '\x1b[33m',
	cyan: '\x1b[36m'
};

const ADD_TO_PROTOCOLS = [
	path.join(import.meta.dirname, '../examples/arthropods.cigaleprotocol.json')
];

const GOOGLE_DRIVE_FOLDER_URL = folderIdFromUrl(
	'https://drive.google.com/drive/folders/1Ms9yPFd5kt1OYUx-6gwe8nlz2EGhJBLd'
);

/**
 * @import { ExportedProtocol } from '../src/lib/schemas/protocols.js';
 * @typedef {typeof ExportedProtocol.infer} Protocol
 * @type {Record<string, {fresh: Protocol, old: Protocol}>}
 */
const protocols = Object.fromEntries(
	ADD_TO_PROTOCOLS.map((file) => [
		file,
		{
			fresh: JSON.parse(readFileSync(file, 'utf8')),
			old: JSON.parse(readFileSync(file.replace('arthropods', 'old-arthropods'), 'utf8'))
		}
	])
);

console.info(
	`Modifying protocols ${Object.keys(protocols)
		.map((file) => `${cc.blue}${file}${cc.reset}`)
		.join(', ')}...`
);

google.options({
	auth: new JWT({
		email: keys.client_email,
		key: keys.private_key,
		scopes: ['https://www.googleapis.com/auth/drive.readonly']
	})
});

console.info(`Logged in to Google Drive as ${cc.blue}${keys.client_email}${cc.reset}...`);

const drive = google.drive('v3');

// List slides in folder
console.info(`Listing slides in folder ${cc.blue}${GOOGLE_DRIVE_FOLDER_URL}${cc.reset}...`);

const response = await drive.files.list({
	q: `'${GOOGLE_DRIVE_FOLDER_URL}' in parents and mimeType = 'application/vnd.google-apps.presentation'`
});

await mkdir('./slides', { recursive: true });

const longestNameLength = Math.max(...response.data.files.map((file) => file.name.length));

for (const { name, id } of response.data.files.sort((a, b) => a.name.localeCompare(b.name))) {
	const log = (...items) =>
		console.info(
			`${cc.bold}${cc.cyan}[${name.padStart(longestNameLength)}]${cc.reset}`,
			...items
		);

	if (name === 'A-BASE') {
		log('Skipping');
		continue;
	}

	try {
		log(
			`Using document at ${cc.blue}https://docs.google.com/presentation/d/${id}/edit${cc.reset}`
		);

		log('Exporting as ODP');
		const odp = await drive.files.export(
			{
				fileId: id,
				mimeType: 'application/vnd.oasis.opendocument.presentation'
			},
			{
				responseType: 'arraybuffer'
			}
		);

		const html = await odt
			.toHTML({
				path: Buffer.from(odp.data),
				trim: true,
				openFilters: {
					// Remove comments (see #308). For some reason, returning null doesnt work, so we turn it into a <slides-comment> tag and let Turndown remove it
					'officeooo:annotation': ({ name }) => ({
						xml: name,
						html: 'slides-comment'
					}),
					'draw:page': ({ attributes, name }) => ({
						xml: name,
						html: 'section',
						attrs: [{ name: 'data-page', value: attributes['draw:name'] }]
					}),
					'text:s': ({ name }) => ({
						xml: name,
						html: 'span',
						attrs: [{ name: 'data-is-whitespace', value: 'true' }]
					})
				}
			})
			.then((html) => {
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
			log('No image found in slides');
		}

		const textPages = [...pages.entries()]
			.filter(([num]) => !imagePageNumbers.has(num))
			.map(([, node]) => node);

		log('Exporting to PDF');
		const pdf = await drive.files.export(
			{
				fileId: id,
				mimeType: 'application/pdf'
			},
			{
				responseType: 'arraybuffer'
			}
		);

		log(`Converting slides ${[...imagePageNumbers].join(', ')} to images`);
		const images = await pdfToPng(pdf.data, {
			pagesToProcess: [...imagePageNumbers],
			viewportScale: 4
		})
			.then((results) =>
				Promise.all(results.map(async ({ content }) => Jimp.fromBuffer(content)))
			)
			.then((images) =>
				images.map((image) => {
					const { width, height } = image.bitmap;
					let cropbox = {
						start: { x: 0, y: 0, found: false },
						end: { x: width, y: height, found: false }
					};

					const isBackground = (x, y) => image.getPixelColor(x, y) === 0xffffffff;

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
						if (!cropbox.start.found && range(width).some((x) => !isBackground(x, y))) {
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

					const logbox = ({ start, end }) =>
						`(${start.x} ${start.y}) -> (${end.x} ${end.y})`;

					log(
						`Cropping image to ${cc.blue}${logbox(cropbox)}${cc.reset} from ${cc.cyan}(0 0) -> (${width} ${height})${cc.reset}`
					);

					return image.crop({
						x: cropbox.start.x,
						y: cropbox.start.y,
						w: cropbox.end.x - cropbox.start.x,
						h: cropbox.end.y - cropbox.start.y
					});
				})
			);

		log('Extracting description');

		const description = textPages.map(htmlToMarkdown).join('\n\n');

		const links = Object.fromEntries(
			textPages
				.flatMap((node) => [...node.querySelectorAll('a')])
				.map((node) => /** @type {const} */ ([node.textContent, node.href]))
				.filter(([text]) => text && text !== ' ')
		);

		const learnMore =
			links.INPN ?? links.LMDI ?? links.GBIF ?? Object.values(links)[0] ?? undefined;

		/** @type {URL[]} */
		let imageUrls = [];

		for (const [filepath, protocol] of Object.entries(protocols)) {
			log(`Adding to ${cc.blue}${protocol.fresh.id}${cc.reset}`);

			const options = protocol.fresh.metadata[`${protocol.fresh.id}__species`].options;

			const oldOption = protocol.old.metadata[`${protocol.old.id}__species`].options.find(
				(o) => o.label === name
			);

			for (const [i, image] of images.entries()) {
				const imagePath = path.join(
					filepath.replace('.json', '.images'),
					`${name}_${i}.png`
				);

				const oldPhoto = decodePhoto(imagePath);

				log(`Writing image to ${cc.blue}${imagePath}${cc.reset}`);
				image.write(imagePath);

				imageUrls.push(
					new URL(
						'https://raw.githubusercontent.com/cigaleapp/cigale/main/' +
							path
								.relative(path.join(filepath, '../..'), imagePath)
								.replaceAll('\\', '/')
					)
				);

				if (protocol.fresh.version && photoChanged(imagePath, oldPhoto)) {
					imageUrls[i].searchParams.set('v', protocol.fresh.version.toString());
				}
			}

			if (options.some((o) => o.label === name)) {
				const option = options.find((o) => o.label === name);
				option.label = name;
				option.learnMore = learnMore;
				option.description = description;
				option.links = links;
				option.images = imageUrls.map((u) => u.toString());
			} else {
				const optionKeys = (options) => options.map((o) => Number(o.key));
				options.push({
					label: name,
					key:
						// ensure keys of options that were present in the old protocol are preserved
						oldOption?.key ??
						(
							Math.max(
								...optionKeys(options),
								...optionKeys(
									protocol.old.metadata[`${protocol.old.id}__species`].options
								)
							) + 1
						).toString(),
					images: imageUrls.map((u) => u.toString()),
					description,
					links,
					learnMore
				});
			}

			options.sort(({ label: aLabel }, { label: bLabel }) => {
				const a = Number(aLabel);
				const b = Number(bLabel);
				if (isNaN(a) || isNaN(b)) {
					return aLabel.localeCompare(bLabel);
				}
				return a - b;
			});

			log(`Writing protocol to ${cc.blue}${filepath}${cc.reset}`);
			writeFileSync(filepath, JSON.stringify(protocol.fresh, null, 2));
		}
	} catch (error) {
		log('An error occured:\n', error);
	}
}

console.info(
	`Formatting protocols ${cc.blue}${cc.dim}$${cc.reset} ${cc.blue}bun run format ${Object.keys(protocols).join(' ')}${cc.reset}`
);

await x('npm', ['run', 'format', ...Object.keys(protocols)]);

/**
 *
 * @param {string} url
 */
function folderIdFromUrl(url) {
	const id = new URL(url).pathname.split('/').at(-1);
	if (!/\w+/.test(id)) {
		throw new Error(`Invalid Folder ID: ${id}`);
	}
	return id;
}
