import { type } from 'arktype';

import { AnalyzedObservation, MetadataRecord } from './results';
import { Session } from './sessions';

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
