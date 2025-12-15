<script lang="ts">
	import { type } from 'arktype';
	import { fade } from 'svelte/transition';
	import wordDiff from 'word-diff';

	import IconAddKey from '~icons/ri/add-line';
	import IconBefore from '~icons/ri/arrow-left-wide-fill';
	import IconKeyValueSeparator from '~icons/ri/arrow-right-s-fill';
	import IconAfter from '~icons/ri/arrow-right-wide-fill';
	import IconRemoveKey from '~icons/ri/delete-bin-line';
	import IconOpenInExternal from '~icons/ri/external-link-fill';
	import IconEditKey from '~icons/ri/pencil-line';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { get, tables } from '$lib/idb.svelte';
	import { resolve } from '$lib/paths';
	import { metadataOptionId, splitMetadataId } from '$lib/schemas/metadata';
	import { entries } from '$lib/utils';

	/**
	 * @typedef {object} Props
	 * @property {import('microdiff').Difference[]} changes
	 *
	 */

	/** @type {Props} */
	const { changes } = $props();

	const HasCurrentOption = type({
		value: {
			key: 'string | number'
		}
	});
</script>

<dl in:fade>
	{#each changes as change (change.path.join('.'))}
		<dt
			class:removed-key={change.type === 'REMOVE'}
			class:added-key={change.type === 'CREATE'}
			class:changed-key={change.type === 'CHANGE'}
		>
			<div class="icon">
				{#if change.type === 'REMOVE'}
					<IconRemoveKey />
				{:else if change.type === 'CREATE'}
					<IconAddKey />
				{:else}
					<IconEditKey />
				{/if}
			</div>
			<div class="path">
				{#if HasCurrentOption.allows(change)}
					{@render breadcrumbedPath(change.path, change.value.key)}
				{:else}
					{@render breadcrumbedPath(change.path)}
				{/if}
			</div>
		</dt>
		<dd
			class:removed={change.type === 'REMOVE'}
			class:removed-value={change.type === 'REMOVE'}
			class:added-value={change.type === 'CREATE'}
		>
			{#if change.type === 'CREATE'}
				{@render jsonValue(change.value)}
			{:else if change.type === 'REMOVE'}
				{@render jsonValue(change.oldValue)}
			{:else if change.type === 'CHANGE' && typeof change.oldValue === 'string' && typeof change.value === 'string'}
				{@render textDiff(wordDiff.diffString(change.oldValue, change.value))}
			{:else if change.type === 'CHANGE'}
				<dl class="changed">
					<dt>
						<IconBefore />
						Avant
					</dt>
					<dd>{@render jsonValue(change.oldValue)}</dd>
					<dt>
						<IconAfter />
						Maintenant
					</dt>
					<dd>{@render jsonValue(change.value)}</dd>
				</dl>
			{/if}
		</dd>
	{/each}
</dl>

{#snippet breadcrumbedPath(
	/** @type {Array<string|number>} */ path,
	/** @type {string|undefined} */ optionKey = undefined
)}
	{@const metadata =
		path[0] === 'metadata' ? tables.Metadata.getFromState(path[1].toString()) : undefined}
	{@const option =
		metadata && path[2] === 'options' && optionKey
			? get('MetadataOption', metadataOptionId(metadata.id, optionKey))
			: undefined}

	{#each path as piece, i (i)}
		{#if i > 0}
			<span class="separator" aria-hidden="true">
				<IconKeyValueSeparator />
			</span>
		{/if}
		{#if metadata}
			{@const metadataId = splitMetadataId(metadata.id)}
			{#if i === 1 && typeof piece === 'string'}
				<a
					title="Voir la métadonnée"
					href={resolve('/(app)/protocols/[id]/metadata/[metadata]', {
						id: metadataId.namespace ?? page.params.id ?? '',
						metadata: metadataId.id
					})}
				>
					{metadata.label || metadataId.id}
				</a>
			{:else if i === 3 && option}
				{#await option then option}
					{#if option}
						<a
							title="Voir l'option"
							href={resolve(
								'/(app)/protocols/[id]/metadata/[metadata]/options/[option]',
								{
									id: metadataId.namespace ?? page.params.id ?? '',
									metadata: metadataId.id,
									option: option.key
								}
							)}
						>
							{option.label || option.key}
						</a>
					{:else}
						<span>{piece}</span>
					{/if}
				{/await}
			{:else}
				<span>{piece}</span>
			{/if}
		{:else if typeof piece === 'number'}
			<span class="index">N°{piece + 1}</span>
		{:else}
			<span>{piece}</span>
		{/if}
	{:else}
		<span class="root">/</span>
	{/each}
{/snippet}

{#snippet jsonValue(/** @type {any} */ value)}
	{#if typeof value === 'string' && URL.canParse(value)}
		<div class="string url">
			{value}
			<ButtonIcon
				help="Ouvrir le lien dans un nouvel onglet"
				onclick={() => window.open(value, '_blank', 'noopener')}
			>
				<IconOpenInExternal />
			</ButtonIcon>
		</div>
	{:else if typeof value === 'string'}
		<span class="string" class:empty={value.length === 0}>
			{#if value.length === 0}
				Vide
			{:else}
				{value}
			{/if}
		</span>
	{:else if typeof value === 'number'}
		<span class="number">{value}</span>
	{:else if typeof value === 'boolean'}
		<span class="boolean">{value ? 'true' : 'false'}</span>
	{:else if value === null}
		<span class="null">
			<!-- @wc-ignore -->
			null
		</span>
	{:else if Array.isArray(value)}
		{#if value.length > 0}
			<ul class="array">
				{#each value as item, i (i)}
					<li>{@render jsonValue(item)}</li>
				{/each}
			</ul>
		{:else}
			<div class="array empty">Vide</div>
		{/if}
	{:else if typeof value === 'object'}
		<dl
			class="object"
			class:nested={Object.values(value).some((v) => typeof v === 'object' && v !== null)}
		>
			{#each entries(value) as [k, v] (k)}
				<dt class="key">{k}</dt>
				<dd>{@render jsonValue(v)}</dd>
			{/each}
		</dl>
	{:else if typeof value === 'undefined'}
		<span class="undefined">
			<!-- @wc-ignore -->
			undefined
		</span>
	{:else}
		<span class="unknown">{value}</span>
	{/if}
{/snippet}

{#snippet textDiff(/** @type {ReturnType<typeof import('word-diff').diffString>} */ parts)}
	{#each parts as change, i (i)}
		{#if change.text}
			<span>{change.text}</span>
		{:else}
			{#if change.remove}
				<span class="removed">{change.remove}</span>
			{/if}
			{#if change.add}
				<span class="added">{change.add}</span>
			{/if}
		{/if}
	{/each}
{/snippet}

<style>
	dt,
	dt .path,
	dt .icon {
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	dt .separator {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	dd {
		margin-left: 2em;
		margin-bottom: 1.5em;
		margin-top: 0.5em;
	}

	.removed {
		text-decoration: line-through;
		color: var(--fg-error);
	}

	.removed-key {
		color: var(--gay);
	}

	.added {
		color: var(--fg-success);
	}

	.added-key .icon {
		color: var(--fg-success);
	}

	.changed-key .icon {
		color: var(--fg-primary);
	}

	.array.empty,
	.string.empty {
		color: var(--gray);
	}

	.array {
		list-style: '— ';
		padding-left: 2ch;
	}

	.added-value .number {
		color: orange;
	}

	.added-value .boolean {
		color: yellow;
	}

	.added-value .null {
		color: violet;
	}

	.added-value dl.object:not(.nested),
	.removed-value dl.object {
		display: grid;
		grid-template-columns: max-content auto;
		align-items: center;
		gap: 0.25em 1em;

		dd {
			margin: 0;
		}

		.key {
			font-weight: bold;

			&::after {
				content: ':';
			}
		}
	}

	.string.url {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
	}
</style>
