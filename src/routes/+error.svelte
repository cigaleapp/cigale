<script>
	import { page } from '$app/state';
	import Logo from '$lib/Logo.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import IconReset from '~icons/ph/arrows-counter-clockwise-light';
	import { nukeDatabase } from '$lib/idb.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import { goto } from '$app/navigation';
</script>

<main>
	<Logo --size="6em" variant="error" />
	<section class="notfound">
		{#if page.status === 404}
			<ButtonPrimary
				onclick={() => {
					goto('#/');
				}}
			>
				Accueil
			</ButtonPrimary>
		{/if}
	</section>

	<section class="troubleshoot">
		<p>
			<code>HTTP {page.status}</code>
			<br />
			<code class="message">
				{page.error?.message ?? '<No diagonstic>'}
			</code>
		</p>
		{#if page.status !== 404}
			<ButtonInk
				help="ATTENTION: SUPPRIME TOUTES VOS DONNÉES"
				onclick={async () => {
					nukeDatabase();
					window.location.reload();
				}}
			>
				<div class="icon">
					<IconReset />
				</div>

				Réinitialiser la base de données
			</ButtonInk>
		{/if}
	</section>
</main>

<style>
	main {
		display: flex;
		height: 100vh;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.notfound {
		margin-top: 1.5rem;
	}

	.troubleshoot {
		position: fixed;
		bottom: 0;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.icon {
		font-size: 1.5em;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
