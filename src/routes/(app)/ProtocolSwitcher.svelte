<script>
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import { goto } from '$lib/paths.js';
	import { uiState } from '$lib/state.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import IconGoto from '~icons/ri/arrow-right-line';
	import IconSelected from '~icons/ri/check-line';
	import IconExpand from '~icons/ri/expand-up-down-line';
</script>

<DropdownMenu
	testid="protocol-switcher"
	items={[
		{
			protocol: null,
			label: 'Gérer les protocoles',
			onclick() {
				goto('/protocols');
			}
		}
	]}
	selectableItems={tables.Protocol.state.map((p) => ({
		protocol: p,
		key: p.id,
		label: p.name,
		selected: uiState.currentProtocolId === p.id,
		onclick() {
			uiState.setCurrentProtocolId(p.id);
		}
	}))}
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

	{#snippet item({ label, protocol })}
		<div class="item">
			<div class="label">
				<div class="icon">
					{#if uiState.currentProtocolId === protocol?.id}
						<IconSelected />
					{:else if !protocol}
						<IconGoto />
					{/if}
				</div>
				{label}
			</div>

			<div class="version">
				{#if protocol}
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
</style>
