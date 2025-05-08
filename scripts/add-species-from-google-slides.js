import { execaSync } from 'execa';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { Jimp } from 'jimp';
import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import odt from 'odt2html';
import { pdfToPng } from 'pdf-to-png-converter';
import keys from '../google-drive-key.json' with { type: 'json' };
import Turndown from 'turndown';

const _tdown = new Turndown();
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
	'https://drive.google.com/drive/folders/1MY8H4RUb955JPv5OZHRSjh52G2X66A_z?usp=sharing'
);

/**
 * @import { Protocol } from '../src/lib/database.js';
 * @type {Record<string, Protocol>}
 */
const protocols = Object.fromEntries(
	ADD_TO_PROTOCOLS.map((file) => [file, JSON.parse(readFileSync(file, 'utf8'))])
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

for (const { name, id } of response.data.files) {
	const log = (...items) =>
		console.info(`${cc.bold}${cc.cyan}[${name.padStart(longestNameLength)}]${cc.reset}`, ...items);

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

	log(`Converting slide 1 to image`);
	const image = await pdfToPng(pdf.data, { pagesToProcess: [1], viewportScale: 2 })
		.then(([{ content }]) => Jimp.fromBuffer(content))
		.then((image) => {
			const { width, height } = image.bitmap;
			let cropbox = {
				start: { x: 0, y: 0, found: false },
				end: { x: width, y: height, found: false }
			};

			const isBackground = (x, y) => image.getPixelColor(x, y) === 0xffffffff;

			image.scan((x, y) => {
				// Get topleft corner
				if (!cropbox.start.found && !isBackground(x, y)) {
					cropbox.start = { x, y, found: true };
				}

				// Get bottomright corner
				if (!cropbox.end.found && !isBackground(width - x, height - y)) {
					cropbox.end = { x: width - x, y: height - y, found: true };
				}
			});

			const logbox = ({ start, end }) => `(${start.x} ${start.y}) -> (${end.x} ${end.y})`;

			log(
				`Cropping image to ${cc.blue}${logbox(cropbox)}${cc.reset} from ${cc.cyan}(0 0) -> (${width} ${height})${cc.reset}`
			);

			return image.crop({
				x: cropbox.start.x,
				y: cropbox.start.y,
				w: cropbox.end.x - cropbox.start.x,
				h: cropbox.end.y - cropbox.start.y
			});
		});

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

	log('Extracting description');
	const html = await odt
		.toHTML({
			path: Buffer.from(odp.data),
			trim: true,
			openFilters: {
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

	const description = htmlToMarkdown(html.querySelector('section[data-page="page2"]'));

	const links = Object.fromEntries(
		[...html.querySelectorAll('section[data-page="page2"] a')]
			.map((node) => [node.href, node.textContent])
			.filter(([, text]) => text && text !== ' ')
	);

	const learnMore =
		Object.entries(links).find(([, text]) => ['INPN', 'LMDI'].includes(text))[0] ?? links[0][0];

	for (const [filepath, protocol] of Object.entries(protocols)) {
		log(`Adding to ${cc.blue}${protocol.id}${cc.reset}`);

		const options = protocol.metadata[`${protocol.id}__species`].options;

		const imagePath = path.join(filepath.replace('.json', '.images'), `${name}.png`);
		const imageUrl = `https://cigaleapp.github.io/cigale/${path.relative(path.dirname(path.dirname(filepath)).replaceAll('\\', '/'), imagePath)}`;

		log(`Writing image to ${cc.blue}${imagePath}${cc.reset}`);
		image.write(imagePath);

		if (options.some((o) => o.label === name)) {
			const option = options.find((o) => o.label === name);
			option.label = name;
			option.learnMore = learnMore;
			option.description = description;
			option.links = links;
			option.image = imageUrl;
		} else {
			options.push({
				label: name,
				key: options.length.toString(),
				image: imageUrl,
				description,
				links,
				learnMore
			});
		}

		log(`Writing protocol to ${cc.blue}${filepath}${cc.reset}`);
		writeFileSync(filepath, JSON.stringify(protocol, null, 2));
	}
}

console.info(
	`Formatting protocols ${cc.blue}${cc.dim}$${cc.reset} ${cc.blue}npm run format ${Object.keys(protocols).join(' ')}${cc.reset}`
);

execaSync`npm run format ${Object.keys(protocols)}`;

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
