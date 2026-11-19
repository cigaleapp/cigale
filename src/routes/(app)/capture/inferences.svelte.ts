import type { CaptureDevice } from './device.svelte.js';
import type { FloatingMessage } from './floatingmessage.svelte.js';

import { geolocationAccuracyToConfidence, getCurrentLocation } from '#lib/geolocation.js';
import { databaseHandle, tables } from '#lib/idb.svelte.js';
import { storeMetadataValue } from '#lib/metadata/storage.js';
import { isMetadataInProtocol } from '#lib/schemas/protocols.js';
import { uiState } from '#lib/uistate.svelte.js';

export async function runCaptureInferences(
	device: CaptureDevice,
	selector: 'before-timer' | 'after-timer'
) {
	const protocol = uiState.currentProtocol;
	if (!protocol) return;

	const beforeTimerInferences = tables.Metadata.state
		.filter((m) => isMetadataInProtocol(protocol, m.id))
		.filter((m) => m.infer && 'capture' in m.infer && m.infer.capture === selector);

	async function askForPics() {
		device.forceLoadCamera = true;

		try {
			// Gather all file-type metadata with before-timer capture inference
			const picsToTake = beforeTimerInferences
				.filter((m) => m.type === 'file')
				.filter((m) => m.accept.includes('image/*'));

			device.storage.freezeCount();

			for (const metadata of picsToTake) {
				device.floatingmsg.freeze('Prendre en photo', metadata.label);
				const pic = await device.waitForCameraCapture();
				await device.storage.flushToMetadata(pic.name, metadata.id);
			}

			await device.storage.unfreezeCount();

			device.floatingmsg.clear();
		} finally {
			device.forceLoadCamera = false;
		}
	}

	if (selector === 'before-timer') await askForPics();

	// Gather all other before-timer capture inferences
	for (const metadata of beforeTimerInferences) {
		device.floatingmsg.freeze('Collecte', metadata.label);
		switch (metadata.type) {
			case 'file':
				continue;
			case 'date': {
				await storeMetadataValue({
					db: databaseHandle(),
					type: 'date',
					value: new Date(),
					metadataId: metadata.id,
					sessionId: uiState.currentSessionId!,
					subjectId: uiState.currentSessionId!,
				});
				break;
			}
			case 'location': {
				const position = await getCurrentLocation();
				if (!position) return;

				await storeMetadataValue({
					db: databaseHandle(),
					type: 'location',
					confidence: geolocationAccuracyToConfidence(position.accuracy),
					value: position,
					metadataId: metadata.id,
					sessionId: uiState.currentSessionId!,
					subjectId: uiState.currentSessionId!,
				});
				break;
			}
		}
	}

	device.floatingmsg.clear();

	if (selector === 'after-timer') {
		await askForPics();
	}

	if (selector === 'before-timer') {
		device.setShootingPhase('wait-start-timer');
		device.floatingmsg.freeze('Timer', 'En attente du démarrage');
	}
}
