import { paraglideMiddleware } from '$lib/paraglide/server.js';

/** @type {import('@sveltejs/kit').Handle} */
const paraglideHandle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
		event.request = localizedRequest;
		return resolve(event, {
			transformPageChunk: ({ html }) => {
				const replacements = {
					lang: locale,
					buildcommit: import.meta.env.buildCommit
				};

				for (const [key, value] of Object.entries(replacements)) {
					html = html.replace(`%${key}%`, value);
				}

				return html;
			}
		});
	});

export const handle = paraglideHandle;
