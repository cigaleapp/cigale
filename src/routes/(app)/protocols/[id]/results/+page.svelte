<script lang="ts">
	import { page } from '$app/state';
	import Charts from '$lib/charts/Charts.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import TopbarBack from '$routes/(app)/TopbarBack.svelte';
</script>

<TopbarBack to="/protocols/">
	Résultats pour {tables.Protocol.getFromState(page.params.id!)?.name ?? '?'}
</TopbarBack>

<section class="graphs">
	<Charts scope="user" protocol={page.params.id!} />
</section>
