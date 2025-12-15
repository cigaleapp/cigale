<script module>
	/**
	 * @typedef {object} CustomButtonProps
	 * @property {() => void | Promise<void>} onclick
	 * @property {string} help
	 * @property {'checking' | 'upgrading' | 'available' | 'uptodate' | 'error'} state
	 * @property {number | undefined} current
	 * @property {number | undefined} newest
	 */
</script>

<script lang="ts">
	import IconArrow from '~icons/ri/arrow-right-line';
	import IconUpgrade from '~icons/ri/arrow-up-circle-line';
	import IconUpToDate from '~icons/ri/checkbox-circle-line';
	import IconCannotCheckForUpdates from '~icons/ri/error-warning-line';
	import IconCheckAgain from '~icons/ri/loop-left-fill';
	import IconNotVersioned from '~icons/ri/question-line';
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import { hasUpgradeAvailable, upgradeProtocol } from '$lib/protocols';
	import { toasts } from '$lib/toasts.svelte';

	import ButtonIcon from './ButtonIcon.svelte';

	/**
	 * @typedef {object} Props
	 * @property {string} id
	 * @property {number} version
	 * @property {typeof import('$lib/schemas/common').HTTPRequest.infer} source
	 * @property {boolean} [compact=false]
	 * @property {import('svelte').Snippet<[CustomButtonProps]>} [button]
	 * @property {(newVersion: number) => void | Promise<void>} [onupgrade] called after a successful upgrade
	 */

	/**  @type {Props}*/
	const { id, version, source, compact, button: customButton, onupgrade } = $props();

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
			{#if customButton}
				{@render customButton({
					onclick: () => {},
					help: 'Recherche de mise à jour…',
					state: 'checking',
					current: version,
					newest: undefined
				})}
			{:else}
				<Btn help="Recherche de mise à jour…" disabled onclick={() => {}}>
					<IconCheckAgain />
					{#if !compact}
						Mettre à jour
					{/if}
				</Btn>
			{/if}
		{:then { upToDate, newVersion }}
			{@const onclick = async () => {
				if (upToDate) {
					checkagain = Date.now();
				} else {
					upgrading = true;
					await upgradeProtocol({ version, source, id, swarpc })
						.then(({ version }) => {
							toasts.success(`Protocole mis à jour vers la v${version}`);
							onupgrade?.(version);
						})
						.catch((e) => {
							toasts.error(`Impossible de mettre à jour le protocole: ${e}`);
						})
						.finally(() => {
							upgrading = false;
						});
				}
			}}

			{@const help = upToDate
				? `Le protocole est à jour (v${newVersion}). Cliquer pour vérifier à nouveau`
				: `Une mise à jour vers la v${newVersion} est disponible`}

			{#if upToDate && customButton}
				{@render customButton({
					onclick,
					help,
					state: 'uptodate',
					current: version,
					newest: newVersion
				})}
			{:else if upToDate}
				<Btn {help} {onclick}>
					<span class="version-check up-to-date">
						<IconUpToDate />
						{#if !compact}
							À jour
						{/if}
					</span>
					{#if !compact}
						<span>
							v{version}
						</span>
					{/if}
				</Btn>
			{:else if customButton}
				{@render customButton({
					onclick,
					help,
					state: upgrading ? 'upgrading' : 'available',
					current: version,
					newest: newVersion
				})}
			{:else}
				<Btn {onclick} {help}>
					<span class="version-check" class:update-available={!upgrading}>
						{#if upgrading}
							<LoadingSpinner />
						{:else}
							<IconUpgrade />
						{/if}
						{#if !compact}
							<!-- @wc-context: Upgrading a protocol. The <0 /> is an icon arrow -->
							{#if upgrading}
								Mise à jour…
							{:else}
								v{version} <IconArrow /> v{newVersion}
							{/if}
						{/if}
					</span>
				</Btn>
			{/if}
		{:catch e}
			{@const onclick = () => {
				checkagain = Date.now();
			}}

			{#if customButton}
				{@render customButton({
					onclick,
					help: `Impossible de vérifier les mises à jour: ${e}`,
					state: 'error',
					current: version,
					newest: undefined
				})}
			{:else}
				<Btn {onclick} help="Impossible de vérifier les mises à jour: {e}">
					<span class="version-check error">
						<IconCannotCheckForUpdates />
						{#if !compact}
							Rééssayer
						{/if}
					</span>
				</Btn>
			{/if}
		{/await}
	{/key}
{:else if version && customButton}
	{@render customButton({
		onclick: () => {},
		help: 'Ce protocole ne supporte pas la vérification des mises à jour',
		state: 'error',
		current: version,
		newest: undefined
	})}
{:else if version}
	<Btn onclick={() => {}} help="Ce protocole ne supporte pas la vérification des mises à jour">
		<span class="version-check not-applicable">
			<IconNotVersioned />
			{#if !compact}
				v{version}
			{/if}
		</span>
	</Btn>
{:else if customButton}
	{@render customButton({
		onclick: () => {},
		help: "Ce protocole n'est pas versionné, pour le mettre à jour, supprimer le et importez la nouvelle version",
		state: 'error',
		current: undefined,
		newest: undefined
	})}
{:else}
	<Btn
		onclick={() => {}}
		help="Ce protocole n'est pas versionné, pour le mettre à jour, supprimer le et importez la nouvelle version"
	>
		<span class="version-check not-applicable">
			<IconNotVersioned />
			{#if !compact}
				Non versionné
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

	.version-check.not-applicable {
		color: var(--gay);
	}

	.version-check {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}
</style>
