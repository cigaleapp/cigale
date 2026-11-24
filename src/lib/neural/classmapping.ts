import type { DatabaseHandle } from '#lib/idb.svelte.js';
import type { NamespacedMetadataID } from '#lib/schemas/common.js';

import { httpStreamProcessLines } from '#lib/http-streaming.ts';
import { namespaceToMetadataOptionInDB } from '#lib/schemas/metadata.js';
import { ClassmappingLineParsed, NeuralEnumInference } from '#lib/schemas/neural.js';
import { compareBy, switchValue } from '#lib/utils.ts';

const Config = NeuralEnumInference.pick('classmapping', 'classes');
type Config = (typeof Config)['inferIn'];

/** Returns metadata enum variant keys */
export async function loadClassmapping(
	db: DatabaseHandle,
	metadataId: NamespacedMetadataID,
	config: Config,
	options: {
		onProgress: (done: number, total: number) => void | Promise<void>;
	}
): Promise<(string | null)[]> {
	const cfg = Config.from(config);

	/** Keyed by output layer neuron index */
	const classes = new Map<number, string | null>();

	let i = -1;
	for await (const line of httpStreamProcessLines(ClassmappingLineParsed, config.classmapping, {
		fallback: true,
	})) {
		i++;

		if (line.progressInFile) await options.onProgress(line.progressInFile, 1);

		if (!line.parsed) {
			throw new Error(`loadClassmapping had no parse for line ${line.index + 1}`);
		}

		const [ref, value, index = i] =
			typeof line.parsed === 'string'
				? [cfg.classes, line.parsed]
				: [line.parsed.ref, line.parsed.value, line.parsed.neuron];

		if (ref === 'keys') {
			classes.set(index, value);
			continue;
		}

		const option = await db.getFromIndex(
			'MetadataOption',
			switchValue(ref, {
				labels: 'namespacedLabel',
				extraKeys: 'namespacedExtraKeys',
			}),
			namespaceToMetadataOptionInDB(metadataId, value)
		);

		if (!option) {
			console.warn(
				`Classmapping line ${value} doesn't match with any option's ${ref}, yielding null to mean this value is unsupported`
			);

			classes.set(index, null);
			continue;
		}

		classes.set(index, option.key);
	}

	return [...classes].sort(compareBy(([i]) => i)).map(([, key]) => key);
}
