import { asset } from '$app/paths';

type SoundName = 'low-battery' | 'timer-lap' | 'timer-finished';

export function sfx(name: SoundName) {
	new Audio(asset(`/${name}.mp3`)).play();
}
