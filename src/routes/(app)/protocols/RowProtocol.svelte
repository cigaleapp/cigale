<script lang="ts">
	import type { Protocol } from '$lib/database';

	import IconUpgrade from '~icons/ri/arrow-up-circle-line';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconLearnMore from '~icons/ri/information-line';
	import IconEdit from '~icons/ri/pencil-line';
	import IconStats from '~icons/ri/pie-chart-2-line';
	import IconExport from '~icons/ri/share-forward-line';
	import Badge from '$lib/Badge.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto, resolve } from '$lib/paths';
	import { getSettings, setSetting } from '$lib/settings.svelte';
	import { shareUrl } from '$lib/share.js';
	import Switch from '$lib/Switch.svelte';
	import { uiState } from '$lib/uistate.svelte.js';

	import BeamupConsentLearnMore from './BeamupConsentLearnMore.svelte';

	interface Props extends Partial<Protocol> {
		id: string;
		name: string;
		source?: string;
		version?: number;
		ondelete: () => void;
		// eslint-disable-next-line no-unused-vars
		oninstall: (source: string, onProgress: (p: number) => void) => Promise<void>;
		installed?: boolean;
		updates: 'automatic' | 'manual';
		beamup?: Protocol['beamup'];
		charts?: Protocol['charts'];

		expanded?: boolean;
	}

	let {
		id,
		name,
		source,
		version,
		ondelete,
		installed = true,
		oninstall,
		updates,
		beamup,
		expanded = $bindable(false),
		charts,
	}: Props = $props();

	const autoUpdatesEnabled = $derived.by(() => {
		const user = getSettings().autoUpdateProtocols;
		if (id in user) return user[id];
		return updates === 'automatic';
	});

	const beamupEnabled = $derived.by(() => {
		if (!beamup) return null;

		const user = getSettings().beamupPreferences;
		return Boolean(user[id]?.enable);
	});

	const hasUserScopedCharts = $derived(
		Boolean(charts?.some((chart) => ['both', 'user'].includes(chart.scope)))
	);
</script>

<li>
	<details open={expanded}>
		<summary>
			<section class="text">
				<h3>
					<!-- {#if dirty}
						<UnsavedChangesIndicator
							help="Protocole modifié par rapport à la version publiée"
						/>
					{/if} -->
					{name}
				</h3>
				<small><OverflowableText tag="code" text={id} /></small>
			</section>
			<section class="actions">
				{#if !installed && source}
					<ButtonSecondary
						loading
						onclick={async (_, { progress }) => {
							await oninstall?.(source, progress);
						}}
					>
						Installer
					</ButtonSecondary>
				{:else}
					<ButtonIcon
						help="Partager"
						disabled={!source}
						onclick={async () => {
							if (!source) return;

							await shareUrl(
								new URL(
									resolve('/(app)/protocols/import/[...url]', {
										url: source,
									}),
									import.meta.env.webOrigin
								)
							);
						}}
					>
						<IconExport />
					</ButtonIcon>
					{#if version && source}
						<ButtonUpdateProtocol compact {version} {source} {id} />
					{:else}
						<ButtonIcon
							crossout
							onclick={() => {}}
							help="Ce protocole ne supporte pas la vérification des mises à jour"
						>
							<IconUpgrade />
						</ButtonIcon>
					{/if}
				{/if}
			</section>
		</summary>
		{#if version && source && installed}
			<label class="auto-updates">
				<Switch
					value={autoUpdatesEnabled}
					label="Mises à jour automatiques"
					onchange={async (enabled) => {
						const currently = getSettings().autoUpdateProtocols;
						await setSetting('autoUpdateProtocols', {
							...currently,
							[id]: enabled,
						});
					}}
				/>

				<div class="text">
					<p>Mettre à jour automatiquement</p>
					<p class="via">
						<OverflowableText text="Via {source}" />
					</p>
				</div>
			</label>
		{/if}

		{#if installed && beamup}
			{let open = $state<() => void>()}

			<BeamupConsentLearnMore config={beamup} protocol={id} bind:open />

			<div class="beamup-consent">
				<Switch
					value={Boolean(beamupEnabled)}
					label="Envoi de corrections pour améliorer le protocole"
					onchange={async (enabled) => {
						const currently = getSettings().beamupPreferences;
						await setSetting('beamupPreferences', {
							...currently,
							[id]: {
								email: currently[id]?.email ?? null,
								enable: enabled,
							},
						});
					}}
				/>

				<div class="text">
					<p>Envoi des corrections</p>
					<p class="via">
						<OverflowableText text="À {beamup.origin}" />
					</p>
				</div>

				<ButtonIcon help="En savoir plus" inline onclick={() => open?.()}>
					<IconLearnMore />
				</ButtonIcon>
			</div>
		{/if}

		{#if installed}
			<div class="more-actions">
				<ButtonSecondary
					danger
					disabled={id === uiState.currentProtocolId && uiState.processing.total > 0}
					onclick={() => {
						ondelete();
					}}
				>
					<IconDelete />
					Supprimer
				</ButtonSecondary>
				{#if hasUserScopedCharts}
					<ButtonSecondary onclick={() => goto('/(app)/protocols/[id]/results', { id })}>
						<IconStats />
						Stats
					</ButtonSecondary>
				{/if}
				<ButtonSecondary onclick={() => goto('/(app)/protocols/[id]/infos', { id })}>
					<IconEdit />
					Modifier
					<Badge>Beta</Badge>
				</ButtonSecondary>
				{#if version && source}
					<ButtonUpdateProtocol {version} {source} {id} />
				{/if}
			</div>
		{/if}
	</details>
</li>

<style>
	li {
		width: 100%;
	}

	.actions,
	.more-actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.more-actions {
		@media (max-width: 600px) {
			flex-wrap: wrap;
		}
	}

	details {
		padding: 1em;
		border-radius: var(--corner-radius);
	}

	details:is(:hover, :focus-visible) {
		background-color: var(--bg-primary-translucent);
		cursor: pointer;
	}

	details:open {
		background-color: var(--bg2-neutral);
	}

	details:open summary {
		margin-bottom: 1em;
	}

	summary {
		display: flex;
		justify-content: space-between;
		gap: 1em;

		&::marker {
			display: none;
		}

		.text {
			width: 70%;
		}
	}

	.auto-updates,
	.beamup-consent {
		display: grid;
		grid-template-columns: max-content auto max-content;
		align-items: center;
		gap: 1em;
		margin-top: 1em;

		.via {
			color: var(--gay);
		}

		.text {
			overflow: hidden;
		}
	}

	.more-actions {
		margin-top: 1em;
		justify-content: center;
	}
</style>
