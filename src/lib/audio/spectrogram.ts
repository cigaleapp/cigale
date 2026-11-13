import type { DecodedAudioMono } from './decode.js';
import type { CoordinatesDomain } from '$lib/BoundingBoxes.svelte.js';
import type * as DB from '$lib/database.js';

export const AUDIO_SPECTROGRAM_ROOT_FOLDER = '.audio_spectrograms';
export type AudioSpectrogramsFolders =
	| typeof AUDIO_SPECTROGRAM_ROOT_FOLDER
	| `${typeof AUDIO_SPECTROGRAM_ROOT_FOLDER}/full`
	| `${typeof AUDIO_SPECTROGRAM_ROOT_FOLDER}/preview`;

const PREVIEW_SPECTROGRAM_HEIGHT = 512;
const FULLSIZE_SPECTROGRAM_HEIGHT = 1080;

interface SpectrogramOptions {
	/** FFT window size, must be a power of two. Default 2048. */
	fftSize?: number;
	/** Output image width in px. Default: one column per hop, capped at maxWidth. */
	width?: number;
	/** Output image height in px. Default 512. */
	height?: number;
	/** Cap for the auto-computed width. Default 4096. */
	maxWidth?: number;
	/** Hop between FFT frames (only used to pick the default width). Default fftSize / 4. */
	hopSize?: number;
	/** Highest frequency to display in Hz. Default: Nyquist. */
	maxFrequency?: number;
	/** Level mapped to the darkest colour, in dBFS. Default -90. */
	minDb?: number;
	/** Level mapped to the brightest colour, in dBFS. Default 0. */
	maxDb?: number;
}

type SpectrogramInfo = NonNullable<(typeof DB.Schemas.AudioFile)['inferIn']['analysis']>;

/**
 * Decode an audio file (mp3, wav, ogg, flac, m4a... whatever the browser supports)
 * and render its spectrogram as two PNGs: a fullsized one and a preview one that's smaller.
 *
 * @param audioBytes Raw bytes of the audio file.
 * @returns PNG blob
 */
export async function generateSpectrograms(
	{ samples, sampleRate }: DecodedAudioMono,
	options: SpectrogramOptions = {}
): Promise<{
	images: { full: Blob; preview: Blob };
	info: SpectrogramInfo;
}> {
	const fftSize = options.fftSize ?? 2048;
	if (fftSize < 2 || (fftSize & (fftSize - 1)) !== 0) {
		throw new Error('fftSize must be a power of two');
	}
	const height = options.height ?? FULLSIZE_SPECTROGRAM_HEIGHT;
	const minDb = options.minDb ?? -90;
	const maxDb = options.maxDb ?? 0;
	const hop = options.hopSize ?? fftSize / 4;

	// Pad short clips so there is at least one full window.
	const data =
		samples.length >= fftSize
			? samples
			: (() => {
					const padded = new Float32Array(fftSize);
					padded.set(samples);
					return padded;
				})();

	const naturalFrames = Math.floor((data.length - fftSize) / hop) + 1;
	const width = Math.max(1, options.width ?? Math.min(naturalFrames, options.maxWidth ?? 4096));

	// 2. Frequency axis: which FFT bins are displayed.
	const nyquist = sampleRate / 2;
	const maxFreq = Math.min(options.maxFrequency ?? nyquist, nyquist);
	const binCount = fftSize / 2;
	const maxBin = (maxFreq / nyquist) * binCount; // fractional

	// 3. Precompute window, FFT tables, colour map.
	const window = new Float64Array(fftSize);
	let windowSum = 0;
	for (let i = 0; i < fftSize; i++) {
		window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / fftSize)); // Hann
		windowSum += window[i];
	}
	// Scales magnitude so a full-scale sine reads as 0 dBFS.
	const norm = 2 / windowSum;

	const fft = createFFT(fftSize);
	const re = new Float64Array(fftSize);
	const im = new Float64Array(fftSize);
	const db = new Float32Array(binCount + 1);
	const palette = buildPalette();

	// 4. Render one pixel column at a time (no need to keep every frame in memory).
	const pixels = new Uint8ClampedArray(width * height * 4);
	const span = data.length - fftSize;

	for (let x = 0; x < width; x++) {
		const start = width === 1 ? 0 : Math.round((x * span) / (width - 1));
		for (let i = 0; i < fftSize; i++) {
			re[i] = data[start + i] * window[i];
			im[i] = 0;
		}
		fft(re, im);

		for (let k = 0; k <= binCount; k++) {
			const mag = Math.hypot(re[k], im[k]) * norm;
			db[k] = 20 * Math.log10(mag + 1e-12);
		}

		for (let y = 0; y < height; y++) {
			// Low frequencies at the bottom of the image.
			const frac = height === 1 ? 0 : 1 - y / (height - 1);
			const bin = frac * maxBin;
			const lo = Math.floor(bin);
			const hi = Math.min(lo + 1, binCount);
			const t = bin - lo;
			const level = db[lo] * (1 - t) + db[hi] * t;

			const norm01 = Math.min(1, Math.max(0, (level - minDb) / (maxDb - minDb)));
			const p = Math.round(norm01 * 255) * 3;
			const o = (y * width + x) * 4;
			pixels[o] = palette[p];
			pixels[o + 1] = palette[p + 1];
			pixels[o + 2] = palette[p + 2];
			pixels[o + 3] = palette[p + 3];
		}
	}

	return {
		// encode as PNG.
		images: await encodePngs(new ImageData(pixels, width, height)),
		info: {
			imageDimensions: { width, height },
			durationRange: [0, (data.length / sampleRate) * 1e3],
			frequencyRange: [0, maxFreq],
			volumeRange: [minDb, maxDb],
		},
	};
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Returns an in-place radix-2 FFT function for a fixed size. */
function createFFT(n: number) {
	const levels = Math.log2(n);
	const rev = new Uint32Array(n);
	for (let i = 0; i < n; i++) {
		let r = 0;
		for (let b = 0; b < levels; b++) r |= ((i >> b) & 1) << (levels - 1 - b);
		rev[i] = r;
	}
	const cos = new Float64Array(n / 2);
	const sin = new Float64Array(n / 2);
	for (let i = 0; i < n / 2; i++) {
		cos[i] = Math.cos((2 * Math.PI * i) / n);
		sin[i] = Math.sin((2 * Math.PI * i) / n);
	}

	return (re: Float64Array, im: Float64Array) => {
		for (let i = 0; i < n; i++) {
			const j = rev[i];
			if (j > i) {
				let t = re[i];
				re[i] = re[j];
				re[j] = t;
				t = im[i];
				im[i] = im[j];
				im[j] = t;
			}
		}
		for (let size = 2; size <= n; size <<= 1) {
			const half = size >> 1;
			const step = n / size;
			for (let i = 0; i < n; i += size) {
				for (let j = i, k = 0; j < i + half; j++, k += step) {
					const l = j + half;
					const tr = re[l] * cos[k] + im[l] * sin[k];
					const ti = -re[l] * sin[k] + im[l] * cos[k];
					re[l] = re[j] - tr;
					im[l] = im[j] - ti;
					re[j] += tr;
					im[j] += ti;
				}
			}
		}
	};
}

/** 256-entry RGBA lookup table (inferno-like). */
function buildPalette(): Uint8ClampedArray {
	const stops: [number, number, number, number][] = [
		// rgba(0, 0, 4, 0)
		[0, 0, 4, 0],
		// rgba(40, 11, 84, 100)
		[40, 11, 84, 100],
		// rgba(101, 21, 110, 255)
		[101, 21, 110, 255],
		// rgba(159, 42, 99, 255)
		[159, 42, 99, 255],
		// rgba(212, 72, 66, 255)
		[212, 72, 66, 255],
		// rgba(245, 125, 21, 255)
		[245, 125, 21, 255],
		// rgba(250, 193, 39, 255)
		[250, 193, 39, 255],
		// rgba(252, 255, 164, 255)
		[252, 255, 164, 255],
	];
	const lut = new Uint8ClampedArray(256 * 3);
	for (let i = 0; i < 256; i++) {
		const pos = (i / 255) * (stops.length - 1);
		const a = Math.floor(pos);
		const b = Math.min(a + 1, stops.length - 1);
		const t = pos - a;
		for (let c = 0; c < 3; c++) {
			lut[i * 3 + c] = stops[a][c] * (1 - t) + stops[b][c] * t;
		}
	}
	return lut;
}

async function encodePngs(image: ImageData): Promise<{ full: Blob; preview: Blob }> {
	const preview = {
		height: PREVIEW_SPECTROGRAM_HEIGHT,
		width: (image.width / image.height) * PREVIEW_SPECTROGRAM_HEIGHT,
	};

	const full = new OffscreenCanvas(image.width, image.height);
	full.getContext('2d')!.putImageData(image, 0, 0);

	const small = new OffscreenCanvas(preview.width, preview.height);
	const ctx = small.getContext('2d')!;
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(full, 0, 0, preview.width, preview.height);

	// Encode both in parallel
	const [fullBlob, smallBlob] = await Promise.all([
		full.convertToBlob({ type: 'image/png' }),
		small.convertToBlob({ type: 'image/png' }),
	]);

	return { full: fullBlob, preview: smallBlob };
}

/** Return a scaler that can scale relative bounding boxes on a spectrogram image into time/frequency or pixel boxes */
export function spectrogramBoundingBoxDomains(spectrogram: SpectrogramInfo) {
	return {
		pixels: {
			x: [0, spectrogram.imageDimensions.width],
			y: [0, spectrogram.imageDimensions.height],
		},
		timeFrequency: {
			x: spectrogram.durationRange,
			// Spectrograms represent frequency from bottom to top
			// but coordinates are from top to bottom (top-left = (0, 0))
			y: spectrogram.frequencyRange.toReversed() as [number, number],
		},
	} satisfies Record<string, CoordinatesDomain>;
}
