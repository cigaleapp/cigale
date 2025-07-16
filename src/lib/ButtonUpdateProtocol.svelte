<script>
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { hasUpgradeAvailable, upgradeProtocol } from '$lib/protocols';
	import { toasts } from '$lib/toasts.svelte';
	import IconUpgrade from '~icons/ph/arrow-circle-up';
	import IconArrow from '~icons/ph/arrow-right';
	import IconCheckAgain from '~icons/ph/arrows-counter-clockwise';
	import IconUpToDate from '~icons/ph/check-circle';
	import IconCannotCheckForUpdates from '~icons/ph/warning-circle';
	import ButtonIcon from './ButtonIcon.svelte';

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

	const Btn = $derived(compact ? ButtonIcon : ButtonSecondary);
</script>

{#if version && source}
	{#key checkagain}
		{#await hasUpgradeAvailable({ id, version, source })}
			<Btn help="Recherche de mise à jour…" disabled onclick={() => {}}>
				<IconCheckAgain />
				{#if !compact}
					Mettre à jour
				{/if}
			</Btn>
		{:then { upToDate, newVersion }}
			{#if upToDate}
				<Btn
					help="Le protocole est à sa dernière version (v{newVersion}). Cliquer pour vérifier à nouveau"
					onclick={() => {
						checkagain = Date.now();
					}}
				>
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
			{:else}
				<Btn
					onclick={async () => {
						await upgradeProtocol({ version, source, id, swarpc })
							.then(({ version }) => {
								toasts.success(`Protocole mis à jour vers la v${version}`);
							})
							.catch((e) => {
								toasts.error(`Impossible de mettre à jour le protocole: ${e}`);
							});
					}}
					help={`Une mise à jour vers la v${newVersion} est disponible`}
				>
					<span class="version-check update-available">
						<IconUpgrade />
						{#if !compact}
							v{version}
							<IconArrow />
							v{newVersion}
						{/if}
					</span>
				</Btn>
			{/if}
		{:catch e}
			<Btn
				onclick={() => {
					checkagain = Date.now();
				}}
				help={`Impossible de vérifier les mises à jour: ${e}`}
			>
				<span class="version-check error">
					<IconCannotCheckForUpdates />
					{#if !compact}
						Rééssayer
					{/if}
				</span>
			</Btn>
		{/await}
	{/key}
{:else if version}
	<Btn onclick={() => {}} help="Ce protocole ne supporte pas la vérification des mises à jour">
		<span class="version-check">
			<IconCannotCheckForUpdates />
			{#if !compact}
				v{version}
			{/if}
		</span>
	</Btn>
{:else}
	<Btn
		onclick={() => {}}
		help="Ce protocole n'est pas versionné, pour le mettre à jour, supprimer le et importez la nouvelle version"
	>
		<span class="version-check error">
			{#if !compact}
				<IconCannotCheckForUpdates />
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

	.version-check {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}
</style>
