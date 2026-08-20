import { http, HttpResponse } from 'msw';

import { test as baseTest, expect } from './fixtures.js';
import { goToProtocolManagement, importPhotos, importProtocol, newSession } from './utils/index.js';

const test = baseTest.extend({
	async networkHandlers({}, use) {
		await use([
			http.get('https://foo.example.org/infer', ({ request }) => {
				const url = new URL(request.url);
				const from = url.searchParams.get('from');

				return HttpResponse.json({ inferred: from ? `inferred:${from}` : null });
			}),
		]);
	},
});

test('can infer metadata from http', async ({ page, app }) => {
	await goToProtocolManagement(page);

	await importProtocol(page, {
		id: 'com.example.httpinference',
		name: 'HTTP inference protocol',
		description: '',
		authors: [],
		metadata: {
			from: {
				type: 'string',
				label: 'From',
				description: '',
				required: false,
				mergeMethod: 'none',
			},
			inferred: {
				type: 'string',
				label: 'Inferred',
				description: '',
				required: false,
				mergeMethod: 'none',
				infer: {
					http: {
						needs: ['from'],
						from: 'https://foo.example.org/infer?from={{ from.value }}',
						select: 'inferred',
					},
				},
			},
		},
	});

	await newSession(page, {
		protocol: 'HTTP inference protocol',
	});

	await importPhotos({ page }, 'cyan.jpeg');
	await app.gallery.card(0).click();

	await app.metadata.textbox('From').fill('hello');
	await app.metadata.textbox('From').blur();

	await expect(app.metadata.textbox('Inferred')).toHaveValue('inferred:hello');

	expect(
		await app.db.metadata.values({ image: 'cyan.jpeg', protocolId: 'com.example.httpinference' })
	).toMatchObject({
		from: 'hello',
		inferred: 'inferred:hello',
	});
});
