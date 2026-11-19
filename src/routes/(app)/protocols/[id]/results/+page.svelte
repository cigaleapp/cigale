<script lang="ts">
	import Charts from '#lib/charts/Charts.svelte';
	import { tables } from '#lib/idb.svelte.js';
	import TopbarBack from '#routes/(app)/TopbarBack.svelte';
	import { page } from '$app/state';
</script>

<TopbarBack to="/protocols/">
	Résultats pour {tables.Protocol.getFromState(page.params.id!)?.name ?? '?'}
</TopbarBack>

<main class="graphs">
	<Charts scope="user" protocol={page.params.id!} />
</main>

<style>
	main {
		margin: 2rem;
	}
</style>
