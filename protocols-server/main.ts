import { startServer } from './lib/server.js';
import { run } from './lib/generator.js';
import { Arthropods, Springtails } from './specializations/arthropods.js';
import { Bees } from './specializations/bees.js';
import { BirdNetClassmapping } from './modules/birdnet.js';
import { Birds } from './specializations/birds.js';
import { CoLXR, GBIFOldBackboneIDs, GBIFTaxonInfo, GBIFTaxonomy } from './modules/gbif.js';
import { GoogleDriveSlides, GoogleSlides } from './modules/gslides.js';
import {
	AndrenaMorphogroups,
	IDMyBeeDescriptions,
	IDMyBeeDescriptors,
	IDMyBeeSpecies,
} from './modules/idmybee.js';
import { FrenchArthro, SmallCollemboles } from './modules/irit.js';
import { IUCN } from './modules/iucn.js';
import { JessicaJoachim } from './modules/jj.js';

if (import.meta.main) {
	const args = process.argv.slice(2);
	if (args.includes('--serve')) {
		// Server mode: start the HTTP server, with an initial regeneration
		// unless --no-regenerate is passed (or AUTO_REGENERATE=false).
		if (args.includes('--no-regenerate')) {
			process.env.AUTO_REGENERATE = 'false';
		}
		startServer();
	} else {
		// One-shot mode (default): run the pipeline once and exit. Useful for
		// debugging, and what the server spawns for /api/regenerate.
		await generate();
	}
}

export async function generate() {
	await run({
		metadataId: (clade) => clade,
		output: { options: 'options', images: 'assets' },
		modules: {
			sources: [
				new GoogleDriveSlides(),
				new FrenchArthro(),
				new BirdNetClassmapping(),
				new SmallCollemboles(),
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
				new AndrenaMorphogroups(),
				new GBIFOldBackboneIDs(),
			],
			specializations: [new Birds(), new Arthropods(), new Springtails(), new Bees()],
			metadatabuilders: [new IDMyBeeDescriptors()],
		},
	});
}
