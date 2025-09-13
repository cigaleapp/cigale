import { $ } from 'bun';
import { execSync } from 'node:child_process';
import { platform } from 'node:os';

const versionfile = Bun.file('.bun-version');

if (!versionfile.exists()) {
	console.error('.bun-version file is missing!');
	process.exit(1);
}

const expectedVersion = (await versionfile.text()).trim();

const currentVersion = await $`bun --version`.then((p) => p.text()).then((v) => v.trim());

if (currentVersion !== expectedVersion) {
	console.error(`Bun version mismatch! Expected ${expectedVersion}, but found ${currentVersion}.`);
	console.info('Installing the correct Bun version...');

	if (platform() === 'win32') {
		execSync(`iex "& {$(irm https://bun.com/install.ps1)} -Version ${expectedVersion}"`, {
			shell: 'powershell.exe'
		});
	} else {
		await $`curl -fsSL https://bun.com/install | bash -s "bun-v${expectedVersion}"`;
	}
}
