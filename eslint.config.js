import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import depend from 'eslint-plugin-depend';
import oxlint from 'eslint-plugin-oxlint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

/** @type {import('eslint').Linter.Config[]} */
export default [
	includeIgnoreFile(gitignorePath),
	{ name: 'Ignore Pleye reporter', ignores: ['tests/reporters/pleye.js'] },
	depend.configs['flat/recommended'],
	js.configs.recommended,
	...ts.configs.recommended.map((cfg) => ({
		files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
		...cfg
	})),
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				Bun: false
			}
		},
		rules: {
			'svelte/no-at-html-tags': 'off',
			// See https://github.com/sveltejs/kit/issues/14894
			'svelte/no-navigation-without-resolve': 'off',
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	// oxlint should be the last one
	...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json')
];
