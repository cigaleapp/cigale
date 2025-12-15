<script lang="ts">
	import VirtualList from '@sveltejs/svelte-virtual-list';
	import { fade } from 'svelte/transition';

	import IconArrow from '~icons/ri/arrow-right-line';
	import IconCascadesTo from '~icons/ri/corner-down-right-fill';
	import IconCascadesFrom from '~icons/ri/corner-right-down-fill';
	import IconTrash from '~icons/ri/delete-bin-line';
	import IconOpenInExternal from '~icons/ri/external-link-fill';
	import IconImage from '~icons/ri/image-2-line';
	import IconRemove from '~icons/ri/indeterminate-circle-line';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { goto } from '$lib/paths.js';
	import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';

	import { onDeleteOption } from '../+layout.svelte';
	import { updater } from './updater.svelte.js';

	const { data } = $props();
	const { cascades, reverseCascades, metadata } = $derived(data);
	const { key, label, description, learnMore, image } = $derived(data.option);
</script>

<div class="split" in:fade={{ duration: 100 }}>
	<div class="left">
		<Field label="Clé">
			<InlineTextInput
				value={key}
				label="Clé de l'option"
				discreet
				onblur={updater((o, value) => {
					o.key = value;
				})}
			/>
		</Field>
		<Field label="Label">
			<InlineTextInput
				value={label}
				label="Label de l'option"
				discreet
				onblur={updater((o, value) => {
					o.label = value;
				})}
			/>
		</Field>

		<Field label="Description">
			<textarea
				rows="10"
				value={description}
				onblur={updater((o, { target }) => {
					if (!(target instanceof HTMLTextAreaElement)) return;
					o.description = target.value;
				})}
			></textarea>
		</Field>
		<FieldUrl
			label="En savoir plus"
			value={learnMore ?? ''}
			onblur={updater((o, value) => {
				if (value) {
					o.learnMore = value;
				} else {
					delete o.learnMore;
				}
			})}
		/>
	</div>

	<div class="right">
		<FieldUrl
			Icon={IconImage}
			check
			label="Lien vers une image"
			value={image ?? ''}
			onblur={updater((o, value) => {
				if (value) {
					o.image = value;
				} else {
					delete o.image;
				}
			})}
		/>

		{#if image}
			<!-- svelte-ignore a11y_missing_attribute -->
			<img src={image} />
		{/if}
	</div>
</div>

<h3>Synonymes</h3>
<p>
	Autres noms possibles pour cette option. Permet de trouver l'option en cherchant avec un
	synonyme.
</p>

<ul class="synonyms">
	{#each data.option.synonyms ?? [] as synonym, i (i)}
		<li>
			<InlineTextInput
				value={synonym}
				label="Synonyme"
				discreet
				onblur={updater((o, value) => {
					if (value) {
						o.synonyms[i] = value;
					} else {
						o.synonyms.splice(i, 1);
					}
				})}
			/>
			<ButtonIcon
				help="Supprimer le synonyme"
				onclick={updater((o) => {
					o.synonyms.splice(i, 1);
				})}
			>
				<IconRemove />
			</ButtonIcon>
		</li>
	{/each}
	<li class="new">
		<InlineTextInput
			label="Synonyme"
			placeholder="Ajouter un synonyme"
			discreet
			onblur={updater((o, value) => {
				if (!value) return;
				if (!o.synonyms) {
					o.synonyms = [];
				}
				o.synonyms.push(value);
			})}
		/>
	</li>
</ul>

<h3>Cascades</h3>
<p>
	Permet de changer la valeur d'autres métadonnées quand cette option est choisie. Peut être
	pratique pour représenter des taxonomies, ajouter des attributs à une métadonnée, etc.
</p>

<div class="split">
	<div class="left">
		<Field Icon={IconCascadesFrom} composite>
			{#snippet label()}
				Affecte
				<p class="label-help">
					Change la valeur d'autres métadonnées quand {data.metadata.label} = {data.option
						.label}
				</p>
			{/snippet}
			<!-- TODO allow modifying -->
			<dl class="cascades">
				{#each cascades as { metadataId, metadata, option, value } (metadataId)}
					{@const shortId = removeNamespaceFromMetadataId(metadataId)}
					<div class="row">
						<dt>
							{metadata?.label || shortId}
						</dt>
						<IconArrow />
						<dd>
							{option?.label || option?.key || value}
						</dd>
						{#if option}
							<ButtonIcon
								help="Voir {option.label || option.key}"
								onclick={() =>
									goto(
										'/(app)/protocols/[id]/metadata/[metadata]/options/[option]',
										{
											id: page.params.id ?? '',
											metadata: shortId,
											option: option.key
										}
									)}
							>
								<IconOpenInExternal />
							</ButtonIcon>
						{/if}
					</div>
				{:else}
					<p class="empty">Aucune cascade</p>
				{/each}
			</dl>
		</Field>
	</div>

	<div class="right">
		<Field Icon={IconCascadesTo} composite>
			{#snippet label()}
				Affectée par
				<p class="label-help">
					Autres métadonnées qui change {metadata.label} à {data.option.label}
				</p>
			{/snippet}
			<ul class="reverse-cascades">
				<VirtualList items={reverseCascades} let:item>
					{@const { metadataId, metadata, option, value } = item}
					{@const shortId = removeNamespaceFromMetadataId(metadataId)}
					<li>
						Si
						{metadata?.label || shortId} =
						{#if option}
							{option.label || option.key}
							<ButtonIcon
								help="Voir {option.label || option.key}"
								onclick={() =>
									goto(
										'/(app)/protocols/[id]/metadata/[metadata]/options/[option]',
										{
											id: page.params.id ?? '',
											metadata: shortId,
											option: option.key
										}
									)}
							>
								<IconOpenInExternal />
							</ButtonIcon>
						{:else}
							{value}
						{/if}
					</li>
				</VirtualList>
			</ul>
		</Field>
	</div>
</div>

<div class="danger">
	<ButtonSecondary
		danger
		onclick={async () => {
			await onDeleteOption(key, label);
		}}
	>
		<IconTrash />
		Supprimer cette option
	</ButtonSecondary>
</div>

<style>
	.split {
		display: grid;
		grid-template-columns: 1fr 450px;
		gap: 2em;
		width: 100%;
		overflow: hidden;
	}

	h3 {
		margin-top: 3rem;
	}
	h3 + p {
		margin-bottom: 2rem;
	}

	.left,
	.right {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	ul.synonyms {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;

		li {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin: 0;
		}
	}

	.right img {
		border-radius: var(--corner-radius);
		overflow: hidden;
	}

	p.empty {
		color: var(--gray);
	}

	.label-help {
		font-size: 0.85rem;
		color: var(--gay);
	}

	dl.cascades .row {
		display: grid;
		grid-template-columns: 1fr max-content 1fr max-content;
		gap: 2em;
		align-items: center;
	}

	dl.cascades .row * {
		display: flex;
		align-items: center;
	}

	ul.reverse-cascades {
		list-style: none;
		padding: 0;
		height: 300px;
		max-height: 100%;
	}

	ul.reverse-cascades li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: space-between;
	}
</style>
