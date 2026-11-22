import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) {
	console.error('Error: BASE_URL environment variable is not set.');
	process.exit(1);
}

const PROTOCOLS_DIR = join(__dirname, '..', 'protocols');
const OLD_URL = 'http://localhost:3000/';

const files = readdirSync(PROTOCOLS_DIR).filter((f) => f.startsWith('.cigaleprotocol.'));

for (const file of files) {
	const filePath = join(PROTOCOLS_DIR, file);
	const content = readFileSync(filePath, 'utf-8');

	if (content.includes(OLD_URL)) {
		const updated = content.split(OLD_URL).join(BASE_URL);
		writeFileSync(filePath, updated, 'utf-8');
		console.log(`Updated: ${file}`);
	} else {
		console.log(`Skipped (no match): ${file}`);
	}
}

console.log('Done.');
