<script lang="ts">
	import { formatDistanceToNow } from 'date-fns';

	import IconClose from '~icons/ri/arrow-left-s-line';
	import IconSettings from '~icons/ri/more-2-fill';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { formatDistanceToNowShortParts } from '$lib/date.js';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto } from '$lib/paths.js';
	import { switchSession } from '$lib/sessions.js';
	import { locale } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/state.svelte.js';
	import { tooltip } from '$lib/tooltips.js';

	import ModalSubmitIssue from './ModalSubmitIssue.svelte';
	import TabSettings from './TabSettings.svelte';
	import TopbarContent from './TopbarContent.svelte';

	const eta = $derived(uiState.eta);
	const progress = $derived(uiState.processing.progress);
	const showingEta = $derived(eta < Infinity && progress > 0 && progress < 1);
</script>

<TopbarContent>
	<ButtonIcon
		help="Fermer la session"
		onclick={async () => {
			await goto('/sessions/');
			await switchSession(null);
		}}
	>
		<IconClose />
	</ButtonIcon>

	<OverflowableText text={uiState.currentSession?.name ?? ''} />

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

		<ModalSubmitIssue type="bug" />

		{#snippet tabSettingsTrigger(props: { help: string; onclick: () => void })}
			<ButtonIcon {...props}>
				<IconSettings />
			</ButtonIcon>
		{/snippet}

		{#if page.route.id === '/(app)/(sidepanel)/import'}
			<TabSettings
				tab="import"
				label="Réglages d'import"
				trigger={tabSettingsTrigger}
				models={[]}
				currentModelIndex={-1}
				setModel={async () => {}}
			/>
		{:else if page.route.id === '/(app)/(sidepanel)/crop'}
			<TabSettings
				tab="crop"
				label="Réglages de recadrage"
				trigger={tabSettingsTrigger}
				models={uiState.cropModels}
				currentModelIndex={uiState.selectedCropModel}
				setModel={async (i) => {
					uiState.setModelSelections({ crop: i });
				}}
			/>
		{:else if page.route.id === '/(app)/(sidepanel)/classify'}
			<TabSettings
				tab="classify"
				label="Réglages de classification"
				trigger={tabSettingsTrigger}
				models={uiState.classificationModels}
				currentModelIndex={uiState.selectedClassificationModel}
				setModel={async (i) => {
					uiState.setModelSelections({ classification: i });
				}}
			/>
		{/if}
	</div>
</TopbarContent>

<style>
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
