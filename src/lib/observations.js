import { tables } from './idb.svelte';
import { mergeMetadataValues } from './metadata';

/**
 * @param {string[]} parts IDs of observations or images to merge
 */
export async function mergeToObservation(parts) {
	const observations = parts
		.map((part) => tables.Observation.state.find((o) => o.id === part))
		.filter((o) => o !== undefined);

	const images = parts
		.map((part) => tables.Image.state.find((i) => i.id === part))
		.filter((i) => i !== undefined);

	const imageIds = [...images.map((i) => i.id), ...observations.flatMap((o) => o.images)];

	const observation = await tables.Observation.add({
		images: imageIds,
		addedAt: new Date().toISOString(),
		label: observations[0]?.label ?? images[0]?.filename ?? 'Nouvelle observation',
		metadataOverrides: Object.fromEntries(
			Object.entries(await mergeMetadataValues(observations.map((o) => o.metadataOverrides))).map(
				([key, { value, ...rest }]) => [key, { ...rest, value: JSON.stringify(value) }]
			)
		)
	});

	for (const { id } of observations) {
		await tables.Observation.remove(id);
	}

	return observation;
}
