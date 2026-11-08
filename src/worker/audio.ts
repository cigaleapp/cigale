import { FLAC, Input, MP3, OGG, WAVE, WEBM } from 'mediabunny';

import { generateSpectrogram } from '$lib/audio/spectrogram.js';
import { processSidecars } from '$lib/sidecars.js';
import { binaryStorage } from '$lib/storage/index.js';
import { createBytes, locateFileOfObject } from '$lib/storage/utils.js';
import { throwError } from '$lib/utils.js';
import { openDatabase, swarp } from '$worker';

const PREVIEW_SPECTROGRAM_MAX_WIDTH = 512;

swarp.importAudioFile(async ({ file, sessionId, id: fileId, sidecars, decoded }) => {
	const bytes = await file.arrayBuffer();

	const spectrogramFull = await generateSpectrogram(decoded);
	const spectrogramPreview = await generateSpectrogram(decoded, {
		height: PREVIEW_SPECTROGRAM_MAX_WIDTH / (4 / 3),
		width: PREVIEW_SPECTROGRAM_MAX_WIDTH,
	});

	const storedFile = await createBytes('AudioFile', {
		filename: file.name,
		sessionId,
		bytes,
		type: file.type,
		images: {
			full: spectrogramFull,
			preview: spectrogramPreview,
		},
	});

	const locator = locateFileOfObject('AudioFile', storedFile);

	const input = new Input({
		formats: [WAVE, MP3, OGG, WEBM, FLAC],
		source: await binaryStorage.mediabunny(locator),
	});

	const metadata = await input.getMetadataTags();

	console.log('metadata is', metadata);

	const db = await openDatabase();

	await db.put('AudioFile', {
		id: fileId,
		...storedFile,
		contentType: file.type,
		dimensions: {
			duration:
				((await input.getDurationFromMetadata()) ?? (await input.computeDuration())) * 1e3,
			sampleRate:
				(await input.getPrimaryAudioTrack().then((track) => track?.getSampleRate())) ??
				throwError(`${file.name} ne contient aucune piste audio`),
		},
	});

	await processSidecars({
		db,
		sessionId,
		// TODO
		cropMetadataId: '',
		fileId,
		file,
		sidecars,
	});

	// TODO: processAudioMetadata({...})

	input.dispose();

	return {
		id: fileId,
		filename: storedFile.filename,
		spectrogramUrl: URL.createObjectURL(spectrogramPreview),
	};
});
