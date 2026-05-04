import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import assetlinks from '../assetlinks.json' with { type: 'json' };

const isPreviewBuild = Boolean(process.env.PR_NUMBER);
const filtered = assetlinks.filter((entry) => {
	switch (entry.target.package_name) {
		case 'io.github.cigaleapp.preview':
			return isPreviewBuild;

		default:
			return !isPreviewBuild;
	}
});

const destination = 'static/.well-known/assetlinks.json';

mkdirSync(dirname(destination), { recursive: true });
await Bun.file(destination).write(JSON.stringify(filtered, null, 2));

console.info(`Generated ${destination} with ${filtered.length} entries:`);
console.info(await Bun.file(destination).text());
