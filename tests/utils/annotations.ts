/**
 * Keys must include the @ prefix 
 * Use a '' key for the fallback
 */
export function dependsOnTags<T>(info: { tags: string[] }, mapping: Record<string, T>): T {
	for (const [tag, value] of Object.entries(mapping)) {
		if (info.tags.includes(tag)) {
			return value;
		}
	}

	if ('' in mapping) {
		return mapping[''];
	}

	throw new Error(
		`No matching tag found for test with tags [${info.tags.join(', ')}]. Expected one of: ${Object.keys(mapping).join(', ')}`
	);
}
