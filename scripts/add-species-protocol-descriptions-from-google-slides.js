import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { Jimp } from 'jimp';
import { JSDOM } from 'jsdom';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import odt from 'odt2html';
import { pdfToPng } from 'pdf-to-png-converter';
import keys from '../google-drive-key.json' with { type: 'json' };

const GOOGLE_DRIVE_FOLDER_URL = folderIdFromUrl(
	'https://drive.google.com/drive/folders/1MY8H4RUb955JPv5OZHRSjh52G2X66A_z?usp=sharing'
);

google.options({
	auth: new JWT({
		email: keys.client_email,
		key: keys.private_key,
		scopes: ['https://www.googleapis.com/auth/drive.readonly']
	})
});

const drive = google.drive('v3');

// List slides in folder
const response = await drive.files.list({
	q: `'${GOOGLE_DRIVE_FOLDER_URL}' in parents and mimeType = 'application/vnd.google-apps.presentation'`
});

await mkdir('./slides', { recursive: true });

for (const { name, id } of response.data.files) {
	const pdf = await drive.files.export(
		{
			fileId: id,
			mimeType: 'application/pdf'
		},
		{
			responseType: 'arraybuffer'
		}
	);

	await pdfToPng(pdf.data, { pagesToProcess: [1] })
		.then(([{ content }]) => Jimp.fromBuffer(content))
		.then((image) =>
			image.autocrop({ tolerance: 0.2 }).write(path.join('./slides', `${name}.png`))
		);

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
				'draw:page': ({ attributes, name }) => {
					return {
						xml: name,
						html: 'section',
						attrs: [{ name: 'data-page', value: attributes['draw:name'] }]
					};
				}
			}
		})
		.then((html) => new JSDOM(html).window.document);

	const description = [...html.querySelectorAll('section[data-page="page2"] p')]
		.map((node) => node.textContent)
		.filter(Boolean)
		.join('\n');

	const links = Object.fromEntries(
		[...html.querySelectorAll('section[data-page="page2"] a')]
			.map((node) => [node.href, node.textContent])
			.filter(([, text]) => text && text !== ' ')
	);

	console.log({ name, links, description });
}

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
