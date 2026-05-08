import { goto } from '$lib/paths.js';

export async function load({ params }) {
	await goto('/(app)/(sidepanel)/o/[observation]/classify/narrow/describe', params);
}
