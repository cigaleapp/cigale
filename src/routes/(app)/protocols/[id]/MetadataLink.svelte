<script lang="ts">
	import IconGoto from '~icons/ri/arrow-right-line';
	import IconError from '~icons/ri/error-warning-line';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import IconDatatype from '$lib/IconDatatype.svelte';
	import {
		ensureNamespacedMetadataId,
		removeNamespaceFromMetadataId
	} from '$lib/schemas/metadata';

	import { updater } from './updater.svelte';

	/**
	 * @typedef {object} Props
	 * @property {string|undefined} key
	 * @property {string} [help] help text to display when metadata is found
	 * @property {string} [no-metadata] help text to display when no metadata
	 * @property {import('$lib/database').Metadata[]} definitions
	 * @property {(metadataKey: string) => Promise<void>} [oncreate] callback when creating a new metadata. Argument is the namespace-less metadata id.
	 * @property {Parameters<typeof updater<string>>[0]} [onupdate] callback when creating a new metadata. Second argument is the namespace-less metadata id.
	 */

	/** @type {Props} */
	const {
		key: metadataKey,
		definitions,
		oncreate,
		onupdate,
		help,
		'no-metadata': noMetadataHelp
	} = $props();

	const shortKey = $derived(metadataKey ? removeNamespaceFromMetadataId(metadataKey) : undefined);
	const protocolId = $derived(page.params.id ?? '');

	const metadata = $derived(
		metadataKey
			? definitions.find(
					(m) =>
						ensureNamespacedMetadataId(m.id, protocolId) ===
						ensureNamespacedMetadataId(metadataKey, protocolId)
				)
			: undefined
	);
</script>

<div class="metadata-link">
	{#if metadata}
		<div class="text">
			<p>
				<IconDatatype tooltip={false} type={metadata.type} />
				{metadata.label || shortKey}
			</p>
			<small>{help}</small>
		</div>
		<div class="actions">
			<ButtonInk
				onclick={async () =>
					goto('/(app)/protocols/[id]/metadata/[metadata]/infos', {
						id: protocolId,
						metadata: shortKey
					})}
			>
				<IconGoto />
				Voir
			</ButtonInk>
		</div>
	{:else}
		<div class="text empty">
			<p>
				<IconError />
				Aucune métadonnée
			</p>
			<small>{noMetadataHelp}</small>
		</div>
		<div class="actions">
			{#if oncreate}
				<ButtonInk
					onclick={updater(async (p) => {
						if (!metadataKey) return;
						const metadataId = ensureNamespacedMetadataId(shortKey, p.id);

						if (!definitions.some((m) => m.id === metadataId)) {
							await oncreate?.(shortKey);
							p.metadata.push(shortKey);
						}

						onupdate?.(p, shortKey);

						await goto('/(app)/protocols/[id]/metadata/[metadata]/infos', {
							id: p.id,
							metadata: shortKey
						});
					})}
				>
					Créer
				</ButtonInk>
			{/if}
		</div>
	{/if}
</div>

<style>
	.metadata-link {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.text p {
			display: flex;
			align-items: center;
			gap: 0.25em;
		}

		.text.empty {
			color: var(--fg-error);
		}
	}
</style>
