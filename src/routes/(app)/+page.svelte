<script>
	import { goto } from '$app/navigation';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import IconSearch from '~icons/ph/magnifying-glass';
	import IconCheck from '~icons/ph/check';
	import IconImport from '~icons/ph/download';
	import { uiState } from '$lib/state.svelte';
	import IconManage from '~icons/ph/gear';
	import Fuse from 'fuse.js';
	import { promptAndImportProtocol } from '$lib/protocols';
	import { toasts } from '$lib/toasts.svelte';
	import { seo } from '$lib/seo.svelte';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import Tooltip from '$lib/Tooltip.svelte';

	seo({ title: 'Choisir un protocole' });

	const currentProtocol = $derived(
		tables.Protocol.state.find((p) => p.id === uiState.currentProtocolId)
	);

	let searchQuery = $state('');
	const searcher = $derived(
		new Fuse(tables.Protocol.state, {
			keys: ['name', 'id']
		})
	);

	const protocols = $derived(
		searchQuery ? searcher.search(searchQuery).map((r) => r.item) : tables.Protocol.state
	);
</script>

<div class="content">
	<h1>Choisir un protocole</h1>

	<ul>
		<li class="search">
			<IconSearch />
			<InlineTextInput
				onblur={() => {}}
				label="Recherche"
				bind:value={searchQuery}
				placeholder="Rechercher..."
			/>
		</li>
		{#each protocols as p, i (p.id)}
			{@const showVersionCheck = p.version && p.source}
			<li class:has-version-check={showVersionCheck}>
				<!-- <button
					data-testid={i === 0 ? 'protocol-to-choose' : undefined}
					class:selected={p.id === currentProtocol?.id}
					onclick={() => {
						uiState.currentProtocolId = p.id;
						goto('#/import');
					}}
				>
					{p.name}
				</button> -->
				<ButtonSecondary
					testid={i === 0 ? 'protocol-to-choose' : undefined}
					onclick={() => {
						uiState.currentProtocolId = p.id;
						goto('#/import');
					}}
				>
					{#if p.id === currentProtocol?.id}
						<Tooltip text="Protocole sélectionné">
							<IconCheck />
						</Tooltip>
					{/if}

					{p.name}
				</ButtonSecondary>
				{#if showVersionCheck}
					<ButtonUpdateProtocol compact {...p} />
				{/if}
			</li>
		{/each}
	</ul>

	<section class="manage">
		<p>Le protocole que vous souhaitez n'est pas disponible?</p>
		<ButtonSecondary onclick={() => goto('#/protocols')}>
			<IconManage />
			Gérer les protocoles
		</ButtonSecondary>
		<ButtonSecondary
			onclick={async () => {
				const protocol = await promptAndImportProtocol({ allowMultiple: false }).catch((e) =>
					toasts.error(e)
				);
				if (!protocol || typeof protocol === 'string') return;
				toasts.success(`Protocole “${protocol.name}” importé et sélectionné`);
				uiState.currentProtocolId = protocol.id;
				goto('#/import');
			}}
		>
			<IconImport />
			Importer un protocole
		</ButtonSecondary>
	</section>
</div>

<style>
	.content {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		margin: 3rem auto;
		max-width: 400px;
		gap: 3rem;
	}

	h1 {
		display: flex;
		width: 100%;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		gap: 1rem;
		flex-direction: column;
		width: 100%;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		--width: 100%;
	}

	li.has-version-check {
		display: grid;
		grid-template-columns: 1fr min-content;
	}

	section.manage {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	section.manage p {
		color: var(--gay);
	}
</style>
