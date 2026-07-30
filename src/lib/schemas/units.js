import { type } from 'arktype';
import { conversions } from 'convert/conversions';

/**
 * @import { ValueOfMap } from '$lib/utils.js';
 */

export const NumericUnit = type.enumerated(
	// TODO turn ...[...x] into just ...x once Vite build supports Iterator#flatMap
	// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/flatMap
	...[...conversions.values()].flatMap(
		({ units }) =>
			/** @type {import('convert').Unit[]} */
			(units.flatMap((unit) => [...unit.names, ...('symbols' in unit ? unit.symbols : [])]))
	)
);

/**
 *
 * @param {string} nameOrSymbol
 */
export function findUnit(nameOrSymbol) {
	// TODO turn [...x] into just x once Vite build supports Iterator#flatMap
	// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/flatMap
	return /** @type {import('convert').Unit | undefined} */ (
		[...conversions.values()]
			.flatMap((kind) => kind.units)
			.find(
				(u) =>
					u.names.includes(nameOrSymbol) ||
					('symbols' in u && u.symbols.includes(nameOrSymbol))
			)
	);
}

/**
 *
 * @param {import('convert').Unit} unit
 * @returns {import('convert').Unit[]}
 */
export function availableUnitsFor(unit) {
	/**
	 *
	 * @param {ValueOfMap<typeof conversions>['units'][number]} def
	 * @param {import('convert').Unit} u
	 * @returns
	 */
	const matchesUnitDefinition = (def, u) => def.names.includes(u) || def.symbols.includes(u);

	// TODO turn [...x] into just x once Vite build supports Iterator#flatMap
	// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/flatMap
	const kind = [...conversions.values()].find((kind) =>
		kind.units.some((def) => matchesUnitDefinition(def, unit))
	);

	if (!kind) return [];

	const best = new Set([...kind.best.metric, ...kind.best.imperial]);
	const currentUnitSymbols = new Set([
		...(kind.units.find((def) => matchesUnitDefinition(def, unit))?.symbols ?? []),
	]);

	let candidates = kind.units;

	if (best.size > 1 && best.intersection(currentUnitSymbols).size > 0) {
		candidates = candidates.filter(({ symbols }) => symbols.some((symbol) => best.has(symbol)));
	}

	return candidates.map(({ names: [name] }) => /** @type {import('convert').Unit} */ (name));
}

/**
 *
 * @param {import('convert').Unit} unit
 * @returns {{symbol: string, name: string }}
 */
export function displayUnit(unit) {
	const u = [...conversions.values()]
		.flatMap((kind) => kind.units)
		.find((u) => [...u.names, ...u.symbols].includes(unit));

	if (!u) return { symbol: '', name: '' };

	const { names, symbols } = u;
	const name = names.find(Boolean) ?? '';
	let symbol = symbols.find(Boolean) ?? '';

	if (symbol === 'C' || symbol === 'F') {
		symbol = `°${symbol}`;
	}

	return { name, symbol };
}

/**
 *
 * @param {import('convert').Unit} unit
 */
export function unitKind(unit) {
	const found = [...conversions.entries()].find(([, { units }]) =>
		units.some((u) => [...u.names, ...u.symbols].includes(unit))
	);

	if (!found) return;

	return found[0];
}
