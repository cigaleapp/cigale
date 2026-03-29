<!-- 
 
@component list of steps. Previous steps are disabled while the current step isn't completed



-->

<script lang="ts" generics="Step extends `step${string}`">
	import type { Snippet } from 'svelte';

	import { SvelteSet } from 'svelte/reactivity';

	type Props = {
		steps: Array<{ name: Step; title: string }>;
	} & Record<Step, Snippet<[{ done: () => void }]>>;

	const { steps, ...snippets }: Props = $props();

	const done = new SvelteSet<Step>();
	let current = $derived(steps[0]);
	const future = $derived(steps.slice(nextIndex(current)));

	function nextIndex(step: { name: Step }) {
		return steps.findIndex((s) => s.name === step.name) + 1;
	}

	$inspect({ done, current, future });
</script>

<ol>
	{#each steps as step (step.name)}
		<li>
			<details open={!future.some((f) => f.name === step.name)}>
				<summary>{step.title}</summary>
				{@render snippets[step.name]({
					done() {
						if (steps[nextIndex(step)]) {
							current = steps[nextIndex(step)];
						}
					},
				})}
			</details>
		</li>
	{/each}
</ol>

<style>
	ol {
		counter-reset: step 0;
		padding-left: 0;
	}

	li {
		counter-increment: step 1;
		list-style: none;
		display: flex;
		gap: 1em;
		margin-bottom: 1em;
	}

	li::before {
		content: counter(step, decimal);
		display: inline-flex;
		padding: 0.25em;
		border-radius: 50%;
		transition: background 250ms ease;
		border: 2px solid var(--bg-primary);
		color: var(--fg-primary);
		font-weight: bold;
		height: 2ch;
		width: 2ch;
		justify-content: center;
		align-items: center;
	}

	li:has(details[open=''])::before {
		background-color: var(--bg-primary);
	}

	details {
		/** XXX: pixel perfection */
		margin-top: 4px;
	}

	summary {
		margin-bottom: 0.5lh;
		font-size: 1.2em;
	}

	summary::marker {
		display: none;
	}

	summary {
		display: inline-block;
	}
</style>
