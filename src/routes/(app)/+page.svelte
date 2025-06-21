<script>
	import { goto } from '$app/navigation';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { promptAndImportProtocol } from '$lib/protocols';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import Fuse from 'fuse.js';
	import { queryParam, ssp } from 'sveltekit-search-params';
	import IconCheck from '~icons/ph/check';
	import IconImport from '~icons/ph/download';
	import IconManage from '~icons/ph/gear';
	import IconSearch from '~icons/ph/magnifying-glass';

	seo({ title: 'Choisir un protocole' });

	const currentProtocol = $derived(
		tables.Protocol.state.find((p) => p.id === uiState.currentProtocolId)
	);

	const preselectedProtocol = queryParam('protocol');
	const preselectedClassificationModel = queryParam('classificationModel', ssp.number());
	const preselectedCropModel = queryParam('cropModel', ssp.number());

	$effect(() => {
		if ($preselectedProtocol) {
			uiState.currentProtocolId = $preselectedProtocol;
			$preselectedProtocol = null;
		}
		if ($preselectedClassificationModel !== null) {
			uiState.selectedClassificationModel = $preselectedClassificationModel;
			$preselectedClassificationModel = null;
		}
		if ($preselectedCropModel !== null) {
			uiState.selectedCropModel = $preselectedCropModel;
			$preselectedCropModel = null;
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
			{ key: -1, label: 'Aucune inférence' },
			...models.map(({ model, name }, key) => {
				const url = typeof model === 'string' ? model : model.url;
				return { key, label: name ?? url };
			})
		];
	}
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
					{#if uiState.classificationModels.length > 0}
						<div class="model-select">
							<p>
								Modèle d'inférence pour {tables.Metadata.state.find(
									(m) => m.id === uiState.classificationMetadataId
								)?.label ?? 'classification'}
							</p>
							<RadioButtons
								value={uiState.selectedClassificationModel}
								onchange={(value) => {
									uiState.selectedClassificationModel = value ?? 0;
								}}
								options={radioOptions(uiState.classificationModels)}
							/>
						</div>
					{/if}
					{#if uiState.cropModels.length > 0}
						<div class="model-select">
							<p>Modèle d'inférence pour la détection</p>
							<RadioButtons
								value={uiState.selectedCropModel}
								onchange={(value) => {
									uiState.selectedCropModel = value ?? 0;
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
