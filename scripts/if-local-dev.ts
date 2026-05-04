// Runs the given command only if we're in a local development environment (not in CI).

if (process.env.CI) {
	console.info('Not in local dev environment (CI=true)');
	process.exit(0);
}

const [cmd, ...args] = process.argv[2].split(' ');

if (!cmd) {
	console.error('No command provided');
	process.exit(1);
}

await Bun.spawn({
	cmd: [cmd, ...args],
	stdout: 'inherit',
	stderr: 'inherit',
});
