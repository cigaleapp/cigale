import { addDays } from 'date-fns';

import type { SORT_FIELDS } from '../src/lib/schemas/sessions.js';
import type { FixturePaths } from './filepaths.js';
import { expect, test, type AppFixture } from './fixtures.js';
import {
	chooseFirstSession,
	chooseInDropdown,
	hoverOnDropdownOption,
	loadDatabaseDump
} from './utils/index.js';

const photos = [
	'lil-fella.jpeg',
	'cyan.jpeg',
	'leaf.jpeg',
	'with-exif-gps.jpeg'
] as const satisfies FixturePaths.Photos[];

test.beforeEach(async ({ page, app }) => {
	await loadDatabaseDump(page, 'db/basic.devalue');
	await chooseFirstSession(page);
	await app.tabs.go('import');

	const ids = Object.fromEntries(
		await Promise.all(
			photos.map(async (filename) => [
				filename,
				await app.db.image.byFilename(filename).then((i) => i!.id)
			])
		)
	) as Record<(typeof photos)[number], string>;

	const now = new Date();
	const days = (n: number) => addDays(now, n).toISOString();

	await Promise.all(
		photos.map(async (filename, index) => {
			await app.db.metadata.set(ids[filename], 'shoot_date', days(index));
		})
	);
});

test.describe('sorting', () => {
	assertCardsOrder({ field: 'Nom' }, [
		'cyan.jpeg',
		'leaf.jpeg',
		'lil-fella.jpeg',
		'with-exif-gps.jpeg'
	]);

	assertCardsOrder({ field: 'Métadonnée…', metadata: 'shoot_date' }, [
		'lil-fella.jpeg',
		'cyan.jpeg',
		'leaf.jpeg',
		'with-exif-gps.jpeg'
	]);
});

async function assertCardsOrder(
	{
		field,
		metadata
	}: {
		field: (typeof SORT_FIELDS)[keyof typeof SORT_FIELDS]['label'];
		metadata?: Parameters<AppFixture['db']['metadata']['set']>[1];
	},
	order: (typeof photos)[number][]
) {
	const label = [field, metadata].filter(Boolean).join(' > ');

	if (metadata && !metadata.includes('__')) {
		metadata = `io.github.cigaleapp.arthropods.example.light__${metadata}`;
	}

	test(label, async ({ page, app }) => {
		await selectOption();
		await expect.poll(getActualOrder).toStrictEqual(order);

		await selectOption(); // re-select to reverse order
		await expect.poll(getActualOrder).toStrictEqual(order.toReversed());

		async function selectOption() {
			if (metadata) {
				const metadataLabel = await app.db.metadata
					.get(metadata)
					.then((m) => m?.label ?? metadata.split('__')[1]);

				await hoverOnDropdownOption(page, 'import-settings', 'Trier par', field);
				await page
					.getByTestId('import-settings-options')
					.getByRole('group', { name: 'Métadonnée' })
					.getByRole('menuitemcheckbox', { name: metadataLabel })
					.click();
			} else {
				await chooseInDropdown(page, 'import-settings', 'Trier par', field);
			}
		}

		async function getActualOrder() {
			return page
				.locator('main article.observation footer')
				.allInnerTexts()
				.then((texts) => texts.map((t) => t.trim()));
		}
	});
}
