import { exampleProtocol, expect, test } from '../fixtures.js';
import {
	confirmDeletionModal,
	dumpDatabase,
	goToProtocolManagement,
	importPhotos,
	importProtocol,
	importResults,
	newSession
} from '../utils/index.js';

test.skip(
	Boolean(process.env.CI),
	'Skipping database dumps and exports on CI, these are meant as easy way to (re)create dump fixtures locally only.'
);
