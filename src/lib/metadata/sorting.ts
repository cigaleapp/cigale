import * as dates from 'date-fns';

import type * as DB from '$lib/database.js';
import type { RuntimeValue } from '$lib/schemas/metadata';

import { switchOnMetadataType } from '.';

/**
 * Returns a comparator function to sort metadata values according to their runtime value.
 * @param  args
 * @param  args.metadata the metadata to sort with
 * @param args.options the options of the metadata, if it's an enum
 * @returns
 */
function compareMetadataValues({
	type,
	options = []
}: {
	type: DB.MetadataType;
	options?: DB.MetadataEnumVariant[];
}): (a: RuntimeValue, b: RuntimeValue) => number {
	return (a, b) =>
		switchOnMetadataType<number>(type, [a, b], {
			boolean: (a, b) => Number(a) - Number(b),
			integer: (a, b) => a - b,
			float: (a, b) => a - b,
			date: (a, b) => dates.compareAsc(new Date(a), new Date(b)),
			string: (a, b) => a.localeCompare(b),
			location: (a, b) => a.latitude - b.latitude || a.longitude - b.longitude,
			boundingbox: (a, b) => a.x - b.x || a.y - b.y || a.w - b.w || a.h - b.h,
			enum: (a, b) => {
				const optionA = options.find((opt) => opt.key === a);
				const optionB = options.find((opt) => opt.key === b);
				if (optionA?.index !== undefined && optionB?.index !== undefined) {
					return optionA.index - optionB.index;
				} else if (optionA) {
					return -1;
				} else if (optionB) {
					return 1;
				} else {
					return a.toString().localeCompare(b.toString());
				}
			}
		});
}

/**
 * Compare observation or images by their value of a given metadata
 * @param {object} args
 * @param {DB.Metadata} args.metadata the metadata to sort with
 * @param {DB.MetadataEnumVariant[]} [args.options] the options of the metadata, if it's an enum
 * @returns {(a: { metadata: DB.MetadataValues }, b: { metadata: DB.MetadataValues }) => number}
 */
export function compareByMetadataValue({
	metadata,
	options = []
}: {
	metadata: Pick<DB.Metadata, 'id' | 'type'>;
	options?: DB.MetadataEnumVariant[];
}): (a: { metadata: DB.MetadataValues }, b: { metadata: DB.MetadataValues }) => number {
	const comparator = compareMetadataValues({ type: metadata.type, options });
	return (a, b) => {
		const valueA = a.metadata[metadata.id]?.value ?? null;
		const valueB = b.metadata[metadata.id]?.value ?? null;

		if (valueA === null && valueB === null) return 0;
		if (valueA === null) return -1;
		if (valueB === null) return 1;

		return comparator(valueA, valueB);
	};
}
