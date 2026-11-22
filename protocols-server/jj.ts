import type { Option } from './modules.js';

import { addHours, addMonths } from 'date-fns';
import * as jsdom from 'jsdom';
import { JSDOM } from 'jsdom';
import Turndown from 'turndown';

import { Datasource, MultipleResponses } from './datasource.js';
import { Enricher, matchCladedName, OptionExtra } from './modules.js';
import { logger } from './progress.js';
import { fetchPagesViaWordpressAPI, RateLimitTimeoutError } from './wordpress.js';

const IGNORED_PAGES = [
	'https://jessica-joachim.com/?page_id=141560',
	'https://jessica-joachim.com/insectes/hymenopteres/gasteruptiidae/gasteruption-genre/',
];

export class JessicaJoachim implements Enricher {
	name = 'jj' as const;

	jj: JessicaJoachimSite;

	index: Page[] | undefined;

	constructor() {
		this.jj = new JessicaJoachimSite();
	}

	async init() {
		this.index ??= await this.jj.one('index', {}).then((r) => r.pages);
		this.index = this.index!.filter((p) => !IGNORED_PAGES.includes(p.link));
	}

	available(option: Option): boolean {
		return this.index!.some(matchCladedName(option));
	}

	async *enrich(options: Option[]) {
		const lookups = this.index!.filter((page) => options.some(matchCladedName(page)));

		for (let i = 0; i < options.length; i += this.jj.chunksize) {
			const chunk = lookups.slice(i, i + this.jj.chunksize);

			const fiches = await this.jj.many(
				'pages',
				chunk.map((l) => ({ link: l.link }))
			);

			for (const fiche of fiches) {
				if (!fiche) continue;
				const { link, extra } = fiche;
				const page = this.index!.find((page) => page.link === link)!;
				const opt = options.find(matchCladedName(page));
				if (!opt?.id) continue;
				yield { id: opt.id, priority: 10, extra };
			}
		}
	}
}

type Page = {
	name: string;
	link: string;
	clade: string;
};

class JessicaJoachimSite extends Datasource<
	'index' | 'pages',
	{
		index: Record<never, never>;
		pages: Array<{ link: string }>;
	},
	{
		index: { pages: Page[] };
		pages: { link: string; extra: OptionExtra } | undefined;
	}
> {
	name = 'jj' as const;

	origin = new URL('https://jessica-joachim.com');

	speciesLinks = new Map<string, URL>();

	expirations = {
		file: (now: Date) => addMonths(now, 6),
		entry: (now: Date, query: 'index' | 'pages') => {
			switch (query) {
				case 'index':
					return addHours(now, 6);
				case 'pages':
					return addMonths(now, 1);
			}
		},
	};

	async init() {}

	chunksize = 81;

	requests = {
		index: async () => {
			const doc = await fetchAndParseHtml(new URL(`/identification`, this.origin));

			const anchors = [...(doc?.getElementById('Listefiches')?.querySelectorAll('a') ?? [])];

			const pages = anchors
				.map((a) => {
					const text = cleanedTextContent(a) ?? '';
					if (!text) return;

					const url = new URL(a.href, this.origin);
					if (!url) return;

					const parsed = parseSpeciesName(text);
					if (!parsed) return;

					return {
						link: url.toString(),
						name: parsed.latin,
						clade: parsed.clade,
					};
				})
				.filter((e) => e !== undefined);

			return { pages };
		},

		pages: async (links: Array<{ link: string }>) => {
			const queries = new Map(links.map((l) => [l.link, new URL(l.link)] as const));

			const pages = await fetchPagesViaWordpressAPI(queries, {
				// XXX: DONT MERGE
				maxWaitTime: 12,
				origin: this.origin.toString(),
				auth: {
					username: process.env.WORDPRESS_USERNAME!,
					password: process.env.WORDPRESS_APP_PASSWORD!,
				},
			}).catch((e) => {
				if (e instanceof RateLimitTimeoutError) {
					logger.warn(`rate limit timeout reached, skipping pages batch`);
					return undefined;
				}
				throw e;
			});

			if (!pages) return undefined;

			const responses = new MultipleResponses<
				{ link: string; extra: OptionExtra },
				{ link: string }
			>();

			for (const [link, page] of Object.entries(pages)) {
				if (!page) continue;
				const content: HTMLElement = page.content.rendered.window.document.body;

				if (!content) {
					throw new Error(
						`Could not find main content in page at ${page.link.toString()}`
					);
				}

				// We aren't using yoast's og_image because it often is either poor resolution or not the same as the main content's main image

				let newImages: URL[] = [
					...page.content.raw.window.document.body.querySelectorAll('img'),
				]
					.map((img) => parseURLSafe(img.src))
					.filter((src): src is URL => {
						if (!src) return false;
						if (isSpecialImage(src)) return false;
						return true;
					});

				if (newImages.length === 0)
					newImages = [page.yoast_head_json.og_image.at(0)?.url].filter(
						(x): x is URL => x !== undefined
					);

				// The images might have a `?resize` query param, remove that
				newImages.forEach((src) => src.searchParams.delete('resize'));

				const hasImageWithFilename = (filename: string) =>
					[...content.querySelectorAll(`img[src*="${filename}"]`)].some(
						(candidate) =>
							new URL(candidate.getAttribute('src')!).pathname.split('/').pop() ===
							filename
					);

				const cascade = {} as Record<string, string | string[]>;

				// Niveau de difficulté
				for (const [key, niveau] of Object.entries({
					easy: 'facile',
					medium: 'moyenne',
					hard: 'difficile',
					very_hard: 'tres-difficile',
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

				responses.push(
					{ link },
					{
						link,
						extra: {
							learnMore: page.yoast_head_json.canonical.toString(),
							description: htmlToMarkdown(content.innerHTML).trim(),
							images: newImages.map((u) => u.toString()),
							cascade,
						},
					}
				);
			}

			return responses;
		},
	};
}

// Suppress annoying virtual console error we can't do anything about and don't care about
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on('error', (e) => {
	if (/Could not parse CSS stylesheet/i.test(e.toString())) return;
	logger.error(e);
});

async function fetchAndParseHtml(url: URL | string): Promise<JSDOM['window']['document']> {
	let html: string;

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

	return new JSDOM(html, { virtualConsole }).window.document;
}

function cleanedTextContent(node: Element) {
	return 'textContent' in node && typeof node.textContent === 'string'
		? node.textContent.replaceAll('\r?\n', ' ').trim()
		: undefined;
}

function parseSpeciesName(title: string) {
	if (title.includes('(') && title.includes(')')) {
		const match = /(.+?) \((.+?)\)/.exec(title);
		if (!match) return undefined;

		const [, vernacular, latin] = match;
		return { vernacular, latin, clade: 'species' };
	}

	if (title.match(/ sp\.?$/)) {
		const latin = title.replace(/ sp\.?$/, '').trim();
		return { latin, clade: 'genus' };
	}
}
function parseURLSafe(str: string | undefined | null): URL | undefined {
	if (!str) return undefined;

	try {
		return new URL(str);
	} catch {
		return undefined;
	}
}

/**
 * checks for image src that are things such as identification difficulty or conservation status icons
 * @param src
 */
function isSpecialImage(src: URL): boolean {
	const filename = src.pathname.split('/').pop() ?? '';
	return (
		/^Id-(facile|moyenne|difficile|tres-difficile)\.jpg$/.test(filename) ||
		/^Statut-(LC|NT|VU|EN|CR|EX)\.jpg$/.test(filename)
	);
}

const tdown = new Turndown();

function htmlToMarkdown(html: string) {
	return tdown.turndown(html).replaceAll('\n• ', '\n- ');
}
