import type { DecodedAudioMono } from './decode.js';

export interface WaveformSvgOptions {
	/** Number of peak columns (also the viewBox width). Default 1000. */
	columns?: number;
	/** viewBox height. Default 200. */
	height?: number;
	/** Fill/stroke colour. */
	color?: string;
	/** Background colour, or null for transparent. Default null. */
	background?: string | null;
	/** Scale so the loudest peak touches the edges. Default true. */
	normalize?: boolean;
}

/**
 * WORKER-SAFE: no canvas, no DOM. Takes mono samples (see decodeToMono in
 * decode.ts) and returns a single scalable SVG string
 */
export function renderWaveformSvg(
	{ samples }: DecodedAudioMono,
	options: WaveformSvgOptions = {}
): string {
	if (samples.length === 0) throw new Error('Audio contains no samples');

	const columns = Math.max(1, options.columns ?? 1000);
	const height = Math.max(1, options.height ?? 200);
	const color = options.color ?? 'var(--waveform-color)';
	const background = options.background ?? null;
	const normalize = options.normalize ?? true;

	// Min/max sample value for each column.
	const n = samples.length;
	const min = new Float32Array(columns);
	const max = new Float32Array(columns);
	let loudest = 0;
	for (let x = 0; x < columns; x++) {
		const start = Math.floor((x * n) / columns);
		const end = Math.min(n, Math.max(start + 1, Math.floor(((x + 1) * n) / columns)));
		let lo = Infinity;
		let hi = -Infinity;
		for (let i = start; i < end; i++) {
			const v = samples[i];
			if (v < lo) lo = v;
			if (v > hi) hi = v;
		}
		min[x] = lo;
		max[x] = hi;
		loudest = Math.max(loudest, Math.abs(lo), Math.abs(hi));
	}
	const scale = normalize && loudest > 0 ? 1 / loudest : 1;

	// One closed polygon: along the top edge (max) left to right,
	// then back along the bottom edge (min) right to left.
	const mid = height / 2;
	const fmt = (v: number) => (Math.round(v * 10) / 10).toString();
	const top: string[] = [];
	const bottom: string[] = [];
	for (let x = 0; x < columns; x++) {
		const cx = x + 0.5;
		top.push(`${fmt(cx)} ${fmt(mid - max[x] * scale * mid)}`);
		bottom.push(`${fmt(cx)} ${fmt(mid - min[x] * scale * mid)}`);
	}
	const d = `M${top.join('L')}L${bottom.reverse().join('L')}Z`;

	const bg = background
		? `<rect width="${columns}" height="${height}" fill="${background}"/>`
		: '';

	// The non-scaling stroke keeps silent sections visible as a 1px line at any size.
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${columns}" height="${height}" ` +
		`viewBox="0 0 ${columns} ${height}" preserveAspectRatio="none">` +
		bg +
		`<path d="${d}" fill="${color}" stroke="${color}" stroke-width="1" ` +
		`vector-effect="non-scaling-stroke"/></svg>`;

	return svg;
}
