<script lang="ts">
	const {data} = $props()
</script>

<ul>
	{#each data.accounts as account (account.id)}
	<li>
		<img src={account.avatarURL.href} />
		{account.displayName}
	</li>
	{/each}
</ul>
