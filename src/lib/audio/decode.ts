export type DecodedAudioMono = {
	samples: Float32Array<ArrayBuffer>;
	sampleRate: number;
};

export async function decodeToMono(
	bytes: ArrayBuffer,
	targetSampleRate = 44100
): Promise<DecodedAudioMono> {
	// 1 channel, 1 frame is a dummy; we only use it for decodeAudioData
	const ctx = new OfflineAudioContext(1, 1, targetSampleRate);
	const buffer = await ctx.decodeAudioData(bytes.slice(0));

	const mono = new Float32Array(buffer.length);
	for (let c = 0; c < buffer.numberOfChannels; c++) {
		const ch = buffer.getChannelData(c);
		for (let i = 0; i < mono.length; i++) mono[i] += ch[i] / buffer.numberOfChannels;
	}
	return { samples: mono, sampleRate: buffer.sampleRate };
}
