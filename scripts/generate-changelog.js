/// <reference types="@types/node" />

import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

import * as date from 'date-fns';

import { sh } from './utils.ts';

const upTo = date.parse(process.argv[2], 'yyyy-MM-dd', new Date());

console.info(`Generating user-facing changelog up to ${date.format(upTo, 'yyyy-MM-dd')}`);

const datePages = [upTo];

while (date.isPast(datePages.at(-1))) {
	datePages.push(date.addMonths(datePages.at(-1), 6));
}

datePages.reverse();

const gitlog = datePages
	.slice(1)
	.map((since, i) =>
		sh(
			'$ git',
			'log',
			`--since=${date.format(since, 'yyyy-MM-dd')}`,
			`--until=${date.format(datePages[i], 'yyyy-MM-dd')}`
		)
	);

const commits = gitlog
	.join('\n')
	.split(/\n\ncommit [0-9a-f]{40}/m)
	.map((raw) => {
		const lines = raw
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		if (lines.length === 0) return {};

		const [subject, ...body] = lines.filter((line) => !/^(Merge|Author|Date):/.test(line));

		const committedAt = new Date(
			lines.find((line) => line.startsWith('Date: '))?.replace('Date: ', '')
		);

		let [emoji, ...title] = subject.split(' ');
		if (/^\w/.test(emoji)) {
			emoji = '';
			title = subject.split(' ');
		}

		return { subject, emoji, title: title.join(' '), body: body.join('\n'), committedAt };
	})
	.filter(
		({ committedAt }) =>
			committedAt &&
			date.isWithinInterval(committedAt, {
				start: upTo,
				end: new Date(),
			})
	);

const SECTIONS = /** @type {const} */ ([
	'Improvements',
	'Performance Improvements',
	'Accessibility Improvements',
	'Bug Fixes',
	'Data Updates',
	'Translation Updates',
	'Legal Changes',
]);

/**
 * @type {Record<string, typeof SECTIONS[number]>}
 */
const EMOJI_TO_SECTION = {
	'✨': 'Improvements',
	':sparkles:': 'Improvements',
	'🐛': 'Bug Fixes',
	':bug:': 'Bug Fixes',
	'🩹': 'Bug Fixes',
	'🚑': 'Bug Fixes',
	'🚸': 'Improvements',
	'⚡': 'Performance Improvements',
	'🥅': 'Improvements',
	'💄': 'Improvements',
	'🍱': 'Data Updates',
	':bento:': 'Data Updates',
	'🌐': 'Translation Updates',
	'📄': 'Legal Changes',
	'♿️': 'Accessibility Improvements',
};

/** @type {Record<string, Record<typeof SECTIONS[number], typeof commits>>} **/
const months = commits.reduce((current, commit) => {
	if (!(commit.emoji in EMOJI_TO_SECTION)) return current;

	const section = EMOJI_TO_SECTION[commit.emoji];
	const month = date.format(commit.committedAt, 'MMMM yyyy');

	return {
		...current,
		[month]: {
			...current[month],
			[section]: [...(current[month]?.[section] ?? []), commit].toSorted((a, b) =>
				date.compareDesc(a.committedAt, b.committedAt)
			),
		},
	};
}, {});

console.dir(
	Object.fromEntries(
		Object.entries(months).map(([month, sections]) => [
			month,
			Object.fromEntries(
				Object.entries(sections).map(([section, commits]) => [
					section,
					commits.map((commit) => commit.title),
				])
			),
		])
	),
	{ depth: null }
);

let rendered = `

# Changelog

All notable changes to this project will be documented in this file, on a monthly basis, with a consistent, simple format: month/year heading > type of change heading > list of changes.


`;

rendered += Object.entries(months)
	.map(([month, sections]) => {
		const renderedSections = Object.entries(sections)
			.sort(([a], [b]) => SECTIONS.indexOf(a) - SECTIONS.indexOf(b))
			.map(([section, commits]) => {
				const commitsList = Array.from(new Set(commits.map((c) => c.title)))
					.sort()
					.join('\n- ');

				return `
### ${section}

- ${commitsList}

`;
			})
			.join('');

		return `
## ${month}

${renderedSections}
`;
	})
	.join('');

writeFile('CHANGELOG.md', rendered, 'utf-8');
