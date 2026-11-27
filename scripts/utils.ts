import { execFileSync, execSync } from 'node:child_process';

/**
 * Start the cmdline with "$ " to log the commandline
 */
export function sh(...cmd: string[]): string {
	if (cmd[0].startsWith('$ ')) {
		console.info(cmd.join(' '));
		cmd[0] = cmd[0].replace(/^\$ /, '');
	}

	if (cmd.length === 1) return execSync(cmd[0], { encoding: 'utf8' }).trim();

	const [program, ...args] = cmd;
	return execFileSync(program, args, { encoding: 'utf8' }).trim();
}
