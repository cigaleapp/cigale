import { type } from 'arktype';

export const UpdateBundleMetadata = type({
	sha: 'string',
	version: '/^0.0.\\d+$/',
	android_native_code_version: 'string.integer',
	checksum: 'string.hex',
});
