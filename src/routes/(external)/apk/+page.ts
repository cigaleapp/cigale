import { ArkErrors } from 'arktype';

import { UpdateBundleMetadata } from '$lib/schemas/update-bundle.js';

export async function load() {
	const info = await fetch('https://cigale-dev-default-data-terra.ai.meso.umontpellier.fr/apk/update.json')
		.then((r) => r.json())
		.then((json) => UpdateBundleMetadata(json));

	if (info instanceof ArkErrors) {
		return { info: undefined };
	}

	return { info };
}
