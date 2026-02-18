import { type } from 'arktype';

import { ID, NamespacedMetadataID } from './common.js';
import { MetadataRecord } from './metadata.js';
import { AnalyzedObservation } from './results.js';
import { Session } from './sessions.js';

export const Analysis = type({
	observations: type
		.Record('string', AnalyzedObservation)
		.describe("Associe l'ID d'une observation à son label et les valeurs de ses métadonnées"),
	session: Session.omit('metadata')
		.and({
			metadata: MetadataRecord(NamespacedMetadataID),
			// TODO(2026-02-17): remove the default in a little while
			protocolMetadata: MetadataRecord(ID).default(() => ({}))
		})
		.describe("La session d'analyse"),
	files: type
		.Record('string', 'string')
		.describe(
			"Associe une référence de fichier à son chemin dans le .zip d'exportation. Les références de fichiers sont les valeurs des métadonnées de type 'file'"
		)
		.default(() => ({}))
});
