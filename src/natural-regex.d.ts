declare module 'natural-regex' {
	export default class NaturalRegex {
		static parser: Parser;

		static parse(code: string): string;
		static from(code: string, flags?: string): RegExp;
		static replace(string?: string, match?: string, replace?: string, flags?: string): string;
	}

	class Parser {
		yy: Record<string, unknown>;
		trace(): void;
		symbols_: Record<string, number>;
		terminals_: Record<number, string>;
		productions_: unknown[];
		performAction(
			yytext: string,
			yyleng: number,
			yylineno: number,
			yy: object,
			yystate: number,
			$$: unknown[],
			_$: TokenLocationInfo[]
		): void;
		table: unknown[];
		defaultActions: Record<number, unknown[]>;
		parseError(str: string, hash: LexerErrorHash | ParserErrorHash): void;
		parse(input: string): string;
		lexer: Lexer;
	}

	interface TokenLocationInfo {
		first_line: number;
		last_line: number;
		first_column: number;
		last_column: number;
		range?: [number, number];
	}

	interface LexerErrorHash {
		text: string;
		token: string;
		line: number;
	}

	interface ParserErrorHash extends LexerErrorHash {
		loc: TokenLocationInfo;
		expected: string;
		recoverable: boolean;
	}

	interface LexerOptions {
		ranges?: boolean;
		flex?: boolean;
		backtrack_lexer?: boolean;
	}

	interface Lexer {
		EOF: 1;
		parseError(str: string, hash: LexerErrorHash): void;
		setInput(input: string): void;
		input(): string;
		unput(str: string): void;
		more(): void;
		less(n: number): void;
		pastInput(): string;
		upcomingInput(): string;
		showPosition(): string;
		test_match(regex_match_array: RegExpMatchArray, rule_index: number): string | number;
		next(): string | number;
		lex(): string | number;
		begin(condition: string): void;
		popState(): string;
		_currentRules(): unknown[];
		topState(): string;
		pushState(condition: string): void;
		options: LexerOptions;
		performAction(
			yy: object,
			yy_: object,
			$avoiding_name_collisions: unknown,
			YY_START: unknown
		): void;
		rules: RegExp[];
		conditions: Record<string, { rules: number[]; inclusive: boolean }>;
	}
}
