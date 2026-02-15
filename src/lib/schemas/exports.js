import { type } from 'arktype';

import { MetadataRecord } from './metadata.js';
import { AnalyzedObservation } from './results.js';
import { Session } from './sessions.js';

export const Analysis = type({
	observations: type
		.Record('string', AnalyzedObservation)
		.describe("Associe l'ID d'une observation à son label et les valeurs de ses métadonnées"),
	session: Session.omit('metadata')
		.and({
			metadata: MetadataRecord
		})
		.describe("La session d'analyse"),
	files: type
		.Record('string', 'string')
		.describe(
			"Associe une référence de fichier à son chemin dans le .zip d'exportation. Les références de fichiers sont les valeurs des métadonnées de type 'file'"
		)
		.default(() => ({}))
});
