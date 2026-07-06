<script lang="ts" module>
	type EntryBase = {
		key: string;
		name: string;
		origin: string;
		originTooltip: string;
		open?: undefined | (() => Promise<void>);
	};
</script>

<script lang="ts" generics="Entry extends EntryBase">
	import IconOpen from '~icons/ri/arrow-right-up-box-line';
	import IconTrash from '~icons/ri/delete-bin-2-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { formatBytesSize } from '$lib/i18n.js';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import { tooltip } from '$lib/tooltips.js';

	import { estimateStorageQuotaUsage } from './+page.svelte';

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
		await estimateStorageQuotaUsage();
	}

	const hasOpenButtons = $derived(entries.some((entry) => Boolean(entry.open)));
</script>

<div class="table">
	{#each entries as entry (entry.key)}
		<div class="row">
			{#if hasOpenButtons}
				<div class="open">
					<ButtonIcon
						help="Voir {entry.name}"
						disabled={!entry.open}
						loading
						onclick={async () => {
							await entry.open?.();
						}}
					>
						<IconOpen />
					</ButtonIcon>
				</div>
			{/if}
			<div class="label">
				<div class="name">
					<OverflowableText text={entry.name} />
				</div>
				<span class="origin" use:tooltip={entry.originTooltip}>{entry.origin}</span>
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
					loading
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
		max-width: min(100%, 67ch);
	}

	.row {
		display: grid;
		align-items: center;
		gap: 1rem;

		grid-template-columns: 1fr auto max-content;
		&:has(.open) {
			grid-template-columns: max-content 1fr auto max-content;
		}

		.label {
			overflow: hidden;
			margin-right: 0.5rem;
		}
	}

	/* .row:not(:focus-within):not(:hover) .delete {
		opacity: 0;
	} */

	.row .label .origin {
		font-size: 0.875rem;
		color: var(--gay);
	}
</style>
