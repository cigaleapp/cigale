<script lang="ts">
	import IconLayoutTopBottom from '~icons/ri/layout-4-line';
	import { tables } from '$lib/idb.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import { FULLSCREEN_CLASSIFY_LAYOUTS as LAYOUTS } from '$lib/schemas/sessions';
	import { uiState } from '$lib/state.svelte';
	import { tooltip } from '$lib/tooltips';
	import { sleep } from '$lib/utils';

	interface Props {
		/** A function that {en,dis}ables CSS transitions when called */
		// eslint-disable-next-line no-unused-vars
		toggleLayoutTransitions: (enable: boolean) => void;
	}

	const layout = $derived(uiState.currentSession?.fullscreenClassifier.layout ?? 'top-bottom');

	const nextLayout = $derived(LAYOUTS[(LAYOUTS.indexOf(layout) + 1) % LAYOUTS.length]);

	let { toggleLayoutTransitions }: Props = $props();

	async function cycleLayout() {
		if (!uiState.currentSessionId) return;

		toggleLayoutTransitions(false);

		await tables.Session.update(uiState.currentSessionId, 'fullscreenClassifier', {
			...uiState.currentSession?.fullscreenClassifier,
			layout: nextLayout
		});

		await sleep(50);
		toggleLayoutTransitions(true);
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
