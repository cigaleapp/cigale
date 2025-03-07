import { tables } from './idb.svelte';
import { mergeMetadataValues } from './metadata';

/**
 * @param {string[]} parts IDs of observations or images to merge
 */
export async function mergeToObservation(parts) {
	const observations = await Promise.all(
		parts.map(async (part) => {
			return tables.Observation.get(part);
		})
	).then((observations) => observations.filter((o) => o !== undefined));

	const images = await Promise.all(
		parts.map(async (part) => {
			return tables.Image.get(part);
		})
	).then((images) => images.filter((i) => i !== undefined));

	const imageIds = parts.flatMap(
		(part) => observations.find((o) => o.id === part)?.images ?? [part]
	);

	const observation = await tables.Observation.add({
		images: imageIds,
		addedAt: new Date().toISOString(),
		label: observations[0]?.label ?? images[0]?.filename ?? 'Nouvelle observation',
		// @ts-expect-error
		metadataOverrides: await mergeMetadataValues(observations.map((o) => o.metadataOverrides))
	});

	await Promise.all(
		parts.map(async (part) => {
			await tables.Observation.remove(part).catch(() => {});
		})
	);

	return observation;
}
