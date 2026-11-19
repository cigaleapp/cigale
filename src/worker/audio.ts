import {
	ADTS,
	BufferSource,
	Conversion,
	FLAC,
	Input,
	MP3,
	OGG,
	Output,
	WAVE,
	WavOutputFormat,
	WEBM,
} from 'mediabunny';

import { SpectrogramBuilder } from '#lib/audio/spectrogram.js';
import { processSidecars } from '#lib/sidecars.js';
import { binaryStorage } from '#lib/storage/index.js';
import { findFreeLocatorForObject, locateImagesOfObject } from '#lib/storage/utils.js';
import { openDatabase, swarp } from '#worker/index.js';

swarp.importAudioFile(async ({ file, sessionId, id: fileId, sidecars }, onProgress) => {
	// const track = await input.getPrimaryAudioTrack()
	// if(!track) throw new Error(`${file.name} n'a aucune piste audio`)

	const locator = await findFreeLocatorForObject('AudioFile', {
		filename: file.name.toLowerCase().endsWith('.wav') ? file.name : file.name + '.wav',
		sessionId,
	});

	const input = new Input({
		formats: [ADTS, FLAC, MP3, WAVE, OGG, WEBM],
		source: new BufferSource(await file.arrayBuffer()),
	});

	const track = await input.getPrimaryAudioTrack();
	if (!track) throw new Error('aucune piste audio');

	const duration = await track.computeDuration();
	let sampleRate: number | undefined;

	let spectrogramBuilder: SpectrogramBuilder | undefined;

	const conversion = await Conversion.init({
		input,

		output: new Output({
			// TODO: use flac? but it require's mediabunny's own flac encoder... but it makes for smaller file sizes.
			format: new WavOutputFormat(),
			target: await binaryStorage.mediabunnyTarget(locator),
		}),

		audio: {
			numberOfChannels: 1,
			async process(sample) {
				sampleRate = sample.sampleRate;

				spectrogramBuilder ??= new SpectrogramBuilder({
					sampleRate,
					duration,
				});

				await spectrogramBuilder.pushAudioSample(sample);

				return sample;
			},
		},

		tags: (existing) => ({
			date: new Date(),
			...existing,
			// TODO: to put timestamped observation images alongside the audio
			// images:
			raw: {
				// metadata tags for WAV is RIFF INFO block
				// described in https://www.aelius.com/njh/wavemetatools/doc/riffmci.pdf
				// page 23 & 24
				// IARL: geolocation? (Archival Location)
				ISFT: 'Cigale App (https://github.com/cigaleapp)',
			},
		}),
	});

	conversion.onProgress = onProgress;
	await conversion.execute();
	const spectrogram = await spectrogramBuilder!.finish();

	const metadata = await input.getMetadataTags();
	console.info(`${file.name} metadata:`, metadata);

	input.dispose();

	const spectrogramLocators = locateImagesOfObject(locator);

	await binaryStorage.write(spectrogramLocators.full, spectrogram.images.full);
	await binaryStorage.write(spectrogramLocators.preview, spectrogram.images.preview);

	const db = await openDatabase();

	await db.put('AudioFile', {
		id: fileId,
		sessionId,
		filename: locator.name,
		contentType: 'audio/wav',
		spectrogram: spectrogram.info,
		dimensions: {
			duration: duration * 1e3,
			sampleRate: sampleRate!,
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

	return {
		id: fileId,
		filename: locator.name,
		spectrogramUrl: URL.createObjectURL(spectrogram.images.preview),
	};
});
