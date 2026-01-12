<script module lang="ts">
	const LAYOUTS = ['top-bottom', 'left-right'] as const;
	export type Layout = (typeof LAYOUTS)[number];
</script>

<script lang="ts">
	import IconLayoutTopBottom from '~icons/ri/layout-4-line';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { tooltip } from '$lib/tooltips';

	interface Props {
		layout: 'top-bottom' | 'left-right';
	}

	let { layout = $bindable('top-bottom') }: Props = $props();

	function cycleLayout() {
		layout = LAYOUTS[(LAYOUTS.indexOf(layout) + 1) % LAYOUTS.length];
	}

	defineKeyboardShortcuts('classification', {
		'Alt+L': {
			help: 'Changer de disposition',
			do: () => cycleLayout()
		}
	});
</script>

<button
	class="layout-switcher"
	onclick={() => cycleLayout()}
	use:tooltip={{
		text: 'Changer de disposition',
		keyboard: 'Alt+L'
	}}
>
	{#each LAYOUTS as l (l)}
		<div class="icon" class:active={layout === l}>
			<IconLayoutTopBottom style={l === 'left-right' ? 'rotate: 90deg;' : ''} />
		</div>
	{/each}
</button>

<style>
	.layout-switcher {
		display: flex;
		align-items: center;
		gap: 0.25em;
		padding: 0.25em;
		font-size: 1rem;
		border: 2px solid var(--fg-neutral);
		background: var(--bg-neutral);
		border-radius: var(--corner-radius);
		width: min-content;
		height: min-content;

		&:is(:has(:focus-visible), :hover) {
			background-color: var(--gray);
			.icon:not(.active) {
				color: var(--fg-neutral);
			}
			.icon.active {
				color: var(--gay);
			}
		}

		.icon {
			font-size: 1.25em;
			display: flex;
		}

		.icon:not(.active) {
			color: var(--gray);
		}
	}
</style>
