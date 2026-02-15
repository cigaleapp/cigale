import { gatherToTree } from '../../../../../lib/file-tree.js';

/**
 * @import { TreeNode } from '../../../../../lib/file-tree.js';
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
		paths: [csv],
		help: 'Métadonnées des images exportées',
		contentType: () => 'text/csv'
	});

	gatherToTree({
		tree: nodes,
		provenance: 'metadata.json',
		paths: [json],
		help: "Export JSON complet de l'analyse",
		contentType: () => 'application/json'
	});

	gatherToTree({
		tree: nodes,
		provenance: 'images.cropped',
		paths: [cropped.toJSON()],
		help: 'Images recadrées',
		contentType: () => 'image/x-unknown'
	});

	gatherToTree({
		tree: nodes,
		provenance: 'images.original',
		paths: [original.toJSON()],
		help: 'Images originales',
		contentType: () => 'image/x-unknown'
	});

	return { protocol, initialTree: nodes };
}
