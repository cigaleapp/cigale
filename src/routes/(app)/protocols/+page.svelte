<script>
	import { fade } from 'svelte/transition';

	import AsyncEach from '#lib/AsyncEach.svelte';
	import ButtonSecondary from '#lib/ButtonSecondary.svelte';
	import { plural } from '#lib/i18n.js';
	import { databaseHandle, tables } from '#lib/idb.svelte.js';
	import LoadingScreen from '#lib/LoadingScreen.svelte';
	import { promptAndImportProtocol } from '#lib/protocols.js';
	import { listAllProtocols } from '#lib/protocols/registry.js';
	import { uninstallProtocol } from '#lib/protocols/uninstall.ts';
	import { isDebugMode } from '#lib/settings.svelte.js';
	import { toasts } from '#lib/toasts.svelte.js';
	import { uiState } from '#lib/uistate.svelte.js';
	import IconImport from '~icons/ri/download-2-line';

	import TopbarBack from '../TopbarBack.svelte';
	import ModalCreateProtocol from './ModalCreateProtocol.svelte';
	import ModalDeleteProtocol from './ModalDeleteProtocol.svelte';
	import RowProtocol from './RowProtocol.svelte';

	const { data } = $props();

	/**
	 * Protocol we're confirming deletion for
	 * @type {string}
	 */
	let removingProtocol = $state('');

	/** @type {undefined | (() => void)} */
	let confirmDelete = $state();

	/** @type {undefined | (() => void)} */
	let openProtocolCreation = $state();

	let expandedProtocol = $state('');

	let reloadProtocols = $state(0);
</script>

<ModalDeleteProtocol
	id={removingProtocol}
	bind:open={confirmDelete}
	ondelete={() => {
		reloadProtocols++;
	}}
/>

<ModalCreateProtocol bind:open={openProtocolCreation} />

<TopbarBack>Protocoles</TopbarBack>

<main class="page" in:fade={{ duration: 100 }}>
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
			<ButtonSecondary
				loading
				onclick={async (_, signals) => {
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

							if (names.size === 1)
								toasts.success(`Protocole “${names.get(ps[0].id)}” importé`);
							else
								toasts.success(
									plural(names.size, [
										'Protocole importé',
										'# protocoles importés',
									])
								);
						});
				}}
			>
				{#snippet children({ loading })}
					{#if !loading}<IconImport />{/if}
					Importer
				{/snippet}
			</ButtonSecondary>
			<!-- <ButtonSecondary onclick={() => openProtocolCreation?.()}>
				<IconCreate />
				Créer
			</ButtonSecondary> -->
		</section>
	</header>

	<ul class="protocols" pw-testid="protocols-list">
		{#key reloadProtocols}
			<AsyncEach
				key={(p) => p.protocol.id}
				items={async function* () {
					yield* listAllProtocols(databaseHandle());
				}}
			>
				{#snippet loading()}
					<LoadingScreen loading="Chargement des protocoles…" />
				{/snippet}
				{#snippet children({ protocol: p, installed, compatible })}
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

							await uiState.processing.finish();
							await tables.Protocol.refresh(null);
							await tables.Metadata.refresh(null);
							reloadProtocols++;
						}}
						ondelete={() => {
							removingProtocol = p.id;
							confirmDelete?.();
						}}
					/>
				{/snippet}
			</AsyncEach>
		{/key}
	</ul>
</main>

<style>
	h1 {
		padding-top: 40px;
		color: var(--fg-primary);
	}

	.page {
		max-width: 600px;
		width: 100%;
		margin: 3rem auto;
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
	}

	header {
		margin-bottom: 2rem;
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
</style>
