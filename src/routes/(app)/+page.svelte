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
	import { fade } from 'svelte/transition';
	import { queryParameters, ssp } from 'sveltekit-search-params';
	import IconCheck from '~icons/ri/check-line';
	import IconManage from '~icons/ri/settings-3-line';
	import IconSearch from '~icons/ri/search-line';
	import IconImport from '~icons/ri/upload-2-line';

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
