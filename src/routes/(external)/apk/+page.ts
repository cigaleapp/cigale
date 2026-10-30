import { UpdateBundleMetadata } from '#lib/schemas/update-bundle.js';
import { ArkErrors } from 'arktype';

export async function load() {
	const info = await fetch(
		'https://cigale-dev-biodimedia-data-terra.ai.meso.umontpellier.fr/apk/update.json'
	)
		.then((r) => r.json())
		.then((json) => UpdateBundleMetadata(json));

	if (info instanceof ArkErrors) {
		return { info: undefined };
	}

	return { info };
}
