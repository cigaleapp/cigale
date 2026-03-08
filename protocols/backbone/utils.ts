import path from 'node:path';

export function here(...segments: string[]) {
	return Bun.file(path.join(import.meta.dir, ...segments));
}

export function entries<K extends string, V>(subject: Record<K, V>): Array<[K, V]> {
	// @ts-expect-error
	return Object.entries(subject);
}
