import { writeFile } from 'node:fs/promises';
import * as date from 'date-fns';
import { x } from 'tinyexec';

const upTo = process.argv[2];

console.info(
	`Generating user-facing changelog up to ${date.parse(upTo, 'yyyy-MM-dd', new Date())}`
);

const gitlog = await x('git', [
	'log',
	`--since=${upTo}`,
	`--until=${date.format(Date.now(), 'yyyy-MM-dd')}`
]).then((result) => result.stdout);

const commits = gitlog
	.split(/\n\ncommit [0-9a-f]{40}/m)
	.map((raw) => {
		const lines = raw
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

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
	.filter(({ committedAt }) =>
		date.isWithinInterval(committedAt, {
			start: date.parse(upTo, 'yyyy-MM-dd', new Date()),
			end: new Date()
		})
	);

const SECTIONS = /** @type {const} */ ([
	'Improvements',
	'Performance Improvements',
	'Accessibility Improvements',
	'Bug Fixes',
	'Data Updates',
	'Translation Updates',
	'Legal Changes'
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
	'♿️': 'Accessibility Improvements'
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
			)
		}
	};
}, {});

console.dir(
	Object.fromEntries(
		Object.entries(months).map(([month, sections]) => [
			month,
			Object.fromEntries(
				Object.entries(sections).map(([section, commits]) => [
					section,
					commits.map((commit) => commit.title)
				])
			)
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
