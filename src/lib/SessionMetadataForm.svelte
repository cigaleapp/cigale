<script lang="ts">
	import type { NamespacedMetadataID } from './schemas/common.js';
	import type * as DB from '$lib/database.js';

	import { dequal } from 'dequal';
	import { watch } from 'runed';

	import { databaseHandle, openDatabase, tables } from './idb.svelte.js';
	import Metadata from './Metadata.svelte';
	import { resolveDefaults } from './metadata/defaults.js';
	import {
		deleteMetadataValue,
		metadataOptionsOf,
		storeMetadataValue,
	} from './metadata/storage.js';
	import MetadataList from './MetadataList.svelte';

	interface Props {
		session: DB.Session;
		metadataOptions?: Map<NamespacedMetadataID, DB.MetadataEnumVariant[]>;
		onmetadatachange?: () => Promise<void> | void;
	}

	let { session, metadataOptions = new Map(), onmetadatachange }: Props = $props();
	const protocol = $derived(tables.Protocol.getFromState(session.protocol));
	$inspect({ session, protocol });
	const metadataDefs = $derived(
		tables.Metadata.state.filter((m) => protocol?.sessionMetadata.includes(m.id))
	);

	watch([() => session.protocol], () => {
		void (async () => {
			if (!protocol) return;
			const options = await metadataOptionsOf(
				await openDatabase(),
				protocol.id,
				protocol.sessionMetadata
			);
			metadataOptions = options.byMetadata;
		})();
	});

	watch([() => session], () => {
		void (async () => {
			if (!protocol) return;
			await resolveDefaults({
				db: await openDatabase(),
				metadataToConsider: protocol.sessionMetadata,
				sessionId: session.id,
			});
		})();
	});
</script>

{#if protocol}
	<form class="metadata" data-testid="session-metadata">
		<MetadataList
			definitions={metadataDefs}
			groups={protocol.metadataGroups}
			ordering={protocol.metadataOrder}
		>
			{#snippet children(def)}
				{@const value = session.metadata[def.id]}
				<Metadata
					options={metadataOptions.get(def.id) ?? []}
					definition={def}
					{value}
					onchange={async (v, unit) => {
						if (dequal(v, value?.value) && unit === value?.unit) return;

						if (v !== undefined) {
							await storeMetadataValue({
								db: databaseHandle(),
								manuallyModified: true,
								subjectId: session.id,
								sessionId: session.id,
								metadataId: def.id,
								value: v,
								unit,
							});
						} else {
							await deleteMetadataValue({
								db: databaseHandle(),
								subjectId: session.id,
								sessionId: session.id,
								metadataId: def.id,
							});
						}

						onmetadatachange?.();
					}}
				/>
			{/snippet}
		</MetadataList>
	</form>
{/if}
