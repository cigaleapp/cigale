<script>
	import IconGoto from '~icons/ri/arrow-right-line';
	import IconSelected from '~icons/ri/check-line';
	import IconExpand from '~icons/ri/expand-up-down-line';
	import IconBeamup from '~icons/ri/upload-cloud-line';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import { goto } from '$lib/paths.js';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import Switch from '$lib/Switch.svelte';
	import { tooltip } from '$lib/tooltips.js';

	import BeamupConsentLearnMore from './BeamupConsentLearnMore.svelte';

	/** @type {undefined | (() => void)} */
	let openBeamupConsent = $state();

	const currentBeamupConfig = $derived(uiState.currentProtocol?.beamup);

	const currentBeamupPreferences = $derived(
		getSettings().beamupPreferences[uiState.currentProtocolId]
	);
</script>

{#if currentBeamupConfig}
	<BeamupConsentLearnMore
		bind:open={openBeamupConsent}
		protocol={uiState.currentProtocolId}
		config={currentBeamupConfig}
	/>
{/if}

<DropdownMenu
	testid="protocol-switcher"
	selectableItems={tables.Protocol.state.map((p) => ({
		protocol: p,
		key: p.id,
		kind: /** @type {const} */ ('protocol'),
		label: p.name,
		selected: uiState.currentProtocolId === p.id,
		onclick() {
			uiState.setCurrentProtocolId(p.id);
		}
	}))}
	items={[
		{
			protocol: null,
			kind: /** @type {const} */ ('beamup'),
			label: "Contribuer à l'amélioration",
			onclick() {
				openBeamupConsent?.();
			}
		},
		{
			protocol: null,
			kind: /** @type {const} */ ('manage'),
			label: 'Gérer les protocoles',
			onclick() {
				goto('/protocols');
			}
		}
	]}
>
	{#snippet trigger(props)}
		<button class:none-selected={!uiState.currentProtocol} class="trigger" {...props}>
			{#if uiState.currentProtocol}
				{uiState.currentProtocol?.name}
			{:else}
				Aucun protocole sélectionné
			{/if}
			<IconExpand />
		</button>
	{/snippet}

	{#snippet item({ label, kind, protocol })}
		<div class="item">
			<div class="label">
				<div class="icon">
					{#if kind === 'beamup'}
						<IconBeamup />
					{:else if kind === 'manage'}
						<IconGoto />
					{:else if uiState.currentProtocolId === protocol?.id}
						<IconSelected />
					{/if}
				</div>
				{label}
			</div>

			<div class="version">
				{#if kind === 'beamup' && currentBeamupPreferences?.enable}
					<strong class="onoff-indicator on">ON</strong>
				{:else if kind === 'beamup'}
					<strong class="onoff-indicator off">OFF</strong>
				{:else if protocol}
					{#if protocol.version}
						<code use:tooltip={'Version du protocole'}>
							v{protocol.version}
						</code>
					{/if}
					<ButtonUpdateProtocol compact {...protocol} />
				{/if}
			</div>
		</div>
	{/snippet}
</DropdownMenu>

<style>
	.trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 2px solid transparent;
		padding: 0.5em 0.75em;
		border-radius: var(--corner-radius);
		flex-wrap: nowrap;
		white-space: nowrap;
		font-size: 1rem;

		&:hover,
		&:focus-visible {
			border-color: var(--gray);
		}

		&.none-selected {
			color: var(--gay);
		}
	}

	.item {
		display: flex;
		align-items: center;
		gap: 2rem;
		width: 100%;
	}

	.item div {
		display: flex;
		align-items: center;
	}

	.icon {
		justify-content: center;
		width: 1rem;
		height: 1rem;
	}

	.label {
		gap: 0.5rem;
		margin-right: auto;
	}

	.footer {
		padding: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.version code {
		font-size: 0.8rem;
	}

	.onoff-indicator {
		font-size: 0.75rem;
		padding: 0.1em 0.4em;
		font-family: var(--font-mono);

		&.on {
			color: var(--fg-success);
		}

		&.off {
			color: var(--fg-error);
		}
	}
</style>
