import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';
import type { MetadataType, RuntimeValue } from '$lib/schemas/metadata.js';

import { ArkErrors } from 'arktype';
import convert from 'convert';
import {
	differenceInDays,
	differenceInHours,
	differenceInMilliseconds,
	differenceInMinutes,
	differenceInMonths,
	differenceInSeconds,
	differenceInYears,
} from 'date-fns';

import { distanceBetweenGeoCoordinates } from '$lib/geolocation.js';
import {
	ensureNamespacedMetadataId,
	Granularity,
	InferenceConfigs,
	removeNamespaceFromMetadataId,
} from '$lib/schemas/metadata.js';
import { entries, mapKeys, safeJSONParse, switchValue, transformObject, zip } from '$lib/utils.js';

import { resolveMetadataImport } from '../imports.js';
import { hasRuntimeType } from '../types.js';

export async function inferHttp(
	db: DatabaseHandle,
	protocolId: string,
	config: DB.Metadata,
	values: Record<NamespacedMetadataID, DB.MetadataValue>
) {
	const settings = InferenceConfigs.http(config.type).get('http')(
		config.infer && 'http' in config.infer ? config.infer.http : undefined
	);

	if (settings instanceof ArkErrors) return;

	const payload = transformObject(values, (key, { value, ...rest }) => {
		if (!settings.needs.some((need) => ensureNamespacedMetadataId(need, protocolId) === key))
			return;

		return [removeNamespaceFromMetadataId(key), { ...rest, value: safeJSONParse(value) }];
	});

	debugger;
	const url = settings.from.render(payload);

	if (!url) return;
	if (!URL.canParse(url)) return;

	const data = await fetch(url).then((r) => r.json());

	const output = await settings.select.evaluate({ metadata: values, ...data });

	return output;
}

export async function httpInferencesToRefresh(
	db: DatabaseHandle,
	protocolId: string,
	changes: Record<NamespacedMetadataID, [before: RuntimeValue | undefined, now: RuntimeValue]>
) {
	console.time('compute http inferences to refresh');

	const toRefresh: DB.Metadata[] = [];
	const protocol = await db.get('Protocol', protocolId);

	for (const id of protocol?.metadata ?? []) {
		const metadata = await db.get('Metadata', resolveMetadataImport(protocol, id));
		if (!metadata) continue;

		// Greatly improves performance (as opposed to shouldRefreshHttpInference that does a arktype check)
		if (!('infer' in metadata)) continue;
		if (!('http' in metadata.infer)) continue;

		if (await shouldRefreshHttpInference(db, protocolId, metadata, changes)) {
			toRefresh.push(metadata);
		}
	}

	console.timeEnd('compute http inferences to refresh');

	return toRefresh;
}

async function shouldRefreshHttpInference(
	db: DatabaseHandle,
	protocolId: string,
	config: DB.Metadata & {
		infer: ReturnType<(typeof InferenceConfigs)['http']>['infer'];
	},
	changes: Record<NamespacedMetadataID, [before: RuntimeValue | undefined, now: RuntimeValue]>
) {
	const settings = InferenceConfigs.http(config.type).get('http')(config.infer.http);

	if (settings instanceof ArkErrors) return;

	const granularities = mapKeys(settings.granularities ?? {}, (key) =>
		ensureNamespacedMetadataId(key, protocolId)
	);

	// debugger

	for (const [metadataId, [before, now]] of entries(changes)) {
		const metadata = await db.get('Metadata', metadataId);
		if (!metadata) continue;

		const { type } = metadata;

		const granularitySchema = Granularity[metadata.type];
		const granularity = granularities[metadataId];

		if (before !== undefined && !hasRuntimeType(type, before)) continue;
		if (!hasRuntimeType(type, now)) continue;
		if (granularitySchema && !granularitySchema.allows(granularity)) continue;

		type ChangedArgs = {
			[t in MetadataType]: {
				type: t;
				granularity: undefined | NonNullable<(typeof Granularity)[t]>['infer'];
				old: undefined | RuntimeValue<t>;
				now: RuntimeValue<t>;
			};
		}[MetadataType];

		function changed(args: ChangedArgs) {
			if (!args.granularity) return args.old !== args.now;

			switch (args.type) {
				case 'date': {
					const diff = switchValue(args.granularity, {
						millisecond: differenceInMilliseconds,
						second: differenceInSeconds,
						minute: differenceInMinutes,
						hour: differenceInHours,
						day: differenceInDays,
						month: differenceInMonths,
						year: differenceInYears,
					});

					return Math.abs(diff(args.old, args.now)) >= 1;
				}

				case 'integer':
				case 'float': {
					return Math.abs(args.old - args.now) >= args.granularity;
				}

				case 'boundingbox': {
					function coords(box: RuntimeValue<'boundingbox'>) {
						return [box.x, box.y, box.w, box.h];
					}

					for (const [o, n] of zip(coords(args.old), coords(args.now))) {
						if (Math.abs(o - n) >= args.granularity) return true;
					}

					return false;
				}

				case 'location': {
					if (!args.old) return true;

					const { gval, gunit } = /^(?<gval>-?\d+(?:.\d+)?)(?<gunit>cm|m|km)$/.exec(
						args.granularity
					)!.groups!;

					return (
						distanceBetweenGeoCoordinates(args.old, args.now) >=
						convert(Number(gval), gunit as 'cm' | 'm' | 'km').to('meters')
					);
				}
			}
		}

		// @ts-expect-error union is not discrimnated here
		if (changed({ type, granularity, old: before, now })) return true;
	}

	return false;
}
