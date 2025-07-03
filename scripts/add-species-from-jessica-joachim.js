import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import RSSParser from 'rss-parser';
import { writeFileSync } from 'node:fs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import Turndown from 'turndown';
import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import oldProtocol from '../examples/old-arthropods.cigaleprotocol.json' with { type: 'json' };

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

/** @type {Array<{ name: string; url: string; found: Array<{ name: string; url: string }> }>}  */
const reportTable = [];

const _tdown = new Turndown();
let rssParser = new RSSParser();

const here = path.dirname(new URL(import.meta.url).pathname).replace('/C:/', 'C:/');

/**
 * Maps species names that were not found to list of titles in the corresponding  search results (for troubleshooting).
 * @type {string[]}
 */
const notFoundCache = await fetch(
	'https://raw.githubusercontent.com/cigaleapp/models/main/jessica-joachim-404cache.json'
)
	.then((response) => response.json())
	.then((data) => (Array.isArray(data) ? data : Object.keys(data)))
	.catch(() => []);

console.log(`Using not found cache with ${notFoundCache.length} entries.`);

const newProtocol = { ...protocol };
const species = protocol.metadata['io.github.cigaleapp.arthropods.example__species'].options;
const oldSpecies = oldProtocol.metadata['io.github.cigaleapp.arthropods.example__species'].options;
const total = Object.keys(species).length;
let done = 0;

// Get combined content of all articles in the "Mises à jour" category from the RSS feed
const { items: newsfeed } = await rssParser.parseURL('https://jessica-joachim.com/feed/');
const updates = newsfeed
	.filter(({ categories }) => categories.includes('Mises à jour'))
	.map(({ content }) => htmlToMarkdown(content).replaceAll('&#160;', ' '))
	.slice(0, 3)
	.join('\n');

// For every species in the protocol:
for (const [index, { label: name }] of species.entries()) {
	const progressHeader = `[${cc.blue}${index}/${total}${cc.reset} ${cc.dim}| ${done}${cc.reset}]`;
	// Get existing descriptions of the species from the old protocol, and the current one
	// (which will not be empty when running the script in multiple passes, e.g. when using --force)
	const candidates = [...oldSpecies, ...species].filter(
		(s) =>
			s.label === name &&
			s.description.trim() &&
			s.learnMore.trim() &&
			// Images from jessica-joachim are not downloaded anymore
			!s.image.startsWith('https://raw.githubusercontent.com/cigaleapp/cigale')
	);

	if (updates.includes(name)) {
		// Check if it's mentioned in the updates, in that case, search for it
		await searchForSpecies(index, progressHeader, name);
	} else if (candidates.length > 0) {
		// Otherwise, use the existing species if it has a description and a learnMore link
		newProtocol.metadata['io.github.cigaleapp.arthropods.example__species'].options[index] =
			candidates[0];
		done++;
	} else if (process.argv.includes('--force') && !notFoundCache.includes(name)) {
		// Otherwise, search for it (only if --force is used)
		// The not found cache is used to avoid searching for the same species multiple times,
		// which is useful for continuation of the script after a failure or interruption
		// when the --force option is used
		// Considering the 17k species in the protocol, --force is not used in CI but
		// is used for the initial filling of the descriptions of the protocol
		await searchForSpecies(index, progressHeader, name);
	}
}

if (reportTable.length) {
	await writeFile(path.join(here, 'jessica-joachim-crawler-report.md'), renderReportTable());
	console.error(
		`\n${cc.bold}${cc.blue}Report written to ${here}/jessica-joachim-crawler-report.md${cc.reset}`
	);
}

async function searchForSpecies(index, logHeader, name) {
	const searchedName = name.trim().toLowerCase();
	const searchurl = `https://jessica-joachim.com/?s=${encodeURIComponent(searchedName).replaceAll('%20', '+')}`;

	const synonyms = {
		'Lochmaea caprea': ['Lochmaea capreae']
	};

	// Do a search
	const searchPage = await fetch(searchurl)
		.then((r) => r.text())
		.then((text) => new JSDOM(text).window.document);

	let speciesPageUrl = [...searchPage.querySelectorAll('a')].find((a) => {
		const names = [a.textContent.trim().toLowerCase(), ...(synonyms[name] || [])];

		return names.some((name) => {
			if (new URL(a.href, 'https://jessica-joachim.com').pathname.match(/^\/?20\d\d/)) return false;
			if (name === searchedName) return true;
			if (name.includes(`(${searchedName})`)) return true;
			return false;
		});
	})?.href;

	if (!speciesPageUrl) {
		// Try <gender name> sp. instead of matching full binomial species name
		const [genus] = searchedName.split(' ');
		speciesPageUrl = [...searchPage.querySelectorAll('a')].find(
			(a) => a.textContent.trim().toLowerCase() === `${genus} sp`
		)?.href;

		if (speciesPageUrl) {
			console.error(
				`${cc.clearline}\r${logHeader} ${cc.yellow}Using ${genus} sp. instead of ${name}${cc.reset}`
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
			`${cc.clearline}\r${logHeader} ${cc.red}${name}: not found (out of ${linksFound.length} links)${cc.reset}`
		);
		if (linksFound.length) {
			console.error(`Links found on ${cc.dim}${cc.blue}${searchurl}${cc.reset}`);
			for (const link of linksFound) {
				console.error(
					`${' '.repeat(logHeader.length)} ${cc.dim}${cc.bold}·${cc.reset} ${cc.bold}${cc.blue}${link.textContent}${cc.reset} ${cc.dim}${link.href}${cc.reset}`
				);
			}
		}

		reportTable.push({
			name,
			url: searchurl,
			found: linksFound.map((a) => ({ name: a.textContent, url: a.href }))
		});
		notFoundCache.push(name);
		writeFileSync(
			path.join(here, 'jessica-joachim-404cache.json'),
			JSON.stringify(notFoundCache, null, 2)
		);
		return;
	}

	await fetch(speciesPageUrl)
		.then((r) => r.text())
		.then((content) =>
			parseAndDescribeSpecies(content, speciesPageUrl, name, logHeader, index, index % 1000 === 0)
		);
}

/**
 *
 * @param {string} pageContent
 * @param {string} url
 * @param {string} name
 * @param {string} progressHeader
 * @param {number} optionIndex
 * @param {boolean} writeFiles
 */
async function parseAndDescribeSpecies(
	pageContent,
	url,
	name,
	progressHeader,
	optionIndex,
	writeFiles
) {
	const dom = new JSDOM(pageContent);
	const main = dom.window.document.querySelector('main');
	if (!main) return;
	// const text = main.textContent;
	const markdown = htmlToMarkdown(main.innerHTML).replaceAll('\u00a0', ' ');

	// sometimes there's an image WITHIN the <strong> of Identification; colon can be inside or outside the bold text
	const boldTextSplitPattern = /\*\*.*Identification.*(?:\*\* _?: | _?:\s*\*\*)/;
	const headingSplitPattern = /#### (?:\*\*)?Identification(?:\*\*)?/;

	// console.log(`Adding ${name} to the species, from ${file}`);
	let identificationHints = '';
	try {
		const parts = markdown.split(boldTextSplitPattern);
		if (parts.length >= 2) {
			identificationHints = markdown.split(boldTextSplitPattern)[1]?.split('**')[0];
		}
	} catch {
		// eslint-disable no-empty
	}

	if (!identificationHints) {
		try {
			identificationHints = markdown.split(headingSplitPattern)[1]?.split('####')[0];
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

	if (
		!text &&
		!markdown.trim().startsWith(`${name.split(' ')[0]} sp`) &&
		!markdown.includes('Fiche en cours de création') &&
		!markdown.includes('Fiche à compléter')
	) {
		console.error(`\n\x1b[31mNo text found, main page content was:\x1b[0m`);
		console.error(markdown.replaceAll('\n', '\n\t'));
		console.error();
		console.error('Splitted parts (via bold text):');
		console.error(markdown.split(boldTextSplitPattern));
		console.error();
		console.error('Splitted parts (via header):');
		console.error(markdown.split(headingSplitPattern));
		console.error();
	}

	let cachebuster =
		new URL(
			oldProtocol.metadata['io.github.cigaleapp.arthropods.example__species'].options[optionIndex]
				?.image ?? `https://example.com?v=${protocol.version}`
		).searchParams.get('v') ?? '0';

	// Download image since CORP prevents us from using them directly
	const image = images.length > 0 ? images[0] : '';
	// if (images.length) {
	// 	const image = images[0];
	// 	imagepath = path.join(here, '../examples/arthropods.cigaleprotocol.images', `${name}.jpeg`);
	// 	const oldPhoto = decodePhoto(imagepath);
	// 	await mkdir(path.dirname(imagepath), { recursive: true });
	// 	// await execa`wget -O ${imagepath} ${image}`;
	// 	await fetch(image)
	// 		.then((r) => r.arrayBuffer())
	// 		.then((buf) => {
	// 			writeFileSync(imagepath, Buffer.from(buf));
	// 		});
	// 	images[0] = imagepath;

	// 	if (photoChanged(imagepath, oldPhoto)) {
	// 		cachebuster = protocol.version;
	// 	}
	// }

	newProtocol.metadata['io.github.cigaleapp.arthropods.example__species'].options[optionIndex] =
		/** @satisfies {NonNullable<import('../src/lib/database').Metadata['options']>[number]} */ ({
			...species[optionIndex],
			description: text,
			learnMore: url,
			image
		});

	done++;
	// Erase previous line, print current progress
	process.stdout.write(`${cc.clearline}\r${progressHeader} Added ${cc.bold}${name}${cc.reset}`);

	newProtocol.metadata['io.github.cigaleapp.arthropods.example__species'].options.sort((a, b) =>
		a.label.localeCompare(b.label)
	);

	// writeFile(path.join(here, 'species.json'), JSON.stringify(species, null, 2));
	if (writeFiles) {
		await mkdir(path.join(here, '../examples'), { recursive: true });
		writeFile(
			path.join(here, '../examples/arthropods.cigaleprotocol.json'),
			JSON.stringify(newProtocol, null, 2)
		);
	}
}

/** @param {string} html  */
function htmlToMarkdown(html) {
	return _tdown.turndown(html);
}

function markdownToHtml(markdown) {
	return marked.parse(markdown);
}

function renderReportTable() {
	return `Recherche effectuée | Résultats\n-----------------|------------------\n${reportTable.map(({ name, url, found }) => `[${name}](${url}) | ${found.map(({ name, url }) => `[${name}](${url})`).join(', ')}`).join('\n')}`;
}
