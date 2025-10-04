import { $, Glob, which } from 'bun';

if (!which('msgcat')) {
	throw new Error('msgcat command not found. Please install gettext tools.');
}

const locales = new Glob('src/locales/*.po');

for await (const file of locales.scan()) {
	console.info(`Sorting ${file}`);
	await $`msgcat --sort-output ${file} -o ${file}`;
}
