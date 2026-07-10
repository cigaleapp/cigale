/// <reference types="@types/node" />

import { execSync } from 'node:child_process';

import arkenv from 'arkenv';
import { type } from 'arktype';
import {
	addMonths,
	formatDuration,
	formatISO,
	intervalToDuration,
	parseISO,
	subMonths,
} from 'date-fns';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface Array<T> {
		sum(): number;
	}
}

Array.prototype.sum = function () {
	return this.reduce((a, b) => a + b, 0);
};

const env = arkenv({
	WAKATIME_API_KEY: '/^waka_.+$/',
	WAKATIME_PROJECT: 'string',
	TIMESPENT_ISSUE_FIELD_ID: 'string = "IFT_kgDOAp1Gyg"',
	HOURS_SPENT_ISSUE_FIELD_ID: 'string = "IFN_kgDOAp9OqA"',
	/** Run on a single PR's issues */
	'PR_NUMBER?': ['number | undefined | ""', '=>', (n) => n || undefined],
	N_MOST_RECENT_ISSUES: 'number = 100',
	BACKFILL: 'boolean = false',
	/** Extra time to add to a branch based on time spent on another branch on another project */
	EXTRA_PROJECTS: type.string
		.pipe((extras) =>
			Map.groupBy(
				extras
					.split(/\r?\n| /)
					.map((line) => line.trim().split(/@|:/, 3))
					.map(([branch, otherProject, otherBranch]) => ({
						branch,
						other: { project: otherProject, branch: otherBranch },
					})),
				({ branch }) => branch
			)
		)
		.default(''),
	GITHUB_REPO: [
		'/^.+?\\/.+?$/',
		'=>',
		(repository) => {
			const [owner, repo] = repository.split('/');
			return { owner, repo };
		},
	],
});

const graphql = (x: string) => x;

if (env.PR_NUMBER) {
	console.info(`Analyzing only PR #${env.PR_NUMBER}...\n\n`);
	type Result = {
		data: {
			repository: {
				pullRequest: {
					number: number;
					headRefName: string;
					closedAt: string;
					createdAt: string;
					closingIssuesReferences: Connection<IssueFragment>;
				};
			};
		};
	};

	const result: Result = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: { Authorization: `Bearer ${execSync('gh auth token')}` },
		body: JSON.stringify({
			variables: { ...env.GITHUB_REPO, number: env.PR_NUMBER },
			query: graphql(`
				fragment issue on Issue {
					id
					number
					title
					issueFieldValues(first: 20) {
						pageInfo {
							hasNextPage
							endCursor
						}
						nodes {
							... on IssueFieldTextValue {
								value
								field {
									... on IssueFieldText {
										id
									}
								}
							}
						}
					}
				}

				query ($number: Int!, $owner: String!, $repo: String!) {
					repository(owner: $owner, name: $repo) {
						pullRequest(number: $number) {
							number
							headRefName
							closedAt
							createdAt
							closingIssuesReferences(first: 10) {
								nodes {
									...issue
								}
							}
						}
					}
				}
			`),
		}),
	}).then((r) => r.json());

	if (Object.keys(result).toString() !== 'data') {
		throw new Error(JSON.stringify(result));
	}

	const times: Array<{ issue: IssueFragment; time: string; seconds: number }> = [];
	for (const issue of result.data.repository.pullRequest.closingIssuesReferences.nodes) {
		await analyzeIssue(issue, times, [result.data.repository.pullRequest]);
	}

	await updateIssueFields(times);

	process.exit(0);
}

let pageInfo = { endCursor: undefined as string | undefined, hasNextPage: true };

while (pageInfo.hasNextPage) {
	pageInfo = await run(pageInfo.endCursor);

	if (!env.BACKFILL) break;
}

async function run(cursor?: string) {
	const result: GithubResponse = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${execSync('gh auth token')}`,
		},
		body: JSON.stringify({
			variables: {
				...env.GITHUB_REPO,
				n: env.N_MOST_RECENT_ISSUES,
				cursor,
			},
			query: `

fragment issue on Issue {
	id
	number
	title
	issueFieldValues(first: 20) {
		pageInfo { hasNextPage endCursor }
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


query($owner: String!, $repo: String!, $n: Int!, $cursor: String) { 

repository(owner: $owner, name: $repo) { 
	issues(orderBy: { field: UPDATED_AT, direction: DESC }, first: $n, after: $cursor) {
		pageInfo { hasNextPage endCursor }
		nodes {
			...issue

			closedByPullRequestsReferences(first: 10) {
				pageInfo { hasNextPage endCursor }
				nodes {
					number
					headRefName
					createdAt
					closedAt

					closingIssuesReferences(first: 5) {
						nodes {
							...issue
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

	const times: Array<{ issue: IssueFragment; time: string; seconds: number }> = [];

	for (const issue of repository.issues.nodes) {
		await analyzeIssue(issue, times);
	}

	await updateIssueFields(times);

	return repository.issues.pageInfo;
}

async function updateIssueFields(times: { issue: IssueFragment; time: string; seconds: number }[]) {
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
		console.info(`#${issue.number} = ${time} (${issue.title})`);
	}

	for (let i = 0; i < toUpdate.length; i += chunksize) {
		const chunk = toUpdate.slice(i, i + chunksize);

		const query = `
mutation {
	${chunk
		.map(
			({ time: hours, seconds, issue }) => `issue${issue.number}: setIssueFieldValue(input: { 
			issueId: ${JSON.stringify(issue.id)},
			issueFields: [
				{
					textValue: ${JSON.stringify(hours)},
					fieldId: ${JSON.stringify(env.TIMESPENT_ISSUE_FIELD_ID)}
				},
				{
					numberValue: ${JSON.stringify(seconds / 3600)},
					fieldId: ${JSON.stringify(env.HOURS_SPENT_ISSUE_FIELD_ID)}
				}
			]
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
}

async function analyzeIssue(
	issue: Issue,
	times: Array<{ issue: IssueFragment; time: string; seconds: number }>,
	overridePRs?: NonNullable<Issue['closedByPullRequestsReferences']>['nodes']
) {
	let prs = issue.closedByPullRequestsReferences?.nodes ?? overridePRs ?? [];

	if (!prs.length) return;

	const start = new Date(Math.min(...prs.map((pr) => parseISO(pr.createdAt).valueOf())));

	// If a PR is not closed, we might be still working on it up to today
	const end = new Date(
		Math.max(...prs.map((pr) => (pr.closedAt ? parseISO(pr.closedAt).valueOf() : Date.now())))
	);

	// Store PRs per branch for display
	const prsPerBranch = Map.groupBy(prs, (pr) => pr.headRefName);

	// Now that we took into account create/close times for all *PR*, we can dedupe them by branch
	prs = [...prsPerBranch.values()].map((prsOfBranch) => prsOfBranch[0]);

	/** Maps a branch to additional seconds from extra projects */
	const extraSeconds: Record<string, number> = {};

	const extrasOfPRs = prs
		.flatMap((pr) => env.EXTRA_PROJECTS.get(pr.headRefName))
		.filter((e) => e !== undefined);

	const extraProjects = Map.groupBy(extrasOfPRs, (extra) => extra.other.project);
	const extrasPerPR = Map.groupBy(extrasOfPRs, (extra) => extra.branch);

	try {
		// One request per project
		for (const [project, extras] of extraProjects) {
			// With all branches of the project
			// for this timeframe
			// that correspond to PR branches for the issue
			const response = await requestWakatime({
				start,
				end,
				project,
				branches: extras.map((extra) => extra.other.branch),
			});

			// For every PR branch
			for (const [branch, extras] of extrasPerPR) {
				// Get all branches from the other project that correspond to the PR branch
				const extraBranchesForProject = extras
					.filter((e) => e.other.project === project)
					.map((e) => e.other.branch);

				// Sum up seconds on branches corresponding to the PR branch
				const added = response.data
					.flatMap((day) => day.branches)
					.filter((b) => extraBranchesForProject.includes(b.name))
					.map((b) => b.total_seconds)
					.sum();

				extraSeconds[branch] = (extraSeconds[branch] ?? 0) + added;
			}
		}

		const response = await requestWakatime({
			start,
			end,
			project: env.WAKATIME_PROJECT,
			branches: prs.map((pr) => pr.headRefName),
		});

		let seconds = response.data
			.flatMap((day) => day.branches)
			.map((branch) => branch.total_seconds)
			.sum();

		seconds += Object.values(extraSeconds).sum();

		const duration = intervalToDuration({
			start: new Date(0),
			end: new Date(0 + seconds * 1e3),
		});

		// eslint-disable-next-line prefer-const
		let { years = 0, months = 0, weeks = 0, days = 0, hours = 0, minutes = 0 } = duration;

		if (!minutes) return;

		// imagine mdr
		if (years > 0) months += 12 * years;
		if (months > 0) weeks += 4 * months;
		if (weeks > 0) days += 7 * weeks;
		if (days > 0) hours += 24 * days;

		const rounded = {
			hours: round(hours + minutes / 60, 1),
			minutes: round(minutes),
		};

		const [unit, value] = Object.entries(rounded).find(([, value]) => value >= 1)!;

		const display = `${value} ${unit === 'minutes' ? 'mins' : unit}`;

		const issuesToUpdate = prs.flatMap((pr) => pr.closingIssuesReferences.nodes);

		for (const issue of issuesToUpdate) {
			console.info(
				`\nIssue #${issue.number} (${issue.title}) = ${display} [${formatDuration(duration)}]:`
			);
			for (const [i, pr] of prs.entries()) {
				console.info(
					` ${i > 0 ? '+' : ' '} ${pr.headRefName} (${prsPerBranch
						.get(pr.headRefName)!
						.map((pr) => `#${pr.number}`)
						.join(', ')})`
				);
				const extras = extrasPerPR.get(pr.headRefName);
				if (extras) {
					for (const { other } of extras) {
						console.info(` + ${pr.headRefName} (${other.project}@${other.branch})`);
					}
				}
			}

			times.push({ issue, time: display, seconds });
		}
	} catch (error) {
		console.error(`An error occurred during analysis of #${issue.number} (${issue.title}): `);
		console.error(error);
	}
}

async function requestWakatime({
	backoff = 30e3,
	...args
}: {
	start: Date;
	end: Date;
	project: string;
	branches: string[];
	backoff?: number;
}): Promise<WakatimeSummaries> {
	const { start, end, project, branches } = args;

	const response = await fetch(
		'https://wakatime.com/api/v1/users/current/summaries?' +
			new URLSearchParams({
				start: formatISO(subMonths(start, 2), { representation: 'date' }),
				end: formatISO(addMonths(end, 1), { representation: 'date' }),
				project,
				branches: [...new Set(branches)].join(','),
			}),
		{
			headers: {
				Authorization: `Basic ${env.WAKATIME_API_KEY}`,
			},
		}
	).then((r) => r.text());

	if (response.includes('Too Many Requests')) {
		await new Promise((resolve) => setTimeout(resolve, backoff));
		return requestWakatime({ ...args, backoff: backoff * 3 });
	}

	return JSON.parse(response);
}

type IssueFragment<T = unknown> = T & {
	id: string;
	number: number;
	title: string;
	issueFieldValues: Connection<
		| undefined
		| {
				value: string;
				field: {
					id: string;
				};
		  }
	>;
};

type Issue = IssueFragment<{
	closedByPullRequestsReferences?: Connection<{
		number: number;
		headRefName: string;
		createdAt: string;
		closedAt: string | null;

		closingIssuesReferences: Connection<IssueFragment>;
	}>;
}>;

type GithubResponse = {
	data: {
		repository: {
			issues: Connection<Issue>;
		};
	};
};

type WakatimeSummaries = {
	data: Array<{
		branches: Array<{
			total_seconds: number;
			name: string;
		}>;
	}>;
};

type Connection<T> = { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: T[] };

function round(value: number, places = 0) {
	return Math.round(value * 10 ** places) / 10 ** places;
}
