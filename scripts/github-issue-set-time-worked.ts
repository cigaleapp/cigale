/// <reference types="@types/node" />

import { execSync } from 'node:child_process';

import arkenv from 'arkenv';
import {
	addMonths,
	formatDuration,
	formatISO,
	intervalToDuration,
	parseISO,
	subMonths,
} from 'date-fns';

const env = arkenv({
	WAKATIME_API_KEY: '/^waka_.+$/',
	WAKATIME_PROJECT: 'string',
	TIMESPENT_ISSUE_FIELD_ID: 'string = "IFN_kgDOApvTqg"',
	N_MOST_RECENT_PRS: 'number = 100',
	GITHUB_REPO: [
		'/^.+?\\/.+?$/',
		'=>',
		(repository) => {
			const [owner, repo] = repository.split('/');
			return { owner, repo };
		},
	],
});

const { repository } = await fetch('https://api.github.com/graphql', {
	method: 'POST',
	headers: {
		Authorization: `Bearer ${execSync('gh auth token')}`,
	},
	body: JSON.stringify({
		variables: { ...env.GITHUB_REPO, n: env.N_MOST_RECENT_PRS },
		query: `
query($owner: String!, $repo: String!, $n: Int!) { 

repository(owner: $owner, name: $repo) { 
	pullRequests(orderBy: { field: UPDATED_AT, direction: DESC }, first: $n) {
		nodes {
			number
			headRefName
			createdAt
			closingIssuesReferences(first: 50) {
				nodes {
					id
					number
					title
				}
			}
		}
	}
}

}
		`,
	}),
})
	.then((r) => r.json())
	.then((d: GithubResponse) => d.data);

const issues: Record<number, { prs: PR[] } & Issue> = {};

for (const pr of repository.pullRequests.nodes) {
	for (const issue of pr.closingIssuesReferences.nodes) {
		issues[issue.number] ??= { prs: [], ...issue };
		issues[issue.number].prs.push(pr);
	}
}

const times: Array<{ issue: Issue; hours: number }> = [];

for (const [issueno, { prs, ...issue }] of Object.entries(issues)) {
	const start = new Date(Math.min(...prs.map((branch) => parseISO(branch.createdAt).valueOf())));

	const end = new Date(Math.max(...prs.map((branch) => parseISO(branch.createdAt).valueOf())));

	const seconds = await fetch(
		'https://wakatime.com/api/v1/users/current/summaries?' +
			new URLSearchParams({
				start: formatISO(subMonths(start, 2), { representation: 'date' }),
				end: formatISO(addMonths(end, 1), { representation: 'date' }),
				project: env.WAKATIME_PROJECT,
				branches: prs.map((b) => b.headRefName).join(','),
			}),
		{
			headers: {
				Authorization: `Basic ${env.WAKATIME_API_KEY}`,
			},
		}
	)
		.then((r) => r.json())
		.then((d: WakatimeSummaries) =>
			d.data
				.flatMap((day) => day.branches.flatMap((branch) => branch.total_seconds))
				.reduce((a, b) => a + b, 0)
		);

	const hours = seconds / 3600;

	const display = formatDuration(
		intervalToDuration({
			start: new Date(0),
			end: new Date(0 + seconds * 1e3),
		}),
		{
			format: ['days', 'hours', 'minutes'],
		}
	);

	console.info('');
	console.info(`Issue #${issueno} (${issue.title}) = ${Math.round(hours)} h:`);
	for (const [i, pr] of prs.entries()) {
		const last = i === prs.length - 1;
		console.info(`  ${pr.headRefName} (#${pr.number}) ${last ? `= ${display}` : '+'}`);
	}
}

// Chunk requests by n mutations...
const chunksize = 20;

for (let i = 0; i < times.length; i += chunksize) {
	const chunk = times.slice(i, i + chunksize);

	const query = `
mutation {
	${chunk
		.map(
			({ hours, issue }) =>
				`issue${issue.number}: setIssueFieldValue(input: { 
			issueId: ${JSON.stringify(issue.id)},
			issueFields: [{
				numberValue: ${JSON.stringify(hours)},
				fieldId: ${JSON.stringify(env.TIMESPENT_ISSUE_FIELD_ID)}
			}]
		}) { clientMutationId }`
		)
		.join('\n')}	
}	
`;

	const result = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		body: JSON.stringify({ query }),
		headers: {
			Authorization: `Bearer ${execSync('gh auth token')}`,
		},
	}).then((r) => r.json());

	if (Object.keys(result).toString() !== 'data') {
		console.dir(result, { depth: null });
	} else {
		console.info(`OK: ${chunk.map(({ issue }) => '#' + issue.number).join(', ')}`);
	}
}

type GithubResponse = {
	data: {
		repository: {
			pullRequests: {
				nodes: Array<{
					number: number;
					headRefName: string;
					createdAt: string;
					closingIssuesReferences: {
						nodes: Array<{
							id: string;
							number: number;
							title: string;
						}>;
					};
				}>;
			};
		};
	};
};

type PR = GithubResponse['data']['repository']['pullRequests']['nodes'][number];
type Issue = PR['closingIssuesReferences']['nodes'][number];

type WakatimeSummaries = {
	data: Array<{
		branches: Array<{
			total_seconds: number;
		}>;
	}>;
};
