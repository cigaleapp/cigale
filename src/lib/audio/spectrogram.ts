import type { DecodedAudioMono } from './decode.js';
import type { CoordinatesDomain } from '$lib/BoundingBoxes.svelte.js';
import type * as DB from '$lib/database.js';
import type { AudioSample } from 'mediabunny';

import { AudioSampleSink } from 'mediabunny';

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

type SpectrogramInfo = NonNullable<(typeof DB.Schemas.AudioFile)['inferIn']['spectrogram']>;

const PALETTES = {
	/** Classic magma theme */
	magma: [
		[0, 0, 4],
		[40, 11, 84],
		[101, 21, 110],
		[159, 42, 99],
		[212, 72, 66],
		[245, 125, 21],
		[250, 193, 39],
		[252, 255, 164],
	],

	/** Magma reversed: light cream → near black. Best light-theme default. */
	magma_light: [
		[255, 255, 255],
		[252, 253, 191],
		[254, 186, 128],
		[248, 118, 92],
		[211, 67, 110],
		[152, 45, 128],
		[95, 24, 127],
		[34, 17, 80],
		[0, 0, 4],
	],

	/** Viridis: fine on either theme */
	viridis: [
		[68, 1, 84],
		[70, 51, 126],
		[54, 92, 141],
		[39, 127, 142],
		[31, 161, 135],
		[74, 194, 109],
		[159, 218, 58],
		[253, 231, 37],
	],

	/** YlGnBu: light-background heatmap */
	ylgnbu: [
		[255, 255, 255],
		[255, 255, 217],
		[237, 248, 177],
		[199, 233, 180],
		[127, 205, 187],
		[65, 182, 196],
		[29, 145, 192],
		[34, 94, 168],
		[37, 52, 148],
		[8, 29, 88],
	],
} as const;

export function paletteSVGFilter(theme: keyof typeof PALETTES) {
	const stops = PALETTES[theme];
	const channel = (i: number) => stops.map((s) => (s[i] / 255).toFixed(4)).join(' ');
	const alpha = () => stops.map((_, i) => (i === 0 ? 0 : 1)).join(' ');

	return `
		<svg width="0" height="0" style="position:absolute" aria-hidden="true">
			<filter id="spectro-palette" color-interpolation-filters="sRGB">
				<feComponentTransfer>
					<feFuncR type="table" tableValues="${channel(0)}" />
					<feFuncG type="table" tableValues="${channel(1)}" />
					<feFuncB type="table" tableValues="${channel(2)}" />
					<feFuncA type="table" tableValues="${alpha()}" />
				</feComponentTransfer>
			</filter>
		</svg>
	`;
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

export interface SpectrogramStreamOptions {
	/** Sample rate of the incoming audio in Hz. */
	sampleRate: number;
	/** Total duration in seconds. Needed up front to lay out the columns. */
	duration: number;
	/** FFT window size, power of two. Default 2048. */
	fftSize?: number;
	/** Image width in px. Default: ~4 columns per FFT window, capped at 4096. */
	width?: number;
	//   /** Image height in px. Default 512. */
	//   height?: number;
	/** Highest frequency to show in Hz. Default: Nyquist. */
	maxFrequency?: number;
	/** Level mapped to black, in dBFS. Default -90. */
	minDb?: number;
	/** Level mapped to white, in dBFS. Default 0. */
	maxDb?: number;
}

export interface SpectrogramImages {
	/** Grayscale PNG (apply your colour palette with a CSS/SVG filter). */
	full: ArrayBuffer;
	/** Smaller PNG, only present if a preview size was requested. */
	preview?: ArrayBuffer;
}

/**
 * Builds a spectrogram incrementally as audio arrives.
 *
 * Memory use is constant: only the pixel buffer (width x height x 4 bytes)
 * and a window of unprocessed samples are kept, never the whole file.
 * Worker-safe: uses no DOM APIs, only OffscreenCanvas at the end.
 */
export class SpectrogramBuilder {
	private readonly duration: number;
	private readonly sampleRate: number;
	private readonly fftSize: number;
	private readonly width: number;
	private readonly height: number;
	private readonly minDb: number;
	private readonly maxDb: number;
	private readonly span: number; // start of the last window = total - fftSize
	private readonly maxBin: number;
	private readonly maxFreq: number;
	private readonly norm: number;

	private readonly hann: Float64Array;
	private readonly fft: (re: Float64Array, im: Float64Array) => void;
	private readonly re: Float64Array;
	private readonly im: Float64Array;
	private readonly db: Float32Array;
	private readonly pixels: Uint8ClampedArray<ArrayBuffer>;

	// Sliding window of samples not yet fully consumed.
	// Invariant: buf[0..len) holds global samples [bufStart, bufStart + len).
	private buf = new Float32Array(0);
	private len = 0;
	private bufStart = 0;
	private nextCol = 0;

	// Scratch space for AudioSample conversion.
	private mono = new Float32Array(0);
	private plane = new Float32Array(0);

	constructor(o: SpectrogramStreamOptions) {
		this.sampleRate = o.sampleRate;
		this.fftSize = o.fftSize ?? 2048;
		if (this.fftSize < 2 || (this.fftSize & (this.fftSize - 1)) !== 0) {
			throw new Error('fftSize must be a power of two');
		}
		if (!(o.duration > 0) || !(o.sampleRate > 0)) {
			throw new Error('duration and sampleRate must be positive');
		}

		this.duration = o.duration;

		this.height = FULLSIZE_SPECTROGRAM_HEIGHT;
		this.minDb = o.minDb ?? -90;
		this.maxDb = o.maxDb ?? 0;

		const total = Math.max(this.fftSize, Math.round(o.duration * o.sampleRate));
		this.span = total - this.fftSize;
		this.width = Math.max(
			1,
			o.width ?? Math.min(4096, Math.floor(this.span / (this.fftSize / 4)) + 1)
		);

		const nyquist = o.sampleRate / 2;
		this.maxFreq = Math.min(o.maxFrequency ?? nyquist, nyquist);
		this.maxBin = (this.maxFreq / nyquist) * (this.fftSize / 2);

		this.hann = new Float64Array(this.fftSize);
		let sum = 0;
		for (let i = 0; i < this.fftSize; i++) {
			this.hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / this.fftSize));
			sum += this.hann[i];
		}
		this.norm = 2 / sum; // full-scale sine reads as 0 dBFS

		this.fft = createFFT(this.fftSize);
		this.re = new Float64Array(this.fftSize);
		this.im = new Float64Array(this.fftSize);
		this.db = new Float32Array(this.fftSize / 2 + 1);

		// Opaque black; columns are filled in as audio arrives.
		this.pixels = new Uint8ClampedArray(this.width * this.height * 4);
		for (let i = 3; i < this.pixels.length; i += 4) this.pixels[i] = 255;
	}

	/** Fraction of columns rendered so far, 0..1. */
	get progress(): number {
		return this.nextCol / this.width;
	}

	/** True once every column is rendered; further input is ignored. */
	get isComplete(): boolean {
		return this.nextCol >= this.width;
	}

	/** Feed the next chunk of mono Float32 samples (in order, no gaps). */
	push(samples: Float32Array): void {
		if (this.isComplete || samples.length === 0) return;

		this.ensureCapacity(this.len + samples.length);
		this.buf.set(samples, this.len);
		this.len += samples.length;

		// Render every column whose window is now fully available.
		while (this.nextCol < this.width) {
			const start = this.colStart(this.nextCol) - this.bufStart;
			if (start + this.fftSize > this.len) break;
			this.renderColumn(this.nextCol, start);
			this.nextCol++;
		}

		// Drop samples no later column needs.
		const keepFrom = this.isComplete
			? this.len
			: Math.min(this.len, this.colStart(this.nextCol) - this.bufStart);
		if (keepFrom > 0) {
			this.buf.copyWithin(0, keepFrom, this.len);
			this.len -= keepFrom;
			this.bufStart += keepFrom;
		}
	}

	/**
	 * Feed a Mediabunny AudioSample. Any channel count and sample format is
	 * accepted; channels are averaged to mono. Does NOT close the sample.
	 */
	async pushAudioSample(sample: AudioSample): Promise<void> {
		if (this.isComplete) return;
		if (sample.sampleRate !== this.sampleRate) {
			throw new Error(
				`Sample rate changed mid-stream (${this.sampleRate} -> ${sample.sampleRate})`
			);
		}
		const frames = sample.numberOfFrames;
		const channels = sample.numberOfChannels;
		if (this.mono.length < frames) {
			this.mono = new Float32Array(frames);
			this.plane = new Float32Array(frames);
		}
		const mono = this.mono.subarray(0, frames);
		const plane = this.plane.subarray(0, frames);
		mono.fill(0);

		for (let c = 0; c < channels; c++) {
			await sample.copyTo(plane, { planeIndex: c, format: 'f32-planar' });
			for (let i = 0; i < frames; i++) mono[i] += plane[i] / channels;
		}
		this.push(mono);
	}

	/**
	 * Finish and encode. Columns not reached (stream shorter than `duration`)
	 * are rendered from zero-padded audio, i.e. silence.
	 */
	async finish(): Promise<{
		images: {
			full: Blob;
			preview: Blob;
		};
		info: SpectrogramInfo;
	}> {
		while (this.nextCol < this.width) {
			const start = this.colStart(this.nextCol) - this.bufStart;
			this.renderColumn(this.nextCol, start);
			this.nextCol++;
		}

		const preview = {
			height: PREVIEW_SPECTROGRAM_HEIGHT,
			width: (this.width / this.height) * PREVIEW_SPECTROGRAM_HEIGHT,
		};

		const full = new OffscreenCanvas(this.width, this.height);
		full.getContext('2d')!.putImageData(
			new ImageData(this.pixels, this.width, this.height),
			0,
			0
		);

		const jobs: Promise<Blob>[] = [toPng(full)];

		const small = new OffscreenCanvas(preview.width, preview.height);
		const ctx = small.getContext('2d')!;
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(full, 0, 0, preview.width, preview.height);
		jobs.push(toPng(small));

		const [fullPng, previewPng] = await Promise.all(jobs);

		return {
			images: { full: fullPng, preview: previewPng },
			info: {
				imageDimensions: { width: this.width, height: this.height },
				durationRange: [0, this.duration * 1e3],
				frequencyRange: [0, this.maxFreq],
				volumeRange: [this.minDb, this.maxDb],
			},
		};
	}

	/* ---------------------------- internals ---------------------------- */

	/** Global sample index where column x's window starts. */
	private colStart(x: number): number {
		return this.width === 1 ? 0 : Math.round((x * this.span) / (this.width - 1));
	}

	private ensureCapacity(needed: number): void {
		if (this.buf.length >= needed) return;
		const next = new Float32Array(Math.max(needed, this.buf.length * 2));
		next.set(this.buf.subarray(0, this.len));
		this.buf = next;
	}

	/** `start` is relative to buf[0]; samples past `len` are treated as zeros. */
	private renderColumn(x: number, start: number): void {
		const { fftSize, re, im, db, hann, buf, height, pixels, width } = this;

		const available = Math.max(0, Math.min(fftSize, this.len - start));
		for (let i = 0; i < available; i++) re[i] = buf[start + i] * hann[i];
		for (let i = available; i < fftSize; i++) re[i] = 0;
		im.fill(0);
		this.fft(re, im);

		const bins = fftSize / 2;
		for (let k = 0; k <= bins; k++) {
			db[k] = 20 * Math.log10(Math.hypot(re[k], im[k]) * this.norm + 1e-12);
		}

		for (let y = 0; y < height; y++) {
			const frac = height === 1 ? 0 : 1 - y / (height - 1); // low freq at bottom
			const bin = frac * this.maxBin;
			const lo = Math.floor(bin);
			const hi = Math.min(lo + 1, bins);
			const t = bin - lo;
			const level = db[lo] * (1 - t) + db[hi] * t;

			const n = Math.min(1, Math.max(0, (level - this.minDb) / (this.maxDb - this.minDb)));
			const v = Math.round(n * 255);
			const o = (y * width + x) * 4;
			pixels[o] = pixels[o + 1] = pixels[o + 2] = v;
		}
	}
}

/* ------------------------------------------------------------------ */

async function toPng(canvas: OffscreenCanvas): Promise<Blob> {
	return await canvas.convertToBlob({ type: 'image/png' });
}

/** In-place radix-2 FFT for a fixed size. */
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
