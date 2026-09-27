import { type } from 'arktype';
import { convert, MeasureKind } from 'convert';
import NaturalRegex from 'natural-regex';

import { describeNaturalRegex } from '../natural-regex-tokens.js';
import { switchValue } from '../utils.js';

/**
 * @import { UnitsByMeasure } from 'convert'
 */

/**
 * @template {MeasureKind|string} Kind
 * @typedef {object} Requirement
 * @property {number|null} limit null means no requirement
 * @property {UnitsOf<Kind>} unit
 */

export const RegexExpression = type('string').pipe.try((source) => new RegExp(source));

export const NaturalRegexExpression = type('string')
	.pipe.try((source) => {
		try {
			const regex = NaturalRegex.from(`start, ${source}, end`);

			return {
				source,
				regex,
				display: describeNaturalRegex(source),
			};
		} catch (e) {
			if (e instanceof Function) {
				// Trust
				throw new Error(e.message, { cause: e });
			}

			throw e;
		}
	})
	.describe(
		"Une description d'un motif avec la syntaxe de natural-regex, cf https://github.com/mbasso/natural-regex/wiki/Operators,-operands-and-expressions. Par exemple, 'group uppercase letter, word, space end group minimum 2 times then <, email, >' correspond à un motif pour Prénom Nom <email>. Voir https://github.com/mbasso/natural-regex/wiki/Examples pour plus d'exemples."
	);

const comparatorsMore = /** @type {const} */ ({
	'>': 'gt',
	'>=': 'gte',
	'≥': 'gte',
});

const comparatorsLess = /** @type {const} */ ({
	'<': 'lt',
	'<=': 'lte',
	'≤': 'lte',
});

const comparators = /** @type {const} */ ({
	...comparatorsLess,
	...comparatorsMore,
});

/**
 * @overload
 * @param {"gt" | "gte"} op
 * @returns {"lt" | "lte"}
 */

/**
 * @overload
 * @param {"lt" | "lte"} op
 * @returns {"gt" | "gte"}
 */

/**
 *
 * @param {typeof comparators[keyof typeof comparators]} op
 * @returns {typeof comparators[keyof typeof comparators]}
 */
function flipComparator(op) {
	switch (op) {
		case 'gt':
			return 'lt';
		case 'gte':
			return 'lte';
		case 'lt':
			return 'gt';
		case 'lte':
			return 'gte';
	}
}

const reg = /** @type {const} */ ({
	float: '(-?\\d+(?:[.,]\\d+)?(?:[eE][+-]?\\d+)?)',
	comp: '(' + Object.keys(comparators).join('|') + ')',
	compLess: '(' + Object.keys(comparatorsLess).join('|') + ')',
});

/**
 * @param {string} s
 * @returns {typeof comparators[keyof typeof comparators] | undefined}
 */
function findComparator(s) {
	// @ts-expect-error
	return comparators[s.match(reg.comp)?.[1]];
}

/**
 * @param {string} s
 * @returns {typeof comparatorsLess[keyof typeof comparatorsLess] | undefined}
 */
function findLessComparator(s) {
	// @ts-expect-error
	return comparatorsLess[s.match(reg.compLess)?.[1]];
}

/**
 * @param {string} s
 * @returns {number | undefined}
 */
function findFloat(s) {
	const parsed = Number.parseFloat(s.match(reg.float)?.[1]?.replace(',', '.') ?? '');
	if (Number.isNaN(parsed)) return undefined;
	if (!Number.isFinite(parsed)) return undefined;
	return parsed;
}

/**
 * @typedef {({ gt?: number } | { gte?: number }) & ({ lt?: number } | { lte?: number })} NumberRange
 */

const numberRangePatterns = {
	open: `((?:x\\s*)?${reg.comp}\\s*${reg.float})`,
	closed: `(${reg.float}\\s*${reg.compLess}\\s*x\\s*${reg.compLess}\\s*${reg.float})`,
	interval: `(${reg.float}\\s*[.][.]\\s*${reg.float})`,
};

export const NumberRangeLiteral = type(
	new RegExp('^' + Object.values(numberRangePatterns).join('|') + '$')
)
	.pipe.try(
		/** @returns {NumberRange} */
		(s) => {
			if (new RegExp(numberRangePatterns.open).test(s)) {
				const op = findComparator(s);
				const num = findFloat(s);
				if (!op) throw new Error(`Invalid comparator in range literal: ${s}`);
				if (num === undefined) throw new Error(`Invalid number in range literal: ${s}`);

				return { [op]: num };
			}

			if (new RegExp(numberRangePatterns.closed).test(s)) {
				const [lhs, rhs] = s.split(/\\s*x\\s*/);
				const lhsOp = findLessComparator(lhs);
				const rhsOp = findLessComparator(rhs);
				const lhsNum = findFloat(lhs);
				const rhsNum = findFloat(rhs);

				if (!lhsOp) throw new Error(`Invalid left comparator in range literal: ${s}`);
				if (!rhsOp) throw new Error(`Invalid right comparator in range literal: ${s}`);
				if (lhsNum === undefined)
					throw new Error(`Invalid left number in range literal: ${s}`);
				if (rhsNum === undefined)
					throw new Error(`Invalid right number in range literal: ${s}`);

				return {
					[lhsOp]: lhsNum,
					[flipComparator(rhsOp)]: rhsNum,
				};
			}

			if (new RegExp(numberRangePatterns.interval).test(s)) {
				const [min, max] = s.split(/\s*[.][.]\s*/);
				const minNum = findFloat(min);
				const maxNum = findFloat(max);

				if (minNum === undefined)
					throw new Error(`Invalid minimum number in range literal: ${s}`);
				if (maxNum === undefined)
					throw new Error(`Invalid maximum number in range literal: ${s}`);

				return {
					gte: minNum,
					lte: maxNum,
				};
			}

			throw new Error(`Invalid number range literal: ${s}`);
		}
	)
	.pipe((range) => {
		const max = 'lt' in range ? range.lt : 'lte' in range ? range.lte : undefined;
		const min = 'gt' in range ? range.gt : 'gte' in range ? range.gte : undefined;

		return { ...range, min, max };
	})
	.describe(
		"Un intervalle de nombres, sous les formes suivantes: '> 5', '<= 5', '5 < x ≤ 10', '5..10'. Précisément, il y a quatres formes possibles:\n- Op n (avec Op un des opérateurs >, >=, <, <=, ≥, ≤),\n- x Op n (qui est équivalent à Op n, mais permet de ne pas commencer l'expression avec un caractère '>', utile en YAML),\n- m Op x Op M (avec m et M des nombres, et Op un des opérateurs <, <=, ≤),\n- m..M (avec m et n des nombres), qui est un équivalent de m ≤ x ≤ M."
	);

/**
 *
 * @template {string} Prop
 * @template {MeasureKind.Data|MeasureKind.Frequency|string} Kind
 * @param {Prop} property
 * @param {Kind} kind
 * @param {Kind extends MeasureKind ? UnitsByMeasure<Kind> : null} convertTo which unit to convert the main figure to, or null if the "unit" is just a count of something that doesnt need converting
 * @returns
 */
const HardwareRequirementCompositeString = (property, kind, convertTo) => {
	const numberPattern = '[+-]?\\d+(?:\\.\\d+)?';
	const unitPatterns = /** @type {const} */ ({
		[MeasureKind.Data]: '[TGMk]?i?[Bb]',
		[MeasureKind.Frequency]: '[TGMk]?Hz',
	});

	const mainUnit = typeof kind === 'string' ? kind : switchValue(kind, unitPatterns);
	const freqUnit = switchValue(MeasureKind.Frequency, unitPatterns);

	/**
	 * @param {string} groupname
	 * @param {string} unitpattern
	 */
	const withUnit = (groupname, unitpattern) =>
		`(?<${groupname}>${numberPattern}\\s+${unitpattern})`;

	const pattern = new RegExp(
		'^' +
			[
				`(?:${withUnit('main', mainUnit)}\\s*@\\s*${withUnit('freq', freqUnit)})`,
				withUnit('main', mainUnit),
				withUnit('freq', freqUnit),
				'\\s*',
			].join('|') +
			'$'
	);

	/**
	 * @template {MeasureKind|string} Kind
	 * @typedef {Kind extends MeasureKind ? UnitsByMeasure<Kind> : null} UnitsOf
	 */

	return type(pattern).pipe(
		/**
		 * @param {string} subject
		 * @returns { { frequency: Requirement<MeasureKind.Frequency> } & Record<Prop, Requirement<Kind>>}
		 */
		(subject) => {
			const match = pattern.exec(subject);

			/**
			 *
			 * @template {MeasureKind} Kind
			 * @param {string|undefined} group
			 * @param {UnitsByMeasure<Kind>|null} convertTo
			 */
			const processGroup = (group, convertTo) => {
				if (!group) {
					/** @type {Requirement<Kind>} */
					return {
						limit: null,
						unit: convertTo,
					};
				}

				const [number, unit] = group.split(/\s+/).map((part) => part.trim());

				const amount = Number.parseFloat(number);

				/**
				 * @param {number} x
				 * @param {UnitsOf<Kind>} unit
				 */
				const normalizeUnit = (x, unit) =>
					convertTo
						? convert(x, /** @type {UnitsByMeasure<Kind>} */ (unit)).to(convertTo)
						: x;

				return {
					limit: normalizeUnit(amount, /** @type {UnitsOf<Kind>} */ (unit)),
					unit: convertTo,
				};
			};

			const processFreq = /** @type {typeof processGroup<MeasureKind.Frequency>} */ (
				processGroup
			);

			return /** @type {const} */ ({
				[property]: processGroup(match?.groups?.main, convertTo),
				frequency: processFreq(match?.groups?.freq, 'Hz'),
			});
		}
	);
};

export const HardwareRequirements = type({
	cpu: HardwareRequirementCompositeString('threads', 'threads', null).default(''),
	ram: HardwareRequirementCompositeString('capacity', MeasureKind.Data, 'GB').default(''),
	vram: HardwareRequirementCompositeString('capacity', MeasureKind.Data, 'GB').default(''),
});

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe('HardwareRequirements', () => {
		test('complex case', () => {
			const reqs = HardwareRequirements.assert({
				cpu: '8 threads @ 2.1 GHz',
				ram: '4 GB @ 500 MHz',
				vram: '1 GHz',
			});

			expect(reqs).toMatchObject({
				cpu: {
					frequency: {
						limit: 2100000000,
						unit: 'Hz',
					},
					threads: {
						limit: 8,
						unit: null,
					},
				},
				ram: {
					capacity: {
						limit: 4,
						unit: 'GB',
					},
					frequency: {
						limit: 500000000,
						unit: 'Hz',
					},
				},
				vram: {
					capacity: {
						limit: null,
						unit: 'GB',
					},
					frequency: {
						limit: 1000000000,
						unit: 'Hz',
					},
				},
			});
		});

		test('just a ram & threads limit', () => {
			const reqs = HardwareRequirements.assert({
				cpu: '4 threads',
				ram: '4 GB',
			});

			expect(reqs).toMatchObject({
				cpu: {
					frequency: {
						limit: null,
						unit: 'Hz',
					},
					threads: {
						limit: 4,
						unit: null,
					},
				},
				ram: {
					capacity: {
						limit: 4,
						unit: 'GB',
					},
					frequency: {
						limit: null,
						unit: 'Hz',
					},
				},
				vram: {
					capacity: {
						limit: null,
						unit: 'GB',
					},
					frequency: {
						limit: null,
						unit: 'Hz',
					},
				},
			});
		});
	});
}
