import { type } from 'arktype';

/**
 * Semi-open range [start=0, end)
 */
export function range(startOrEnd: number, end: number | undefined = undefined) {
	if (end === undefined) {
		return Array.from({ length: startOrEnd }, (_, i) => i);
	}
	return Array.from({ length: end - startOrEnd }, (_, i) => i + startOrEnd);
}

export const JSONPResponse = type('<T>', [
	[
		'string',
		'=>',
		(response) => JSON.parse(response.replace(new RegExp(`^[\\w_]+\\((.*)\\)$`), '$1'))
	],
	'|>',
	'T'
]);

// ANSI control sequences
class CC {
	static clearline = '\x1b[2K';
	static red = '\x1b[31m';
	static reset = '\x1b[0m';
	static dim = '\x1b[2m';
	static blue = '\x1b[34m';
	static bold = '\x1b[1m';
	static yellow = '\x1b[33m';
	static cyan = '\x1b[36m';
	static green = '\x1b[32m';
}

export function yellow(text: string): string {
	return `${CC.yellow}${text}${CC.reset}`;
}

export function cyan(text: string): string {
	return `${CC.cyan}${text}${CC.reset}`;
}

export function red(text: string): string {
	return `${CC.red}${text}${CC.reset}`;
}

export function bold(text: string): string {
	return `${CC.bold}${text}${CC.reset}`;
}

export function dim(text: string): string {
	return `${CC.dim}${text}${CC.reset}`;
}

export function percentage(part: number, total: number, precision = 0): string {
	return ((part / total) * 100).toFixed(precision).padStart(3 + precision, ' ') + '%';
}

export function align<T extends string | number>(num: T, total: T | T[]): string {
	const maxlen = Array.isArray(total)
		? Math.max(...total.map((t) => t.toString().length))
		: total.toString().length;

	// right-align numbers, left-align strings
	if (typeof num === 'number') {
		return num.toString().padStart(maxlen);
	} else {
		return num.toString().padEnd(maxlen);
	}
}

export function chunkBySize<T>(by: number, items: T[]): T[][] {
	return new Array(Math.ceil(items.length / by))
		.fill([])
		.map((_, i) => items.slice(i * by, (i + 1) * by));
}
