import { execa } from 'execa';
import { JSDOM } from 'jsdom';
import path from 'node:path';
import { stat, mkdir, readFile, opendir, writeFile } from 'node:fs/promises';
import { marked } from 'marked';
import Turndown from 'turndown';

// ANSI control sequences
const cc = {
	clearline: '\x1b[2K',
	red: '\x1b[31m',
	reset: '\x1b[0m',
	dim: '\x1b[2m',
	blue: '\x1b[34m',
	bold: '\x1b[1m'
};

const _tdown = new Turndown();
/** @param {string} html  */
function htmlToMarkdown(html) {
	return _tdown.turndown(html);
}

function markdownToHtml(markdown) {
	return marked.parse(markdown);
}

const classmapping = await fetch('https://cigaleapp.github.io/models/class_mapping.txt')
	.then((r) => r.text())
	.then((text) =>
		Object.fromEntries(
			text
				.split('\n')
				.filter((x) => x.trim())
				.map((line, i) => [line, i])
		)
	);

// Check if wget is installed
await execa`wget --version`.catch((error) => {
	if (error) {
		console.error('wget is not installed. Please install wget to use this script.');
		process.exit(1);
	}
});

const here = path.dirname(new URL(import.meta.url).pathname);
const output = path.join(here, 'jessica-joachim.com');

if (!(await exists(output))) {
	await mkdir(output);

	// Download whole site from jessica-joachim.com/identification, inheriting stdio and only downloading .html files and images, storing them inside the `output` directory
	await execa(
		'wget',
		[
			'--recursive',
			'--page-requisites',
			'--html-extension',
			'--convert-links',
			'--restrict-file-names=windows',
			'--domains',
			'jessica-joachim.com',
			'--no-parent',
			'--no-host-directories',
			'--directory-prefix',
			output,
			'--accept',
			'html,jpg,jpeg,png,gif',
			'https://jessica-joachim.com/identification'
		],
		{ stdio: 'inherit' }
	);
}

// Recursively walk all .html files, keeping in the array only text content of files whose text content contains "Espèce : "
/** @type {Record<string, { url: string; text: string; images: string[] }>} */
const species = {};

/**
 * @type {typeof import('../src/lib/protocols').ExportedProtocol.inferIn}
 */
const protocol = {
	$schema: 'https://cigaleapp.github.io/cigale/protocol.schema.json',
	id: 'io.github.cigaleapp.transects.arthropods',
	name: "Transect d'arthropodes",
	source: 'https://github.com/cigaleapp/cigale/tree/main/scripts/jessica-joachim-crawler.js',
	description:
		'Protocole de transect pour l’identification des arthropodes. Descriptions et photos des espèces de Jessica Joachim, cf https://jessica-joachim.com/identification',
	authors: [],
	metadata: {
		'io.github.cigaleapp.transects.arthropods__species': {
			type: 'enum',
			label: 'Espèce',
			description: '',
			required: true,
			mergeMethod: 'max',
			options: []
		}
	}
};

const total = Object.keys(classmapping).length;
let done = 0;

for await (const file of walk(output)) {
	if (file.endsWith('.html')) {
		const content = await readFile(file).then((buffer) => buffer.toString());
		const dom = new JSDOM(content);
		const main = dom.window.document.querySelector('main');
		if (!main) continue;
		const text = main.textContent;
		const markdown = htmlToMarkdown(main.innerHTML).replaceAll('\u00a0', ' ');

		if (/Espèce : .+/.test(text)) {
			const name = /Espèce : (.+)/.exec(text)[1].trim();
			if (name === '–') continue;
			// console.log(`Adding ${name} to the species, from ${file}`);
			let identificationHints = '';
			try {
				identificationHints = markdown.split('**Identification** : ')[1]?.split('**')[0];
			} catch {
				// eslint-disable no-empty
			}

			if (!identificationHints) {
				try {
					identificationHints = markdown.split('#### Identification')[1]?.split('####')[0];
				} catch {
					// eslint-disable no-empty
				}
			}
			const cleaneddom = new JSDOM(markdownToHtml(identificationHints || '<body></body>'));
			const selfurl =
				[...cleaneddom.window.document.querySelectorAll('a')].find(
					(a) => a.textContent.trim() === name
				)?.href ??
				`https://jessica-joachim.com/${path.relative(output, file).replace('/index.html', '')}`;

			species[name] = {
				text: cleaneddom.window.document.documentElement.textContent
					.replaceAll('\u00a0', ' ')
					.replaceAll('• ', '\r\n• ')
					.trim(),
				classmapping: classmapping[name],
				url: selfurl,
				images: [...main.querySelectorAll('img')].map(({ src }) => src)
			};

			if (classmapping[name]) {
				if (!species[name].text) {
					console.error(
						`\n\x1b[31mNo text found for ${name} in ${file}\nMain page content was:\x1b[0m`
					);
					console.error(markdown.replaceAll('\n', '\n\t'));
					console.error();
				}
				protocol.metadata[`${protocol.id}__species`].options.push(
					/** @satisfies {NonNullable<import('../src/lib/database').Metadata['options']>[number]} */ ({
						key: classmapping[name].toString(),
						label: name,
						description: species[name].text,
						learnMore: selfurl,
						image: species[name].images[0]
					})
				);
				protocol.metadata[`${protocol.id}__species`].options.sort(
					(a, b) => parseFloat(a.key) - parseFloat(b.key)
				);
				done++;
				// Erase previous line, print current progress
				process.stdout.write(
					`${cc.clearline}\r[${cc.blue}${done}/${total}${cc.reset}] Added ${cc.bold}${name}${cc.reset}`
				);
			} else {
				process.stdout.write(
					`${cc.clearline}\r[${cc.blue}${done}/${total}${cc.reset}] ${cc.dim}Skipped ${cc.bold}${name}${cc.reset}${cc.dim} (not in class mapping)${cc.reset}`
				);
			}

			// writeFile(path.join(here, 'species.json'), JSON.stringify(species, null, 2));
			await mkdir(path.join(here, '../examples'), { recursive: true });
			writeFile(
				path.join(here, '../examples/arthropods.cigaleprotocol.json'),
				JSON.stringify(protocol, null, 2)
			);
		}
	}
}

async function* walk(dir) {
	for await (const d of await opendir(dir)) {
		const entry = path.join(dir, d.name);
		if (d.isDirectory()) yield* walk(entry);
		else if (d.isFile()) yield entry;
	}
}

async function exists(path) {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}
