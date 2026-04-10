import { databaseHandle, tables } from '$lib/idb.svelte.js';
import { resolveDefaults } from '$lib/metadata/defaults.js';
import { goto } from '$lib/paths.js';
import { defaultClassificationMetadata, defaultCropMetadata } from '$lib/protocols.js';
import { switchSession } from '$lib/sessions.js';
import { toasts } from '$lib/toasts.svelte.js';
import { orEmptyObj } from '$lib/utils.js';

export async function createSession() {
	const defaultProtocol = tables.Protocol.state.at(0);

	if (!defaultProtocol) {
		toasts.error('Aucun protocole installé, impossible de créer une session.');
		return;
	}

	const classificationMetadata = defaultClassificationMetadata(
		defaultProtocol,
		tables.Metadata.state
	);

	const cropMetadata = defaultCropMetadata(defaultProtocol, tables.Metadata.state);

	const mtimeMetadata = defaultProtocol.exports?.images.mtime;

	const { id } = await tables.Session.add({
		name: `Session du ${Intl.DateTimeFormat().format(new Date())}`,
		description: '',
		protocol: defaultProtocol.id,
		createdAt: new Date().toISOString(),
		openedAt: new Date().toISOString(),
		metadata: {},
		fullscreenClassifier: {
			layout: 'top-bottom',
			...orEmptyObj(classificationMetadata !== undefined, {
				focusedMetadata: classificationMetadata?.id ?? '',
			}),
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
					? { field: 'metadataValue', direction: 'asc', metadata: mtimeMetadata }
					: { field: 'name', direction: 'asc' },
		},
	});

	await resolveDefaults({
		db: databaseHandle(),
		sessionId: id,
		metadataToConsider: defaultProtocol.metadata,
	});

	await switchSession(id);
	await goto('/(app)/sessions/[id]', { id });
}
