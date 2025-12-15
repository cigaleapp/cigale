import { tables } from './idb.svelte';
import { modelUrl } from './inference';
import { fetchHttpRequest, nonnull } from './utils';

/**
 * @import * as DB from '$lib/database';
 */

/**
 * Downloads all models associated with this protocol, to make them available offline.
 * @param {string[]} protocolIds
 * @param {(p: {done: number, total: number, modelNo: number, modelURL: string}) => void} [onProgress]
 */
export async function prepareForOfflineUse(protocolIds, onProgress) {
	const protocols = tables.Protocol.state.filter((p) => protocolIds.includes(p.id));
	if (protocols.length < protocolIds.length)
		throw new Error(`Some protocols not found in ${protocolIds.join(', ')}`);

	const models = [
		...protocols.flatMap((protocol) => protocol.crop.infer?.map((i) => i.model) ?? []),
		...protocols.flatMap((protocol) =>
			protocol.metadata
				.map((metadataId) => tables.Metadata.getFromState(metadataId))
				.filter(nonnull)
				.flatMap(({ infer }) => {
					if (infer && 'neural' in infer) return infer.neural.map(({ model }) => model);
					return [];
				})
		)
	];

	const results = await Promise.allSettled(
		models.map((model, i) =>
			fetchHttpRequest(model, {
				cacheAs: 'model',
				onProgress({ total, transferred }) {
					onProgress?.({
						done: transferred,
						total,
						modelNo: i,
						modelURL: modelUrl(model)
					});
				}
			})
		)
	);

	if (results.some((r) => r.status === 'rejected')) {
		throw new Error(
			'Could not download all models: ' +
				results
					.map((result, i) => {
						if (result.status === 'fulfilled') return;

						return `${modelUrl(models[i])}: ${result.reason}`;
					})
					.filter(nonnull)
					.join('; ')
		);
	}
}
