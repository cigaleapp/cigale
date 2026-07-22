import type { PermissionStatus } from '@capacitor/geolocation';

import { Geolocation } from '@capacitor/geolocation';

export async function getCurrentLocation() {
	const permission = await Geolocation.checkPermissions().catch((e): PermissionStatus => {
		console.error('Checking for geolocation permissions failed', e);
		return {
			location: 'denied',
			coarseLocation: 'denied',
		};
	});

	if (permission.location !== 'granted') {
		const ok = await Geolocation.requestPermissions()
			.then((perms) => perms.location !== 'denied')
			.catch((e) => {
				console.error('Asking for geolocation permissions failed', e);
				return {
					location: 'denied',
					coarseLocation: 'denied',
				};
			});

		if (!ok) return;
	}

	const { coords, timestamp } = await Geolocation.getCurrentPosition({
		enableHighAccuracy: true,
	});

	return { timestamp, ...coords };
}
