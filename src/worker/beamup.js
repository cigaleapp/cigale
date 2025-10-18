/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { syncCorrections } from '$lib/beamup.svelte.js';
import { openDatabase, swarp } from './index.js';

swarp.syncStoredCorrections(async (_, onProgress) => {
	const db = await openDatabase();
	if (!db.objectStoreNames.contains('BeamupCorrection')) {
		throw new Error('Database does not support Beamup corrections');
	}

	/** @type {Array<{why: string, ids: string[]}>} */
	let failed = [];
	let succeeded = 0;
	const total = await db.count('BeamupCorrection');
	if (total === 0) {
		return { total, failed, succeeded };
	}

	await syncCorrections(db, (ids, error) => {
		if (error) {
			failed.push({ why: error, ids });
		} else {
			succeeded++;
		}

		onProgress((failed.length + succeeded) / total);
	});

	return { total, failed, succeeded };
});
