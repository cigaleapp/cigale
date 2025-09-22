<script>
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { hasUpgradeAvailable } from '$lib/protocols.js';
	import { ArkErrors, type } from 'arktype';
	import IconCheck from '~icons/ph/check';
	import IconWarning from '~icons/ph/warning';
	import IconUnpublished from '~icons/ph/cloud-x';
	import { updater } from '../updater.svelte.js';
	import { getContext } from 'svelte';

	let { data } = $props();
	let source = $derived(typeof data.source === 'string' ? data.source : data.source?.url);
	let { version, id } = $derived(data);

	// $inspect('ver', version, 'fromdata', data.version);
	// $inspect('src', source, 'fromdata', data.source);

	const setSidebarVersion = getContext('setSidebarVersion');
	$effect(() => setSidebarVersion?.(version));

	/**
	 * @type {Record<import('$lib/ButtonUpdateProtocol.svelte').CustomButtonProps['state'], string>}
	 */
	const updateButtonTexts = {
		checking: '',
		upgrading: m.updating(),
		uptodate: '',
		available: m.update(),
		error: m.error_text()
	};
</script>

<main>
	<h2>Versionnage</h2>

	<FieldUrl
		check
		label="URL de téléchargement du protocole"
		value={source ?? ''}
		onblur={updater((p, value) => {
			if (value) {
				p.source = value;
				// FIXME reactivity loss of data.source when changed here forces us to change source too
				source = value;
				data.source = value;
			} else {
				delete p.source;
				source = undefined;
				delete data.source;
			}
		})}
	/>

	<Field label="Version actuelle">
		<InlineTextInput
			label="Version"
			Type={type('string.integer.parse')}
			value={version?.toString() ?? ''}
			onblur={updater((p, value) => {
				if (value instanceof ArkErrors) throw value;

				if (value !== undefined) {
					p.version = value;
					// FIXME reactivity loss of data.version when changed here forces us to change version too
					version = value;
					data.version = value;
				} else {
					delete p.version;
					version = undefined;
					delete data.version;
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
										version = newVersion;
									})}
								>
									Réétablir
								</ButtonInk>
							</div>
						</div>
					{:else if upToDate}
						<div class="upgrade-check ok">
							<IconCheck />
							À jour
						</div>
					{:else}
						<div class="upgrade-check warning">
							<IconWarning />
							Une mise à jour à la v{newVersion} est disponible
							<div class="action">
								<ButtonUpdateProtocol
									{...{ id, version, source }}
									onupgrade={(newVersion) => {
										data.version = newVersion;
									}}
								>
									{#snippet button({ state, help, onclick })}
										{@const text = updateButtonTexts[state]}
										{#if text}
											<ButtonInk disabled={state === 'upgrading'} {help} {onclick}>
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
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
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
</style>
