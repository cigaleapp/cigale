<script
	lang="ts"
	generics="Entry extends {key: string, name: string, origin: string,originTooltip: string}  "
>
	import IconTrash from '~icons/ri/delete-bin-2-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { formatBytesSize } from '$lib/i18n.js';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import { tooltip } from '$lib/tooltips.js';

	import { reestimateStorage } from './+page.svelte';

	interface Props {
		listEntries: () => Promise<Entry[]>;
		// eslint-disable-next-line no-unused-vars
		deleteEntry: (entry: Entry) => Promise<void>;
		// eslint-disable-next-line no-unused-vars
		entrySize: (entry: Entry) => Promise<number>;
	}

	const { listEntries, deleteEntry, entrySize }: Props = $props();

	let entries = $state<Entry[]>([]);
	$effect(() => {
		void refresh();
	});

	async function refresh() {
		entries = await listEntries();
		await reestimateStorage();
	}
</script>

<div class="table">
	{#each entries as entry (entry.key)}
		<div class="row">
			<div class="label">
				<div class="name">{entry.name}</div>
				<div class="origin" use:tooltip={entry.originTooltip}>{entry.origin}</div>
			</div>

			<div class="size">
				{#await entrySize(entry)}
					<LoadingText value={Loading} mask={formatBytesSize(0)} />
				{:then size}
					{formatBytesSize(size)}
				{:catch err}
					<Tooltip text={err.toString()}>???</Tooltip>
				{/await}
			</div>

			<div class="delete">
				<ButtonIcon
					dangerous
					help="Supprimer"
					onclick={async () => {
						await deleteEntry(entry);
						await refresh();
					}}
				>
					<IconTrash />
				</ButtonIcon>
			</div>
		</div>
	{/each}
</div>

<style>
	.table {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 67ch;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr auto max-content;
		align-items: center;
		gap: 1rem;
	}

	/* .row:not(:focus-within):not(:hover) .delete {
		opacity: 0;
	} */

	.row .label .origin {
		font-size: 0.875rem;
		color: var(--gay);
	}
</style>
