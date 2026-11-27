<script lang="ts">
	import { fade } from 'svelte/transition';

	import ButtonIcon from '#lib/ButtonIcon.svelte';
	import ButtonSecondary from '#lib/ButtonSecondary.svelte';
	import { plural } from '#lib/i18n.js';
	import { databaseHandle, tables } from '#lib/idb.svelte.js';
	import LoadingScreen from '#lib/LoadingScreen.svelte';
	import { IsMobile } from '#lib/mobile.svelte.js';
	import { promptAndImportProtocol } from '#lib/protocols.js';
	import { listAllProtocols } from '#lib/protocols/registry.js';
	import { uninstallProtocol } from '#lib/protocols/uninstall.ts';
	import { Protocol } from '#lib/schemas/protocols.js';
	import { isDebugMode } from '#lib/settings.svelte.js';
	import { toasts } from '#lib/toasts.svelte.js';
	import { uiState } from '#lib/uistate.svelte.js';
	import IconImport from '~icons/ri/download-2-line';

	import TopbarBack from '../TopbarBack.svelte';
	import ModalCreateProtocol from './ModalCreateProtocol.svelte';
	import ModalDeleteProtocol from './ModalDeleteProtocol.svelte';
	import RowProtocol from './RowProtocol.svelte';

	const { data } = $props();

	const mobile = new IsMobile();

	/**
	 * Protocol we're confirming deletion for
	 */
	let removingProtocol = $state('');

	let confirmDelete = $state<() => void>();

	let openProtocolCreation = $state<() => void>();

	let expandedProtocol = $state('');

	let reloadProtocols = $state(0);

	async function importFromFiles(
		_event: MouseEvent,
		signals: {
			loadingStarted: () => void;
			loadingEnded: () => void;
		}
	) {
		await promptAndImportProtocol({
			allowMultiple: true,
			onInput: signals.loadingStarted,
			importProtocol: data.swarpc.importProtocol,
		})
			.catch((e) => toasts.error(null, e))
			.then((ps) => {
				if (!ps || typeof ps === 'string' || ps.length === 0) return;
				const names = new Map(
					ps.map((p) => [p.id, tables.Protocol.getFromState(p.id)?.name])
				);

				if (names.size === 1) toasts.success(`Protocole “${names.get(ps[0].id)}” importé`);
				else
					toasts.success(
						plural(names.size, ['Protocole importé', '# protocoles importés'])
					);

				reloadProtocols++;
			})
			.finally(() => {
				signals.loadingEnded();
			});
	}
</script>

<ModalDeleteProtocol
	id={removingProtocol}
	bind:open={confirmDelete}
	ondelete={() => {
		reloadProtocols++;
	}}
/>

<ModalCreateProtocol bind:open={openProtocolCreation} />

<TopbarBack>
	Protocoles

	{#snippet actions()}
		<ButtonIcon loading help="Importer" onclick={importFromFiles}>
			<IconImport />
		</ButtonIcon>
	{/snippet}
</TopbarBack>

<main class="page" in:fade={{ duration: 100 }}>
	{#if isDebugMode() || !mobile.current}
		<header>
			<h1>Protocoles</h1>
			<section class="actions">
				{#if isDebugMode()}
					<ButtonSecondary
						danger
						loading
						onclick={async () => {
							for (const { id } of tables.Protocol.state) {
								await uninstallProtocol(databaseHandle(), id);
							}

							reloadProtocols++;
						}}
					>
						Tout désinstaller
					</ButtonSecondary>
				{/if}
				{#if !mobile.current}
					<ButtonSecondary loading onclick={importFromFiles}>
						<IconImport />
						Importer
					</ButtonSecondary>
				{/if}
				<!-- <ButtonSecondary onclick={() => openProtocolCreation?.()}>
				<IconCreate />
				Créer
			</ButtonSecondary> -->
			</section>
		</header>
	{/if}

	<ul class="protocols" pw-testid="protocols-list">
		{#key reloadProtocols}
			{#await Array.fromAsync(listAllProtocols(databaseHandle()))}
				<LoadingScreen loading="Chargement des protocoles…" />
			{:then protocols}
				{const installed = $derived(protocols.filter((p) => p.installed))}

				{const notinstalled = $derived(protocols.filter((p) => !p.installed))}

				{const usable = $derived(installed.filter((p) => Protocol.from(p.protocol).usable))}

				{const unusable = $derived(
					installed.filter((p) => !Protocol.from(p.protocol).usable)
				)}

				{#each usable as entry (entry.protocol.id)}
					{@render row(entry)}
				{/each}

				{#if unusable.length > 0}
					<section class="divider">
						<hr />
						<h2>Bases</h2>
					</section>
				{/if}

				{#each unusable as entry (entry.protocol.id)}
					{@render row(entry)}
				{/each}

				<section class="divider">
					<hr />
					<h2>Non installés</h2>
				</section>

				{#each notinstalled as entry (entry.protocol.id)}
					{@render row(entry)}
				{:else}
					<li class="empty">
						<LoadingScreen empty="Tout est installé!" />
					</li>
				{/each}

				{#snippet row({ protocol: p, installed, compatible })}
					<RowProtocol
						{...p}
						{installed}
						{compatible}
						bind:expanded={
							() => expandedProtocol === p.id,
							(expanded) => {
								if (!installed) return;
								if (expanded) expandedProtocol = p.id;
								else if (expandedProtocol === p.id) expandedProtocol = '';
							}
						}
						oninstall={async (source, onProgress) => {
							try {
								await data.swarpc.importProtocol.once(
									{
										url: source,
									},
									({ done, total, ...rest }) => {
										console.log(done, total, rest);
										onProgress?.(done / total);
										uiState.processing.task = 'install-protocol';
										uiState.processing.done = done;
										uiState.processing.total = total;
									}
								);

								await tables.Protocol.refresh(null);
								await tables.Metadata.refresh(null);
							} catch (e) {
								console.error(e);
								toasts.error(e, `Impossible d'installer ${source}`);
							} finally {
								reloadProtocols++;
								await uiState.processing.finish();
							}
						}}
						ondelete={() => {
							removingProtocol = p.id;
							confirmDelete?.();
						}}
					/>
				{/snippet}
			{:catch error}
				<LoadingScreen failure={error} />
			{/await}
		{/key}
	</ul>
</main>

<style>
	h1 {
		padding-top: 1rem;
		color: var(--fg-primary);
	}

	.page {
		max-width: 600px;
		width: 100%;
		margin: 1rem auto;
	}

	.protocols {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 1em;
		width: 100%;
		list-style-position: inside;
		padding-left: 0;
		padding: 0;
		--loading-screen-min-height: 60vh;

		@media (max-width: 600px) {
			--row-corner-radius: 0;
		}
	}

	header {
		margin: 2rem 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		flex-wrap: wrap;
		gap: 2rem;

		@media (max-width: 600px) {
			justify-content: center;
		}
	}

	header h1 {
		padding: 0;
	}

	section.actions {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.protocols .divider {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		position: relative;
		hr {
			width: 100%;
			position: absolute;
			top: 50%;
			translate: 0 -50%;
			z-index: -1;
		}

		h2 {
			background: var(--bg-neutral);
			padding: 0 1rem;
		}
	}

	.protocols .divider h2 {
		text-align: center;
		font-weight: normal;
		font-size: 1.1rem;
	}

	hr {
		border: none;
		border-top: 1px solid var(--gray);
	}

	li.empty {
		--loading-screen-min-height: 12rem;
		height: var(--loading-screen-min-height);
	}
</style>
