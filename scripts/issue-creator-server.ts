import { readFileSync } from 'node:fs';
import arkenv from 'arkenv';
import { ArkErrors } from 'arktype';
import { App } from 'octokit';

import { IssueCreatorRequest } from '../src/lib/schemas/issue-creator.js';

const env = arkenv({
	GITHUB_APP_ID: 'string > 0',
	GITHUB_APP_INSTALLATION_ID: 'string.integer.parse',
	GITHUB_APP_KEY_FILE: 'string > 0',
	PORT: 'number.port'
});

const reporter = new App({
	appId: env.GITHUB_APP_ID,
	privateKey: readFileSync(env.GITHUB_APP_KEY_FILE, 'utf8')
});

const github = await reporter.getInstallationOctokit(env.GITHUB_APP_INSTALLATION_ID);

Bun.serve({
	port: env.PORT,
	routes: {
		async '/'() {
			const user = await github.rest.users.getAuthenticated();
			return Response.json({
				'Connected as': user.data.login,
				'POST /submit': IssueCreatorRequest.toJsonSchema()
			});
		},
		'/submit': {
			async OPTIONS() {
				return new Response(null, {
					status: 204
				});
			},
			async POST(request) {
				const data = IssueCreatorRequest(await request.json());
				if (data instanceof ArkErrors) {
					return Response.json(
						{
							summary: data.summary,
							errors: data
						},
						{
							status: 400,
							headers: { 'Content-Type': 'application/json' }
						}
					);
				}

				const { body, title, metadata, type } = data;

				try {
					const issue = await github.rest.issues.create({
						owner: 'cigaleapp',
						repo: 'cigale',
						title,
						type: type === 'bug' ? 'Bug' : 'Feature',
						body: `${body}\n\n---\n\n${Object.entries(metadata)
							.map(([k, v]) => `- **${k}**: ${v}`)
							.join('\n')}`
					});

					return Response.json({ url: issue.data.html_url });
				} catch (error) {
					console.error('Failed to create issue on GitHub:', error);
					return Response.json(
						{ error: 'Failed to create issue on GitHub' },
						{ status: 500, headers: { 'Content-Type': 'application/json' } }
					);
				}
			}
		}
	},
	fetch() {
		return new Response('Not found', { status: 404 });
	}
});

console.info(`Listening on :${env.PORT}`);
