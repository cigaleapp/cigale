import { ExportedProtocol } from '$lib/schemas/protocols';
import { Analysis } from '$lib/schemas/results';
import { deleteKeysDeep, keys } from '$lib/utils';
import { error, json } from '@sveltejs/kit';

export const prerender = true;

const schemas = {
	protocol: ExportedProtocol,
	results: Analysis
};

export const entries = () => keys(schemas).map((name) => ({ schema: name }));

/** @type {import('@sveltejs/kit').RequestHandler} */
export const GET = ({ params }) => {
	const schema = schemas[params.schema];

	if (!schema) {
		error(404, `Schema ${params.schema} not found`);
	}

	// Remove any key that as a value matching a $ark.object
	return json(
		removeArktypeInternals({
			$schema: 'https://json-schema.org/draft-07/schema',
			...schema.in.toJsonSchema()
		})
	);
};

/**
 *
 * @param {any} obj
 * @returns
 */
function removeArktypeInternals(obj) {
	return deleteKeysDeep(obj, (key, value) => key === 'table' && /^\$ark\.object\d+$/.test(value));
}
