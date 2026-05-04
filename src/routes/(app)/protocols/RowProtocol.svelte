<script lang="ts">
	import type { Protocol } from '$lib/database';

	import IconUpgrade from '~icons/ri/arrow-up-circle-line';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconEdit from '~icons/ri/pencil-line';
	import IconExport from '~icons/ri/share-forward-line';
	import Badge from '$lib/Badge.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto, resolve } from '$lib/paths';
	import { getSettings, setSetting } from '$lib/settings.svelte';
	import { shareUrl } from '$lib/share.js';
	import { uiState } from '$lib/state.svelte';
	import Switch from '$lib/Switch.svelte';

	interface Props extends Partial<Protocol> {
		id: string;
		name: string;
		source?: string;
		version?: number;
		ondelete: () => void;
		updates: 'automatic' | 'manual';

		expanded?: boolean;
	}

	let {
		id,
		name,
		source,
		version,
		ondelete,
		updates,
		expanded = $bindable(false),
	}: Props = $props();

	const autoUpdatesEnabled = $derived.by(() => {
		const user = getSettings().autoUpdateProtocols;
		if (id in user) return user[id];
		return updates === 'automatic';
	});
</script>

<li>
	<details open={expanded}>
		<summary>
			<section class="text">
				<h3>
					<!-- {#if dirty}
						<UnsavedChangesIndicator
							help="Protocole modifié par rapport à la version publiée"
						/>
					{/if} -->
					{name}
				</h3>
				<small><OverflowableText tag="code" text={id} /></small>
			</section>
			<section class="actions">
				<ButtonIcon
					help="Partager"
					disabled={!source}
					onclick={async () => {
						if (!source) return;

						await shareUrl(
							new URL(
								resolve('/(app)/protocols/import/[...url]', {
									url: source,
								}),
								import.meta.env.webOrigin
							)
						);
					}}
				>
					<IconExport />
				</ButtonIcon>
				{#if version && source}
					<ButtonUpdateProtocol compact {version} {source} {id} />
				{:else}
					<ButtonIcon
						crossout
						onclick={() => {}}
						help="Ce protocole ne supporte pas la vérification des mises à jour"
					>
						<IconUpgrade />
					</ButtonIcon>
				{/if}
			</section>
		</summary>
		{#if version && source}
			<label class="auto-updates">
				<Switch
					value={autoUpdatesEnabled}
					label="Mises à jour automatiques"
					onchange={async (enabled) => {
						const currently = getSettings().autoUpdateProtocols;
						await setSetting('autoUpdateProtocols', {
							...currently,
							[id]: enabled,
						});
					}}
				/>

				<div class="text">
					<p>Mettre à jour automatiquement</p>
					<p class="via">
						<OverflowableText text="Via {source}" />
					</p>
				</div>
			</label>
		{/if}
		<div class="more-actions">
			<ButtonSecondary
				danger
				disabled={id === uiState.currentProtocolId && uiState.processing.total > 0}
				onclick={() => {
					ondelete();
				}}
			>
				<IconDelete />
				Supprimer
			</ButtonSecondary>
			<ButtonSecondary onclick={() => goto('/(app)/protocols/[id]/infos', { id })}>
				<IconEdit />
				Modifier
				<Badge>Beta</Badge>
			</ButtonSecondary>

			{#if version && source}
				<ButtonUpdateProtocol {version} {source} {id} />
			{/if}
		</div>
	</details>
</li>

<style>
	li {
		width: 100%;
	}

	.actions,
	.more-actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.more-actions {
		@media (max-width: 600px) {
			flex-wrap: wrap;
		}
	}

	details {
		padding: 1em;
		border-radius: var(--corner-radius);
	}

	details:is(:hover, :focus-visible, :open) {
		background-color: var(--bg-primary-translucent);
		cursor: pointer;
	}

	details:open summary {
		margin-bottom: 1em;
	}

	summary {
		display: flex;
		justify-content: space-between;
		gap: 1em;

		&::marker {
			display: none;
		}

		.text {
			width: 70%;
		}
	}

	.auto-updates {
		display: grid;
		grid-template-columns: max-content auto;
		align-items: center;
		gap: 1em;

		.via {
			color: var(--gay);
		}

		.text {
			overflow: hidden;
		}
	}

	.more-actions {
		margin-top: 1em;
		justify-content: center;
	}
</style>
