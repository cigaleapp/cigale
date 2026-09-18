<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	import IconAdd from '~icons/ri/add-line';
	import { providers } from '$lib/accounts/registry.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import Datetime from '$lib/Datetime.svelte';
	import { plural } from '$lib/i18n.js';
	import { countByIndex, databaseHandle, listByIndex, tables } from '$lib/idb.svelte.js';
	import { loadPreviewImage } from '$lib/images.js';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import LoadingText from '$lib/LoadingText.svelte';
	import { IsMobile } from '$lib/mobile.svelte.js';
	import { goto } from '$lib/paths.js';
	import { seo } from '$lib/seo.svelte';
	import { switchSession } from '$lib/sessions.js';
	import { getSettings, isDebugMode } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { nonnull } from '$lib/utils.js';

	import TopbarHome from '../TopbarHome.svelte';
	import Cards from './Cards.svelte';
	import { createSession } from './create.js';
	import { downloadRemoteSession } from './download.js';
	import HeaderDesktop from './Header.svelte';

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

	const mobile = new IsMobile();

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

<TopbarHome>
	{#snippet otherActions()}
		{#if mobile.current}
			<ButtonIcon help="Créer une session" onclick={createSession}>
				<IconAdd />
			</ButtonIcon>
		{/if}
	{/snippet}
</TopbarHome>

<main in:fade={{ duration: 100 }}>
	<!-- {#if mobile.current}
		<HeaderMobile />
	{:else} -->
	<HeaderDesktop />
	<!-- {/if} -->

	<section class="sessions" data-scrollable="true">
		{#if directory.platform === 'local'}
			<div class="cards" in:fade={{ duration: 200 }}>
				<Cards
					create={createSession}
					sessions={tables.Session.state.filter(
						(ses) => !directory.protocol || ses.protocol === directory.protocol
					)}
					card={(session) => ({
						highlighted: uiState.currentSessionId === session.id,
						tooltip: 'Ouvrir la session',
						loading: 'Ouverture…',
						async onclick() {
							await switchSession(session.id);
							// Get number of images in the session to decide which tab to open on
							const imagesCount = await countByIndex(
								'Image',
								'sessionId',
								session.id
							);
							if (imagesCount > 0) {
								await goto('/(app)/(sidepanel)/import');
							} else {
								await goto('/(app)/sessions/[id]', session);
							}
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
						sessions={async function* (cursor: string | undefined) {
							for await (const session of account.sessions({
								cursor,
								protocol: directory.protocol,
							})) {
								if ('total' in session) {
									yield session;
									continue;
								}

								const local = tables.Session.state.find(
									(s) => s.remoteId === session.id
								);

								yield {
									...session,
									local,
									downloaded: Boolean(local),
								};
							}
						}}
						thumbnails={async function* (session) {
							if (!session.thumbnails.length) return;

							const yielded = new Set<string>();

							for (const thumb of session.thumbnails) {
								const url = await account.thumbnail(thumb);
								if (!yielded.has(thumb.href)) yield url.href;
								yielded.add(thumb.href);
								if (yielded.size >= 4) break;
							}
						}}
						card={(session) => ({
							tooltip: isDebugMode()
								? `id: ${session.id}; local: ${session.local?.id}`
								: session.local
									? 'Ouvrir'
									: 'Télécharger',
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
								if (!id) return;
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

						{#snippet actions({ page, local })}
							{#if page || local}
								<ButtonInk
									fills
									onclick={async (e) => {
										e.stopPropagation();
										if (local) {
											await switchSession(local.id);
											await goto('/(app)/sessions/[id]', local);
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
		display: grid;
		height: 100%;
		grid-template-rows: max-content 1fr;
		gap: 1rem;
		padding: 0 1.2rem;
	}

	section.sessions {
		overflow-y: auto;
		padding-bottom: 2rem;
	}

	section.sessions .cards {
		display: grid;
		/* flex-wrap: wrap; */
		grid-template-columns: repeat(auto-fit, var(--card-width));
		justify-content: center;
		gap: 1rem;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;

		--card-height: 250px;
		--card-width: calc(min(100%, 350px));
		--card-padding: 0;

		@media (max-content: 600px) {
			gap: 2rem;
		}
	}
</style>
