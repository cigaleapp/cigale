import type { DatabaseHandle } from '#lib/idb.svelte.js';
import { NetworkStreamedLines } from '#lib/schemas/network.js';
import { NeuralEnumInference } from '#lib/schemas/neural.js';

const Config = NeuralEnumInference.get('classmapping');
type Config = (typeof Config)['inferIn'];

export async function loadClassmapping(
	db: DatabaseHandle
)
