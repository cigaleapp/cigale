/**
 * Run vitest on all git-dirty files (including those with inline tests)
 */

// Get all modified files from git status
const gitResult = await Bun.$`git status -s`;
const lines = gitResult.text().split('\n').filter(Boolean);

// Extract file paths and create Bun.file objects
const files = lines
	.map((line) => line.substring(3).trim())
	.map((path) => ({ path, file: Bun.file(path) }));

// Filter for existing files
const dirtyFiles = (
	await Promise.all(files.map(async (f) => (await f.file.exists()) ? f.path : null))
).filter(Boolean) as string[];

if (dirtyFiles.length === 0) {
	console.info('No dirty files found');
	process.exit(0);
}

console.info(`Found ${dirtyFiles.length} dirty file(s):\n${dirtyFiles.join('\n')}\n`);

// Run vitest with the dirty files
const proc = Bun.spawn(['bun', 'run', 'vitest', '--watch', ...dirtyFiles], {
	stdio: ['inherit', 'inherit', 'inherit'],
});

process.exit(await proc.exited);
