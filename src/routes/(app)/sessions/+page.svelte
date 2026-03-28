<script lang="ts">
	import type { Account, AccountConstructor } from '$lib/accounts/types.js';

	import { SvelteMap } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	import IconAdd from '~icons/ri/add-line';
	import IconDropdown from '~icons/ri/arrow-down-s-fill';
	import IconLocal from '~icons/ri/hard-drive-2-line';
	import IconImport from '~icons/ri/import-line';
	import IconManage from '~icons/ri/settings-3-line';
	import { providers } from '$lib/accounts/registry.js';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import CompositeAvatar from '$lib/CompositeAvatar.svelte';
	import Datetime from '$lib/Datetime.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { promptForFiles } from '$lib/files';
	import { plural } from '$lib/i18n.js';
	import { databaseHandle, listByIndex, tables } from '$lib/idb.svelte.js';
	import { loadPreviewImage } from '$lib/images.js';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import LoadingText from '$lib/LoadingText.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto } from '$lib/paths.js';
	import { importMore } from '$lib/queue.svelte';
	import { seo } from '$lib/seo.svelte';
	import { switchSession } from '$lib/sessions.js';
	import { getSettings, isDebugMode, setSetting } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/state.svelte.js';
	import { nonnull } from '$lib/utils.js';

	import Cards from './Cards.svelte';
	import { createSession } from './create.js';
	import { downloadRemoteSession } from './download.js';

	seo({ title: 'Sessions' });

	const db = $derived(databaseHandle());
	const directory = $derived(getSettings().sessionsDirectory);
	const account = $derived.by(() => {
		if (!directory.account) return undefined;
		const databaseAccount = tables.Account.getFromState(directory.account);
		if (!databaseAccount) return undefined;
		return providers.fromDatabase(db, databaseAccount);
	});

	const sessionsCache = new SvelteMap<string, any[]>();

	defineKeyboardShortcuts('debugmode', {
		's d a y': {
			help: 'Supprimer toutes les sessions',
			debug: true,
			allowInModals: false,
			when: isDebugMode,
			async do() {
				await tables.Session.clear();
			},
		},
	});
</script>

<main in:fade={{ duration: 100 }}>
	<header>
		<div class="line">
			<section class="filters">
				<DropdownMenu
					items={[
						{
							items: [
								{
									type: 'selectable',
									label: "Sur l'appareil",
									key: 'local',
									selected: directory.platform === 'local',
									data: {
										special: 'local' as undefined | 'local' | 'manage',
										provider: undefined as undefined | AccountConstructor,
										account: undefined as undefined | Account,
									},
									onclick() {
										setSetting('sessionsDirectory', {
											...$state.snapshot(directory),
											platform: 'local',
											account: undefined,
											protocol: undefined,
										});
									},
								},
							],
						},
						...providers.list().map((provider) => ({
							label: provider.displayName,
							items: tables.Account.state
								.filter((account) => account.type === provider.id)
								.map((account) => ({
									type: 'selectable' as const,
									label: account.displayName,
									key: account.id,
									selected: directory.account === account.id,
									data: {
										special: undefined,
										provider,
										account: providers.fromDatabase(db, account),
									},
									onclick() {
										setSetting('sessionsDirectory', {
											...$state.snapshot(directory),
											platform: account.type,
											account: account.id,
											protocol: undefined,
										});
									},
								})),
						})),
						{
							label: 'Ajouter & supprimer',
							items: [
								{
									type: 'clickable',
									key: 'manage',
									label: 'Gérer les comptes',
									data: {
										special: 'manage',
										provider: undefined,
										account: undefined,
									},
									async onclick() {
										await goto('/(app)/accounts');
									},
								},
							],
						},
					]}
				>
					{#snippet trigger(props)}
						<ButtonSecondary {...props}>
							<div class="account-selection-item">
								{#if directory.platform === 'local'}
									<div class="icon">
										<IconLocal />
									</div>
									<span class="label">Sur l'appareil</span>
								{:else if account}
									{@const provider = providers.get(directory.platform)!}
									<div class="icon">
										<CompositeAvatar
											avatar={account.avatarURL}
											sublogo={provider.logoURL}
											tooltip="{account.username} sur {provider.displayName}"
										/>
									</div>
									<span class="label">
										<OverflowableText text={account.displayName} />
									</span>
								{/if}
								<div class="dropdown-arrow icon">
									<IconDropdown />
								</div>
							</div>
						</ButtonSecondary>
					{/snippet}

					{#snippet item({ provider, account, special }, { label })}
						<div class="account-selection-item taller">
							<div class="icon">
								{#if provider && account}
									<CompositeAvatar
										avatar={account.avatarURL}
										sublogo={provider.logoURL}
									/>
								{:else if special === 'local'}
									<IconLocal />
								{:else if special === 'manage'}
									<IconManage />
								{/if}
							</div>
							<span class="label">
								<OverflowableText text={label} />
							</span>
						</div>
					{/snippet}
				</DropdownMenu>
			</section>
			<section class="actions">
				<ButtonSecondary
					onclick={async () => {
						const zipfile = await promptForFiles({
							accept: 'application/zip',
							multiple: false,
						});
						await switchSession(null);
						importMore(zipfile);
						await goto('/(app)/(sidepanel)/import');
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
	</header>

	<section class="sessions">
		{#if directory.platform === 'local'}
			<div class="cards" in:fade={{ duration: 200 }}>
				<Cards
					sessions={async function* () {
						for (const session of tables.Session.state) {
							yield session;
						}
					}}
					card={(session) => ({
						highlighted: uiState.currentSessionId === session.id,
						tooltip: 'Ouvrir la session',
						loading: 'Ouverture…',
						async onclick() {
							await switchSession(session.id);
							await goto('/(app)/(sidepanel)/import');
						},
					})}
					thumbnails={async function* ({ id }) {
						const images = await listByIndex('Image', 'sessionId', id);

						const firstUniqueFileIds = [
							...new Set(images.map((image) => image.fileId).filter(nonnull)),
						].slice(0, 4);

						for (const fileId of firstUniqueFileIds) {
							if (uiState.hasPreviewURL(fileId)) {
								yield uiState.getPreviewURL(fileId)!;
								continue;
							}

							await loadPreviewImage(fileId, 'global');
							yield uiState.getPreviewURL(fileId)!;
						}
					}}
				>
					{#snippet subtitle({ id, createdAt })}
						<LoadingText
							mask="# images"
							value={async () =>
								listByIndex('Image', 'sessionId', id).then(
									(images) => images.length
								)}
						>
							{#snippet loaded(count)}
								{plural(count, ['# image', '# images'])}
							{/snippet}
						</LoadingText>
						· <Datetime parts="date" show="absolute" value={createdAt} />
					{/snippet}

					{#snippet actions({ id })}
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
					{/snippet}
				</Cards>
			</div>
		{:else if account}
			{#key directory}
				<div class="cards" in:fade={{ duration: 200 }}>
					<Cards
						cache={{
							key: `${directory.platform}:${directory.account}`,
							entries: sessionsCache,
						}}
						sessions={async function* () {
							for await (const session of account.sessions()) {
								if ('total' in session) {
									yield session;
									continue;
								}

								const local = tables.Session.state.find(s => s.remoteId === session.id)

								yield {
									...session,
									local,
									downloaded: Boolean(local), 
								};
							}
						}}
						thumbnails={async function* (session) {
							console.log(`fetching thumbs for ${session.name}`)
							if (!session.thumbnails.length) return;

							for (const thumb of session.thumbnails.slice(0, 4)) {
								const url =  await account.thumbnail(thumb);
								yield url.href
							}
						}}
						card={(session) => ({
							tooltip: isDebugMode() ? `id: ${session.id}; local: ${session.local?.id}` :  session.local ? 'Ouvrir' : 'Télécharger',
							loading: session.local ? 'Ouverture…' : 'Téléchargement…',
							highlighted: false,
							async onclick(_, mutator) {
								let id = session.local?.id;
								if (!session.local) {
									id = await downloadRemoteSession({
										account,
										session,
										mutator,
									});
								}
								await switchSession(id);
								await goto('/(app)/(sidepanel)/import');
							},
						})}
					>
						{#snippet subtitle({ submittedAt, imagesCount, submittedBy })}
							{#if providers.get(directory.platform)?.capabilities.includes('images')}
								{plural(imagesCount, ['# image', '# images'])}
								·
							{/if}
							<Datetime parts="date" show="absolute" value={submittedAt} />
							{#if submittedBy}
								· par {submittedBy}
							{/if}
						{/snippet}

						{#snippet actions({ page, id, local })}
							{#if page || local}
								<ButtonInk
									fills
									onclick={async (e) => {
										e.stopPropagation();
										if (local) {
											await switchSession(local.id);
											await goto('/(app)/sessions/[id]', local.id);
										} else {
											window.open(page, '_blank');
										}
									}}
								>
									{#if local}
										Gérer
									{:else}
										Voir sur {providers.get(directory.platform)!.displayName}
									{/if}
								</ButtonInk>
							{/if}
						{/snippet}
					</Cards>
				</div>
			{/key}
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

	.error-screen {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;
		text-align: center;
		min-height: 50vh;
	}

	.account-selection-item {
		display: flex;
		align-items: center;
		gap: 1em;

		&.taller {
			height: 2.3em;
		}

		.icon {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 1.5em;
			height: 1.5em;
		}

		.label {
			max-width: 20ch;
		}
	}
</style>
