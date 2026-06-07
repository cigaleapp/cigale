<script lang="ts">
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Modal from '$lib/Modal.svelte';
	import IconExportCandidatesList from '~icons/ri/export-line';

	import { narrowingState } from './+layout.svelte';
	import { watch } from 'runed';

	let open = $state<() => void>();
	let copied = $state(false);

	const listText = $derived(
		'[' +
			narrowingState.remainingCandidates
				.filter((candidate) => 'x-xper3-declaration-index' in candidate)
				.map((candidate) => candidate['x-xper3-declaration-index'])
				.join(', ') +
			']'
	);

watch(() => listText, () => {
	copied = false;
})
</script>

<Modal key="modal_candidates_list" title="Liste des candidats restants" bind:open>
	<div class="candidates-list-xper3">
		<p>Liste compatible avec un import dans Xper3</p>
		<textarea
			readonly
			rows={10}
			cols={30}
			onfocus={(event) => {
				event.currentTarget.select();
			}}
			value={listText}
		></textarea>
		<ButtonSecondary
			onclick={async () => {
				await navigator.clipboard.writeText(listText);
				copied = true;
			}}
		>
			{#if copied}
				Copié!
			{:else}
				Copier
			{/if}
		</ButtonSecondary>
	</div>
</Modal>

<ButtonIcon help="Exporter la liste des candidats restants vers Xper3" onclick={() => open?.()}>
	<IconExportCandidatesList />
</ButtonIcon>

<style>

	.candidates-list-xper3 {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1em;
	}

</style>
