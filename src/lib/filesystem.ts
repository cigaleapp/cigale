export async function writeToFilesystem(
	root: FileSystemDirectoryHandle,
	filepath: string,
	contents: string | Uint8Array
) {
	const [filename, ...directories] = filepath.split('/').filter(Boolean).toReversed();

	let cwd = root;
	for (const directory of directories.toReversed()) {
		cwd = await cwd.getDirectoryHandle(directory, { create: true });
	}

	const writable = await cwd
		.getFileHandle(filename, { create: true })
		.then((file) => file.createWritable());

	await writable.write(contents);
	await writable.close();
}
