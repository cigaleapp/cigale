<script>
	import IconGoto from '~icons/ri/arrow-right-line';
	import IconSelected from '~icons/ri/check-line';
	import IconExpand from '~icons/ri/expand-up-down-line';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import { goto } from '$lib/paths.js';
	import { uiState } from '$lib/state.svelte.js';
</script>

<DropdownMenu
	testid="protocol-switcher"
	items={[
		{
			session: null,
			key: '#current',
			label: 'Gérer la session actuelle',
			async onclick() {
				if (!uiState.currentSessionId) {
					return;
				}

				await goto('/(app)/sessions/[id]', {
					id: uiState.currentSessionId
				});
			}
		}
	]}
	selectableItems={tables.Session.state.map((s) => ({
		session: s,
		key: s.id,
		label: s.name,
		selected: uiState.currentSessionId === s.id,
		async onclick() {
			await uiState.setCurrentSessionId(s.id);
		}
	}))}
>
	{#snippet trigger(props)}
		<button class:none-selected={!uiState.currentSession} class="trigger" {...props}>
			{#if uiState.currentSession}
				{uiState.currentSession?.name}
			{:else}
				Aucune session sélectionnée
			{/if}
			<IconExpand />
		</button>
	{/snippet}

	{#snippet item({ label, session })}
		<div class="item">
			<div class="label">
				<div class="icon">
					{#if uiState.currentSessionId === session?.id}
						<IconSelected />
					{:else if !session}
						<IconGoto />
					{/if}
				</div>
				{label}
			</div>

			<!-- <div class="version">
				{#if protocol}
					{#if protocol.version}
						<code use:tooltip={'Version du protocole'}>
							v{protocol.version}
						</code>
					{/if}
					<ButtonUpdateProtocol compact {...protocol} />
				{/if}
			</div> -->
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
