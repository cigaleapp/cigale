import { type } from 'arktype';
import { conversions } from 'convert/conversions';

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
 */
export function availableUnitsFor(unit) {
	// TODO turn [...x] into just x once Vite build supports Iterator#flatMap
	// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/flatMap
	const kind = [...conversions.values()].find((kind) =>
		kind.units.some(
			(u) =>
				/** @type {readonly string[]} */ (u.names).includes(unit) ||
				('symbols' in u && /** @type {readonly string[]} */ (u.symbols).includes(unit))
		)
	);

	if (!kind) return [];

	return kind.units.map(
		(u) =>
			/** @type {const} */ ({
				names: u.names,
				symbols: 'symbols' in u ? u.symbols : [],
			})
	);
}
