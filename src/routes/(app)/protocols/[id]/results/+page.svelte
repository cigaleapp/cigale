<script lang="ts">
	import { page } from '$app/state';
	import Charts from '$lib/charts/Charts.svelte';
</script>

<section class="graphs">
	<Charts scope="user" protocol={page.params.id!} />
</section>
