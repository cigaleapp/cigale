import { type } from 'arktype';

import { Protocol } from './protocols';
import { AnalyzedObservation } from './results';

export const Analysis = type({
	observations: type({
		'[string]': AnalyzedObservation
	}).describe("Associe l'ID d'une observation à son label et les valeurs de ses métadonnées"),
	protocol: Protocol.describe("Le protocole utilisé pour cette session d'analyse")
});
