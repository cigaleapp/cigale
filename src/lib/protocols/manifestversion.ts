import manifestVersion from './current-version.json' with { type: 'json' };

export const MANIFEST_VERSION = {
	...manifestVersion,
	toString() {
		return `${this.major}.${this.minor}`;
	},
};

function parseManifestVersion(version: string) {
	const [major, minor] = version.split('.');

	return {
		major: Number.parseInt(major),
		minor: Number.parseInt(minor),
	};
}

/**
 * Makes sure that a given protocol can be installed
 * by checking its manifestVersion against the one
 * we're running under
 */
export function manifestVersionsCompatible(manifestVersion: string) {
	const protocol = parseManifestVersion(manifestVersion);
	const installed = MANIFEST_VERSION;

	return protocol.major === installed.major && protocol.minor <= installed.minor;
}
