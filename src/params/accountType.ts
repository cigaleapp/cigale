import type { ParamMatcher } from '@sveltejs/kit';

const TYPES = ['github', 'kobotoolbox'] as const satisfies Array<
	(typeof import('$lib/database.js').Schemas.Account)['infer']['type']
>;

export const match: ParamMatcher = (param) => {
	return (TYPES as string[]).includes(param);
};
