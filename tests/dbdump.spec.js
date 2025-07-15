import { test } from './fixtures.js';
import { importResults, dumpDatabase } from './utils.js';

test.describe.skip('Database dump', () => {
	test('(dumb database)', async ({ page }) => {
		await importResults(page, 'correct.zip');
		await dumpDatabase(page, 'basic.devalue');
	});
});
