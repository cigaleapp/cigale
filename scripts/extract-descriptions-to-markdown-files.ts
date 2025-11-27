import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import { MetadataEnumVariant } from '../src/lib/database';

async function extractToMarkdown(optionKey: string) {
	const option: MetadataEnumVariant = protocol.metadata[
		'io.github.cigaleapp.arthropods.example__species'
	].options?.find((o) => o.key === optionKey);
	if (!option) throw new Error(`Option with key ${optionKey} not found`);

	return `
${option.image ? `![](${option.image})` : ''}

# ${option.learnMore ? `[${option.label}](${option.learnMore})` : option.label}

${option.description}
`;
}

if (import.meta.main) {
	const [, , directory, ...keys] = process.argv;
	if (!directory) {
		console.error('Please provide a directory to save the markdown files.');
		process.exit(1);
	}

	for (const key of keys) {
		const markdownContent = await extractToMarkdown(key);
		const filePath = path.join(directory, `${key}.md`);
		await writeFile(filePath, markdownContent, 'utf-8');
		console.info(`Extracted description for ${key} to ${filePath}`);
	}
}
