<script>
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { hasUpgradeAvailable, upgradeProtocol } from '$lib/protocols';
	import { toasts } from '$lib/toasts.svelte';
	import IconUpgrade from '~icons/ph/arrow-circle-up';
	import IconArrow from '~icons/ph/arrow-right';
	import IconCheckAgain from '~icons/ph/arrows-counter-clockwise';
	import IconUpToDate from '~icons/ph/check-circle';
	import IconCannotCheckForUpdates from '~icons/ph/warning-circle';

	/**
	 * @typedef {object} Props
	 * @property {string} id
	 * @property {number} version
	 * @property {string} source
	 * @property {boolean} [compact=false]
	 */

	/**  @type {Props}*/
	const { id, version, source, compact } = $props();

	/**
	 * Change value to force re-rendering of the component, and thus re-evaluate the upgrade availability
	 */
	let checkagain = $state(0);
</script>

{#if version && source}
	{#key checkagain}
		{#await hasUpgradeAvailable({ id, version, source })}
			<ButtonSecondary disabled onclick={() => {}}>
				<IconCheckAgain />
				{#if !compact}
					Mettre à jour
				{:else}
					v…
				{/if}
			</ButtonSecondary>
		{:then { upToDate, newVersion }}
			{#if upToDate}
				<ButtonSecondary
					help="Cliquer pour vérifier à nouveau"
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
					<span>
						v{version}
					</span>
				</ButtonSecondary>
			{:else}
				<ButtonSecondary
					onclick={async () => {
						await upgradeProtocol({ version, source, id })
							.then(({ version }) => {
								toasts.success(`Protocole mis à jour vers la v${version}`);
							})
							.catch((e) => {
								toasts.error(`Impossible de mettre à jour le protocole: ${e}`);
							});
					}}
					help={`Une mise à jour vers la v${newVersion} est disponible`}
				>
					<IconUpgrade />
					<span class="version-check update-available">
						{#if !compact}
							v{version}
							<IconArrow />
						{/if}
						v{newVersion}
					</span>
				</ButtonSecondary>
			{/if}
		{:catch e}
			<ButtonSecondary
				onclick={() => {
					checkagain = Date.now();
				}}
				help={`Impossible de vérifier les mises à jour: ${e}`}
			>
				<span class="version-check error">
					<IconCannotCheckForUpdates />
					{#if !compact}
						Rééssayer
					{:else}
						v?
					{/if}
				</span>
			</ButtonSecondary>
		{/await}
	{/key}
{:else if version}
	<ButtonSecondary
		onclick={() => {}}
		help="Ce protocole ne supporte pas la vérification des mises à jour"
	>
		<span class="version-check">
			<IconCannotCheckForUpdates />
			v{version}
		</span>
	</ButtonSecondary>
{:else}
	<ButtonSecondary
		onclick={() => {}}
		help="Ce protocole n'est pas versionné, pour le mettre à jour, supprimer le et importez la nouvelle version"
	>
		<span class="version-check error">
			<IconCannotCheckForUpdates />
			v--
		</span>
	</ButtonSecondary>
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
