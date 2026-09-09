<script lang="ts">
	import type { Account, AccountConstructor } from '$lib/accounts/types.js';

	import IconAdd from '~icons/ri/add-line';
	import IconFilterAll from '~icons/ri/apps-2-line';
	import IconDropdown from '~icons/ri/arrow-down-s-fill';
	import IconLocal from '~icons/ri/hard-drive-2-line';
	import IconImport from '~icons/ri/import-line';
	import IconManage from '~icons/ri/settings-3-line';
	import { providers } from '$lib/accounts/registry.js';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import CompositeAvatar from '$lib/CompositeAvatar.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { promptForFiles } from '$lib/files';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import Logo from '$lib/Logo.svelte';
	import { IsMobile } from '$lib/mobile.svelte.js';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto } from '$lib/paths.js';
	import { importMore } from '$lib/queue.svelte';
	import { scrollfader } from '$lib/scrollfader.js';
	import { switchSession } from '$lib/sessions.js';
	import { getSettings, setSetting } from '$lib/settings.svelte.js';

	import { createSession } from './create.js';

	const db = $derived(databaseHandle());
	const directory = $derived(getSettings().sessionsDirectory);
	const provider = $derived.by(() => {
		if (!directory.platform) return undefined;
		if (directory.platform === 'local') return undefined;
		return providers.get(directory.platform);
	});
	const account = $derived.by(() => {
		if (!directory.account) return undefined;
		const databaseAccount = tables.Account.getFromState(directory.account);
		if (!databaseAccount) return undefined;
		return providers.fromDatabase(db, databaseAccount);
	});

	const mobile = new IsMobile();
</script>

<header class:mobile={mobile.current} {@attach mobile.current ? scrollfader('x') : undefined}>
	<section class="filters">
		<DropdownMenu
			title="Plateforme"
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
				<button class="filter-trigger" {...props}>
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
				</button>
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
			title="Filtrer par protocole"
			items={[
				{
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
									mobile.current ||
									directory.platform === 'local' ||
									providers.get(directory.platform)?.compatibleWith(protocol)
							)
							.map((protocol) => ({
								type: 'selectable' as const,
								disabled: !(
									directory.platform === 'local' ||
									providers.get(directory.platform)?.compatibleWith(protocol)
								),
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
				<button class="filter-trigger" {...props}>
					<div class="filter-option button">
						{const protocol = $derived(
							tables.Protocol.getFromState(directory.protocol ?? '')
						)}
						<div class="icon">
							{#if !directory.protocol}
								<IconFilterAll />
							{:else if protocol?.logo}
								<CompositeAvatar avatar={protocol.logo} sublogo={undefined} />
							{:else}
								<Logo variant="empty" />
							{/if}
						</div>
						<div class="label">
							{#if protocol}
								{protocol.name}
							{:else}
								<span class="filter-not-filtering">Protocole</span>
							{/if}
						</div>
						<div class="dropdown-arrow icon">
							<IconDropdown />
						</div>
					</div>
				</button>
			{/snippet}
			{#snippet item(protocol, { label, key, disabled })}
				<div class="filter-option" class:disabled>
					<div class="icon">
						{#if key === 'all'}
							<IconFilterAll />
						{:else if protocol?.logo}
							<CompositeAvatar avatar={protocol.logo} sublogo={undefined} />
						{:else}
							<Logo variant="empty" />
						{/if}
					</div>
					<div class="label">
						<OverflowableText text={label} />
						{#if disabled}
							<div class="subtext">
								{#if provider}
									Protocole incompatible avec {provider.displayName}
								{:else}
									Protocole incompatible
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/snippet}
		</DropdownMenu>
	</section>
	<!-- TODO: allow creating sessions remotely for platforms that support uploading ? -->
	{#if !mobile.current && directory.platform === 'local'}
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

<style>
	header {
		width: 100%;
		margin: 0 auto;

		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;

		.actions,
		.filters {
			display: flex;
			align-items: center;
			gap: 1rem;
			flex-wrap: wrap;
		}

		&.mobile .filters {
			gap: 0.25rem;
			flex-wrap: nowrap;
		}

		&.mobile {
			overflow-x: auto;
			scrollbar-width: none;
			margin-top: 1rem;
		}
	}

	.filter-trigger {
		border-radius: 999999px;

		header:not(.mobile) & {
			border: 2px solid var(--gray);
			padding: 0.5rem;
			font-size: 0.95rem;
			font-weight: bold;
		}

		header.mobile & {
			padding: 0.35em;
			font-size: 0.9rem;
			background: var(--bg2-neutral);
		}

		&:focus-visible,
		&:hover {
			background: var(--faint);
		}
	}

	.filter-option {
		display: flex;
		align-items: center;
		gap: 1em;

		&:not(.button) {
			height: 2.3em;
		}

		&.disabled {
			color: var(--gay);

			.icon {
				opacity: 0.5;
			}
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

		.subtext {
			font-size: 0.8rem;
			width: 100%;
		}

		&:not(.button) .label {
			max-width: 20ch;
		}

		header:not(.mobile) &.button .label {
			width: 12ch;
		}

		header.mobile &.button .label {
			max-width: 15ch;
		}
	}
</style>
