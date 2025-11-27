import { exists, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { formatDuration, intervalToDuration } from 'date-fns';
import { JSDOM } from 'jsdom';
import * as jsdom from 'jsdom';
import RSSParser from 'rss-parser';
import Turndown from 'turndown';

import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import type { MetadataEnumVariant } from '../src/lib/schemas/metadata';
import type { ExportedProtocol } from '../src/lib/schemas/protocols';

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
const rss = new RSSParser();
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
	const augmented = await augmentProtocol(protocol);
	await Bun.write(protocolPath, JSON.stringify(augmented, null, 2));
	await Bun.$`bunx prettier --write ${protocolPath}`;
}

async function scanSpecies(protocol: typeof ExportedProtocol.infer) {
	await searchForSpecies('');

	let untouchedLinks = [...(speciesLinks?.entries() ?? [])];

	const total =
		protocol.metadata['io.github.cigaleapp.arthropods.example__species'].options!.length;
	let done = 0;
	for (const { label, key } of protocol.metadata[
		'io.github.cigaleapp.arthropods.example__species'
	].options!) {
		const u = (await searchForSpecies(label))?.href;
		untouchedLinks = untouchedLinks.filter(([, link]) => link.href !== u);

		if (++done % 500 === 0) {
			console.info(
				`${align(done, total)} ${percentage(done, total)} Scanned species ${dim(label)}`
			);
		}
	}

	return untouchedLinks;
}

async function augmentProtocol(
	protocol: typeof ExportedProtocol.infer,
	limit = -1
): Promise<typeof ExportedProtocol.infer> {
	const augmented = structuredClone(protocol);
	const protocolSpecies =
		augmented.metadata['io.github.cigaleapp.arthropods.example__species'].options!;

	let total = 0;
	let done = 0;
	let processed = 0;
	let stepDurationsSum = 0;
	let lastStepTime = performance.now();
	let eta = 0; // in ms

	total = protocolSpecies.length;
	for (const s of protocolSpecies) {
		done++;

		if (limit > 0 && done > limit) break;

		const pageUrl = await searchForSpecies(s.label);
		if (!pageUrl) {
			// console.warn(yellow(`⁄ Could not find page for species ${s.label}`));
			continue;
		}

		const newData = await getSpecies(s.key, pageUrl);

		if (!newData) {
			console.warn(yellow(`⁄ Could not extract data for species ${s.label}`));
			continue;
		}

		Object.assign(s, newData);

		processed++;

		const currentTime = performance.now();
		const currentStepDuration = currentTime - lastStepTime;
		stepDurationsSum += currentStepDuration;
		lastStepTime = currentTime;

		eta = (stepDurationsSum / processed) * (total - done);

		console.info(
			`${align(processed, total)} ${percentage(done, total, 1)} ${cyan(`→ ${formatEta(eta)}`)} Updating species ${dim(`took ${currentStepDuration.toFixed(0)}ms`)} ${s.label}  with ${pageUrl} `
		);
	}

	console.info(
		cyan(
			`⁄ Finished processing species, updated ${processed}/${total} entries (${percentage(processed, total)})`
		)
	);

	return augmented;
}

async function searchForSpecies(name: string): Promise<URL | null> {
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
		// FIXME redirects to an image file
		if (
			link.href ===
			'https://jessica-joachim.com/insectes/dipteres/syrphidae/paragus-pecchiolii/'
		) {
			continue;
		}
		if (blogTitleMatchesSpeciesName(title, name)) {
			return link;
		}
	}

	return null;
}

async function getSpecies(
	key: string,
	page: URL
): Promise<Partial<typeof MetadataEnumVariant.infer>> {
	const doc = await fetchAndParseHtml(page);
	if (!doc) throw new Error(`Could not fetch or parse page at ${page.toString()}`);

	const content = doc.querySelector('main');
	if (!content) throw new Error(`Could not find main content in page at ${page.toString()}`);

	const imageUrl = content.querySelector('img')?.src;

	// First image, keeping it in description would be redundant
	content.querySelector('img')?.remove();
	// Comments
	content.querySelector('.entry-content > #comments')?.remove();
	// Like button section
	content.querySelector('.entry-content > [id^=like-post-wrapper]')?.remove();
	// Social media share buttons
	content.querySelector('.entry-content > .sharedaddy')?.remove();
	// Text (most likely header) for the removed gallery
	content.querySelector('.entry-content > p:has(+ .wp-block-kadence-advancedgallery)')?.remove();
	// Gallery (can't be represented in markdown well)
	content.querySelector('.entry-content > .wp-block-kadence-advancedgallery')?.remove();
	content.querySelector('.entry-content > .tiled-gallery')?.remove();
	content.querySelector('.entry-content > [id^=gallery-]')?.remove();
	// Navigation buttons
	content.querySelector('.entry-content > .wp-block-kadence-advancedbtn')?.remove();
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
		image: imageUrl
	};
}

// TODO remove once TS declares it itself
declare global {
	interface RegExpConstructor {
		escape(s: string): string;
	}
}

function blogTitleMatchesSpeciesName(title: string, name: string): boolean {
	const normalize = (str: string) => str.trim().toLowerCase();

	const candidates = [
		new RegExp(`^${RegExp.escape(name)}$`, 'i'),
		new RegExp(`^.+ \\(${RegExp.escape(name)}\\)$`, 'i'),
		new RegExp(`^${RegExp.escape(name)} \\(.+\\)$`, 'i')
	];

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

function formatEta(eta: number): string {
	const { hours = 0, minutes = 0 } = intervalToDuration({ start: 0, end: eta });
	return `${hours.toString().padStart(2, '0')}h${minutes.toString().padStart(2, '0')}`;
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
			throw new Error(
				`Failed to fetch ${url.toString()}: ${response.status} ${response.statusText}`
			);
		}

		html = await response.text();

		if (await exists(cachedir)) {
			await writeFile(cachefile, html);
		}
	}

	return new JSDOM(html, { virtualConsole }).window.document;
}
