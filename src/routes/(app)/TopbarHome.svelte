<script lang="ts">
	import Logo from '$lib/Logo.svelte';
	import ModalSubmitIssue from './ModalSubmitIssue.svelte';

	import Settings from './Settings.svelte';
	import TopbarContent from './TopbarContent.svelte';
</script>

<TopbarContent>
	{#snippet children(props)}
		<div class="title">
			<Logo />
			Cigale
		</div>
		<!-- Wrapper is because DropdownMenu creates another 0x0 element wrapper alongside its trigger... -->
		<div class="actions">
<ModalSubmitIssue type="bug" />

			<Settings {...props} />
		</div>
	{/snippet}
</TopbarContent>

<style>
	.title {
		display: flex;
		align-items: center;
		gap: 0.5rem;

		font-size: 1.1rem;
		text-transform: uppercase;
		letter-spacing: 0.125ch;
		font-weight: 200;
		/* font-family: var(--font-mono); */

		/* <Logo /> props */
		--size: 1.5em;
		--stroke-width: 4.2rem;
	}
</style>
