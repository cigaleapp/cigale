<script>
	import { fade } from 'svelte/transition';

	import IconAdd from '~icons/ri/add-line';
	import IconImport from '~icons/ri/import-line';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Card from '$lib/Card.svelte';
	import Datetime from '$lib/Datetime.svelte';
	import { promptForFiles } from '$lib/files';
	import { plural } from '$lib/i18n.js';
	import { tables } from '$lib/idb.svelte.js';
	import { goto } from '$lib/paths.js';
	import { importMore } from '$lib/queue.svelte';
	import { seo } from '$lib/seo.svelte';
	import { imagesOfSession, observationsOfSession } from '$lib/sessions.js';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { compareBy } from '$lib/utils';

	seo({ title: 'Sessions' });

	const defaultProtocol = $derived(tables.Protocol.state[0]);

	async function createSession() {
		if (!defaultProtocol) {
			toasts.error('Aucun protocole installé, impossible de créer une session.');
			return;
		}

		const { id } = await tables.Session.add({
			name: `Session du ${Intl.DateTimeFormat().format(new Date())}`,
			description: defaultProtocol.id,
			protocol: tables.Protocol.state[0]?.id,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			metadata: {}
		});

		await goto('/(app)/sessions/[id]', { id });
	}
</script>

<main in:fade={{ duration: 100 }}>
	<header>
		<h1>Sessions</h1>
		<section class="actions">
			<ButtonSecondary
				onclick={async () => {
					const zipfile = await promptForFiles({
						accept: 'application/zip',
						multiple: false
					});

					await uiState.setCurrentSessionId(null);
					importMore(zipfile);
					await goto('/import');
				}}
			>
				<IconImport />
				Importer un export .zip
			</ButtonSecondary>
			<ButtonSecondary
				onclick={async () => {
					await createSession();
				}}
			>
				<IconAdd />
				Nouvelle session
			</ButtonSecondary>
		</section>
	</header>

	<section class="sessions">
		{#each tables.Session.state
			.toSorted(compareBy('updatedAt'))
			.toReversed() as { createdAt, id, name, protocol: protocolId } (id)}
			{@const protocol = tables.Protocol.getFromState(protocolId)}
			<Card
				--card-border={uiState.currentSessionId === id ? 'var(--bg-primary)' : ''}
				tooltip="Ouvrir la session"
				onclick={async () => {
					await uiState.setCurrentSessionId(id);
					// TODO remember last viewed page in session
					await goto('/import');
				}}
			>
				<div class="content">
					<div class="gallery">
						<!-- TODO -->
					</div>
					<header>
						<p class="protocol">
							{#if protocol}
								{protocol.name}
							{:else}
								<em class="unavailable">Protocole indisponible</em>
							{/if}
						</p>
						<h2>{name}</h2>
						<p class="date">
							Créé <Datetime show="relative" value={createdAt} />
						</p>
						<p class="counts">
							{#await observationsOfSession(id) then obs}
								{plural(obs.length, ['# observation', '# observations'])}
							{/await} · {#await imagesOfSession(id) then images}
								{plural(images.length, ['# image', '# images'])}
							{/await}
						</p>
					</header>
					<footer>
						<ButtonInk
							fills
							onclick={async (e) => {
								e.stopPropagation();
								await goto('/(app)/sessions/[id]', { id });
							}}
						>
							Gérer
						</ButtonInk>
					</footer>
				</div>
			</Card>
		{:else}
			<Card
				tooltip="Créer une nouvelle session"
				onclick={async () => {
					await createSession();
				}}
			>
				<div class="content new">
					<IconAdd />
				</div>
			</Card>
		{/each}
	</section>
</main>

<style>
	main {
		width: 100%;
		max-width: 1000px;
		margin: 0 auto;
	}

	main > header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;

		.actions {
			display: flex;
			align-items: center;
			gap: 1rem;
		}
	}

	section.sessions {
		display: grid;
		/* flex-wrap: wrap; */
		grid-template-columns: repeat(auto-fit, var(--card-width));
		justify-content: center;
		gap: 1rem;
		padding: 1rem;

		--card-height: 250px;
		--card-width: 350px;
		--card-padding: 0;
	}

	.content {
		display: grid;
		grid-template-rows: 2fr max-content minmax(3rem, 1fr);
		grid-template-columns: 100%;
		gap: 1rem;
		width: 100%;
		height: 100%;
		position: relative;
	}

	.content.new {
		place-items: center;
		grid-template-rows: 1fr;
		font-size: 3rem;
	}

	.content header {
		padding: 0 1rem;
	}

	.content footer {
		display: flex;
		justify-content: center;
		flex-grow: 0;
	}
</style>
