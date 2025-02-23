import { fillBuiltinData, get } from '$lib/idb';

export async function load() {
	await fillBuiltinData();
	return {
		showInputHints: await get('Settings', '_').then((settings) => settings?.showInputHints)
	};
}
