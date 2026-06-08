import { databaseHandle, tables } from '$lib/idb.svelte.js';
import { resolveDefaults } from '$lib/metadata/defaults.js';
import { pickProtocol } from '$lib/ModalPickProtocol.svelte';
import { goto } from '$lib/paths.js';
import { defaultClassificationMetadata, defaultCropMetadata } from '$lib/protocols.js';
import { isNamespacedToProtocol } from '$lib/schemas/metadata.js';
import { switchSession } from '$lib/sessions.js';
import { compareBy, orEmptyObj } from '$lib/utils.js';

export async function createSession() {
	await pickProtocol({
		after: {
			loadingText: 'Création de la session…',
			async do(selectedProtocol) {
				if (!selectedProtocol) {
					return;
				}

				const classificationMetadata = defaultClassificationMetadata(
					selectedProtocol,
					tables.Metadata.state
				);

				const cropMetadata = defaultCropMetadata(selectedProtocol, tables.Metadata.state);

				const mtimeMetadata = selectedProtocol.exports?.images.mtime;

				const narrowableGroups = selectedProtocol.metadataGroups
					.filter((group) => group.narrowable)
					.map((group) => ({
						...group,
						metadataCount: tables.Metadata.state.filter(
							(metadata) =>
								isNamespacedToProtocol(selectedProtocol.id, metadata.id) &&
								metadata.group === group.id
						).length,
					}));

				const largestNarrowableGroup = narrowableGroups
					.toSorted(compareBy((group) => group.metadataCount))
					.at(-1);

				const { id } = await tables.Session.add({
					name: `Session du ${Intl.DateTimeFormat().format(new Date())}`,
					description: '',
					protocol: selectedProtocol.id,
					createdAt: new Date().toISOString(),
					openedAt: new Date().toISOString(),
					metadata: {},
					fullscreenClassifier: {
						layout: 'top-bottom',
						...orEmptyObj(largestNarrowableGroup !== undefined, {
							narrowableGroup: largestNarrowableGroup?.id ?? '',
						}),
						// TODO: set this once we can change it in the UI
						// otherwise, we lock ourselves into these values and changing the session's protocol afterwards does nothing
						//
						// ...orEmptyObj(classificationMetadata !== undefined, {
						// 	focusedMetadata: classificationMetadata?.id ?? '',
						// }),
					},
					group: {
						global: { field: 'none' },
						crop: cropMetadata?.groupable
							? { field: 'metadataPresence', metadata: cropMetadata.id }
							: { field: 'none' },
						classify: classificationMetadata?.groupable
							? { field: 'metadataConfidence', metadata: classificationMetadata.id }
							: { field: 'none' },
					},
					sort: {
						global:
							mtimeMetadata && tables.Metadata.getFromState(mtimeMetadata)?.sortable
								? {
										field: 'metadataValue',
										direction: 'asc',
										metadata: mtimeMetadata,
									}
								: { field: 'name', direction: 'asc' },
					},
				});

				await resolveDefaults({
					db: databaseHandle(),
					sessionId: id,
					metadataToConsider: selectedProtocol.metadata,
				});

				await switchSession(id);
				await goto('/(app)/sessions/[id]', { id });
			},
		},
	});
}
