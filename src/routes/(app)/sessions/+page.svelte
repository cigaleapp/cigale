<script lang="ts">
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
	import { switchSession } from '$lib/sessions.js';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';

	seo({ title: 'Sessions' });

	const { data } = $props();
	const sessions = $derived(data.sessions);

	const defaultProtocol = $derived(tables.Protocol.state[0]);

	async function createSession() {
		if (!defaultProtocol) {
			toasts.error('Aucun protocole installé, impossible de créer une session.');
			return;
		}

		const { id } = await tables.Session.add({
			name: `Session du ${Intl.DateTimeFormat().format(new Date())}`,
			description: '',
			protocol: tables.Protocol.state[0]?.id,
			createdAt: new Date().toISOString(),
			openedAt: new Date().toISOString(),
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

					await switchSession(null);
					importMore(zipfile);
					await goto('/import');
				}}
			>
				<IconImport />
				Importer un export .zip
			</ButtonSecondary>
			<ButtonSecondary
				testid="new-session"
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
		{#each sessions as { createdAt, id, name, protocol, counts, thumbs } (id)}
			<Card
				--card-border={uiState.currentSessionId === id ? 'var(--bg-primary)' : ''}
				tooltip="Ouvrir la session"
				onclick={async () => {
					await switchSession(id);
					// TODO remember last viewed page in session
					await goto('/import');
				}}
			>
				<div class="content">
					<div class="gallery">
						{#each thumbs as src (src)}
							<img {src} />
						{/each}
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
							{plural(counts.images, ['# image', '# images'])}
							· créée <Datetime show="relative" value={createdAt} />
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
				testid="new-session-card"
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
		max-width: 1200px;
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
		grid-template-rows: 3fr max-content 50px;
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

	.content .gallery {
		display: flex;
		gap: 0.5rem;
		padding: 1rem 1rem 0;
		height: 100%;
		overflow: hidden;

		img {
			border-radius: var(--corner-radius);
		}
	}

	.content header {
		padding: 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5em;

		h2 {
			line-height: 1;
		}

		.protocol,
		.date {
			color: var(--gay);
		}
	}

	.content footer {
		display: flex;
		justify-content: center;
		flex-grow: 0;
	}
</style>
