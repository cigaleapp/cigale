<script>
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { hasUpgradeAvailable, upgradeProtocol } from '$lib/protocols';
	import { toasts } from '$lib/toasts.svelte';
	import IconUpgrade from '~icons/ph/arrow-circle-up';
	import IconArrow from '~icons/ph/arrow-right';
	import IconCheckAgain from '~icons/ph/arrows-counter-clockwise';
	import IconUpToDate from '~icons/ph/check-circle';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import IconCannotCheckForUpdates from '~icons/ph/warning-circle';
	import ButtonIcon from './ButtonIcon.svelte';
	import { m } from '$lib/paraglide/messages.js';

	/**
	 * @typedef {object} Props
	 * @property {string} id
	 * @property {number} version
	 * @property {typeof import('$lib/schemas/common').HTTPRequest.infer} source
	 * @property {boolean} [compact=false]
	 */

	/**  @type {Props}*/
	const { id, version, source, compact } = $props();

	const swarpc = $derived(page.data.swarpc);

	/**
	 * Change value to force re-rendering of the component, and thus re-evaluate the upgrade availability
	 */
	let checkagain = $state(0);

	let upgrading = $state(false);

	const Btn = $derived(compact ? ButtonIcon : ButtonSecondary);
</script>

{#if version && source}
	{#key checkagain}
		{#await hasUpgradeAvailable({ id, version, source })}
			<Btn help={m.checking_for_updates()} disabled onclick={() => {}}>
				<IconCheckAgain />
				{#if !compact}
					{m.update()}
				{/if}
			</Btn>
		{:then { upToDate, newVersion }}
			{#if upToDate}
				<Btn
					help={m.protocol_up_to_date_click_to_check_again({ newVersion })}
					onclick={() => {
						checkagain = Date.now();
					}}
				>
					<span class="version-check up-to-date">
						<IconUpToDate />
						{#if !compact}
							{m.up_to_date()}
						{/if}
					</span>
					{#if !compact}
						<span>
							v{version}
						</span>
					{/if}
				</Btn>
			{:else}
				<Btn
					onclick={async () => {
						upgrading = true;
						await upgradeProtocol({ version, source, id, swarpc })
							.then(({ version }) => {
								toasts.success(m.protocol_updated_to_version({ version }));
							})
							.catch((e) => {
								toasts.error(m.cannot_update_protocol({ error: e }));
							})
							.finally(() => {
								upgrading = false;
							});
					}}
					help={m.update_available_to_version({ newVersion })}
				>
					<span class="version-check" class:update-available={!upgrading}>
						{#if upgrading}
							<LoadingSpinner />
						{:else}
							<IconUpgrade />
						{/if}
						{#if !compact}
							{#if upgrading}
								{m.updating()}
							{:else}
								v{version}
								<IconArrow />
								v{newVersion}
							{/if}
						{/if}
					</span>
				</Btn>
			{/if}
		{:catch e}
			<Btn
				onclick={() => {
					checkagain = Date.now();
				}}
				help={m.cannot_check_for_updates({ error: e })}
			>
				<span class="version-check error">
					<IconCannotCheckForUpdates />
					{#if !compact}
						{m.retry()}
					{/if}
				</span>
			</Btn>
		{/await}
	{/key}
{:else if version}
	<Btn onclick={() => {}} help={m.protocol_does_not_support_update_check()}>
		<span class="version-check">
			<IconCannotCheckForUpdates />
			{#if !compact}
				v{version}
			{/if}
		</span>
	</Btn>
{:else}
	<Btn onclick={() => {}} help={m.protocol_not_versioned_help()}>
		<span class="version-check error">
			{#if !compact}
				<IconCannotCheckForUpdates />
				{m.not_versioned()}
			{/if}
		</span>
	</Btn>
{/if}

<style>
	.version-check.error {
		color: var(--fg-error);
	}

	.version-check.up-to-date {
		color: var(--fg-success);
	}

	.version-check.update-available {
		color: var(--fg-warning);
	}

	.version-check {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}
</style>
