import { exists, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { type } from 'arktype';
import * as jsdom from 'jsdom';
import { JSDOM } from 'jsdom';
import Turndown from 'turndown';

import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import type { MetadataEnumVariant } from '../src/lib/schemas/metadata.js';
import type { ExportedProtocol } from '../src/lib/schemas/protocols.js';
import { EtaCalculator } from './eta.js';

const LINKS_TO_AVOID = [
	// FIXME redirects to an image file
	'https://jessica-joachim.com/insectes/dipteres/syrphidae/paragus-pecchiolii/',
	// FIXME 404 not found
	'https://jessica-joachim.com/insectes/dipteres/syrphidae/eupeodes-luniger/',
	// FIXME 404 not found
	'https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/curculionidae/aulacobaris-sp/',
	// FIXME redirects to an image file
	'https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/chrysomelidae/timarcha-sp/'
];

const cleanedTextContent = (node: Element) =>
	'textContent' in node && typeof node.textContent === 'string'
		? node.textContent.replaceAll('\r?\n', ' ').trim()
		: undefined;

// Suppress annoying virtual console error we can't do anything about and don't care about
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on('error', (e) => {
	if (/Could not parse CSS stylesheet/i.test(e.toString())) return;
	console.error(e);
});

const here = import.meta.dirname;
const protocolPath = path.join(here, '../examples/arthropods.cigaleprotocol.json');
const tdown = new Turndown();
let speciesLinks: Map<string, URL> | undefined;
// For some reason Turndown#turndown is typed as string instead of a method returning string
const htmlToMarkdown = (html: string) =>
	(tdown.turndown as unknown as (input: string) => string)(html);

const ORIGIN = 'https://jessica-joachim.com';

if (import.meta.main) {
	await main();
}

async function main() {
	const metadataKey = type('"genus" | "species"').assert(process.argv[2]);

	const augmented = await augmentMetadata(
		protocol,
		metadataKey,
		metadataKey === 'species' ? searchForSpecies : searchForGenus
	);

	await Bun.write(protocolPath, JSON.stringify(augmented, null, 2));
	await Bun.$`bunx prettier --write ${protocolPath}`;
}

async function augmentMetadata(
	protocol: typeof ExportedProtocol.infer,
	metadataKey: 'genus' | 'species',
	search: (...names: string[]) => Promise<URL | null>,
	limit = -1
): Promise<typeof ExportedProtocol.infer> {
	const augmented = structuredClone(protocol);
	const metadataOptions = augmented.metadata[`${protocol.id}__${metadataKey}`].options!;

	let total = 0;
	let done = 0;
	let processed = 0;
	const eta = new EtaCalculator({
		averageOver: 300,
		// TODO use percentage advancement instead of hardcoded number
		totalSteps: { species: 1850, genus: 345 }[metadataKey]
	});

	total = metadataOptions.length;
	for (const s of metadataOptions) {
		done++;

		if (limit > 0 && done > limit) break;

		const pageUrl = await search(s.label, ...(s.synonyms ?? []));
		if (!pageUrl) {
			// console.warn(yellow(`⁄ Could not find page for species ${s.label}`));
			continue;
		}

		const newData = await augmentMetadataOption(s, pageUrl);

		if (!newData) {
			console.warn(yellow(`⁄ Could not extract data for ${metadataKey} ${s.label}`));
			continue;
		}

		Object.assign(s, newData);

		processed++;

		const stepTookMs = eta.msSinceLastStep();
		eta.step();

		console.info(
			`${align(processed, total)} ${percentage(done, total, 1)} ${cyan(`→ ${eta.display(processed)}`)} Updating ${metadataKey} ${dim(`took ${stepTookMs.toFixed(0)}ms`)} ${s.label}  with ${pageUrl} `
		);
	}

	console.info(
		cyan(
			`⁄ Finished processing ${metadataKey}, updated ${processed}/${total} entries (${percentage(processed, total)})`
		)
	);

	return augmented;
}

async function searchForGenus(...names: string[]): Promise<URL | null> {
	return searchForSpecies(...names.map((name) => `${name} sp`));
}

async function searchForSpecies(...names: string[]): Promise<URL | null> {
	speciesLinks ??= await fetchAndParseHtml(new URL(`/identification`, ORIGIN)).then(
		(doc) =>
			new Map(
				[...(doc?.getElementById('Listefiches')?.querySelectorAll('a') ?? [])]
					.map((a) => {
						const text = cleanedTextContent(a) ?? '';
						if (!text) return null;
						const url = new URL(a.href, ORIGIN);
						if (!url) return null;
						return [text, url];
					})
					.filter((e): e is [string, URL] => e !== null)
			)
	);

	for (const [title, link] of speciesLinks ?? []) {
		if (LINKS_TO_AVOID.includes(link.href)) {
			continue;
		}
		if (blogTitleMatchesSpeciesName(title, names)) {
			return link;
		}
	}

	return null;
}

async function augmentMetadataOption(
	{ key, cascade }: typeof MetadataEnumVariant.infer,
	page: URL
): Promise<Partial<typeof MetadataEnumVariant.infer>> {
	const doc = await fetchAndParseHtml(page);
	if (!doc) throw new Error(`Could not fetch or parse page at ${page.toString()}`);

	const content = doc.querySelector('main');
	if (!content) throw new Error(`Could not find main content in page at ${page.toString()}`);

	const imageUrl = content.querySelector('img')?.src;

	const hasImageWithFilename = (filename: string) =>
		[...content.querySelectorAll(`img[src*="${filename}"]`)].some(
			(candidate) =>
				new URL(candidate.getAttribute('src')!).pathname.split('/').pop() === filename
		);

	cascade ??= {};

	// Niveau de difficulté
	for (const [key, niveau] of Object.entries({
		easy: 'facile',
		medium: 'moyenne',
		hard: 'difficile',
		very_hard: 'tres-difficile'
	})) {
		if (hasImageWithFilename(`Id-${niveau}.jpg`)) {
			cascade.identification_difficulty = key;
		}
	}

	// Statut de conservation
	for (const symbol of ['lc', 'nt', 'vu', 'en', 'cr', 'ex']) {
		if (hasImageWithFilename(`Statut-${symbol.toUpperCase()}.jpg`)) {
			cascade.conservation_status = symbol;
		}
	}

	const removeAll = (selector: string) =>
		content.querySelectorAll(selector).forEach((el) => el.remove());

	// First image, keeping it in description would be redundant
	content.querySelector('img')?.remove();
	// Comments
	content.querySelector('.entry-content > #comments')?.remove();
	// Like button section
	content.querySelector('.entry-content > [id^=like-post-wrapper]')?.remove();
	// Social media share buttons
	content.querySelector('.entry-content > .sharedaddy')?.remove();
	// Text (most likely header) for the removed gallery
	removeAll('.entry-content > p:has(+ .wp-block-kadence-advancedgallery)');
	// Gallery (can't be represented in markdown well)
	removeAll('.entry-content > .wp-block-kadence-advancedgallery');
	removeAll('.entry-content > .tiled-gallery');
	removeAll('.entry-content > [id^=gallery-]');
	removeAll('.entry-content > [id^=gallery-]');
	// Navigation buttons
	removeAll('.entry-content > .wp-block-kadence-advancedbtn');
	// Remove title
	content.querySelector('h1')?.remove();
	// Remove year-only bold text, it's usually above a gallery (that is now removed)
	content.querySelectorAll('strong, h1, h2, h3, h4, h5, h6').forEach((node) => {
		const text = cleanedTextContent(node) ?? '';

		if (/^20\d\d(-20\d\d)?$/.test(text)) {
			node.remove();
		}
	});

	// TODO improve this
	content.querySelectorAll('img').forEach((img) => img.remove());

	// Remove links that became empty
	content.querySelectorAll('a').forEach((node) => {
		const text = cleanedTextContent(node) ?? '';

		if (!text) {
			node.remove();
		}
	});

	return {
		key,
		learnMore: page.toString(),
		description: htmlToMarkdown(content.innerHTML).trim(),
		image: imageUrl,
		cascade
	};
}

// TODO remove once TS declares it itself
declare global {
	interface RegExpConstructor {
		escape(s: string): string;
	}
}

function blogTitleMatchesSpeciesName(title: string, names: string[]): boolean {
	const normalize = (str: string) => str.trim().toLowerCase();

	const candidates = names.flatMap((name) => [
		new RegExp(`^${RegExp.escape(name)}$`, 'i'),
		new RegExp(`^.+ \\(${RegExp.escape(name)}\\)$`, 'i'),
		new RegExp(`^${RegExp.escape(name)} \\(.+\\)$`, 'i')
	]);

	for (const candidate of candidates) {
		if (candidate.test(normalize(title))) {
			return true;
		}
	}

	return false;
}

// ANSI control sequences
class CC {
	static clearline = '\x1b[2K';
	static red = '\x1b[31m';
	static reset = '\x1b[0m';
	static dim = '\x1b[2m';
	static blue = '\x1b[34m';
	static bold = '\x1b[1m';
	static yellow = '\x1b[33m';
	static cyan = '\x1b[36m';
}

function yellow(text: string): string {
	return `${CC.yellow}${text}${CC.reset}`;
}

function cyan(text: string): string {
	return `${CC.cyan}${text}${CC.reset}`;
}

function dim(text: string): string {
	return `${CC.dim}${text}${CC.reset}`;
}

function percentage(part: number, total: number, precision = 0): string {
	return ((part / total) * 100).toFixed(precision).padStart(3 + precision, ' ') + '%';
}

function align<T extends string | number>(num: T, total: T | T[]): string {
	return num.toString().padStart(total.toString().length);
}

async function fetchAndParseHtml(url: URL | string): Promise<JSDOM['window']['document']> {
	const cachedir = path.join('.jessica-joachim-cache');
	const cachefile = path.join(
		cachedir,
		encodeURIComponent(url.toString().replace(ORIGIN, '')) + '.html'
	);

	let html: string;

	if (await exists(cachefile)) {
		html = await readFile(cachefile, 'utf-8');
	} else {
		const response = await fetch(url);
		if (!response.ok) {
			if (response.status === 429) {
				await new Promise((resolve) => setTimeout(resolve, 10_000));
				return fetchAndParseHtml(url);
			}
			throw new Error(
				`Failed to fetch ${url.toString()} : ${response.status} ${response.statusText}`
			);
		}

		html = await response.text();

		if (await exists(cachedir)) {
			await writeFile(cachefile, html);
		}
	}

	return new JSDOM(html, { virtualConsole }).window.document;
}
