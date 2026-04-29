<script lang="ts">
	// TODO: remove when Intl.DurationFormat is Baseline Widely Available (in Sep 2027)
	import { DurationFormat } from '@formatjs/intl-durationformat';
	import { formatDistanceToNow, intervalToDuration } from 'date-fns';

	import IconClose from '~icons/ri/arrow-left-s-line';
	import IconSettings from '~icons/ri/more-2-fill';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto } from '$lib/paths.js';
	import { switchSession } from '$lib/sessions.js';
	import { uiState } from '$lib/state.svelte.js';
	import { tooltip } from '$lib/tooltips.js';

	import TabSettings from './TabSettings.svelte';
	import TopbarContent from './TopbarContent.svelte';

	const eta = $derived(uiState.eta);
	const progress = $derived(uiState.processing.progress);
	const showingEta = $derived(eta < Infinity && progress > 0 && progress < 1);
	/** [number, unit] */
	const formattedEta = $derived(
		new DurationFormat('fr-FR', { style: 'narrow' })
			.formatToParts(
				intervalToDuration({
					start: Date.now(),
					end: Date.now() + eta,
				})
			)
			.map((part) => part.value)
			.filter((value) => value.trim())
	);
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
			<div
				class="eta"
				use:tooltip={`Termine ${formatDistanceToNow(Date.now() + eta, { addSuffix: true, includeSeconds: true })}`}
			>
				<code>{formattedEta[0]}</code>
				<span>{formattedEta[1]}</span>
			</div>
		{/if}

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
</style>
