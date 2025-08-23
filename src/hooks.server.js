import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { paraglideMiddleware } from '$lib/paraglide/server.js';

Sentry.init({
	dsn: 'https://37bb5c00dde50e2bc0dd0d4243db086d@o4509894523551744.ingest.de.sentry.io/4509894524731472',
	tracesSampleRate: 1,
	enableLogs: true
});

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

export const handle = sequence(Sentry.sentryHandle(), paraglideHandle);
export const handleError = Sentry.handleErrorWithSentry();
