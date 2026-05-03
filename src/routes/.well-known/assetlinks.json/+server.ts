import { json } from '@sveltejs/kit';

const fingerprints = {
	'.preview': [
		'AB:C5:38:E6:0C:15:99:D7:2A:8E:CF:C4:97:C7:A9:B4:9A:1C:4B:6A:C6:BE:5E:09:6B:58:DB:4F:4D:54:6A:55',
	],
	'': [
		'6F:D9:0C:B4:9D:66:5B:0F:AB:2E:79:4C:61:4C:09:D0:1F:47:C6:6A:2D:B1:57:E9:CB:BD:12:48:77:C1:27:1A',
	],
};

export async function GET() {
	return json(
		Object.entries(fingerprints).map(([variant, sha256_cert_fingerprints]) => ({
			relation: ['delegate_permission/common.handle_all_urls'],
			target: {
				namespace: 'android_app',
				package_name: 'io.github.cigaleapp' + variant,
				sha256_cert_fingerprints,
			},
		}))
	);
}
