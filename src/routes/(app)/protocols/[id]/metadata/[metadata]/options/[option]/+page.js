import { error } from '@sveltejs/kit';

export async function load({ parent, params }) {
	const { protocol, metadata } = await parent();
	if (!('options' in metadata)) {
		error(400, 'Metadata does not have options');
	}

	const option = metadata.options.find((o) => o.key === params.option);
	if (!option) {
		error(
			404,
			`Option ${params.option} not found in metadata ${metadata.id} of protocol ${protocol.id}`
		);
	}

	return {
		protocol,
		metadata,
		option
	};
}
