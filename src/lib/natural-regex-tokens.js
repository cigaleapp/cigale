import NaturalRegex from 'natural-regex';

const parser = NaturalRegex.parser;

/**
 * French labels for natural-regex tokens. Keys are token type names from the Jison parser's `terminals_` table.
 * @type {Record<string, string>}
 */
const TOKEN_LABELS = {
	// Structure
	STARTS_WITH: 'commence par',
	ENDS_WITH: 'finit par',
	GROUP: 'groupe',
	END_GROUP: 'fin groupe',
	CAPTURE: 'capture',
	END_CAPTURE: 'fin capture',
	CHARACTER_SET: 'un parmi',
	NOT_CHARACTER_SET: 'aucun parmi',

	// Logique
	AND: 'et',
	OR: 'ou',
	THEN: 'puis',
	FOLLOWED_BY: 'suivi de',
	NOT_FOLLOWED_BY: 'non suivi de',

	// Quantificateurs
	OPTIONAL_REPETITION: 'répété optionnellement',
	ONE_OR_MORE_REPETITION: 'une ou plusieurs fois',
	ZERO_OR_ONE_REPETITION: 'optionnel',
	REPETITION: 'fois',
	MINIMUM: 'minimum',
	MAXIMUM: 'maximum',
	FOR: 'pour',
	FROM: 'de',
	TO: 'à',
	SMALLEST: 'le plus petit',

	// Classes de caractères
	DIGIT: 'chiffre',
	NON_DIGIT: 'non-chiffre',
	LETTER: 'lettre',
	UPPERCASE: 'majuscule',
	LOWERCASE: 'minuscule',
	WORD: 'mot',
	NON_WORD: 'non-mot',
	ALPHANUMERIC: 'alphanumérique',
	SPACE: 'espace',
	NON_SPACE: 'non-espace',
	ANY_CHARACTER: 'tout caractère',
	ANYTHING: "n'importe quoi",

	// Caractères spéciaux
	TAB: 'tabulation',
	VERTICAL_TAB: 'tabulation verticale',
	NULL: 'nul',
	RETURN: 'retour chariot',
	LINE_FEED: 'saut de ligne',
	FORM_FEED: 'saut de page',
	BACKSPACE: 'retour arrière',

	// Ancres
	START: 'début',
	END: 'fin',

	// Encodage
	HEX: 'hexadécimal',
	UNICODE: 'unicode',
	ESCAPED: 'échappé',

	// Nombre
	// NUMBER: 'nombre',
	TYPE_NUMBER: 'nombre',
	NEGATIVE: 'négatif',
	POSITIVE: 'positif',
	DECIMAL: 'décimal',

	// Motifs courants
	HTML_TAG: 'balise HTML',
	IPV4: 'IPv4',
	IPV6: 'IPv6',
	IP_ADDRESS: 'adresse IP',
	MAC_ADDRESS: 'adresse MAC',
	URL: 'URL',
	EMAIL: 'e-mail',
	SLUG: 'slug',
	LOCALE: 'locale',
	LATITUDE: 'latitude',
	LONGITUDE: 'longitude',
	COLOR_NAME: 'nom de couleur',
	HOSTNAME: "nom d'hôte",
	UUID: 'UUID',
	GUID: 'GUID',
	US_ZIP_CODE: 'code postal US',
	CANADIAN_POSTAL_CODE: 'code postal canadien',
	BRAZILIAN_POSTAL_CODE: 'code postal brésilien',
	UK_POSTAL_CODE: 'code postal britannique',
	BIC: 'BIC',
	IBAN: 'IBAN',
	BRAINFUCK: 'brainfuck',
	MORSE: 'morse',
	YOUTUBE_CHANNEL: 'chaîne YouTube',
	YOUTUBE_VIDEO: 'vidéo YouTube',

	// Date/heure
	DATE: 'date',
	DAY: 'jour',
	MONTH: 'mois',
	YEAR: 'année',
	yy: 'année courte',
	HOURS: 'heures',
	MINUTES: 'minutes',
	SECONDS: 'secondes',

	// Divers
	CONTROL_CHARACTER: 'caractère de contrôle',
	CHARACTER: 'caractère'
};

/**
 * Compound token patterns: when two adjacent token types appear in sequence,
 * they are merged into a single token with a combined French label.
 * Maps `firstType -> secondType -> mergedLabel`.
 * @type {Record<string, Record<string, string>>}
 */
const COMPOUND_LABELS = {
	UPPERCASE: { LETTER: 'lettre majuscule' },
	LOWERCASE: { LETTER: 'lettre minuscule' },
	NEGATIVE: { TYPE_NUMBER: 'nombre négatif', NUMBER: 'nombre négatif' },
	POSITIVE: { TYPE_NUMBER: 'nombre positif', NUMBER: 'nombre positif' },
	DECIMAL: { TYPE_NUMBER: 'nombre décimal', NUMBER: 'nombre décimal' }
};

/**
 * @typedef {{ type: string; text: string; label: string }} NaturalRegexToken
 */

/**
 * Tokenizes a natural-regex source string and returns tokens with French labels.
 * @param {string} input
 * @returns {NaturalRegexToken[]}
 */
function tokenize(input) {
	const lexer = Object.create(parser.lexer);
	lexer.setInput(input, {});

	/** @type {{ type: string; text: string }[]} Raw tokens before compound merging */
	const raw = [];

	while (true) {
		const tokenId = lexer.lex();
		if (tokenId === false) break;
		const type = parser.terminals_[tokenId] ?? String(tokenId);
		if (type === 'EOF') break;
		raw.push({ type, text: lexer.yytext });
	}

	/** @type {NaturalRegexToken[]} */
	const tokens = [];
	for (let i = 0; i < raw.length; i++) {
		const compoundLabel = COMPOUND_LABELS[raw[i].type]?.[raw[i + 1]?.type];
		if (compoundLabel) {
			tokens.push({
				type: `${raw[i].type}+${raw[i + 1].type}`,
				text: `${raw[i].text} ${raw[i + 1].text}`,
				label: compoundLabel
			});
			i++;
		} else {
			tokens.push({
				type: raw[i].type,
				text: raw[i].text,
				label: TOKEN_LABELS[raw[i].type] ?? raw[i].text
			});
		}
	}

	return tokens;
}

/**
 * Converts a natural-regex source string into a human-readable description.
 * @param {string} input
 * @returns {string}
 */
export function describeNaturalRegex(input) {
	return tokenize(input)
		.map((t) => t.label)
		.join(' ')
		.trim();
}

if (import.meta.vitest) {
	const { test, expect, describe: suite } = import.meta.vitest;

	suite('tokenize', () => {
		test('tokenizes a simple pattern', () => {
			const tokens = tokenize('digit');
			expect(tokens).toHaveLength(1);
			expect(tokens[0].type).toBe('DIGIT');
			expect(tokens[0].label).toBe('chiffre');
		});

		test('tokenizes a multi-token pattern', () => {
			const tokens = tokenize('starts with digit then letter end');
			const types = tokens.map((t) => t.type);
			expect(types).toEqual(['STARTS_WITH', 'DIGIT', 'THEN', 'LETTER', 'END']);
		});

		test('labels punctuation/literal characters with their text', () => {
			const tokens = tokenize('starts with "hello" end');
			const literals = tokens.filter((t) => t.type === 'CHARACTER');
			expect(literals.every((t) => t.label === t.text)).toBe(true);
		});

		test('tokenizes date/time tokens', () => {
			const tokens = tokenize('year month day hours minutes seconds');
			const types = tokens.map((t) => t.type);
			expect(types).toEqual(['YEAR', 'MONTH', 'DAY', 'HOURS', 'MINUTES', 'SECONDS']);
		});

		test('tokenizes quantifiers', () => {
			const tokens = tokenize('digit one or more times');
			const types = tokens.map((t) => t.type);
			expect(types).toContain('DIGIT');
			expect(types).toContain('ONE_OR_MORE_REPETITION');
		});
	});

	suite('describe', () => {
		test('produces a readable description', () => {
			const result = describeNaturalRegex('starts with digit then letter end');
			expect(result).toBe('commence par chiffre puis lettre fin');
		});

		test('handles uppercase/lowercase', () => {
			const result = describeNaturalRegex('uppercase letter');
			expect(result).toBe('lettre majuscule');
		});

		test('handles lowercase letter', () => {
			const result = describeNaturalRegex('lowercase letter');
			expect(result).toBe('lettre minuscule');
		});

		test('handles negative number', () => {
			const result = describeNaturalRegex('negative number');
			expect(result).toBe('nombre négatif');
		});

		test('does not reorder when adjective has no following noun', () => {
			const result = describeNaturalRegex('uppercase');
			expect(result).toBe('majuscule');
		});

		test('merges compound tokens into a single token', () => {
			const tokens = tokenize('uppercase letter');
			expect(tokens).toHaveLength(1);
			expect(tokens[0].label).toBe('lettre majuscule');
			expect(tokens[0].type).toBe('UPPERCASE+LETTER');
		});
	});
}
