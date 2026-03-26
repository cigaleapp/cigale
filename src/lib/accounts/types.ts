import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { SessionRemoteID } from '$lib/schemas/sessions.js';

export type AuthenticationMethod = 'oauth' | 'token' | 'password';

export type LoginData<S extends string = string> = {
	server: S;
	token?: string;
	password?: { username: string; password: string };
	oauth?: { authorize: URL; identity: URL; token: URL };
};

export interface Account {
	logout(): Promise<void>;

	/**
	 * Upload a session to the account
	 * @param session session object from the database
	 */
	upload(session: DB.Session): Promise<{
		/** If the session has a remote ID that can be used to import it back later into CIGALE. Useful if the Account is ALSO a {@link AccountRemoteSessions} */
		remoteID?: SessionRemoteID;
		/**
		 * URL to where the session can be visited on the account
		 */
		page?: URL;
	}>;

	/**
	 * List available remote sessions on the account
	 * @param protocol chosen protocol
	 * @param options
	 * @param options.cursor see nextCursor in the response
	 * @param options.limit change the number of sessions returned in each call. Default is implementation-specific
	 */
	sessions(
		protocol: DB.Protocol,
		options?: { cursor?: string | undefined; limit?: number }
	): AsyncIterator<{
		id: SessionRemoteID;
		name: string;
		submittedAt: Date;
		thumbnail: URL | undefined;
		/** Cursor to pass to the method to get the next results. Must be undefined once we have finished listing all sessions. Must be the same on all items */
		nextCursor: string | undefined;
	}>;
	/**
	 * Get the remote session
	 * @param protocol protocol of the session
	 * @param id remote ID of the session
	 */
	session(
		protocol: DB.Protocol,
		id: SessionRemoteID
	): Promise<Omit<(typeof DB.Schemas.Session)['inferIn'], 'id' | 'account'>>;
	/**
	 * Get all observations/images/image files of the remote session
	 * @param protocol protocol of the session
	 * @param session remote ID of the session (in Session.remote.id in the database)
	 */
	items(
		protocol: DB.Protocol,
		session: SessionRemoteID
	): Promise<{
		observations: Array<(typeof DB.Schemas.Observation)['inferIn']>;
		images: Array<(typeof DB.Schemas.Image)['inferIn']>;
		files: Array<(typeof DB.Tables.ImageFile)['inferIn']>;
	}>;
	/**
	 * Get files from file-type session metadata values
	 * @param protocol protocol of the session
	 * @param session remote ID of the session
	 */
	files(
		protocol: DB.Protocol,
		session: SessionRemoteID
	): AsyncIterator<Omit<(typeof DB.Tables.MetadataValueFile)['inferIn'], 'sessionId'>>;
	/**
	 * Get a URL to a page on the remote website for a session
	 */
	sessionRemotePage(id: SessionRemoteID): URL | undefined;
}

export interface AccountConstructor<
	Auth extends AuthenticationMethod = AuthenticationMethod,
	Server extends string = string,
> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any allows anything in the constructor
	new (...args: any[]): Account;

	id: string
	logoURL: URL;
	displayName: string;
	capabilities: readonly ('sessions' | 'upload')[];
	auth: Auth;
	servers: readonly Server[];

	fromDatabase(db: DatabaseHandle, account: DB.Account): Account;
	login(
		db: DatabaseHandle,
		data: LoginData<Server>
	): Promise<Omit<(typeof DB.Schemas.Account)['inferIn'], 'id'>>;
}
