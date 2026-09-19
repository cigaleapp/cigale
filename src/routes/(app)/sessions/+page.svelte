<script lang="ts">
	import type { Account, AccountConstructor } from '$lib/accounts/types.js';

	import { SvelteMap } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	import IconAdd from '~icons/ri/add-line';
	import IconFilterAll from '~icons/ri/apps-2-line';
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
	import { countByIndex, databaseHandle, listByIndex, tables } from '$lib/idb.svelte.js';
	import { loadPreviewImage } from '$lib/images.js';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import LoadingText from '$lib/LoadingText.svelte';
	import Logo from '$lib/Logo.svelte';
	import ModalPickProtocol from '$lib/ModalPickProtocol.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto } from '$lib/paths.js';
	import { importMore } from '$lib/queue.svelte';
	import { seo } from '$lib/seo.svelte';
	import { switchSession } from '$lib/sessions.js';
	import { getSettings, isDebugMode, setSetting } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { nonnull } from '$lib/utils.js';

	import TopbarHome from '../TopbarHome.svelte';
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

<TopbarHome />

<ModalPickProtocol />

<main in:fade={{ duration: 100 }}>
	<header>
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
						<div class="filter-option button">
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
					<div class="filter-option">
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

			<DropdownMenu
				items={[
					{
						label: 'Filtrer par protocole',
						items: [
							{
								type: 'selectable' as const,
								selected: !directory.protocol,
								label: 'Tous',
								key: 'all',
								data: null,
								onclick() {
									setSetting('sessionsDirectory', {
										...$state.snapshot(directory),
										protocol: undefined,
									});
								},
							},
							...tables.Protocol.state
								.filter(
									(protocol) =>
										providers
											.get(directory.platform)
											?.compatibleWith(protocol) ?? true
								)
								.map((protocol) => ({
									type: 'selectable' as const,
									selected: directory.protocol === protocol.id,
									label: protocol.name,
									key: protocol.id,
									data: protocol,

									onclick() {
										setSetting('sessionsDirectory', {
											...$state.snapshot(directory),
											protocol: protocol.id,
										});
									},
								})),
						],
					},
				]}
			>
				{#snippet trigger(props)}
					<ButtonSecondary {...props}>
						<div class="filter-option button">
							{const protocol = $derived(
								tables.Protocol.getFromState(directory.protocol ?? '')
							)}
							<div class="icon">
								{#if !protocol}
									<IconFilterAll />
								{:else if protocol.logo}
									<CompositeAvatar avatar={protocol.logo} sublogo={undefined} />
								{:else}
									<Logo variant="empty" />
								{/if}
							</div>
							<div class="label">
								{#if protocol}
									{protocol.name}
								{:else}
									<span class="filter-not-filtering">Tous</span>
								{/if}
							</div>
							<div class="dropdown-arrow icon">
								<IconDropdown />
							</div>
						</div>
					</ButtonSecondary>
				{/snippet}
				{#snippet item(protocol, { label })}
					<div class="filter-option">
						<div class="icon">
							{#if !protocol}
								<IconFilterAll />
							{:else if protocol.logo}
								<CompositeAvatar avatar={protocol.logo} sublogo={undefined} />
							{:else}
								<Logo variant="empty" />
							{/if}
						</div>
						<span class="label">
							<OverflowableText text={label} />
						</span>
					</div>
				{/snippet}
			</DropdownMenu>
		</section>
		<!-- TODO: allow creating sessions remotely for platforms that support uploading ? -->
		{#if directory.platform === 'local'}
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
					Importer .zip
				</ButtonSecondary>
				<ButtonSecondary
					testid="new-session"
					onclick={async () => {
						await createSession();
					}}
				>
					<IconAdd />
					Créer
				</ButtonSecondary>
			</section>
		{/if}
	</header>

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
		width: 100%;
		margin: 0 auto;
		height: 100%;
		display: grid;
		grid-template-rows: max-content 1fr;
	}

	section.sessions .cards,
	main > header {
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
	}

	section.sessions {
		overflow-y: auto;
	}

	main > header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
		gap: 1rem;
		flex-wrap: wrap;

		.actions,
		.filters {
			display: flex;
			align-items: center;
			gap: 1rem;
		}

		@media (max-width: 600px) {
			justify-content: center;
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

	.filter-option {
		display: flex;
		align-items: center;
		gap: 1em;

		&:not(.button) {
			height: 2.3em;
		}

		.icon {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 1.5em;
			height: 1.5em;

			/* For fallback logo on protocols */
			--stroke-width: 250px;
		}

		.filter-not-filtering {
			color: var(--gay);
		}

		.label {
			overflow: hidden;
			text-overflow: ellipsis;
			text-wrap: nowrap;
			text-align: left;
		}

		&:not(.button) .label {
			max-width: 20ch;
		}

		&.button .label {
			width: 12ch;
		}
	}
</style>
