export async function handle({ event, resolve }) {
	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%buildcommit%', import.meta.env.buildCommit || 'dev')
	});
}
