<script>
	import { afterNavigate } from '$app/navigation';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import HighlightHostname from '$lib/HighlightHostname.svelte';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';

	import { goto } from '$lib/paths.js';
	import { promptAndImportProtocol } from '$lib/protocols';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import Fuse from 'fuse.js';
	import { queryParameters, ssp } from 'sveltekit-search-params';
	import IconCheck from '~icons/ph/check';
	import IconManage from '~icons/ph/gear';
	import IconSearch from '~icons/ph/magnifying-glass';
	import IconImport from '~icons/ph/upload-simple';

	const { data } = $props();

	seo({ title: 'Choisir un protocole' });

	const currentProtocol = $derived(
		tables.Protocol.state.find((p) => p.id === uiState.currentProtocolId)
	);

	let importingPreselectedProtocol = $state(false);
	const numberToIndex = {
		encode: (/** @type {unknown} */ v) => (v === null ? undefined : (Number(v) + 1).toString()),
		decode: (/** @type {unknown} */ v) => (v === null ? null : Number(v) - 1)
	};
	const preselection = queryParameters({
		protocol: ssp.string(),
		classificationModel: numberToIndex,
		cropModel: numberToIndex
	});

	let openImportRemoteProtocol = $state();
	const preselectedProtocolIsRemote = $derived(
		Boolean(preselection.protocol?.startsWith('https:') && URL.canParse(preselection.protocol))
	);

	afterNavigate(() => {
		if (preselectedProtocolIsRemote && openImportRemoteProtocol && !importingPreselectedProtocol) {
			openImportRemoteProtocol();
		}
	});

	$effect(() => {
		if (preselectedProtocolIsRemote) return;
		if (preselection.protocol) {
			uiState.setCurrentProtocolId(preselection.protocol);
			preselection.protocol = null;
		}

		void uiState
			.setModelSelections({
				classification: preselection.classificationModel,
				crop: preselection.cropModel
			})
			.then(() => {
				if (preselection.classificationModel !== null) preselection.classificationModel = null;
				if (preselection.cropModel !== null) preselection.cropModel = null;
			});
	});

	let searchQuery = $state('');
	const searcher = $derived(
		new Fuse(tables.Protocol.state, {
			keys: ['name', 'id']
		})
	);

	const protocols = $derived(
		searchQuery ? searcher.search(searchQuery).map((r) => r.item) : tables.Protocol.state
	);

	/**
	 * @param {typeof uiState.classificationModels | typeof uiState.cropModels} models
	 */
	function radioOptions(models) {
		return [
			{ key: -1, label: 'Aucune inférence' },
			...models.map(({ model, name }, key) => {
				const url = typeof model === 'string' ? model : model.url;
				return { key, label: name ?? url };
			})
		];
	}
</script>

<ModalConfirm
	title="Importer le protocole distant ?"
	key="modal_import_remote_protocol"
	confirm="Importer"
	bind:open={openImportRemoteProtocol}
	oncancel={() => {
		preselection.protocol = null;
	}}
	onconfirm={async () => {
		if (!preselection.protocol) return;
		importingPreselectedProtocol = true;
		const raw = await fetch(preselection.protocol)
			.then((res) => res.text())
			.catch((e) => {
				toasts.error(`Erreur lors de l'import du protocole distant: ${e}`);
				return null;
			});

		if (!raw) return;

		try {
			const { id } = await data.swarpc.importProtocol({ contents: raw });
			await tables.Protocol.refresh();
			await tables.Metadata.refresh();

			uiState.setCurrentProtocolId(id);
			preselection.protocol = null;
		} catch (error) {
			toasts.error(`Erreur lors de l'import du protocole distant: ${error}`);
		} finally {
			importingPreselectedProtocol = false;
		}
	}}
>
	Ce lien pointe vers un protocole distant. Voulez-vous l'importer? Il se trouve à l'adresse
	suivante:

	{#if preselection.protocol && preselectedProtocolIsRemote}
		<HighlightHostname linkify url={preselection.protocol} />
	{/if}

	<section class="modal-import-loading">
		{#if importingPreselectedProtocol}
			<p>Importation en cours...</p>
		{/if}
	</section>
</ModalConfirm>

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
				<div class="select-and-version">
					<ButtonSecondary
						testid={i === 0 ? 'protocol-to-choose' : undefined}
						aria-pressed={p.id === uiState.currentProtocolId}
						onclick={async () => {
							if (p.id === currentProtocol?.id) {
								await goto('/(app)/(sidepanel)/import');
							} else {
								uiState.setCurrentProtocolId(p.id);
							}

							preselection.protocol = null;
							preselection.classificationModel = null;
							preselection.cropModel = null;
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
				</div>
				{#if p.id === uiState.currentProtocolId}
					{#if uiState.classificationModels.length > 0 && uiState.classificationMetadataId}
						{@const classificationMetadata = tables.Metadata.getFromState(
							uiState.classificationMetadataId
						)}
						<div class="model-select">
							<RadioButtons
								label="Modèle d'inférence pour {classificationMetadata?.label}"
								value={uiState.selectedClassificationModel}
								onchange={async (value) => {
									await uiState.setModelSelections({ classification: value ?? 0 });
								}}
								options={radioOptions(uiState.classificationModels)}
							/>
						</div>
					{/if}
					{#if uiState.cropModels.length > 0}
						<div class="model-select">
							<RadioButtons
								label="Modèle d'inférence pour la détection"
								value={uiState.selectedCropModel}
								onchange={async (value) => {
									await uiState.setModelSelections({ crop: value ?? 0 });
								}}
								options={radioOptions(uiState.cropModels)}
							/>
						</div>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>

	<section class="manage">
		<p>Le protocole que vous souhaitez n'est pas disponible?</p>
		<ButtonSecondary onclick={() => goto('/protocols')}>
			<IconManage />
			Gérer les protocoles
		</ButtonSecondary>
		<ButtonSecondary
			loading
			onclick={async (_, signals) => {
				const protocol = await promptAndImportProtocol({
					allowMultiple: false,
					onInput: signals.loadingStarted,
					importProtocol: data.swarpc.importProtocol
				}).catch((e) => toasts.error(e));
				if (!protocol || typeof protocol === 'string') return;
				toasts.success(`Protocole "${protocol.name}" importé et sélectionné`);
				uiState.setCurrentProtocolId(protocol.id);
				goto('/import');
			}}
		>
			{#snippet children({ loading })}
				{#if !loading}
					<IconImport />
				{/if}

				Importer un protocole
			{/snippet}
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
		width: min(400px, 100%);
		gap: 3rem;
	}

	.modal-import-loading {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 3rem;
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

	li.search {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	li .select-and-version {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		--width: 100%;
	}

	li .model-select {
		margin-top: 0.5rem;
	}

	section.manage {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	section.manage p {
		color: var(--gay);
	}
</style>
