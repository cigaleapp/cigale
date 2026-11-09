import type { PROCEDURES } from '$worker/procedures.js';
import type { SwarpcClient } from 'swarpc';

import { decodeToMono } from '$lib/audio/spectrogram.js';
import { tables } from '$lib/idb.svelte.js';
import { imageId } from '$lib/images.js';
import { uiState } from '$lib/uistate.svelte.js';

/** @see https://en.wikipedia.org/wiki/HTML_audio#Supported_audio_coding_formats */
export const ACCEPTED_IMPORT_TYPES = [
	'audio/wav',
	'audio/mpeg',
	'audio/mp4',
	// 'audio/aa',
	// 'audio/aacp',
	'audio/ogg',
	'audio/webm',
	// 'audio/x-caf',
	'audio/flac',
];

export async function processAudioFile(
	swarpc: SwarpcClient<typeof PROCEDURES>,
	{
		file,
		id,
		sidecars,
	}: {
		file: File;
		/** New, free ImageFile id to use */
		id: string;
		sidecars: File[];
	}
) {
	if (!uiState.currentProtocol) {
		throw new Error('Aucun protocole sélectionné');
	}

	if (!uiState.currentSession) {
		throw new Error('Aucune session active');
	}

	console.time('get bytes');
	const bytes = await file.arrayBuffer();
	console.timeEnd('get bytes');

	console.time('decoding audio');
	const decoded = await decodeToMono(bytes);
	console.timeEnd('decoding audio');

	const { filename, spectrogramUrl } = await swarpc.importAudioFile({
		id,
		file,
		sidecars,
		sessionId: uiState.currentSession.id,
		decoded: decoded,
	});

	uiState.setPreviewURL(id, spectrogramUrl);

	await tables.Sound.set({
		id: imageId(id, 1),
		fileId: id,
		filename,
		addedAt: new Date().toISOString(),
		metadata: {},
		sessionId: uiState.currentSession.id,
	});

	await tables.AudioFile.refresh(uiState.currentSessionId);

	uiState.processing.removeFile(id);
}
