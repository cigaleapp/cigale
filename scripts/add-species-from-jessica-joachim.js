import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import { writeFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Turndown from 'turndown';
import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import oldProtocol from '../examples/old-arthropods.cigaleprotocol.json' with { type: 'json' };
import { decodePhoto, photoChanged } from './utils.js';

// Doing the 17k species would be wayyy too long, so we only do these ones. They correspond to the ones that exist in the old ("lightweight") ~80-classes model
/**
 * GBIF IDs of the species that we will crawl for
 */
const speciesAllowlist = await fetch(
	'https://raw.githubusercontent.com/cigaleapp/models/main/lightweight-80-classmapping.txt'
)
	.then((r) => r.text())
	.then((text) =>
		text
			.split(/\r?\n/)
			.map((line) => Number(line.trim()))
			.filter((n) => !isNaN(n))
	);

console.log(speciesAllowlist.length, 'species to crawl for');

// ANSI control sequences
const cc = {
	clearline: '\x1b[2K',
	red: '\x1b[31m',
	reset: '\x1b[0m',
	dim: '\x1b[2m',
	blue: '\x1b[34m',
	bold: '\x1b[1m',
	yellow: '\x1b[33m'
};

const _tdown = new Turndown();
/** @param {string} html  */
function htmlToMarkdown(html) {
	return _tdown.turndown(html);
}

function markdownToHtml(markdown) {
	return marked.parse(markdown);
}

/** @type {Array<{ name: string; url: string; found: Array<{ name: string; url: string }> }>}  */
const reportTable = [];

function renderReportTable() {
	return `Recherche effectuée | Résultats\n-----------------|------------------\n${reportTable.map(({ name, url, found }) => `[${name}](${url}) | ${found.map(({ name, url }) => `[${name}](${url})`).join(', ')}`).join('\n')}`;
}

const here = path.dirname(new URL(import.meta.url).pathname).replace('/C:/', 'C:/');
console.log({ here });

const species = protocol.metadata['io.github.cigaleapp.arthropods.example__species'].options;
const total = Object.keys(species).length;
let done = 0;

const describedSpecies = [...species];

for (const [index, { label: name, key }] of species.entries()) {
	if (!speciesAllowlist.includes(Number(key))) {
		continue;
	}

	const progressHeader = `[${cc.blue}${index}/${total}${cc.reset} ${cc.dim}| ${done}${cc.reset}]`;
	const progressHeaderLength = `[${done}/${total}]`.length;
	const searchedName = name.trim().toLowerCase();
	const searchurl = `https://jessica-joachim.com/?s=${encodeURIComponent(searchedName).replaceAll('%20', '+')}`;
	// Do a search
	const searchPage = await fetch(searchurl)
		.then((r) => r.text())
		.then((text) => new JSDOM(text).window.document);

	let speciesPageUrl = [...searchPage.querySelectorAll('a')].find((a) => {
		const name = a.textContent.trim().toLowerCase();
		if (name === searchedName) return true;
		if (name.includes(` (${searchedName})`)) return true;
		return false;
	})?.href;
	if (!speciesPageUrl) {
		// Try <gender name> sp. instead of matching full binomial species name
		const [genus] = searchedName.split(' ');
		speciesPageUrl = [...searchPage.querySelectorAll('a')].find(
			(a) => a.textContent.trim().toLowerCase() === `${genus} sp`
		)?.href;

		if (speciesPageUrl) {
			console.error(
				`${cc.clearline}\r${progressHeader} ${cc.yellow}Using ${genus} sp. instead of ${name}${cc.reset}`
			);
		}
	}
	if (!speciesPageUrl) {
		let linksFound = [...searchPage.querySelector('main').querySelectorAll('a')]
			.filter((a) => a.textContent.trim())
			.filter((a) => !a.textContent.includes('Lire la suite'))
			.filter((a) => !a.textContent.endsWith(' commentaires'));
		// Uniquify by URL
		const uniqueLinks = new Map(linksFound.map((a) => [a.href, a]));
		linksFound = [...uniqueLinks.values()];
		console.error(
			`${cc.clearline}\r${progressHeader} ${cc.red}${name}: not found (out of ${linksFound.length} links)${cc.reset}`
		);
		if (linksFound.length) {
			console.error(`Links found on ${cc.dim}${cc.blue}${searchurl}${cc.reset}`);
			for (const link of linksFound) {
				console.error(
					`${' '.repeat(progressHeaderLength)} ${cc.dim}${cc.bold}·${cc.reset} ${cc.bold}${cc.blue}${link.textContent}${cc.reset} ${cc.dim}${link.href}${cc.reset}`
				);
			}
		}

		reportTable.push({
			name,
			url: searchurl,
			found: linksFound.map((a) => ({ name: a.textContent, url: a.href }))
		});
		continue;
	}

	await fetch(speciesPageUrl)
		.then((r) => r.text())
		.then((content) =>
			parseAndDescribeSpecies(content, speciesPageUrl, name, progressHeader, index)
		);
}

if (reportTable.length) {
	await writeFile(path.join(here, 'jessica-joachim-crawler-report.md'), renderReportTable());
	console.error(
		`\n${cc.bold}${cc.blue}Report written to ${here}/jessica-joachim-crawler-report.md${cc.reset}`
	);
}

/**
 *
 * @param {string} pageContent
 * @param {string} url
 * @param {string} name
 * @param {string} progressHeader
 * @param {number} optionIndex
 */
async function parseAndDescribeSpecies(pageContent, url, name, progressHeader, optionIndex) {
	const dom = new JSDOM(pageContent);
	const main = dom.window.document.querySelector('main');
	if (!main) return;
	// const text = main.textContent;
	const markdown = htmlToMarkdown(main.innerHTML).replaceAll('\u00a0', ' ');

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

	const text = cleaneddom.window.document.documentElement.textContent
		.replaceAll('\u00a0', ' ')
		.replaceAll('• ', '\r\n• ')
		.trim();

	const images = [...main.querySelectorAll('img')].map(({ src }) => src);

	if (!text) {
		console.error(`\n\x1b[31mNo text found, main page content was:\x1b[0m`);
		console.error(markdown.replaceAll('\n', '\n\t'));
		console.error();
	}

	let cachebuster =
		new URL(
			oldProtocol.metadata['io.github.cigaleapp.arthropods.example__species'].options[optionIndex]
				?.image ?? `https://example.com?v=${protocol.version}`
		).searchParams.get('v') ?? '0';

	// Download image since CORP prevents us from using them directly
	let imagepath = '';
	if (images.length) {
		const image = images[0];
		imagepath = path.join(here, '../examples/arthropods.cigaleprotocol.images', `${name}.jpeg`);
		const oldPhoto = decodePhoto(imagepath);
		await mkdir(path.dirname(imagepath), { recursive: true });
		// await execa`wget -O ${imagepath} ${image}`;
		await fetch(image)
			.then((r) => r.arrayBuffer())
			.then((buf) => {
				writeFileSync(imagepath, Buffer.from(buf));
			});
		images[0] = imagepath;

		if (photoChanged(imagepath, oldPhoto)) {
			cachebuster = protocol.version;
		}
	}

	describedSpecies[optionIndex] =
		/** @satisfies {NonNullable<import('../src/lib/database').Metadata['options']>[number]} */ ({
			key: optionIndex.toString(),
			label: name,
			description: text,
			learnMore: url,
			...(imagepath
				? {
						image: `https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/${encodeURIComponent(name)}.jpeg?v=${cachebuster}`
					}
				: {})
		});

	done++;
	// Erase previous line, print current progress
	process.stdout.write(`${progressHeader} Added ${cc.bold}${name}${cc.reset}`);

	// writeFile(path.join(here, 'species.json'), JSON.stringify(species, null, 2));
	await mkdir(path.join(here, '../examples'), { recursive: true });
	writeFile(
		path.join(here, '../examples/arthropods.cigaleprotocol.json'),
		JSON.stringify(
			{
				...protocol,
				metadata: {
					...protocol.metadata,
					'io.github.cigaleapp.arthropods.example__species': {
						...protocol.metadata['io.github.cigaleapp.arthropods.example__species'],
						options: describedSpecies
					}
				}
			},
			null,
			2
		)
	);
}
