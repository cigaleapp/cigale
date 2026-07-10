import { execSync } from 'node:child_process';
import type { introspection } from './graphql-env.js';
import type { ResultOf } from 'gql.tada';

import arkenv from 'arkenv';
import { initGraphQLTada, TadaDocumentNode } from 'gql.tada';
import * as graphqlLib from 'graphql';

const graphql = initGraphQLTada<{
	introspection: introspection;
	disableMasking: true;
}>();

const env = arkenv({
	HOURS_SPENT_ISSUE_FIELD_ID: 'string = "IFN_kgDOAp9OqA"',
	PRICE_ISSUE_FIELD_ID: 'string = "IFN_kgDOApKUqw"',
	HOURLY_RATE_CUSTOM_PROPERTY_NAME: 'string = "hourly_rate"',
	GITHUB_REPO: [
		'/^.+?\\/.+?$/',
		'=>',
		(repository) => {
			const [owner, repo] = repository.split('/');
			return { owner, repo };
		},
	],
});

const query = graphql(`
	query ($owner: String!, $repo: String!, $cursor: String) {
		repository(owner: $owner, name: $repo) {
			id

			issues(
				after: $cursor
				first: 100
				states: [CLOSED]
				orderBy: { direction: DESC, field: CREATED_AT }
			) {
				pageInfo {
					hasNextPage
					endCursor
				}
				nodes {
					number
					title

					issueFieldValues(first: 20) {
						nodes {
							__typename

							... on IssueFieldNumberValue {
								value
								field {
									__typename
									... on IssueFieldNumber {
										id
									}
								}
							}
						}
					}

					milestone {
						description
						title
						id
						number
					}
				}
			}
		}
	}
`);

let totalPrice = 0;
let totalHours = 0;
let chunkIndex = 0;

/**
 * Milestone.id → totals
 */
const perMilestone: Record<
	string,
	{
		price: number;
		hours: number;
		milestone: NonNullable<
			NonNullable<
				NonNullable<
					NonNullable<
						NonNullable<ResultOf<typeof query>['repository']>['issues']
					>['nodes']
				>[number]
			>['milestone']
		>;
	}
> = {};

let pageInfo = { endCursor: null as string | null, hasNextPage: true };
let chunk: ResultOf<typeof query>;

while (pageInfo.hasNextPage) {
	chunkIndex++;

	chunk = await github(query, { cursor: pageInfo.endCursor });
	await analyze(chunk);

	console.info(`So far (${chunkIndex}): ${totalPrice}/${totalHours}`);

	pageInfo = chunk.repository?.issues.pageInfo ?? {
		endCursor: null,
		hasNextPage: false,
	};
}

const rate = computeRate(totalPrice, totalHours);

console.info(`Final: ${totalPrice}/${totalHours} => ${rate} €/h`);
console.info(`Per milestone:`);
for (const { milestone, price, hours } of Object.values(perMilestone)) {
	console.info(`- ${milestone.title}: ${price}€/${hours}h => ${computeRate(price, hours)} €/h`);
	// Not available as a gql mutation lol
	const response = await fetch(
		`https://api.github.com/repos/${env.GITHUB_REPO.owner}/${env.GITHUB_REPO.repo}/milestones/${milestone.number}`,
		{
			method: 'PATCH',
			headers: { Authorization: `Bearer ${execSync('gh auth token')}` },
			body: JSON.stringify({
				description: milestone.description?.includes('[Effective rate:')
					? milestone.description.replace(
							/\[Effective rate: .+?\]/,
							`[Effective rate: ${computeRate(price, hours)} €/h]`
						)
					: `${milestone.description ?? ''} [Effective rate: ${computeRate(price, hours)} €/h]`,
			}),
		}
	);

	if (!response.ok) {
		console.error(await response.text());
	}
}

function computeRate(price: number, hours: number) {
	return Math.round((price / hours) * 100) / 100;
}

await github(
	graphql(`
		mutation ($repoId: ID!, $name: String!, $rate: CustomPropertyValue!) {
			setRepositoryCustomPropertyValues(
				input: { repositoryId: $repoId, properties: { propertyName: $name, value: $rate } }
			) {
				clientMutationId
			}
		}
	`),
	{
		name: env.HOURLY_RATE_CUSTOM_PROPERTY_NAME,
		rate: `${rate} EUR`,
		repoId: chunk.repository?.id,
	}
);

async function analyze(chunk: ResultOf<typeof query>) {
	console.info(`Analyzing chunk of ${chunk.repository?.issues.nodes?.length ?? 0} issues`);
	for (const issue of chunk.repository?.issues.nodes ?? []) {
		if (!issue) continue;

		const price = issueFieldValue(issue, env.PRICE_ISSUE_FIELD_ID);
		const hours = issueFieldValue(issue, env.HOURS_SPENT_ISSUE_FIELD_ID);

		if (price === undefined) continue;
		if (hours === undefined) continue;

		console.info(`#${issue.number} (${issue.title}): ${price}€ / ${hours}h`);

		totalPrice += price;
		totalHours += hours;

		if (issue.milestone) {
			perMilestone[issue.milestone.id] ??= { hours: 0, price: 0, milestone: issue.milestone };
			perMilestone[issue.milestone.id].hours += hours;
			perMilestone[issue.milestone.id].price += price;
		}
	}
}

function issueFieldValue(
	issue: NonNullable<
		NonNullable<NonNullable<ResultOf<typeof query>['repository']>['issues']>['nodes']
	>[number],
	fieldId: string
) {
	if (!issue) return undefined;

	const field = issue.issueFieldValues?.nodes?.find(
		(n) =>
			n !== null &&
			n.__typename === 'IssueFieldNumberValue' &&
			n.field?.__typename === 'IssueFieldNumber' &&
			n.field.id === fieldId
	) as undefined | { value: number };

	return field?.value;
}

async function github<
	Variables extends Record<string, unknown>,
	Result extends Record<string, unknown>,
>(
	query: TadaDocumentNode<Result, Variables>,
	variables: Partial<Pick<Variables, 'repo' | 'owner'>> & Omit<Variables, 'repo' | 'owner'>
): Promise<Result> {
	const result = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		body: JSON.stringify({
			query: graphqlLib.print(query),
			variables: { ...env.GITHUB_REPO, ...variables },
		}),
		headers: {
			Authorization: `Bearer ${execSync('gh auth token')}`,
		},
	}).then((r) => r.json());

	if (!result.data || result.errors) throw new Error(JSON.stringify(result.errors));

	return result.data;
}
