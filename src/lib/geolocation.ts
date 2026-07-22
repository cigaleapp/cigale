import type { PermissionStatus } from '@capacitor/geolocation';

import { Geolocation } from '@capacitor/geolocation';

// XXX: no $lib alias here, this file is imported by $lib/exif which is used in $lib/schemas/*
import { clamp } from './utils.js';

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

export function geolocationAccuracyToConfidence(accuracy: number): number {
	if (!accuracy) return 1;

	// We consider that 30m is the worst accuracy possible, resulting in a confidence of 0%

	return clamp(30 / accuracy, 0, 1);
}

export function gpsDilutionOfPrecisionToConfidence(dop: number): number {
	// See https://en.wikipedia.org/wiki/Dilution_of_precision#Interpretation
	// TODO(#1984): maybe allow protocol to specify different threshold?
	// cuz for e.g. Panoramax, the dop -> score conversion is much more demanding (<5 is considered bad)
	// thank wikipedia (<20 is bad)
	// See https://docs.panoramax.fr/pictures-metadata/quality_score/#gps-position-accuracy

	return clamp(20 / dop, 0, 1);
}

export function geolocationAccuracyFromMake(make: string | undefined): number | undefined {
	if (!make) return;

	// Thanks to https://gitlab.com/panoramax/server/geo-picture-tag-reader/-/blob/302f2839daa615c6124a330336ed8b155f382cb9/geopic_tag_reader/camera.py
	const perMake: Record<string, number> = {
		// Diff GPS
		stfmani: 2,
		trimble: 2,
		imajing: 2,
		// Good GPS
		gopro: 4,
		insta360: 4,
		garmin: 4,
		viofo: 4,
		xiaoyi: 4,
		blackvue: 4,
		tectectec: 4,
		'arashi vision': 4,
		qoocam: 4,
		dji: 4,
		// Smartphone GPS
		akaso: 5,
		samsung: 5,
		xiaomi: 5,
		huawei: 5,
		ricoh: 5,
		lenovo: 5,
		motorola: 5,
		oneplus: 5,
		apple: 5,
		google: 5,
		sony: 5,
		wiko: 5,
		asus: 5,
		cubot: 5,
		lge: 5,
		fairphone: 5,
		realme: 5,
		symphony: 5,
		crosscall: 5,
		htc: 5,
		homtom: 5,
		'hmd global': 5,
		oppo: 5,
		ulefone: 5,
	};

	return perMake[make.toLowerCase().trim()];
}
