import type * as DB from '$lib/database.js';
import type { DatabaseHandle } from '$lib/idb.svelte.js';
import type { SessionRemoteID } from '$lib/schemas/sessions.js';

export type AuthenticationMethod = 'oauth' | 'token' | 'password';

export type AccountCapability = 'sessions' | 'upload' | 'images' | 'sync';

export type LoginData<S extends string = string> = {
	server: S;
	token?: string;
	password?: { username: string; password: string };
	oauth?: { authorize: URL; identity: URL; token: URL };
};

export interface Account {
	username: string;
	displayName: string;
	avatarURL: URL | undefined;
	/** Database ID of the account. */
	id: string | undefined;
	logout(): Promise<void>;

	armAbort(signal: AbortSignal): void;

	sessionPage(protocol: DB.Protocol|undefined, session: DB.Session|undefined): URL | undefined;

	/**
	 * Upload a session to the account
	 * @param session session object from the database
	 */
	upload(
		protocol: DB.Protocol,
		session: DB.Session
	): AsyncIterable<
		| {
				message: 'session-id';
				/** If the session has a remote ID that can be used to import it back later into CIGALE. Useful if the Account has session capabilities */
				remoteId?: SessionRemoteID;
		  }
		| {
				/** Progress update */
				message: 'progress';
				action: string;
				done?: number;
				total?: number;
				/** Is a sub-task */
				indent?: boolean;
		  }
	>;

	/**
	 * List available remote sessions on the account
	 * @param protocol chosen protocol
	 * @param options
	 * @param options.cursor see nextCursor in the response
	 * @param options.limit change the number of sessions returned in each call. Default is implementation-specific
	 * @param options.mine only return sessions created by the account's user
	 */
	sessions(options?: {
		cursor?: string | undefined;
		limit?: number;
		mine?: boolean;
	}): AsyncIterable<
		| {
				/** Signals the total number of sessions */
				total: number;
		  }
		| {
				id: SessionRemoteID;
				protocol: string;
				page: URL | undefined;
				name: string;
				submittedAt: Date;
				submittedBy?: string;
				thumbnails: URL[];
				/** Cursor to pass to the method to get the next results. Must be undefined once we have finished listing all sessions. Must be the same on all items */
				nextCursor: string | undefined;
				filesCount: number;
				imagesCount: number;
		  }
	>;

	/**
	 * Download the remote session
	 * @param protocol protocol of the session
	 * @param id remote ID of the session
	 */
	download(
		protocol: DB.Protocol,
		id: SessionRemoteID
	): AsyncIterable<
		| {
				message: 'session-id';
				/** The database id of the newly created, in-db session object */
				databaseId?: string;
		  }
		| {
				/** Progress update */
				message: 'progress';
				action: string;
				done?: number;
				total?: number;
				/** Is a sub-task */
				indent?: boolean;
		  }
	>;

	/**
	 * Sync local session with remote session
	 */
	sync(
		protocol: DB.Protocol,
		session: DB.Session
	): AsyncIterable<{
		/** Progress update */
		message: 'progress';
		action: string;
		done?: number;
		total?: number;
		/** Is a sub-task */
		indent?: boolean;
	}>;

	/**
	 * Fetch the thumbnail for a session,
	 * returning a blob:// URL ready for use
	 */
	thumbnail(url: URL): Promise<URL>;
}

export interface AccountConstructor<
	Auth extends AuthenticationMethod = AuthenticationMethod,
	Server extends string = string,
> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	new (...args: any[]): Account;

	id: string;
	logoURL: URL;
	displayName: string;
	capabilities: readonly AccountCapability[];
	auth: Auth;

	servers(db: DatabaseHandle): Promise<Array<{ domain: Server; name?: string }>>;

	compatibleWith(protocol: DB.Protocol | undefined): boolean;

	/** Returns the error message, or undefined if everything is a-ok */
	checkAuth(data: LoginData<Server>): Promise<undefined | string>;

	fromDatabase(db: DatabaseHandle, account: DB.Account): Account;
	login(
		db: DatabaseHandle,
		data: LoginData<Server>
	): Promise<Omit<(typeof DB.Schemas.Account)['inferIn'], 'id'>>;
}
