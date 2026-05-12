<script lang="ts">
	import type { NamespacedMetadataID } from './schemas/common.js';
	import type * as DB from '$lib/database.js';

	import { dequal } from 'dequal';
	import { watch } from 'runed';
	import { SvelteMap } from 'svelte/reactivity';

	import { databaseHandle, openDatabase, tables } from './idb.svelte.js';
	import Metadata from './Metadata.svelte';
	import { resolveDefaults } from './metadata/defaults.js';
	import { deleteMetadataValue, storeMetadataValue } from './metadata/storage.js';
	import MetadataList from './MetadataList.svelte';

	interface Props {
		session: DB.Session;
		onmetadatachange?: () => Promise<void> | void;
		/** Bind to this prop to check if all metadata values are valid (required metadata are filled, nothing breaks constraints, etc). Maps metadata IDs to error messages for that metadata */
		errors?: Map<NamespacedMetadataID, string[]>;
	}

	let refreshDefaults = $state(0);

	let { session, errors = new SvelteMap(), onmetadatachange }: Props = $props();
	const protocol = $derived(tables.Protocol.getFromState(session.protocol));

	const metadataDefs = $derived(
		protocol
			? tables.Metadata.state.filter((m) =>
					[
						...protocol.sessionMetadata,
						...protocol.importedMetadata
							.filter((imp) => imp.sessionwide)
							.map((imp) => imp.source),
					].includes(m.id)
				)
			: []
	);

	watch([() => refreshDefaults], () => {
		void (async () => {
			if (!protocol) return;
			await resolveDefaults({
				db: await openDatabase(),
				metadataToConsider: protocol.sessionMetadata,
				sessionId: session.id,
			});
			onmetadatachange?.();
		})();
	});
</script>

{#if protocol}
	<form class="metadata" data-testid="session-metadata">
		<MetadataList
			definitions={metadataDefs}
			values={session.metadata}
			groups={protocol.metadataGroups}
			ordering={protocol.metadataOrder}
		>
			{#snippet children(def, value)}
				<Metadata
					requiredness="all"
					options={undefined}
					definition={def}
					{value}
					onvalidation={(messages) => {
						if (messages.length > 0) {
							errors.set(def.id, messages);
						} else {
							errors.delete(def.id);
						}
					}}
					onchange={async ({value: v, unit}) => {
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

						refreshDefaults++;
						onmetadatachange?.();
					}}
				/>
			{/snippet}
		</MetadataList>
	</form>
{/if}
