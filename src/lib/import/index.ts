import { ACCEPTED_SIDECAR_TYPES } from '$lib/sidecars.js';

import * as audio from './audio.svelte.js';
import * as images from './images.svelte.js';

export const ACCEPTED_IMPORT_TYPES = [
	'application/zip',
	...images.ACCEPTED_IMPORT_TYPES,
	...audio.ACCEPTED_IMPORT_TYPES,
	...ACCEPTED_SIDECAR_TYPES,
];
