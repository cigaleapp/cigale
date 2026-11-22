import { run } from './lib/generator';
import { Bees } from './modules/bees';
import { Birds } from './modules/birds';
import { CoLXR, GBIFTaxonInfo, GBIFTaxonomy } from './modules/gbif';
import { GoogleDriveSlides, GoogleSlides } from './modules/gslides';
import { IDMyBeeDescriptions, IDMyBeeDescriptors, IDMyBeeSpecies } from './modules/idmybee';
import { Collembola, Insects } from './modules/insects';
import { IRITModels } from './modules/irit';
import { IUCN } from './modules/iucn';
import { JessicaJoachim } from './modules/jj';

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
				new IRITModels('light'),
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
