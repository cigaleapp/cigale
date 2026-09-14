import { type } from 'arktype';

import { GeoJSONFeature } from '../geojson.js';
import { ensureArray } from '../utils.js';
import { ColorHex, ID, NamespacedMetadataID } from './common.js';
import { JsonataExpression } from './expressions.js';
import { MetadataRecord } from './metadata.js';

const ChartBlockBase = type({
	title: 'string',
	'needs?': ['string[]', '@', 'Métadonnées nécéssaire pour le calcul'],
	description: 'string = ""',
});

const Image = type({ id: 'string', filename: 'string', metadata: MetadataRecord(ID) });

export const ComputationPayloadSession = type({
	createdAt: 'Date',
	metadata: MetadataRecord(ID),
	images: Image.array(),
	observations: type({
		label: 'string',
		metadataOverrides: MetadataRecord(ID),
		metadata: MetadataRecord(ID),
		images: Image.array(),
	}).array(),
});

export const ComputationPayload = type.or(
	ComputationPayloadSession.and({
		scope: '"session"',
	}),
	{
		scope: '"user"',
		sessions: ComputationPayloadSession.array(),
	}
);

/**
 * @template {import('arktype').Type} T
 * @param {T} Out
 */
const Computation = (Out) =>
	JsonataExpression(
		ComputationPayload,
		Out.or('undefined|null'),
		Out.extends('unknown[]') ? ensureArray : undefined
	);

export const ChartBlockFigure = ChartBlockBase.and({
	type: '"figure"',
	'suffix?': 'string',
	'prefix?': 'string',
	compute: Computation(type('string|number')),
}).describe('Un gros chiffre ou texte');

export const ChartBlockPartition = ChartBlockBase.and({
	type: '"partition"',
	compute: Computation(type({ value: 'number', label: 'string', 'color?': ColorHex }).array()),
}).describe(
	'Un diagramme de répartition, avec des parts se sommant à 100%. Souvant représenté avec des diagrammes camembert par exemple'
);

export const ChartBlockMap = ChartBlockBase.and({
	type: '"map"',
	compute: Computation(
		GeoJSONFeature(
			type({
				'fill?': ColorHex,
				'outline?': ColorHex,
				'label?': 'string',
				'stroke?': {
					'color?': ColorHex,
					'width?': 'number',
				},
			})
		).array()
	),
}).describe('Une carte du monde avec des zones, lignes et points');

export const ChartBlockHistogram = ChartBlockBase.and({
	type: '"histogram"',
	compute: Computation(type({ x: 'number|string', y: 'number' }).array()),
	'axes?': {
		'x?': Computation(type('(string|number)[]')),
		'y?': Computation(type('(string|number)[]')),
	},
}).describe('Un histogramme ou diagramme en barre');

export const ChartBlockGraph = ChartBlockBase.and({
	type: '"graph"',
	compute: Computation(
		type({
			axes: { x: '(string|number)[]', y: '(string|number)[]' },
			lines: type({
				label: 'string',
				'color?': ColorHex,
				dashed: 'boolean = false',
				points: type({ x: 'number', y: 'number' }).array(),
				'presentation?': type.enumerated('pointcloud', 'segments'),
			}).array(),
		})
	),
});

export const ChartBlockSpotlight = ChartBlockBase.and({
	type: '"spotlight"',
	metadata: ID.or(NamespacedMetadataID),
	compute: Computation(type('string|number')),
}).describe("Mettre en avant une option d'une métadonnée de type enum");

export const ChartBlockList = ChartBlockBase.and({
	type: '"list"',
	compute: Computation(type('string[]')),
}).describe("Liste d'éléments");

export const ChartBlockText = ChartBlockBase.and({
	type: "'text'",
	compute: Computation(type('string')).default('null'),
}).describe(
	"Peut être utilisé pour afficher du texte arbitraire. Sur ce block, 'compute' peut être omis pour simplement faire un bloc statique de texte grâce à title & description"
);

export const ChartBlock = type.or(
	// None
	ChartBlockFigure,
	// https://www.layerchart.com/docs/components/Waffle maybe, or if sum of all values > 1000,
	// https://www.layerchart.com/docs/components/BarChart stacked with a single series
	ChartBlockPartition,
	// WorldMap component
	ChartBlockMap,
	// https://www.layerchart.com/docs/components/BarChart
	ChartBlockHistogram,
	// https://www.layerchart.com/docs/components/LineChart
	// https://www.layerchart.com/docs/components/ScatterChart
	ChartBlockGraph,
	// None
	ChartBlockList,
	// None
	ChartBlockText,
	// None
	ChartBlockSpotlight
);

export const Charts = type({
	blocks: type.Record('string', ChartBlock),
	'layout?': '(string|null)[][]',
	'sections?': type.Record('string', {
		title: 'string',
		layout: '(string|null)[][]',
	}),
});
