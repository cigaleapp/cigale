import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

if (import.meta.env.sentry === 'enabled') {
	Sentry.init({
		dsn: 'https://37bb5c00dde50e2bc0dd0d4243db086d@o4509894523551744.ingest.de.sentry.io/4509894524731472',
		tracesSampleRate: 1.0,
		enableLogs: true,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		integrations: [replayIntegration()]
	});
}

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
