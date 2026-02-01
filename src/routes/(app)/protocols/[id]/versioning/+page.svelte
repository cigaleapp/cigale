<script>
	import { type } from 'arktype';
	import { fade } from 'svelte/transition';

	import IconCheck from '~icons/ri/check-line';
	import IconUnpublished from '~icons/ri/cloud-off-line';
	import IconWarning from '~icons/ri/triangle-line';
	import { page } from '$app/state';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import { percent } from '$lib/i18n.js';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Logo from '$lib/Logo.svelte';
	import { hasUpgradeAvailable } from '$lib/protocols.js';
	import { clamp, gradientedColor } from '$lib/utils.js';

	import { updater } from '../updater.svelte.js';
	import ChangesWithRemote from './ChangesWithRemote.svelte';

	const { data } = $props();
	const source = $derived(typeof data.source === 'string' ? data.source : data.source?.url);
	let { version, id } = $derived(data);

	/**
	 * @typedef {object} UpstreamComparison
	 * @property {boolean} hasMore
	 * @property {import('microdiff').Difference[] } changes
	 * @property {number} progress comparison in progress (0 to 1)
	 * @property {boolean} loading whether a comparison is in progress (progress ∈ ]0.02, 1[)
	 */
	/** @type {UpstreamComparison} */
	let upstreamComparison = $state({
		hasMore: false,
		changes: [],
		progress: 0,
		get loading() {
			return this.progress > 0.02 && this.progress < 1;
		}
	});

	async function computeChangesWithUpstream() {
		const { changes, dirty } = await page.data.swarpc.diffProtocolWithRemote.once(
			{ protocolId: id },
			(progress) => {
				upstreamComparison.progress = progress;
			}
		);

		upstreamComparison.hasMore = changes.length > 100;
		upstreamComparison.changes = changes.slice(0, 100);
		upstreamComparison.progress = 1;

		await tables.Protocol.update(id, 'dirty', dirty);

		return upstreamComparison.changes;
	}

	/**
	 * @type {Record<import('$lib/ButtonUpdateProtocol.svelte').CustomButtonProps['state'], string>}
	 */
	const updateButtonTexts = {
		checking: '',
		upgrading: 'Mise à jour...',
		uptodate: '',
		available: 'Mise à jour disponible',
		error: 'Erreur lors de la mise à jour'
	};
</script>

<main in:fade={{ duration: 100 }}>
	<h2>Versionnage</h2>

	<FieldUrl
		check
		label="URL de téléchargement du protocole"
		value={source ?? ''}
		onblur={updater((p, value) => {
			if (value) {
				p.source = value;
			} else {
				delete p.source;
			}
		})}
	/>

	<Field label="Version actuelle">
		<InlineTextInput
			monospace
			label="Version"
			Type={type('string.integer.parse')}
			value={version?.toString() ?? ''}
			onblur={updater((p, value) => {
				if (value !== undefined) {
					p.version = value;
				} else {
					delete p.version;
				}
			})}
		/>

		{#snippet hint()}
			{#if source && version}
				{#await hasUpgradeAvailable({ version, source, id }) then { upToDate, newVersion }}
					{#if version > newVersion}
						<div class="upgrade-check notice">
							<IconUnpublished />
							Dernière version en ligne:
							<strong>v{newVersion}</strong>
							<div class="action">
								<ButtonInk
									onclick={updater((p) => {
										p.version = newVersion;
									})}
								>
									Réétablir
								</ButtonInk>
							</div>
						</div>
					{:else if upToDate}
						{#await computeChangesWithUpstream()}
							<div class="upgrade-check loading">
								<LoadingSpinner progress={upstreamComparison.progress} />
								Comparaison avec la version distante...
							</div>
						{:then diff}
							{#if diff.length > 0}
								<div class="upgrade-check warning">
									<IconWarning />
									Le protocole local a des modifications non publiées, voir ci-dessous
									<div class="action">
										<ButtonInk
											onclick={updater((p) => {
												p.version = version + 1;
												close?.();
											})}
										>
											Passer à la v{version + 1}
										</ButtonInk>
									</div>
								</div>
							{:else}
								<div class="upgrade-check ok">
									<IconCheck />
									À jour
								</div>
							{/if}
						{:catch error}
							<div class="upgrade-check warning">
								<IconWarning />
								Erreur lors de la comparaison avec la version distante: {error.message}
							</div>
						{/await}
					{:else}
						<div class="upgrade-check warning">
							<IconWarning />
							Une mise à jour à la v{newVersion} est disponible
							<div class="action">
								<ButtonUpdateProtocol
									{...{ id, version, source }}
									onupgrade={updater((p, newVer) => {
										p.version = newVer;
									})}
								>
									{#snippet button({ state, help, onclick })}
										{@const text = updateButtonTexts[state]}
										{#if text}
											<ButtonInk
												disabled={state === 'upgrading'}
												{help}
												{onclick}
											>
												{text}
											</ButtonInk>
										{/if}
									{/snippet}
								</ButtonUpdateProtocol>
							</div>
						</div>
					{/if}
				{/await}
			{/if}
		{/snippet}
	</Field>

	{#if version !== undefined && (upstreamComparison.changes.length > 0 || upstreamComparison.loading)}
		{@const { changes, hasMore } = upstreamComparison}
		<section class="changes-with-remote">
			<h3>
				{#if upstreamComparison.progress >= 1}
					<span
						style:color={gradientedColor(
							clamp(changes.length / 20, 0, 1),
							'fg-neutral',
							'fg-warning',
							'fg-error'
						)}
						class="differences-count">{changes.length}{hasMore ? '+' : ''}</span
					>
				{/if}
				Différences avec la version publiée
			</h3>
			{#if upstreamComparison.progress < 1}
				<div class="loading" in:fade={{ duration: 100 }}>
					<Logo --size="5rem" drawpercent={upstreamComparison.progress} />
					<div class="text">
						<p>Chargement...</p>
						<code>{percent(upstreamComparison.progress)}</code>
					</div>
				</div>
			{:else}
				<ChangesWithRemote {changes} />
			{/if}
		</section>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex-grow: 1;
	}

	.upgrade-check {
		padding: 0.5em 0;
		display: flex;
		align-items: center;
		gap: 0.25em;

		&.warning {
			color: var(--fg-warning);
		}
		&.ok {
			color: var(--fg-success);
		}
		&.notice {
			color: var(--fg-primary);
		}
	}

	.upgrade-check .action {
		margin-left: auto;
	}

	h3 {
		margin-bottom: 1em;
	}

	.changes-with-remote {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	.changes-with-remote .loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		text-align: center;
		flex-grow: 1;
	}

	.differences-count {
		font-weight: bold;
	}
</style>
