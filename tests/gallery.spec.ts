import type { Locator } from '@playwright/test';
import { addDays } from 'date-fns';

import lightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import type { GROUP_FIELDS, SORT_FIELDS } from '../src/lib/schemas/sessions.js';
import type { FixturePaths } from './filepaths.js';
import { assert, test, type AppFixture } from './fixtures.js';
import {
	chooseFirstSession,
	chooseInDropdown,
	loadDatabaseDump,
	type Tuple
} from './utils/index.js';

const photos = [
	'lil-fella.jpeg',
	'cyan.jpeg',
	'leaf.jpeg',
	'with-exif-gps.jpeg'
] as const satisfies FixturePaths.Photos[];

const orders =
	lightProtocol.metadata['io.github.cigaleapp.arthropods.example.light__order'].options;

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
			await app.db.metadata.set(ids[filename], 'conservation_status', {
				value: 'ex',
				confidence: 1 - index / 4
			});

			if (index === 0) {
				// Delete order metadata for the first photo, so we can test "no metadata" grouping
				await app.db.metadata.set(ids[filename], 'order', null);
			} else {
				await app.db.metadata.set(ids[filename], 'order', {
					value: orders[index % 2].key,
					confidence: index / 4
				});
			}
		})
	);

	await app.db.refresh();
});

test.describe('sorting', () => {
	testCardsOrder('Nom', undefined, [
		'cyan.jpeg',
		'leaf.jpeg',
		'lil-fella.jpeg',
		'with-exif-gps.jpeg'
	]);

	testCardsOrder('Métadonnée…', 'shoot_date', [
		'lil-fella.jpeg',
		'cyan.jpeg',
		'leaf.jpeg',
		'with-exif-gps.jpeg'
	]);

	testCardsOrder('Confiance en…', 'conservation_status', [
		'with-exif-gps.jpeg',
		'leaf.jpeg',
		'cyan.jpeg',
		'lil-fella.jpeg'
	]);
});

test.describe('grouping', () => {
	testCardsGroups('Métadonnée…', 'order', {
		'Ordre = Symphypleona': ['leaf.jpeg'],
		'Ordre = Poduromorpha': ['cyan.jpeg', 'with-exif-gps.jpeg'],
		'Sans Ordre': ['lil-fella.jpeg']
	});

	testCardsGroups('Présence de…', 'order', {
		'Avec Ordre': ['cyan.jpeg', 'leaf.jpeg', 'with-exif-gps.jpeg'],
		'Sans Ordre': ['lil-fella.jpeg']
	});

	testCardsGroups('Confiance en…', 'order', {
		'Ordre: confiance à 75%-100%': ['with-exif-gps.jpeg'],
		'Ordre: confiance à 50%-75%': ['leaf.jpeg'],
		'Ordre: confiance à 25%-50%': ['cyan.jpeg'],
		'Sans Ordre': ['lil-fella.jpeg']
	});

	test('collapse and expand groups', async ({ page }) => {
		await chooseInDropdown(
			page,
			page.getByRole('button', { name: "Réglages d'import" }),
			'Regrouper par…',
			'Métadonnée…',
			'Ordre'
		);

		const group = page.locator('main').getByRole('region', { name: 'Ordre = Symphypleona' });
		const leaf = page.locator('main').getByRole('article', { name: 'leaf.jpeg' });

		await assert(leaf).toBeVisible();
		await group.getByRole('button', { name: 'Réduire le groupe' }).click();
		await assert(leaf).not.toBeVisible();
		await group.getByRole('button', { name: 'Développer le groupe' }).click();
		await assert(leaf).toBeVisible();
	});
});

function testCardsOrder<Label extends Exclude<keyof SortFieldByLabel, 'ID'>>(
	field: SortSelector<Label>['field'],
	metadata: SortSelector<Label>['metadata'],
	order: (typeof photos)[number][]
) {
	const label = [field, metadata].filter(Boolean).join(': ');

	if (metadata && !metadata.includes('__')) {
		metadata = `io.github.cigaleapp.arthropods.example.light__${metadata}`;
	}

	test(label, async ({ page, app }) => {
		const trigger = page.getByRole('button', { name: "Réglages d'import" });

		let query: Tuple<string, 2 | 3> = ['Trier par', field];
		if (metadata) {
			const m = await app.db.metadata.get(metadata);
			query = [...query, m!.label];
		}

		// Reset before choosing, otherwise itll reverse order instead of setting it
		// We use 'ID' because it's never the field we're testing
		await chooseInDropdown(page, trigger, 'Trier par', 'ID');

		await chooseInDropdown(page, trigger, ...query);
		await expectCardsOrder(page.locator('main'), order);

		// re-select to reverse order
		await chooseInDropdown(page, trigger, ...query);
		await expectCardsOrder(page.locator('main'), order.toReversed());
	});
}

function testCardsGroups<Field extends keyof GroupFieldByLabel>(
	field: GroupSelector<Field>['field'],
	metadataKey: GroupSelector<Field>['metadata'],
	groupings: Record<string, (typeof photos)[number][]>
) {
	const label = [field, metadataKey].filter(Boolean).join(': ');

	let metadata: string | undefined = metadataKey;
	if (metadata && !metadata.includes('__')) {
		metadata = `io.github.cigaleapp.arthropods.example.light__${metadata}`;
	}

	test(label, async ({ page, app }) => {
		const trigger = page.getByRole('button', { name: "Réglages d'import" });

		if (metadata) {
			const metadataLabel = await app.db.metadata
				.get(metadata)
				.then((m) => m?.label ?? metadata.split('__')[1]);

			await chooseInDropdown(page, trigger, 'Regrouper par', field, metadataLabel);
		} else {
			await chooseInDropdown(page, trigger, 'Regrouper par', field);
		}

		for (const [label, photos] of Object.entries(groupings)) {
			await expectCardsOrder(
				page.locator('main').getByRole('region', { name: label, exact: true }),
				photos
			);
		}
	});
}

async function expectCardsOrder(locator: Locator, order: string[]) {
	await assert
		.poll(() =>
			locator
				.locator('article.observation footer')
				.allInnerTexts()
				.then((texts) => texts.map((t) => t.trim()))
		)
		.toStrictEqual(order);
}

type SortFieldByLabel = {
	[K in keyof typeof SORT_FIELDS as (typeof SORT_FIELDS)[K]['label']]: K;
};

type GroupFieldByLabel = {
	[K in keyof typeof GROUP_FIELDS as (typeof GROUP_FIELDS)[K]['label']]: K;
};

type SortFieldNeedsMetadata = {
	[K in keyof typeof SORT_FIELDS as (typeof SORT_FIELDS)[K]['label']]: (typeof SORT_FIELDS)[K]['needsMetadata'];
};

type GroupFieldNeedsMetadata = {
	[K in keyof typeof GROUP_FIELDS as (typeof GROUP_FIELDS)[K]['label']]: (typeof GROUP_FIELDS)[K]['needsMetadata'];
};

type SortSelector<Label extends keyof SortFieldByLabel> = {
	field: Label;
} & (SortFieldNeedsMetadata[Label] extends true
	? { metadata: Parameters<AppFixture['db']['metadata']['set']>[1] }
	: { metadata?: undefined });

type GroupSelector<Label extends keyof GroupFieldByLabel> = {
	field: Label;
} & (GroupFieldNeedsMetadata[Label] extends true
	? { metadata: Parameters<AppFixture['db']['metadata']['set']>[1] }
	: { metadata?: undefined });
