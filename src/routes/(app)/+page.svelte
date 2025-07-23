<script>
	import { afterNavigate, goto } from '$app/navigation';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { promptAndImportProtocol } from '$lib/protocols';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import Fuse from 'fuse.js';
	import { queryParam, ssp } from 'sveltekit-search-params';
	import IconCheck from '~icons/ph/check';
	import IconImport from '~icons/ph/upload-simple';
	import IconManage from '~icons/ph/gear';
	import IconSearch from '~icons/ph/magnifying-glass';
	import { m } from '$lib/simple-messages.js';

	const { data } = $props();

	seo({ title: 'Choisir un protocole' });

	const currentProtocol = $derived(
		tables.Protocol.state.find((p) => p.id === uiState.currentProtocolId)
	);

	let importingPreselectedProtocol = $state(false);
	const preselectedProtocol = queryParam('protocol');
	const preselectedClassificationModel = queryParam('classificationModel', ssp.number());
	const preselectedCropModel = queryParam('cropModel', ssp.number());

	let openImportRemoteProtocol = $state();
	const preselectedProtocolIsRemote = $derived(
		$preselectedProtocol &&
			$preselectedProtocol.startsWith('https:') &&
			URL.canParse($preselectedProtocol)
	);

	afterNavigate(() => {
		if (preselectedProtocolIsRemote && openImportRemoteProtocol && !importingPreselectedProtocol) {
			openImportRemoteProtocol();
		}
	});

	$effect(() => {
		if (preselectedProtocolIsRemote) return;
		if ($preselectedProtocol) {
			uiState.currentProtocolId = $preselectedProtocol;
			$preselectedProtocol = null;
		}
		if ($preselectedClassificationModel !== null) {
			void uiState.setSelectedClassificationModel($preselectedClassificationModel).then(() => {
				$preselectedClassificationModel = null;
			});
		}
		if ($preselectedCropModel !== null) {
			void uiState.setSelectedCropModel($preselectedCropModel).then(() => {
				$preselectedCropModel = null;
			});
		}
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
			{ key: -1, label: m.no_inference() },
			...models.map(({ model, name }, key) => {
				const url = typeof model === 'string' ? model : model.url;
				return { key, label: name ?? url };
			})
		];
	}
</script>

<ModalConfirm
	title="Importer le protocole distant?"
	key="modal_import_remote_protocol"
	confirm="Importer"
	bind:open={openImportRemoteProtocol}
	oncancel={() => {
		$preselectedProtocol = null;
	}}
	onconfirm={async () => {
		if (!$preselectedProtocol) return;
		importingPreselectedProtocol = true;
		const raw = await fetch($preselectedProtocol)
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

			uiState.currentProtocolId = id;
			$preselectedProtocol = null;
		} catch (error) {
			toasts.error(`Erreur lors de l'import du protocole distant: ${error}`);
		} finally {
			importingPreselectedProtocol = false;
		}
	}}
>
	{m.remote_protocol_import_confirm()}
	suivante:

	{#if $preselectedProtocol && preselectedProtocolIsRemote}
		<a href={$preselectedProtocol}>
			{@render highlightHostname($preselectedProtocol)}
		</a>
	{/if}

	<section class="modal-import-loading">
		{#if importingPreselectedProtocol}
			<p>Importation en cours...</p>
		{/if}
	</section>

	{#snippet highlightHostname(/** @type {string} */ url)}
		{url.split(new URL(url).hostname, 2)[0]}
		<strong>{new URL(url).hostname}</strong>
		{url.split(new URL(url).hostname, 2)[1]}
	{/snippet}
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
						onclick={async () => {
							uiState.currentProtocolId = p.id;
							$preselectedProtocol = null;
							$preselectedClassificationModel = null;
							$preselectedCropModel = null;
							await goto('#/import');
						}}
					>
						{#if p.id === currentProtocol?.id}
							<Tooltip text={m.selected_protocol()}>
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
					{#if uiState.classificationModels.length > 0}
						<div class="model-select">
							<p>
								{m.inference_model_for({
									target:
										tables.Metadata.state.find((m) => m.id === uiState.classificationMetadataId)
											?.label ?? 'classification'
								})}
							</p>
							<RadioButtons
								value={uiState.selectedClassificationModel}
								onchange={async (value) => {
									await uiState.setSelectedClassificationModel(value ?? 0);
								}}
								options={radioOptions(uiState.classificationModels)}
							/>
						</div>
					{/if}
					{#if uiState.cropModels.length > 0}
						<div class="model-select">
							<p>{m.inference_model_for_detection()}</p>
							<RadioButtons
								value={uiState.selectedCropModel}
								onchange={async (value) => {
									await uiState.setSelectedCropModel(value ?? 0);
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
		<ButtonSecondary onclick={() => goto('#/protocols')}>
			<IconManage />
			{m.manage_protocols()}
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
				toasts.success(m.protocol_imported_and_selected({ protocolName: protocol.name }));
				uiState.currentProtocolId = protocol.id;
				goto('#/import');
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
		max-width: 400px;
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

	li .model-select p {
		margin-bottom: 0.25rem;
		color: var(--gay);
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
