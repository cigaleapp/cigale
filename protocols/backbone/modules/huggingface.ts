import { Module } from '../module.ts';

export const MODELS = {
	detectors: {
		'YOLO v11': {
			scope: 'arthropoda',
			imagesize: 640
		}
	},
	classifiers: {
		'Arthropodes (~17k classes)': {
			scope: 'arthropoda',
			imagesize: 224
		},
		'Collemboles (~80 classes)': {
			scope: 'collembola',
			imagesize: 224
		}
	}
};

export const module: Module<{ ids: Set<string> }> = {
	name: 'Hugging Face',
	data: {
		ids: new Set()
	},
	async totalSteps() {
		return Object.keys(MODELS.classifiers).length;
	},
	async *run() {
		let done = 0;
		for (const { scope } of Object.values(MODELS.classifiers)) {
			const response = await fetch(huggingface('classifier', scope, 'classmapping'));
			const classmapping = await response.text();

			done++;

			classmapping
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => Boolean(line))
				.filter((line) => !Number.isNaN(Number.parseInt(line)))
				.forEach((klass) => this.data.ids.add(klass));

			yield done;
		}
	},
	apply(protocol) {
		const { detectors, classifiers } = MODELS;

		if (protocol.metadata.species.type !== 'enum') throw 'species metadata should be an enum';

		protocol.metadata.species.infer = {
			neural: Object.entries(classifiers).map(([name, { scope, imagesize }]) => ({
				name,
				model: huggingface('classifier', scope, 'model'),
				classmapping: huggingface('classifier', scope, 'classmapping'),
				input: {
					width: imagesize,
					height: imagesize,
					disposition: 'CHW',
					normalized: true
				}
			}))
		};

		for (const gbifId of this.data.ids) {
			protocol.metadata.species.options!.push({
				key: gbifId,
				label: '',
				synonyms: [],
				description: '',
				learnMore: `https://gbif.org/species/${gbifId}`
			});
		}

		if (protocol.metadata.crop.type !== 'boundingbox')
			throw 'crop metadata should be of boundingbox type';

		protocol.metadata.crop.infer = {
			neural: Object.entries(detectors).map(([name, { scope, imagesize }]) => ({
				name,
				model: huggingface('detector', scope, 'model'),
				input: {
					height: imagesize,
					width: imagesize,
					disposition: '1CHW',
					normalized: true
				},
				output: {
					normalized: true,
					shape: ['sx', 'sy', 'ex', 'ey', 'score', '_']
				}
			}))
		};
	}
};

export default module;

export function huggingface(
	task: 'detector' | 'classifier',
	scope: string,
	type: 'model' | 'classmapping'
) {
	const ending = {
		model: '.onnx',
		classmapping: '-classmapping.txt'
	}[type];

	return `https://huggingface.co/cigaleapp/built-in-protocols/resolve/main/${task}-${scope}${ending}?download=true`;
}
