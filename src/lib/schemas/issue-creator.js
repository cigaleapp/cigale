import { type } from 'arktype';

export const IssueCreatorRequest = type({
	title: ['string', '@', 'Issue title'],
	body: ['string', '@', 'Issue body'],
	type: type.enumerated('bug', 'feature').describe('Type of issue to create'),
	metadata: [
		'Record<string, string>',
		'@',
		'Additional metadata to include at the end of the issue body'
	]
});
