import { run } from './lib/generator.js';
import { Bees } from './modules/bees.js';
import { BirdNetClassmapping } from './modules/birdnet.js';
import { Birds } from './modules/birds.js';
import { CoLXR, GBIFTaxonInfo, GBIFTaxonomy } from './modules/gbif.js';
import { GoogleDriveSlides, GoogleSlides } from './modules/gslides.js';
import { IDMyBeeDescriptions, IDMyBeeDescriptors, IDMyBeeSpecies } from './modules/idmybee.js';
import { Collembola, Insects } from './modules/insects.js';
import { IRITModels } from './modules/irit.js';
import { IUCN } from './modules/iucn.js';
import { JessicaJoachim } from './modules/jj.js';

if (import.meta.main) {
	await generate();
}

export async function generate() {
	await run({
		metadataId: (clade) => clade,
		output: { options: 'options', images: 'assets' },
		modules: {
			sources: [
				new GoogleDriveSlides(),
				// new IRITModels('full'),
				// new BirdNetClassmapping(),
				// new IRITModels('light'),
				new IDMyBeeSpecies(),
			],
			identifier: new CoLXR(),
			taxonomy: new GBIFTaxonomy(),
			// TODO: add iNat for photos when we have access to the API: find out if we can get the first 5 featured images that inat shows at e.g. https://www.inaturalist.org/taxa/51702-Coccinella-septempunctata. using gbif media seems too unreliable, theres plenty of images that arent photos of the species
			enrich: [
				new JessicaJoachim(),
				new IUCN(),
				new GoogleSlides(),
				new GBIFTaxonInfo(),
				new IDMyBeeDescriptions(),
			],
			specializations: [new Birds(), new Insects(), new Collembola(), new Bees()],
			metadatabuilders: [new IDMyBeeDescriptors()],
		},
	});
}
