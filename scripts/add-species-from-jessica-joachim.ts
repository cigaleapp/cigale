import { exists, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ArkErrors, type } from 'arktype';
import { Estimation as ETA } from 'arrival-time';
import { formatDistanceToNowStrict, secondsToMilliseconds } from 'date-fns';
import * as jsdom from 'jsdom';
import { JSDOM } from 'jsdom';
import Turndown from 'turndown';

import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import type { MetadataEnumVariant } from '../src/lib/schemas/metadata.js';
import type { ExportedProtocol } from '../src/lib/schemas/protocols.js';

// Suppress annoying virtual console error we can't do anything about and don't care about
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on('error', (e) => {
	if (/Could not parse CSS stylesheet/i.test(e.toString())) return;
	console.error(e);
});

const RichContent = type({ rendered: 'string' }).pipe(
	(content) =>
		new JSDOM(content.rendered, {
			virtualConsole
		})
);

const OGImage = type({
	url: 'string.url.parse',
	width: 'string.integer.parse | number | ""',
	height: 'string.integer.parse | number | ""'
});

const WordpressPage = type({
	id: 'number',
	date: 'string.date.iso.parse',
	date_gmt: 'string.date.iso.parse',
	modified: 'string.date.iso.parse',
	modified_gmt: 'string.date.iso.parse',
	slug: 'string',
	link: 'string.url.parse',
	title: RichContent,
	content: RichContent,
	excerpt: RichContent,
	yoast_head_json: {
		canonical: 'string.url.parse',
		og_description: 'string = ""',
		og_image: OGImage.array().default(() => [])
	}
});

const WordpressPagesResponse = WordpressPage.array().atLeastLength(1);

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

	try {
		await Bun.$`bun x prettier --write ${protocolPath}`;
	} catch (error) {
		console.error(`Couldnt format protocol ${protocolPath}:\n`, error);
	}
}

async function augmentMetadata(
	protocol: typeof ExportedProtocol.infer,
	metadataKey: 'genus' | 'species',
	search: (lookups: Record<string, string[]>) => Promise<Map<string, URL>>,
	limit = -1
): Promise<typeof ExportedProtocol.infer> {
	const augmented = structuredClone(protocol);
	const metadataOptions = augmented.metadata[`${protocol.id}__${metadataKey}`].options!;

	const batchSize = 50;

	console.info(
		cyan(`⁄ Starting to process ${metadataKey}, ${metadataOptions.length} entries to check`)
	);
	const pageUrls = await search(
		Object.fromEntries(metadataOptions.map((s) => [s.key, [s.label, ...(s.synonyms ?? [])]]))
	);
	console.info(cyan(`⁄ Found ${pageUrls.size} pages for ${metadataKey} to process`));

	const retry = new Map<string, URL>();

	const total = pageUrls.size;
	let done = 0;
	let processed = 0;
	const eta = new ETA({ total });

	for (const urlsChunk of chunkBySize(batchSize, [...pageUrls.entries()])) {
		if (limit > 0 && done > limit) break;

		const pages = await fetchPagesViaWordpressAPI(new Map(urlsChunk));

		for (const [key, page] of Object.entries(pages)) {
			done++;

			if (!page) {
				console.warn(
					yellow(
						`⁄ Could not fetch page for ${metadataKey} ${key} at ${pageUrls.get(key)}. Adding to retry-batch...`
					)
				);

				retry.set(key, pageUrls.get(key)!);

				continue;
			}

			const i = metadataOptions.findIndex((s) => s.key === key);
			if (i < 0) throw new Error(`No option with key ${key}`);

			const s = metadataOptions[i];

			const newData = await augmentMetadataOption(s, page!);

			if (!newData) {
				console.warn(yellow(`⁄ Could not extract data for ${metadataKey} ${s.label}`));
				continue;
			}

			Object.assign(s, newData);

			processed++;

			eta.update(done, total);

			console.info(
				`${align(processed, total)} ${percentage(done, total)} ${cyan(
					`→ ${formatDistanceToNowStrict(new Date(Date.now() + eta.estimate()))}`
				)} Updating ${metadataKey} ${dim(`takes ~${Math.round(eta.measure().averageTime)}ms`)} ${s.label} with ${page!.link}`
			);
		}
	}

	if (retry.size > 0) {
		console.info(
			cyan(
				`⁄ Retrying ${retry.size} failed ${metadataKey} entries one more time via Wordpress API...`
			)
		);

		let done = 0;
		const total = retry.size;
		const eta = new ETA({ total });

		// Shuffle batches to avoid hitting rate limits on same entries
		const retries = [...retry.entries()].sort(() => 0.5 - Math.random());

		for (const urlChunk of chunkBySize(Math.floor(batchSize / 2), retries)) {
			const pages = await fetchPagesViaWordpressAPI(new Map(urlChunk));

			for (const [key, page] of Object.entries(pages)) {
				done++;

				if (!page) {
					console.warn(
						yellow(
							`⁄ Could not fetch page for ${metadataKey} ${key} at ${pageUrls.get(key)} on retry. Skipping...`
						)
					);

					continue;
				}

				const i = metadataOptions.findIndex((s) => s.key === key);
				if (i < 0) throw new Error(`No option with key ${key}`);

				const s = metadataOptions[i];

				const newData = await augmentMetadataOption(s, page!);
				if (!newData) {
					console.warn(
						yellow(`⁄ Could not extract data for ${metadataKey} ${s.label} on retry`)
					);
					continue;
				}

				Object.assign(s, newData);
				processed++;

				eta.update(done, total);
				console.info(
					`${align(processed, total)} ${percentage(done, total)} ${cyan(
						`→ ${formatDistanceToNowStrict(new Date(Date.now() + eta.estimate()))}`
					)} (retry) Updating ${metadataKey} ${dim(`takes ~${Math.round(eta.measure().averageTime)}ms`)} ${s.label} with ${page!.link}`
				);
			}
		}
	}

	console.info(
		cyan(
			`⁄ Finished processing ${metadataKey}, updated ${processed}/${total} entries out of ${metadataOptions.length} options (${percentage(processed, metadataOptions.length)})`
		)
	);

	return augmented;
}

async function searchForGenus(lookups: Record<string, string[]>) {
	return searchForSpecies(
		Object.fromEntries(
			Object.entries(lookups).map(([key, names]) => [key, names.map((name) => `${name} sp`)])
		)
	);
}

async function searchForSpecies(lookups: Record<string, string[]>) {
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
					.filter(([, url]) => !LINKS_TO_AVOID.includes(url.href))
			)
	);

	console.info(
		cyan(`⁄ Fetched ${speciesLinks!.size} species links from Jessica Joachim blog for matching`)
	);

	const total = speciesLinks!.size;
	const links = [...speciesLinks!.entries()];
	const eta = new ETA({ total });
	let done = 0;
	const results = await Promise.all(
		links.map(async ([title, link]) => {
			done++;
			eta.update(done, total);

			console.info(
				`${align(done, total)} ${percentage(done, total, 1)} ${cyan(
					`→ ${formatDistanceToNowStrict(new Date(Date.now() + eta.estimate()))}`
				)} Finding GBIF ID for ${title}`
			);

			const slug = lastPathSegment(link).toLowerCase();

			const titleMatcher = speciesNamesToBlogTitleMatcher(title);

			for (const [key, names] of Object.entries(lookups)) {
				if (names.some((name) => name.replaceAll(' ', '-').toLowerCase() === slug)) {
					return [key, link] as const;
				}

				if (titleMatcher(names)) {
					return [key, link] as const;
				}
			}
		})
	);

	const map = new Map(results.filter((e): e is [string, URL] => e !== undefined));
	return map;
}

async function augmentMetadataOption(
	{ key, cascade }: typeof MetadataEnumVariant.infer,
	page: typeof WordpressPage.infer
): Promise<Partial<typeof MetadataEnumVariant.infer>> {
	const content: HTMLElement = page.content.window.document.body;
	if (!content) throw new Error(`Could not find main content in page at ${page.link.toString()}`);

	// We aren't using yoast's og_image because it often is either poor resolution or not the same as the main content's main image
	const imageUrl =
		parseURLSafe(content.querySelector('img')?.getAttribute('src')) ??
		page.yoast_head_json.og_image.at(0)?.url;

	// Since this is wordpress, the image might have a `?resize` query param, remove it
	imageUrl?.searchParams.delete('resize');

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
	// Text (most likely header) for the removed gallery
	removeAll('p:has(+ .wp-block-kadence-advancedgallery)');
	// Gallery (can't be represented in markdown well)
	removeAll('.wp-block-kadence-advancedgallery');
	removeAll('.tiled-gallery');
	removeAll('[id^=gallery-]');
	removeAll('[id^=gallery-]');
	// Navigation buttons
	removeAll('.wp-block-kadence-advancedbtn');
	removeAll('.wp-block-kadence-tabs');
	// Style tags, that are dumped as plain text when converting to markdown,
	// for some reason
	removeAll('style');
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

		if (node.href.startsWith('#')) {
			node.replaceWith(document.createTextNode(text));
		}
	});

	return {
		key,
		learnMore: page.yoast_head_json.canonical.toString(),
		description: htmlToMarkdown(content.innerHTML).trim(),
		images: imageUrl ? [imageUrl.toString()] : [],
		cascade
	};
}

async function fetchPagesViaWordpressAPI(
	lookups: Map<string, URL>,
	{ rateLimitWaitSeconds = 12 } = {}
): Promise<Record<string, undefined | typeof WordpressPage.infer>> {
	const query = new URLSearchParams(
		[...lookups.values()].flatMap((link) => {
			const { id, slug } = extractPageParams(link);
			if (slug) return [['slug[]', slug]];
			if (id) return [['id[]', id.toString()]];
			return [];
		})
	);

	query.append('per_page', lookups.size.toString());

	const response = await fetch(`https://jessica-joachim.com/wp-json/wp/v2/pages?${query}`);

	// Handle rate limiting
	if (response.status === 429 || response.status === 504) {
		const retryAfter = response.headers.get('Retry-After');
		const waitTime = retryAfter ? Number(retryAfter) : rateLimitWaitSeconds;
		console.warn(
			yellow(
				`⁄ Rate limited by Wordpress API. Waiting for ${waitTime} seconds before retrying...`
			)
		);

		if (waitTime > 60) {
			console.error(
				`⁄ Wait time is quite long (${waitTime}s). Skipping this batch: ${query}. Response was`,
				await response.text()
			);
			return Object.fromEntries([...lookups.keys()].map((key) => [key, undefined]));
		}

		await new Promise((resolve) => setTimeout(resolve, secondsToMilliseconds(waitTime)));

		return fetchPagesViaWordpressAPI(lookups, {
			rateLimitWaitSeconds: rateLimitWaitSeconds * Math.E
		});
	}

	if (response.headers.get('Content-Type')?.startsWith('application/json') === false) {
		throw new Error(
			`Unexpected content type: ${response.headers.get('Content-Type')} for ${response.url}. text: ${await response.text()}`
		);
	}

	const data = WordpressPagesResponse(await response.json());

	if (data instanceof ArkErrors) {
		throw new Error(data.summary);
	}

	return Object.fromEntries(
		[...lookups.entries()].map(([key, link]) => {
			const { id } = extractPageParams(link);
			const page = data.find(
				(page) => page.id === id || page.link.pathname === link.pathname
			);
			if (!page)
				console.error(
					`Could not find page for ${key} at ${link.toString()}: id=${id}, pathname=${link.pathname}, within: (${data.length})`,
					data.map((p) => ({ id: p.id, pathname: p.link.pathname }))
				);
			return [key, page];
		})
	);
}

function extractPageParams(page: URL) {
	if (page.searchParams.has('page_id')) {
		return { id: Number(page.searchParams.get('page_id')), slug: undefined };
	}

	return {
		id: undefined,
		slug: lastPathSegment(page) || undefined
	};
}

function lastPathSegment(url: URL): string {
	return (
		url.pathname
			.split('/')
			.map((seg) => seg.trim())
			.filter(Boolean)
			.at(-1) ?? ''
	);
}

// TODO remove once TS declares it itself
declare global {
	interface RegExpConstructor {
		escape(s: string): string;
	}
}

function speciesNamesToBlogTitleMatcher(title: string): (names: string[]) => boolean {
	let latinName = title;

	const vernaculared = /^(.+ \((?<latin>\w+ \w+)\))|((?<latin>\w+ \w+) \(.+\))$/.exec(title);

	if (vernaculared?.groups?.latin) latinName = vernaculared.groups.latin;

	return (names) => names.includes(latinName);
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

function chunkBySize<T>(by: number, items: T[]): T[][] {
	return new Array(Math.ceil(items.length / by))
		.fill([])
		.map((_, i) => items.slice(i * by, (i + 1) * by));
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

function parseURLSafe(str: string | undefined | null): URL | undefined {
	if (!str) return undefined;

	try {
		return new URL(str);
	} catch {
		return undefined;
	}
}
