import type { Theme } from '$lib/colorscheme.svelte.js';

export function resolveColorVariable(theme: Theme, name: `--${string}`) {
	// should be a light-dark() expression
	const unresolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim();

	// TODO: find out if theres a way for the cssom to do this work... this is ugly
	const pattern = /^light-dark\((?<light>.+),\s*(?<dark>.+)\)$/;

	const match = pattern.exec(unresolved);

	if (!match) return unresolved;

	return match.groups![theme.effective];
}
