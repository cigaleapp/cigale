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
				}
			}
		}
	}
`);

let totalPrice = 0;
let totalHours = 0;
let chunkIndex = 0;

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

const rate = Math.round((totalPrice / totalHours) * 100) / 100;

console.info(`Final: ${totalPrice}/${totalHours} => ${rate} €/h`);

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
