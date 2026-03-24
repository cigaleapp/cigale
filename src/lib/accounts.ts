import type * as DB from '$lib/database.js';

interface Account {
	logoURL: URL;
	login(): Promise<{ username: string; displayName: string; avatarURL: URL; profileURL: URL }>;
	logout(): Promise<void>;
	loggedIn: boolean;
	upload(session: DB.Session): Promise<void>;
}
