import { type } from 'arktype';

import { Protocol } from './protocols';
import { AnalyzedObservation } from './results';
import { Session } from './sessions';

export const Analysis = type({
	observations: type({
		'[string]': AnalyzedObservation
	}).describe("Associe l'ID d'une observation à son label et les valeurs de ses métadonnées"),
	session: Session.describe("La session d'analyse")
});
