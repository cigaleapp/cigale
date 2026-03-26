<script lang="ts">
	import type * as DB from '$lib/database.js';

	import { fade } from 'svelte/transition';

	import IconAdd from '~icons/ri/add-line';
	import IconBack from '~icons/ri/arrow-left-s-fill';
	import IconRemote from '~icons/ri/cloud-line';
	import IconLocal from '~icons/ri/hard-drive-2-line';
	import IconImport from '~icons/ri/import-line';
	import { providers } from '$lib/accounts/registry.js';
	import AsyncEach from '$lib/AsyncEach.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Card from '$lib/Card.svelte';
	import Datetime from '$lib/Datetime.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { promptForFiles } from '$lib/files';
	import { errorMessage, plural } from '$lib/i18n.js';
	import { databaseHandle, set, tables } from '$lib/idb.svelte.js';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Logo from '$lib/Logo.svelte';
	import { resolveDefaults } from '$lib/metadata/defaults.js';
	import { goto } from '$lib/paths.js';
	import { defaultClassificationMetadata, defaultCropMetadata } from '$lib/protocols.js';
	import { importMore } from '$lib/queue.svelte';
	import RowAccount from '$lib/RowAccount.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { seo } from '$lib/seo.svelte';
	import { switchSession } from '$lib/sessions.js';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { orEmptyObj } from '$lib/utils.js';
	import { tooltip } from '$lib/tooltips.js';
	import { getSettings, setSetting } from '$lib/settings.svelte.js';

	seo({ title: 'Sessions' });

	const { data } = $props();
	const sessions = $derived(data.sessions);
	const db = $derived(databaseHandle());

	const defaultProtocol = $derived(tables.Protocol.state[0]);

	const sessionFolder = $derived(getSettings().sessionFolder)
	const provenance: 'local' | 'remote' = $derived(
		sessionFolder === "local" ? "local" : "remote"
	)
	const remoteAccount: DB.Account | undefined = $derived(
		sessionFolder === "local" ? undefined : tables.Account.getFromState(sessionFolder.remote)
	)
	const remoteAccountProvider  = $derived(remoteAccount? providers.get(remoteAccount.type):undefined)

	async function createSession() {
		if (!defaultProtocol) {
			toasts.error('Aucun protocole installé, impossible de créer une session.');
			return;
		}

		const classificationMetadata = defaultClassificationMetadata(
			defaultProtocol,
			tables.Metadata.state
		);

		const cropMetadata = defaultCropMetadata(defaultProtocol, tables.Metadata.state);

		const mtimeMetadata = defaultProtocol.exports?.images.mtime;

		const { id } = await tables.Session.add({
			name: `Session du ${Intl.DateTimeFormat().format(new Date())}`,
			description: '',
			protocol: defaultProtocol.id,
			createdAt: new Date().toISOString(),
			openedAt: new Date().toISOString(),
			metadata: {},
			fullscreenClassifier: {
				layout: 'top-bottom',
				...orEmptyObj(classificationMetadata !== undefined, {
					focusedMetadata: classificationMetadata?.id ?? '',
				}),
			},
			group: {
				global: { field: 'none' },
				crop: cropMetadata?.groupable
					? { field: 'metadataPresence', metadata: cropMetadata.id }
					: { field: 'none' },
				classify: classificationMetadata?.groupable
					? { field: 'metadataConfidence', metadata: classificationMetadata.id }
					: { field: 'none' },
			},
			sort: {
				global:
					mtimeMetadata && tables.Metadata.getFromState(mtimeMetadata)?.sortable
						? { field: 'metadataValue', direction: 'asc', metadata: mtimeMetadata }
						: { field: 'name', direction: 'asc' },
			},
		});

		await resolveDefaults({
			db: databaseHandle(),
			sessionId: id,
			metadataToConsider: defaultProtocol.metadata,
		});

		await switchSession(id);
		await goto('/(app)/sessions/[id]', { id });
	}
</script>

<main in:fade={{ duration: 100 }}>
	<header>
		<div class="line">
			<h1>Sessions</h1>
			<section class="actions">
				<ButtonSecondary
					onclick={async () => {
						const zipfile = await promptForFiles({
							accept: 'application/zip',
							multiple: false,
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
		</div>

		<section class="breadcrumbs">
			<ButtonInk
				onclick={() => {
					setSetting("sessionFolder", "local")
				}}
			>
				<IconLocal /> Local
			</ButtonInk>
			|
			{#if remoteAccount}
				<ButtonInk
					onclick={() => {
						setSetting("sessionFolder", {remote: "_"})
					}}
				>
					<IconBack /> Autres comptes
				</ButtonInk>
				/
				<div class="current-account">
					<div class="composite-avatar" use:tooltip={`${remoteAccount.username} sur ${remoteAccountProvider!.displayName}`}>
						<img
							class="avatar"
							src="https://cors.gwen.works/{remoteAccount.avatarURL.href}"
						/>
						<img
							src={remoteAccountProvider!.logoURL.href}
							alt=""
							class="provider-logo"
						/>
					</div>
					<span class="username">{remoteAccount.username}</span>
				</div>
			{:else}
				<ButtonInk
					onclick={() => {
						setSetting("sessionFolder", {remote:  "_"})
					}}
				>
					<IconRemote /> En ligne
				</ButtonInk>
			{/if}
		</section>
	</header>

	<section class="sessions">
		{#if provenance === 'local'}
			<div class="cards">
				{#each sessions as { createdAt, id, name, protocol, counts, thumbs } (id)}
					<Card
						--card-border={uiState.currentSessionId === id ? 'var(--bg-primary)' : ''}
						tooltip="Ouvrir la session"
						loading="Ouverture…"
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
									· <Datetime parts="date" show="absolute" value={createdAt} />
								</p>
							</header>
							<footer>
								<ButtonInk
									fills
									onclick={async (e) => {
										e.stopPropagation();
										await switchSession(id);
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
			</div>
		{:else if remoteAccount && typeof sessionFolder !== "string"}
			{@const provider = providers.get(remoteAccount.type)}
			{@const acct = provider.fromDatabase(db, remoteAccount)}
			<div class="cards">
				<AsyncEach items={() => acct.sessions({ mine: sessionFolder.mine })} key={(s) => s.id}>
					{#snippet children(session, _)}
						{@const protocol = tables.Protocol.getFromState(session.protocol)}
						<Card
							tooltip="Télécharger la session"
							loading="Téléchargement…"
							onclick={async (_, mutator) => {
								if (!protocol) return;
								if (!remoteAccount) return;
								const ses = await acct.session(protocol, session.id);

								mutator({ loading: 'Sauvegarde…' });
								const { id } = await tables.Session.add({
									account: remoteAccount.id,
									...ses,
								});

								let i = 0;
								for await (const file of acct.files(protocol, session.id)) {
									i++;

									mutator({
										loading: `Fichiers (${i}/${session.filesCount})…`,
									});
									await set('MetadataValueFile', {
										sessionId: id,
										...file,
									});
								}

								mutator({ loading: 'Ouverture…' });
								await switchSession(id);
								await goto('/(app)/sessions/[id]', { id });
							}}
						>
							<div class="content">
								<div class="gallery">
									{#if session.thumbnail}
										<img src={session.thumbnail.href} />
									{/if}
								</div>
								<header>
									<p class="protocol">
										{#if protocol}
											{protocol.name}
										{:else}
											<em class="unavailable">Protocole indisponible</em>
										{/if}
									</p>
									<h2>{session.name}</h2>
									<p class="date">
										{#if provider.capabilities.includes('images')}
											{plural(session.imagesCount, ['# image', '# images'])} ·
										{/if}
										<Datetime
											show="absolute"
											parts="date"
											value={session.submittedAt}
										/>
										{#if session.submittedBy}
											· par {session.submittedBy}
										{/if}
									</p>
								</header>

								{#if session.page}
									<footer>
										<ButtonInk
											fills
											onclick={(e) => {
												window.open(session.page, '_blank');
												e.stopPropagation();
											}}
										>
											Voir sur {provider.displayName}
										</ButtonInk>
									</footer>
								{/if}
							</div>
						</Card>
					{/snippet}
					{#snippet ghost()}
						<Card alwaysLoading loading="Chargement…">
							<!-- empty -->
						</Card>
					{/snippet}
					{#snippet loading()}
						<div class="error-screen" in:fade={{ duration: 500 }}>
							<LoadingSpinner --size="5rem" --stroke="3" />
							Chargement…
						</div>
					{/snippet}
					{#snippet empty()}
						<div class="error-screen" in:fade={{ duration: 300 }}>
							<Logo --size="5rem" variant="empty" />
							Aucune session
						</div>
					{/snippet}
					{#snippet error(e)}
						<div class="error-screen" in:fade={{ duration: 300 }}>
							<Logo --size="5rem" variant="error" />
							{errorMessage(e, 'Impossible de charger les sessions distantes')}
						</div>
					{/snippet}
				</AsyncEach>
			</div>
		{:else}
			<ul class="accounts">
				{#each tables.Account.state as account (account.id)}
					<RowAccount {account}>
						{#snippet action()}
							<ButtonSecondary
								onclick={() => {
									setSetting("sessionFolder", {remote: account.id})
								}}>
								Ouvrir
								</ButtonSecondary
							>
						{/snippet}
					</RowAccount>
				{:else}
					<li class="empty">
						Aucun compte
					</li>
				{/each}
				<li class="manage">
					<ButtonSecondary onclick={async () => 
						goto("/(app)/accounts")
					}>
					Gérer
					</ButtonSecondary>
				</li>
			</ul>
		{/if}
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
		flex-direction: column;
		margin-bottom: 2rem;

		.line {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 0.5rem;
		}

		.actions,
		.places {
			display: flex;
			align-items: center;
			gap: 1rem;
		}
	}

	section.sessions .cards {
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

	.accounts {
		padding: 0;
		margin: 7rem auto 0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;

		li {
			list-style: none;
		}

		:global li {
			margin: 0 auto;
		}

		li.manage {
			margin-top: 1.5rem;
		}
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 1em;

		> * {
			display: flex;
			align-items: center;
			gap: 0.5em;
		}
	}

	.composite-avatar {
		position: relative;
		font-size: 1.8em;
		.provider-logo {
			position: absolute;
			top: -0.125em;
			right: -0.125em;
			height: 0.6em;
			width: 0.6em;
			background-color: var(--bg-neutral);
			border-radius: var(--corner-radius);
		}

		.avatar {
			display: flex;
			justify-content: center;
			align-items: center;
			border-radius: 50%;
			height: 1em;
			width: 1em;
		}
	}

	.error-screen {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;
		text-align: center;
		min-height: 50vh;
	}
</style>
