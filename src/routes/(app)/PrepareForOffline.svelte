<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';

	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import { tables } from '$lib/idb.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Modal from '$lib/Modal.svelte';
	import { prepareForOfflineUse } from '$lib/offline';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { toastIcon } from '$lib/Toast.svelte';
	import { clamp } from '$lib/utils';

	let { open = $bindable() } = $props();

	/**
	 * @type {undefined | true | string}
	 */
	let status = $state();

	/**
	 * @type {undefined | (() => void)}
	 */
	let close = $state();

	async function startDownload() {
		await prepareForOfflineUse(
			tables.Protocol.state.map((p) => p.id),
			({ modelNo, ...data }) => {
				progressBars.set(modelNo, data);
			}
		).catch((e) => {
			status = e;
		});
	}

	$effect(() => {
		if (loading && progressBars.values().every((v) => v.done >= v.total)) status = true;
	});

	/**
	 * @type {Map<number, { done: number, total: number, modelURL: string }>}
	 */
	let progressBars = new SvelteMap();

	const loading = $derived(progressBars.size > 0);

	const StateIcon = $derived(toastIcon(status === true ? 'success' : 'error'));
</script>

<Modal key="modal_prepare_for_offline" title="Préparation hors-ligne" bind:open bind:close>
	<p>
		Télécharger tout ce qu'il est nécéssaire pour pouvoir utiliser l'application hors-ligne.
		Télécharge tout les modèles pour tout les protocoles actuellement installés.
	</p>

	<ul class="bars">
		{#each progressBars as [modelNo, { done, total, modelURL }] (modelNo)}
			<li>
				<span class="url">{modelURL}</span>
				<ProgressBar alwaysActive progress={clamp(done / total, 0, 1)} />
			</li>
		{/each}
	</ul>

	<section
		class="state"
		style:color="var(--fg-{status === true ? 'success' : loading ? 'secondary' : 'error'})"
	>
		{#if status === true}
			<StateIcon /> OK!
		{:else if status !== undefined}
			<StateIcon /> {status}
		{:else if progressBars.size > 0}
			<LoadingSpinner /> Chargement…
		{/if}
	</section>

	{#snippet footer({ close })}
		{#if status !== true}
			<ButtonPrimary {loading} onclick={startDownload}>Démarrer</ButtonPrimary>
		{:else}
			<ButtonPrimary
				onclick={() => {
					progressBars.clear();
					status = undefined;
					close?.();
				}}
			>
				Fermer
			</ButtonPrimary>
		{/if}
	{/snippet}
</Modal>

<style>
	.bars {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
		padding-left: 0;
		margin: 1em 2em;
	}

	.bars li {
		display: flex;
		justify-content: center;
		flex-direction: column;
		gap: 0.5em;
	}

	.bars li .url {
		color: var(--gray);
		overflow-wrap: anywhere;
	}

	.state {
		margin-top: 2rem;
		display: flex;
		justify-content: center;
		gap: 0.5em;
		margin-bottom: 1em;
		width: 100%;
	}
</style>
