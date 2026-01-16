<script>
	import { fade } from 'svelte/transition';

	import IconCreate from '~icons/ri/add-circle-line';
	import IconImport from '~icons/ri/download-2-line';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { plural } from '$lib/i18n';
	import { tables } from '$lib/idb.svelte.js';
	import { promptAndImportProtocol } from '$lib/protocols';
	import { toasts } from '$lib/toasts.svelte';

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
</script>

<ModalDeleteProtocol id={removingProtocol} bind:open={confirmDelete} />

<ModalCreateProtocol bind:open={openProtocolCreation} />

<div class="page" in:fade={{ duration: 100 }}>
	<header>
		<h1>Protocoles</h1>
		<section class="actions">
			<ButtonSecondary
				loading
				onclick={async (_, signals) => {
					await promptAndImportProtocol({
						allowMultiple: true,
						onInput: signals.loadingStarted,
						importProtocol: data.swarpc.importProtocol
					})
						.catch((e) => toasts.error(e))
						.then((ps) => {
							if (!ps || typeof ps === 'string' || ps.length === 0) return;
							if (ps.length === 1)
								toasts.success(`Protocole “${ps[0].name}” importé`);
							else
								toasts.success(
									plural(ps.length, [
										'Protocole importé',
										'# protocoles importés'
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
			<ButtonSecondary onclick={() => openProtocolCreation?.()}>
				<IconCreate />
				Créer
			</ButtonSecondary>
		</section>
	</header>

	<ul class="protocols">
		{#each tables.Protocol.state as p (p.id)}
			<RowProtocol
				{...p}
				bind:expanded={
					() => expandedProtocol === p.id,
					(expanded) => {
						if (expanded) expandedProtocol = p.id;
						else if (expandedProtocol === p.id) expandedProtocol = '';
					}
				}
				ondelete={() => {
					removingProtocol = p.id;
					confirmDelete?.();
				}}
			/>
		{/each}
	</ul>
</div>

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
	}

	header {
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
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
