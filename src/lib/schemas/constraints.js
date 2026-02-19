import { type } from 'arktype';
import NaturalRegex from 'natural-regex';

import { describeNaturalRegex } from '../natural-regex-tokens.js';

export const RegexExpression = type('string').pipe.try((source) => new RegExp(source));

export const NaturalRegexExpression = type('string')
	.pipe.try((source) => {
		try {
			const regex = NaturalRegex.from(`start, ${source}, end`);

			return {
				source,
				regex,
				display: describeNaturalRegex(source)
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
	'≥': 'gte'
});

const comparatorsLess = /** @type {const} */ ({
	'<': 'lt',
	'<=': 'lte',
	'≤': 'lte'
});

const comparators = /** @type {const} */ ({
	...comparatorsLess,
	...comparatorsMore
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
	compLess: '(' + Object.keys(comparatorsLess).join('|') + ')'
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
	interval: `(${reg.float}\\s*[.][.]\\s*${reg.float})`
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
					[flipComparator(rhsOp)]: rhsNum
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
					lte: maxNum
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
