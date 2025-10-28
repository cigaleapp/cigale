import { gatherToTree } from './utils.js';

/**
 * @import { TreeNode } from './utils.js';
 */

export async function load({ parent }) {
	const protocol = await parent();

	/**
	 * @type {TreeNode}
	 */
	const nodes = [];

	const {
		images: { cropped, original },
		metadata: { csv, json }
	} = protocol.exports ?? {
		images: {
			cropped: { toJSON: () => 'cropped/{{ sequence }}.{{ extension image.filename }}' },
			original: { toJSON: () => 'original/{{ sequence }}.{{ extension image.filename }}' }
		},
		metadata: {
			csv: 'metadata.csv',
			json: 'metadata.json'
		}
	};

	gatherToTree({
		tree: nodes,
		provenance: 'metadata.csv',
		path: csv,
		help: 'Métadonnées des images exportées'
	});

	gatherToTree({
		tree: nodes,
		provenance: 'metadata.json',
		path: json,
		help: "Export JSON complet de l'analyse"
	});

	gatherToTree({
		tree: nodes,
		provenance: 'images.cropped',
		path: cropped.toJSON(),
		help: 'Images recadrées'
	});

	gatherToTree({
		tree: nodes,
		provenance: 'images.original',
		path: original.toJSON(),
		help: 'Images originales'
	});

	return { protocol, initialTree: nodes };
}
