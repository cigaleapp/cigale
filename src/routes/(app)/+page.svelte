<script>
	import { afterNavigate } from '$app/navigation';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { type } from 'arktype';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { goto } from '$lib/paths.js';
	import { promptAndImportProtocol } from '$lib/protocols';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import { seo } from '$lib/seo.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import Fuse from 'fuse.js';
	import { useSearchParams } from 'runed/kit';
	import IconCheck from '~icons/ph/check';
	import IconManage from '~icons/ph/gear';
	import IconSearch from '~icons/ph/magnifying-glass';
	import IconImport from '~icons/ph/upload-simple';

	const { data } = $props();

	seo({ title: m.choose_protocol() });

	const currentProtocol = $derived(
		tables.Protocol.state.find((p) => p.id === uiState.currentProtocolId)
	);

	let importingPreselectedProtocol = $state(false);

	const preselection = useSearchParams(
		type({
			protocol: 'string = ""',
			classificationModel: 'number = -1',
			cropModel: 'number = -1'
		}),
		{
			updateURL: true,
			pushHistory: false
		}
	);

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
			preselection.protocol = '';
		}

		// URL params are 1-based, internal state is 0-based
		// In Search params, -1 means "don't change", 0 means "no inference"
		const toIndex = (/** @type {number} */ n) => (n === -1 ? null : n - 1);

		void uiState
			.setModelSelections({
				classification: toIndex(preselection.classificationModel),
				crop: toIndex(preselection.cropModel)
			})
			.then(() => {
				if (preselection.classificationModel !== -1) preselection.classificationModel = -1;
				if (preselection.cropModel !== -1) preselection.cropModel = -1;
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
			{ key: -1, label: m.no_inference() },
			...models.map(({ model, name }, key) => {
				const url = typeof model === 'string' ? model : model.url;
				return { key, label: name ?? url };
			})
		];
	}
</script>

<ModalConfirm
	title={m.import_remote_protocol_title()}
	key="modal_import_remote_protocol"
	confirm={m.import()}
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
				toasts.error(m.error_importing_remote_protocol({ error: e }));
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
			toasts.error(m.error_importing_remote_protocol({ error }));
		} finally {
			importingPreselectedProtocol = false;
		}
	}}
>
	{m.remote_protocol_import_confirm_following()}

	{#if preselection.protocol && preselectedProtocolIsRemote}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={preselection.protocol}>
			{@render highlightHostname(preselection.protocol)}
		</a>
	{/if}

	<section class="modal-import-loading">
		{#if importingPreselectedProtocol}
			<p>{m.importing_in_progress()}</p>
		{/if}
	</section>

	{#snippet highlightHostname(/** @type {string} */ url)}
		{url.split(new URL(url).hostname, 2)[0]}
		<strong>{new URL(url).hostname}</strong>
		{url.split(new URL(url).hostname, 2)[1]}
	{/snippet}
</ModalConfirm>

<div class="content">
	<h1>{m.choose_protocol()}</h1>

	<ul>
		<li class="search">
			<IconSearch />
			<InlineTextInput
				onblur={() => {}}
				label={m.search()}
				bind:value={searchQuery}
				placeholder={m.search_placeholder()}
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
							uiState.setCurrentProtocolId(p.id);
							preselection.protocol = null;
							preselection.classificationModel = null;
							preselection.cropModel = null;
							await goto('/import');
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
							<RadioButtons
								label={m.inference_model_for({
									target:
										tables.Metadata.state.find((m) => m.id === uiState.classificationMetadataId)
											?.label ?? 'classification'
								})}
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
								label={m.inference_model_for_detection()}
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
				uiState.setCurrentProtocolId(protocol.id);
				goto('/import');
			}}
		>
			{#snippet children({ loading })}
				{#if !loading}
					<IconImport />
				{/if}

				{m.import_protocol()}
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

	section.manage {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	section.manage p {
		color: var(--gay);
	}
</style>
