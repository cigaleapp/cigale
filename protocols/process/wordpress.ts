import { ArkErrors, type } from 'arktype';
import { secondsToMilliseconds } from 'date-fns';
import * as jsdom from 'jsdom';
import { JSDOM } from 'jsdom';
import { logger } from './progress';

// Suppress annoying virtual console error we can't do anything about and don't care about
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on('error', (e) => {
	if (/Could not parse CSS stylesheet/i.test(e.toString())) return;
	logger.error(e);
});

const RichContent = type({ rendered: 'string', raw: 'string' }).pipe((content) => ({
	raw: new JSDOM(content.raw, {
		virtualConsole,
	}),
	rendered: new JSDOM(content.rendered, {
		virtualConsole,
	}),
}));

const OGImage = type({
	url: 'string.url.parse',
	width: 'string.integer.parse | number | ""',
	height: 'string.integer.parse | number | ""',
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
		og_image: OGImage.array().default(() => []),
	},
});

const WordpressPagesResponse = WordpressPage.array().atLeastLength(1);

export async function fetchPagesViaWordpressAPI(
	pages: Map<string, URL>,
	{
		origin,
		auth,
		rateLimitWaitSeconds = 12,
	}: {
		origin: string;
		auth: { username: string; password: string };
		rateLimitWaitSeconds?: number;
	}
): Promise<Record<string, undefined | typeof WordpressPage.infer>> {
	const query = new URLSearchParams(
		[...pages.values()].flatMap((link) => {
			const pageId = link.searchParams.get('page_id');
			const slug = lastPathSegment(link);

			if (pageId) return [['id[]', pageId]];
			if (slug) return [['slug[]', slug]];

			return [];
		})
	);

	query.append('per_page', pages.size.toString());
	query.append('context', 'edit');

	const response = await fetch(new URL(`/wp-json/wp/v2/pages?${query}`, origin), {
		headers: {
			Authorization: 'Basic ' + btoa(`${auth.username}:${auth.password}`),
		},
	});

	// Handle rate limiting
	if (response.status === 429 || response.status === 504) {
		const retryAfter = response.headers.get('Retry-After');
		const waitTime = retryAfter ? Number(retryAfter) : rateLimitWaitSeconds;

		if (waitTime > 60) {
			logger.error(
				`wait time is quite long (${waitTime}s). Skipping this batch: ${query}. Response was`,
				await response.text()
			);
			return Object.fromEntries([...pages.keys()].map((key) => [key, undefined]));
		}

		await new Promise((resolve) => setTimeout(resolve, secondsToMilliseconds(waitTime)));

		return fetchPagesViaWordpressAPI(pages, {
			origin,
			auth,
			rateLimitWaitSeconds: rateLimitWaitSeconds * Math.E,
		});
	}

	if (response.headers.get('Content-Type')?.startsWith('application/json') === false) {
		throw new Error(
			`Unexpected content type: ${response.headers.get('Content-Type')} for ${response.url}. text: ${await response.text()}`
		);
	}

	const json = await response.json()
	const data = WordpressPagesResponse(json);

	if (data instanceof ArkErrors) {
		logger.error(json)
		throw new Error(data.summary);
	}

	return Object.fromEntries(
		[...pages.entries()].map(([key, link]) => {
			const id = Number.parseInt(link.searchParams.get('page_id') ?? '');

			const page = data.find(
				(page) => page.id === id || page.link.pathname === link.pathname
			);

			if (!page) {
				logger.error(
					`Could not find page for ${key} at ${link.toString()}: id=${id}, pathname=${link.pathname}, within: (${data.length})`,
					data.map((p) => ({ id: p.id, pathname: p.link.pathname }))
				);
			}

			return [key, page];
		})
	);
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
