import type { MetadataValues } from './database.js';
import { list, tables } from './idb.svelte';
import { compareByMetadataValue, metadataOptionsKeyRange, metadataValueGrouper } from './metadata';
import { removeNamespaceFromMetadataId, splitMetadataId } from './schemas/metadata';
import type { GroupSettings, SortSettings } from './schemas/sessions.js';
import { getSettings } from './settings.svelte.js';
import { applySortDirection, compareBy, type Comparator } from './utils';

export type GalleryItem<AdditionalData> = {
	sessionId: string;
	id: string;
	name: string;
	addedAt: Date;
	virtual: boolean;
	metadata: MetadataValues;
	data: AdditionalData;
};

export async function galleryItemsSorter<D>(
	settings: typeof SortSettings.infer
): Promise<Comparator<GalleryItem<D>>> {
	const dir = (comparator: Comparator<GalleryItem<D>>) =>
		applySortDirection(settings.direction, comparator);

	switch (settings.field) {
		case 'id':
			return dir(compareBy('id'));
		case 'name':
			return dir(compareBy((item) => item.name));
		case 'metadataConfidence': {
			if (!settings.metadata) {
				throw new Error(
					'Tried to sort by metadata confidence without specifying metadata ID'
				);
			}

			return dir(compareBy((item) => item.metadata?.[settings.metadata!]?.confidence ?? 0));
		}
		case 'metadataValue': {
			if (!settings.metadata) {
				throw new Error('Tried to sort by metadata value without specifying metadata ID');
			}

			const metadataId = splitMetadataId(settings.metadata);
			if (!metadataId.namespace) {
				throw new Error(
					`Tried to sort by metadata value with non-namespaced metadata ID ${JSON.stringify(settings.metadata)}`
				);
			}

			return dir(
				compareByMetadataValue({
					metadata: await tables.Metadata.getOrThrow(settings.metadata),
					options: await list(
						'MetadataOption',
						metadataOptionsKeyRange(metadataId.namespace, metadataId.id)
					)
				})
			);
		}
	}
}

/**
 *
 * @returns Either null (no grouping) or a function that takes a gallery item and returns [key to sort the groups on, group label]
 */
export async function galleryItemsGrouper<D>(
	settings: typeof GroupSettings.infer
): Promise<null | ((item: GalleryItem<D>) => [number | string, string])> {
	if (settings.field === 'none') return null;

	if (!settings.metadata) {
		throw new Error(`tried to group by ${settings.field} without specifying metadata ID`);
	}

	const metadata = await tables.Metadata.getOrThrow(settings.metadata);
	const label = metadata.label || removeNamespaceFromMetadataId(metadata.id);

	switch (settings.field) {
		case 'metadataPresence': {
			return (item) => {
				const has = item.metadata[settings.metadata!] !== undefined;

				return has ? [0, `Avec ${label}`] : [1, `Sans ${label}`];
			};
		}

		case 'metadataConfidence': {
			return (item) => {
				const confidence = item.metadata[settings.metadata!]?.confidence;

				if (confidence >= 0.75) return [0, `${label}: confiance à 75%-100%`];
				if (confidence >= 0.5) return [1, `${label}: confiance à 50%-75%`];
				if (confidence >= 0.25) return [2, `${label}: confiance à 25%-50%`];
				if (confidence !== undefined) return [3, `${label}: confiance à 0%-25%`];
				else return [4, `Sans ${label}`];
			};
		}

		case 'metadataValue': {
			const metadataId = splitMetadataId(settings.metadata);
			if (!metadataId.namespace) {
				throw new Error(
					`Tried to group by metadata value with non-namespaced metadata ID ${JSON.stringify(settings.metadata)}`
				);
			}

			const options = await list(
				'MetadataOption',
				metadataOptionsKeyRange(metadataId.namespace, metadataId.id)
			);

			const grouper = metadataValueGrouper({
				type: metadata.type,
				language: getSettings().language,
				options
			});

			return (item) => {
				const value = item.metadata[settings.metadata!]?.value;
				if (value === undefined) return [options.length, `Sans ${label}`];
				const group = grouper(value);
				return [
					options.find((opt) => opt.key === value)?.index ?? group,
					`${label} = ${group}`
				];
			};
		}
	}
}
