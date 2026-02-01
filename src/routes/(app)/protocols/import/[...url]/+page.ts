// The [...url] is a user-provided URL, and thus the trailing slash in _that_ URL should be kept as-is, otherwise we could end up with a 404, a different resource, etc
export const trailingSlash = 'ignore';
