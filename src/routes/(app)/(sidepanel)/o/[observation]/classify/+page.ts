import { goto } from '$lib/paths.js';

export async function load({ params }) {
	// TODO: remember last tab used ?
	await goto('/(app)/(sidepanel)/o/[observation]/classify/suggestions', params);
}
