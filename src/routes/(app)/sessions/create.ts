import IconImport from '~icons/ri/import-line';
import { promptForFiles } from '$lib/files';
import { satisfiesHardwareRequirements } from '$lib/hardware-requirements.js';
import { databaseHandle, tables } from '$lib/idb.svelte.js';
import { resolveDefaults } from '$lib/metadata/defaults.js';
import { metadataUsedByProtocol } from '$lib/metadata/imports.js';
import { pickProtocol } from '$lib/ModalPickProtocol.svelte';
import { goto } from '$lib/paths.js';
import { defaultClassificationMetadata, defaultCropMetadata } from '$lib/protocols.js';
import { importMore } from '$lib/queue.svelte';
import { isNamespacedToProtocol } from '$lib/schemas/metadata.js';
import { switchSession } from '$lib/sessions.js';
import { compareBy, nonnull, orEmptyObj } from '$lib/utils.js';

export async function createSession() {
	await pickProtocol({
		extraOptions: [
			{
				key: 'zip',
				label: 'Importer un .zip',
				subtext: 'Importer un export Cigale',
				icon: IconImport,
			},
		],
		after: {
			loadingText: 'Création de la session…',
			async do(selectedProtocol) {
				if (selectedProtocol === 'zip') {
					const zipfile = await promptForFiles({
						accept: 'application/zip',
						multiple: false,
					});
					if (zipfile.length === 0) return;

					await switchSession(null);
					importMore(zipfile);
					await goto('/(app)/(sidepanel)/import');

					return;
				}

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
					neuralModels: Object.fromEntries(
						await Promise.all(
							tables.Metadata.state
								.filter((metadata) =>
									metadataUsedByProtocol(selectedProtocol, metadata.id)
								)
								.map(async (metadata) => {
									if (!metadata.infer) return;
									if (!('neural' in metadata.infer)) return;

									for (const [i, model] of metadata.infer.neural.entries()) {
										if (
											await satisfiesHardwareRequirements(model.requirements)
										) {
											return [metadata.id, { kind: 'protocol', i }] as const;
										}
									}

									return [metadata.id, { kind: 'disabled' }] as const;
								})
						).then((entries) => entries.filter(nonnull))
					),
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
