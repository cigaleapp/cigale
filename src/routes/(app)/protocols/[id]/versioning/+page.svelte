<script>
	import { tables } from '$lib/idb.svelte.js';
	import FieldUrl from '$lib/FieldURL.svelte';

	const { data } = $props();
	let source = $derived(typeof data.source === 'string' ? data.source : data.source?.url);
</script>

<FieldUrl
	label="URL de téléchargement du protocole"
	value={source}
	onblur={async (newSource) => {
		source = newSource;
		await tables.Protocol.update(
			data.id,
			'source',
			typeof data.source === 'string' ? newSource : { ...data.source, url: newSource }
		);
	}}
/>
