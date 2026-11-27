<script lang="ts">
	import type { Path, PageRouteId } from '$app/types';
	import type { Snippet } from 'svelte';

	import { formatDistanceToNow } from 'date-fns';

	import ButtonIcon from '#lib/ButtonIcon.svelte';
	import { formatDistanceToNowShortParts } from '#lib/date.ts';
	import { goto } from '#lib/paths.js';
	import { locale } from '#lib/settings.svelte.js';
	import { tooltip } from '#lib/tooltips.js';
	import { uiState } from '#lib/uistate.svelte.js';
	import IconBack from '~icons/ri/arrow-left-s-line';

	import ModalSubmitIssue from './ModalSubmitIssue.svelte';
	import TopbarContent from './TopbarContent.svelte';

	interface Props {
		children: Snippet;
		actions?: Snippet;
		/** Home by default */
		to?: Path | PageRouteId;
	}

	const { children, actions, to = '/(app)/sessions/' }: Props = $props();

	const eta = $derived(uiState.eta);
	const progress = $derived(uiState.processing.progress);
	const showingEta = $derived(eta < Infinity && progress > 0 && progress < 1);
</script>

<TopbarContent>
	<div class="back">
		<ButtonIcon
			help="Retour"
			onclick={async () => {
				await goto(to);
			}}
		>
			<IconBack />
		</ButtonIcon>

		{@render children()}
	</div>

	<div class="actions">
		{#if showingEta}
			{@const [quantity, unit] = formatDistanceToNowShortParts(locale(), Date.now() + eta)}

			<div
				class="eta"
				use:tooltip={`Termine ${formatDistanceToNow(Date.now() + eta, { addSuffix: true, includeSeconds: true })}`}
			>
				<code>{quantity}</code>
				<span>{unit}</span>
			</div>
		{/if}

		{@render actions?.()}

		<ModalSubmitIssue type="bug" />
	</div>
</TopbarContent>

<style>
	.back {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.eta {
		display: flex;
		align-items: center;
		font-size: 0.85em;
		min-width: 3ch;
		max-width: 6ch;
	}
</style>
