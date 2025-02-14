<script>
	let componentName = $state('');
</script>

<input type="text" bind:value={componentName} />

<a href="/_components/{componentName}">
	Aller à /_components/{componentName}
</a>
