<script>
	import IconGoto from '~icons/ri/arrow-right-line';
	import IconSelected from '~icons/ri/check-line';
	import IconExpand from '~icons/ri/expand-up-down-line';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import { goto } from '$lib/paths.js';
	import { tooltip } from '$lib/tooltips.js';

	/**
	 * @typedef {object} Props
	 * @property {string} value selected protocol's ID
	 * @property {(value: string) => Promise<void> | void} [onchange]
	 * @property {string} [testid]
	 */

	/** @type {Props} */
	let { value = $bindable(), testid, onchange } = $props();
</script>

<DropdownMenu
	{testid}
	items={[
		{
			label: 'Choisir un protocole',
			items: tables.Protocol.state.map((p) => ({
				type: 'selectable',
				data: { protocol: p },
				key: p.id,
				label: p.name,
				selected: value === p.id,
				async onclick() {
					value = p.id;
					await onchange?.(value);
				}
			}))
		},
		{
			items: [
				{
					type: 'clickable',
					data: { protocol: null },
					label: 'Gérer les protocoles',
					async onclick() {
						await goto('/protocols');
					}
				}
			]
		}
	]}
>
	{#snippet trigger(props)}
		<button aria-label="Choisir un protocole" class:none-selected={!value} class="trigger" {...props}>
			{#if value}
				{tables.Protocol.getFromState(value)?.name}
			{:else}
				Aucun protocole sélectionné
			{/if}
			<IconExpand />
		</button>
	{/snippet}

	{#snippet item({ protocol }, { label })}
		<div class="item">
			<div class="label">
				<div class="icon">
					{#if value === protocol?.id}
						<IconSelected />
					{:else if !protocol}
						<IconGoto />
					{/if}
				</div>
				{label}
			</div>

			<div class="version">
				{#if protocol}
					{#if protocol.version}
						<code use:tooltip={'Version du protocole'}>
							v{protocol.version}
						</code>
					{/if}
					<ButtonUpdateProtocol compact {...protocol} />
				{/if}
			</div>
		</div>
	{/snippet}
</DropdownMenu>

<style>
	.trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 2px solid transparent;
		padding: 0.5em 0.75em;
		border-radius: var(--corner-radius);
		flex-wrap: nowrap;
		white-space: nowrap;
		font-size: 1rem;

		&:hover,
		&:focus-visible {
			border-color: var(--gray);
		}

		&.none-selected {
			color: var(--gay);
		}
	}

	.item {
		display: flex;
		align-items: center;
		gap: 2rem;
		width: 100%;
	}

	.item div {
		display: flex;
		align-items: center;
	}

	.icon {
		justify-content: center;
		width: 1rem;
		height: 1rem;
	}

	.label {
		gap: 0.5rem;
		margin-right: auto;
	}

	.footer {
		padding: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.version code {
		font-size: 0.8rem;
	}
</style>
