import { $, Glob } from 'bun';

const locales = new Glob('src/locales/*.po');

for await (const file of locales.scan()) {
	console.info(`Sorting ${file}`);
	await $`msgcat --sort-output ${file} -o ${file}`;
}
