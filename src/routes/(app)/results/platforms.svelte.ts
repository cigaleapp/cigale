import type { Message } from '$lib/ProgressTree.svelte';

import { providers } from '$lib/accounts/registry.js';
import { databaseHandle, tables } from '$lib/idb.svelte.js';
import { uiState } from '$lib/uistate.svelte.js';
import { switchValue } from '$lib/utils.js';

class ExporterPlatforms {
	compatibleProviders = $derived(
		providers
			.list()
			.filter(
				(provider) =>
					provider.capabilities.includes('upload') &&
					provider.compatibleWith(uiState.currentProtocol)
			)
	);

	compatibleAccounts = $derived(
		tables.Account.state.filter((acc) =>
			this.compatibleProviders.some((provider) => provider.id === acc.type)
		)
	);

	#getProvider(accountId: string | undefined) {
		if (!accountId) return;
		const accountData = tables.Account.getFromState(accountId);

		if (!accountData) return;
		return providers.get(accountData.type);
	}

	#getAccount(accountId: string | undefined) {
		if (!accountId) return;
		const accountData = tables.Account.getFromState(accountId);

		if (!accountData) return;
		const provider = providers.get(accountData.type);

		if (!provider) return;
		return provider.fromDatabase(databaseHandle(), accountData);
	}

	sessionAccount = $derived(this.#getAccount(uiState.currentSession?.account));
	sessionProvider = $derived(this.#getProvider(uiState.currentSession?.account));

	selectedAccountId = $derived(this.compatibleAccounts.at(0)?.id);

	/** @deprecated dont use */
	selectedAccountData = $derived(
		this.selectedAccountId ? tables.Account.getFromState(this.selectedAccountId) : undefined
	);

	selectedProvider = $derived(this.#getProvider(this.selectedAccountId));
	selectedAccount = $derived(this.#getAccount(this.selectedAccountId));

	/** @deprecated use selectedAccount */
	account = $derived(this.selectedAccount);
	/** @deprecated use selectedProvider */
	provider = $derived(this.selectedProvider);

	selectAccount(id: string | undefined) {
		this.selectedAccountId = id;
	}

	avatar(accountId: string | undefined) {
		if (!accountId) return;

		const provider = this.#getProvider(accountId);
		const accountData = tables.Account.getFromState(accountId);
		if (!accountData) return;

		return {
			avatar: accountData.avatarURL,
			avatarColor: 'color' in accountData ? accountData.color : undefined,
			sublogo: provider?.logoURL,
		};
	}

	notifyDone = $state<(state: 'ok' | 'error' | 'canceled') => void>();
	notify = $state<(message: Message) => void>();

	error = $state('');
	aborter = $state(new AbortController());

	state: 'idle' | 'uploading' | 'completed' | 'errored' | 'canceled' = $state('idle');

	get abortSignal() {
		return this.aborter.signal;
	}

	get aborted() {
		return this.abortSignal.aborted;
	}

	get uploading() {
		return this.state === 'uploading';
	}

	get done() {
		return switchValue(this.state, {
			idle: false,
			uploading: false,
			completed: true,
			errored: true,
			canceled: true,
		});
	}

	starting() {
		if (!this.account) return;
		this.notify?.({ clear: true, action: '' });
		this.error = '';
		this.state = 'uploading';
		this.aborter = new AbortController();

		console.time('upload');
	}

	completed() {
		this.state = 'completed';
		this.notifyDone?.('ok');
		console.timeEnd('upload');
	}

	errored(error: unknown) {
		console.error(error);
		this.state = 'errored';
		this.notifyDone?.('error');
		this.error = String(error);
		console.timeEnd('upload');
	}

	canceled() {
		this.state = 'canceled';
		this.notifyDone?.('canceled');
		console.timeEnd('upload');
	}
}

export const exporter = new ExporterPlatforms();
