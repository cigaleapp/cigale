<script>
	import { afterNavigate } from '$app/navigation';
	import HighlightHostname from '$lib/HighlightHostname.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { queryParameters, ssp } from 'sveltekit-search-params';

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
		if (
			preselectedProtocolIsRemote &&
			openImportRemoteProtocol &&
			!importingPreselectedProtocol
		) {
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
				if (preselection.classificationModel !== null)
					preselection.classificationModel = null;
				if (preselection.cropModel !== null) preselection.cropModel = null;
			});
	});
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

<style>
	.modal-import-loading {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 3rem;
	}
</style>
