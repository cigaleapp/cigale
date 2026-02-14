import { type } from 'arktype';

import { MetadataRecord } from './metadata.js';
import { AnalyzedObservation } from './results.js';
import { Session } from './sessions.js';

export const Analysis = type({
	observations: type({
		'[string]': AnalyzedObservation
	}).describe("Associe l'ID d'une observation à son label et les valeurs de ses métadonnées"),
	session: Session.omit('metadata')
		.and({
			metadata: MetadataRecord
		})
		.describe("La session d'analyse")
});
