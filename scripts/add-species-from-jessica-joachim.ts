import path from 'node:path';
import { JSDOM } from 'jsdom';
import RSSParser from 'rss-parser';
import Turndown from 'turndown';

import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import type { MetadataEnumVariant } from '../src/lib/schemas/metadata';
import type { ExportedProtocol } from '../src/lib/schemas/protocols';

const here = import.meta.dirname;
const protocolPath = path.join(here, '../examples/arthropods.cigaleprotocol.json');
const rss = new RSSParser();
const tdown = new Turndown();
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

async function augmentProtocol(
	protocol: typeof ExportedProtocol.infer
): Promise<typeof ExportedProtocol.infer> {
	const augmented = structuredClone(protocol);
	const protocolSpecies =
		augmented.metadata['io.github.cigaleapp.arthropods.example__species'].options!;

	const updatesArticles = await getNewsfeedUpdateArticles();

	let total = 0;
	let done = 0;
	for (const articleUrl of updatesArticles) {
		const updatedSpeciesList = await updatedSpecies(articleUrl);
		total += updatedSpeciesList.length;

		for (const [name, pageUrl] of updatedSpeciesList) {
			done++;

			const enumVariant = protocolSpecies.find(({ label }) =>
				blogTitleMatchesSpeciesName(name, label)
			);

			if (!enumVariant) continue;

			console.info(`${done}/${total} Updating species ${enumVariant.label} with ${pageUrl}`);

			const newData = await getSpecies(enumVariant.key, pageUrl);

			if (!newData) {
				console.warn(yellow(`⁄ Could not extract data for species ${enumVariant.label}`));
				continue;
			}

			enumVariant.cascade = { ...enumVariant.cascade, scientific_name: enumVariant.label };
			Object.assign(enumVariant, newData);
		}
	}

	const notFoundCache: Record<string, Array<{ text: string; url: string }>> = await fetch(
		'https://raw.githubusercontent.com/cigaleapp/models/main/jessica-joachim-404cache.json'
	).then((r) => r.json());

	total = protocolSpecies.length;
	for (const s of protocolSpecies) {
		done++;

		if (s.label in notFoundCache) continue;

		const pageUrl = await searchForSpecies(s.label);
		if (!pageUrl) {
			console.warn(yellow(`⁄ Could not find page for species ${s.label}`));
			continue;
		}

		const newData = await getSpecies(s.key, pageUrl);

		if (!newData) {
			console.warn(yellow(`⁄ Could not extract data for species ${s.label}`));
			continue;
		}

		console.info(`${done}/${total} Updating species ${s.label} with ${pageUrl}`);

		Object.assign(s, newData);
	}

	return augmented;
}

async function getNewsfeedUpdateArticles(): Promise<URL[]> {
	const feed = await rss.parseURL('https://jessica-joachim.com/feed/');
	const updates = feed.items
		.filter(({ categories }) => categories?.includes('Mises à jour'))
		.map(({ link }) => (link ? new URL(link) : null))
		.filter((link): link is URL => link !== null);

	return updates;
}

async function updatedSpecies(updatesArticle: URL): Promise<Array<readonly [string, URL]>> {
	const doc = await fetch(updatesArticle)
		.then((r) => r.text())
		.then((html) => new JSDOM(html).window.document);

	// TODO get URL patterns (/insectes/*, /especes/*, ... ) to filter out irrelevant links
	return Array.from(doc.querySelectorAll<HTMLAnchorElement>('main .entry-content a'))
		.map((link) => [
			link.textContent?.trim(),
			URL.canParse(link.href) ? new URL(link.href) : updatesArticle
		])
		.map((link) => link as [string, URL])
		.filter(([name]) => Boolean(name))
		.filter(([, url]) => url.origin === ORIGIN && url.pathname !== updatesArticle.pathname);
}

async function searchForSpecies(name: string): Promise<URL | null> {
	const results = await fetch(new URL(`/?${new URLSearchParams({ s: name })}`, ORIGIN))
		.then((r) => r.text())
		.then((html) => new JSDOM(html).window.document);

	const links = results.querySelectorAll<HTMLAnchorElement>('main article h2 a');

	for (const link of links) {
		const title = link.textContent;
		if (blogTitleMatchesSpeciesName(title, name)) {
			return new URL(link.href);
		}
	}

	return null;
}

async function getSpecies(
	key: string,
	page: URL
): Promise<Partial<typeof MetadataEnumVariant.infer> | null> {
	const doc = await fetch(page)
		.then((r) => r.text())
		.then((html) => new JSDOM(html).window.document);

	const content = doc.querySelector('main');
	if (!content) return null;

	const imageUrl = content.querySelector('img')?.src;

	// First image, keeping it in description would be redundant
	content.querySelector('img')?.remove();
	// Comments
	content.querySelector('.entry-content > #comments')?.remove();
	// Like button section
	content.querySelector('.entry-content > [id^=like-post-wrapper]')?.remove();
	// Social media share buttons
	content.querySelector('.entry-content > .sharedaddy')?.remove();
	// Gallery (can't be represented in markdown well)
	content.querySelector('.entry-content > .wp-block-kadence-advancedgallery')?.remove();
	content.querySelector('.entry-content > .tiled-gallery')?.remove();
	content.querySelector('.entry-content > [id^=gallery-]')?.remove();
	// Navigation buttons
	content.querySelector('.entry-content > .wp-block-kadence-advancedbtn')?.remove();
	// Remove title
	content.querySelector('h1')?.remove();

	return {
		key,
		learnMore: page.toString(),
		description: htmlToMarkdown(content.innerHTML).trim(),
		image: imageUrl
	};
}

function blogTitleMatchesSpeciesName(title: string, name: string): boolean {
	const normalize = (str: string) => str.trim().toLowerCase();

	const candidates = [
		new RegExp(`^${RegExp.escape(name)}$`, 'i'),
		new RegExp(`^.+ \\(${RegExp.escape(name)}\\)$`, 'i')
	];

	for (const candidate of candidates) {
		if (candidate.test(normalize(title))) {
			return true;
		}
	}

	return false;
}

function yellow(text: string): string {
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

	return `${cc.yellow}${text}${cc.reset}`;
}
