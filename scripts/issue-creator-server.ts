import { ArkErrors } from 'arktype';
import { Octokit } from 'octokit';

import { IssueCreatorRequest } from '../src/lib/schemas/issue-creator.js';

const cors = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
	'Access-Control-Allow-Headers': 'Content-Type'
};

const github = new Octokit({
	auth: process.env.GITHUB_TOKEN
});

Bun.serve({
	port: Number(process.argv[1]),
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
					status: 204,
					headers: cors
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
							headers: { 'Content-Type': 'application/json', ...cors }
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

					return Response.json({ url: issue.data.html_url }, { headers: cors });
				} catch (error) {
					console.error('Failed to create issue on GitHub:', error);
					return Response.json(
						{ error: 'Failed to create issue on GitHub' },
						{ status: 500, headers: { 'Content-Type': 'application/json', ...cors } }
					);
				}
			}
		}
	},
	fetch() {
		return new Response('Not found', { status: 404 });
	}
});
