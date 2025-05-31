<script>
	import { page } from '$app/state';
	import { seo } from '$lib/seo.svelte';

	seo({ title: `Protocole ${page.params.id}: Export` });
</script>
