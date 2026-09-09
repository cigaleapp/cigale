import type { ExportedProtocol } from '../src/lib/schemas/protocols.js';

import { RateLimit } from 'async-sema';
import { chunk } from 'es-toolkit';

// import light from '../examples/arthropods.light.cigaleprotocol.json' with{type: "json"}

import _backbone from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };

const backbone = _backbone as (typeof ExportedProtocol)['inferIn'];

const ratelimit = RateLimit(100);

const species = optionsOf('species');
const genera = optionsOf('genus');
const families = optionsOf('family');
const orders = optionsOf('order');
const classes = optionsOf('class');

const USERNAME = 'admin';
const PASSWORD = 'Administrator20';
const SERVER = 'http://localhost:8889';

let token = '';

const total = Math.ceil(species.size / 100);

try {
	for (const [i, slice] of chunk([...species.values()], 100).entries()) {
		console.info(`${i}/${total} Making file`);
		const data = new FormData();
		data.append(
			'file',
			new Blob(
				[
					JSON.stringify(
						slice.map(({ label, cascade }) => ({
							cached_scientific_name: label,
							// TODO common name
							cached_common_name: label,
							col_genus_name: lookup(genera, cascade?.genus),
							col_family_name: lookup(families, cascade?.family),
							col_order_name: lookup(orders, cascade?.order),
							col_class_name: lookup(classes, cascade?.class),
							taxonomy_source: 'GBIF',
						}))
					),
				],

				{
					type: 'application/json',
				}
			),
			'taxa.json'
		);

		console.info(`${i}/${total} Sending request`);

		const response = (await request('POST', 'taxons/imports', {}, data)) as {
			data: {
				failed: number;
				succeeded: number;
				rows: Array<{
					status: 'succeeded' | 'failed';
					row_number: number;
					field: string;
					reason: string;
				}>;
			};
		};

		if (response.data.failed > 0) {
			console.error(
				response.data.rows
					.filter((r) => r.status !== 'succeeded')
					.map((r) => `#${r.row_number}: ${r.field}: ${r.reason} (${r.status})`)
					.join('\n')
			);
			throw new Error('Some failed');
		}
	}
} finally {
	await request('DELETE', 'auth-tokens/current');
}

function lookup(options: Map<string, { label: string }>, key: undefined | string | string[]) {
	if (!key) return '';

	if (!Array.isArray(key)) return options.get(key)!.label;

	if (Array.isArray(key) && key.length > 1)
		throw new Error(`multiple cascades ${JSON.stringify(key)}`);

	return options.get(key[0])!.label;
}

function optionsOf(name: string) {
	return new Map(
		backbone.metadata[`io.github.cigaleapp.arthropods.example__${name}`].options!.map(
			(option) => [option.key, option]
		)
	);
}

async function request(
	method: 'GET' | 'POST' | 'DELETE',
	path: string,
	queryParams: Record<string, unknown> = {},
	body?: FormData | URLSearchParams | Record<string, unknown>
) {
	const url = `${SERVER}/api/v1/${path}?${new URLSearchParams(Object.fromEntries(Object.entries(queryParams).map(([key, val]) => [key, String(val)])))}`;

	await ratelimit();

	if (!token && !/^auth-tokens(\/.+)?$/.test(path)) {
		console.info('Logging in');
		const response = await request(
			'POST',
			'auth-tokens',
			{},
			new URLSearchParams({
				username: USERNAME,
				password: PASSWORD,
			})
		);

		token = response.access_token;
	}

	const response = await fetch(url, {
		method,
		headers: { Authorization: `Bearer ${token}` },
		body:
			body === undefined
				? undefined
				: body instanceof FormData || body instanceof URLSearchParams
					? body
					: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(`Error for ${method} ${url}: ${await response.text()}`);
	}

	return response.json();
}
