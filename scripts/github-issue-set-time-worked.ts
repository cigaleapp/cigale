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
	TIMESPENT_ISSUE_FIELD_ID: 'string = "IFT_kgDOAp1Gyg"',
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

const result: GithubResponse = await fetch('https://api.github.com/graphql', {
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
					issueFieldValues(first: 20) {
						nodes {
							...on IssueFieldTextValue {
								value
								field {
									...on IssueFieldText {
										id
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

}
		`,
	}),
}).then((r) => r.json());

if (Object.keys(result).toString() !== 'data') {
	console.dir(result, { depth: null });
	process.exit(1);
}

const { repository } = result.data;

const issues: Record<number, { prs: PR[] } & Issue> = {};

for (const pr of repository.pullRequests.nodes) {
	for (const issue of pr.closingIssuesReferences.nodes) {
		issues[issue.number] ??= { prs: [], ...issue };
		issues[issue.number].prs.push(pr);
	}
}

const times: Array<{ issue: Issue; time: string }> = [];

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

	const duration = intervalToDuration({
		start: new Date(0),
		end: new Date(0 + seconds * 1e3),
	});

	let { years = 0, months = 0, weeks = 0, days = 0, hours = 0, minutes = 0 } = duration;

	if (!minutes) continue;

	// imagine mdr
	if (years > 0) months += 12 * years;
	if (months > 0) weeks += 4 * months;
	if (weeks > 0) days += 7 * weeks;

	const rounded = {
		days: round(days + hours / 24, 2),
		hours: round(hours + minutes / 60, 1),
		minutes: round(minutes),
	};

	const [unit, value] = Object.entries(rounded).find(([, value]) => value >= 1)!;

	const display = `${value} ${unit === 'minutes' ? 'mins' : unit}`;

	console.info(
		`\nIssue #${issueno} (${issue.title}) = ${display} [${formatDuration(duration)}]:`
	);
	for (const [i, pr] of prs.entries()) {
		console.info(`${i > 0 ? '+' : ''} ${pr.headRefName} (#${pr.number})`);
	}

	times.push({ issue, time: display });
}

// Chunk requests by n mutations...
const chunksize = 20;

const toUpdate = times.filter(
	({ time, issue }) =>
		time !==
		issue.issueFieldValues.nodes.find((f) => f?.field?.id === env.TIMESPENT_ISSUE_FIELD_ID)
			?.value
);

console.info('\n\n');
console.info('Issues that will be updated:');
for (const { issue, time } of toUpdate) {
	const current = issue.issueFieldValues.nodes.find(
		(node) => node?.field?.id === env.TIMESPENT_ISSUE_FIELD_ID
	)?.value;

	let diff = '';
	if (current) {
	}

	console.info(`#${issue.number} = ${time} (${issue.title})`);
}

for (let i = 0; i < toUpdate.length; i += chunksize) {
	const chunk = toUpdate.slice(i, i + chunksize);

	const query = `
mutation {
	${chunk
		.map(
			({ time: hours, issue }) =>
				`issue${issue.number}: setIssueFieldValue(input: { 
			issueId: ${JSON.stringify(issue.id)},
			issueFields: [{
				textValue: ${JSON.stringify(hours)},
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
			pullRequests: Connection<{
				number: number;
				headRefName: string;
				createdAt: string;
				closingIssuesReferences: Connection<{
					id: string;
					number: number;
					title: string;
					issueFieldValues: Connection<
						| undefined
						| {
								value: string;
								field: { id: string };
						  }
					>;
				}>;
			}>;
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

type Connection<T> = { nodes: T[] };

function round(value: number, places = 0) {
	return Math.round(value * 10 ** places) / 10 ** places;
}
