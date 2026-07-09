import { ArkErrors } from 'arktype';

import { UpdateBundleMetadata } from '$lib/schemas/update-bundle.js';

export async function load() {
	const info = await fetch('https://apk.cigale.gwen.works/update.json')
		.then((r) => r.json())
		.then((json) => UpdateBundleMetadata(json));

	if (info instanceof ArkErrors) {
		return { info: undefined };
	}

	return { info };
}
