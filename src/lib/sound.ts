import { asset } from '$app/paths';

export type SfxName = 'low-battery' | 'timer-lap' | 'timer-finished';

export function sfx(name: SfxName) {
	new Audio(asset(`/${name}.mp3`)).play();
}
