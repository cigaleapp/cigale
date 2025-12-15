<script lang="ts">
	import { fade } from 'svelte/transition';

	import IconAdd from '~icons/ri/add-line';
	import IconDescription from '~icons/ri/align-left';
	import IconAuthors from '~icons/ri/group-line';
	import IconRemove from '~icons/ri/indeterminate-circle-line';
	import IconLearnMore from '~icons/ri/information-2-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';

	import { updater } from '../updater.svelte.js';

	/**
	 * @import { Protocol } from '$lib/database.js';
	 * @typedef { Protocol['authors'][number] } Author
	 */

	const { data } = $props();

	let { learnMore, authors, description } = $derived(data);
</script>

<main in:fade={{ duration: 100 }}>
	<h2>Informations sur le protocole</h2>
	<Field Icon={IconDescription} label="Description">
		<textarea
			class="description"
			value={description}
			rows="10"
			onblur={updater((p, { target }) => {
				if (!(target instanceof HTMLTextAreaElement)) return;
				p.description = target.value;
			})}
			placeholder="Description du protocole..."
		></textarea>
	</Field>

	<FieldUrl
		Icon={IconLearnMore}
		value={learnMore ?? ''}
		label="Site du protocole"
		onblur={updater((p, value) => {
			learnMore = value;
			p.learnMore = value;
		})}
	/>

	{#snippet author(/** @type {{name: string; email?: string}} */ a, /** @type {number} */ i)}
		<div class="author-inputs">
			<InlineTextInput
				label="Nom"
				discreet
				value={a.name}
				onblur={updater((p, value) => {
					a.name = value;
					p.authors[i].name = value;
				})}
			/>
			<br />
			<InlineTextInput
				label="Email"
				discreet
				placeholder="Pas d'email"
				value={a.email ?? ''}
				onblur={updater((p, value) => {
					if (value) {
						a.email = value;
						p.authors[i].email = value;
					} else {
						delete a.email;
						delete p.authors[i].email;
					}
				})}
			/>
		</div>
		<ButtonIcon
			help="Supprimer cet·te auteurice"
			onclick={updater((p) => {
				p.authors.splice(i, 1);
			})}
		>
			<IconRemove />
		</ButtonIcon>
	{/snippet}

	<Field composite Icon={IconAuthors} label="Auteurices">
		<ul class="authors">
			{#each authors as a, i (a.email + a.name)}
				<li>{@render author(a, i)}</li>
			{/each}
			<li class="new">
				<form
					onsubmit={async (e) => {
						e.preventDefault();
						const nameInput = /** @type {HTMLInputElement | undefined} */ (
							e.currentTarget.elements.item(0)
						);
						const emailInput = /** @type {HTMLInputElement | undefined} */ (
							e.currentTarget.elements.item(1)
						);

						if (!emailInput) return;
						if (!nameInput?.value.trim()) return;

						/** @type {Author} */
						const author = { name: nameInput.value.trim() };
						if (emailInput.value.trim()) {
							author.email = emailInput.value.trim();
						}

						await updater((p) => {
							p.authors.push(author);
						})(undefined);

						nameInput.value = '';
						emailInput.value = '';
					}}
				>
					<div class="author-inputs">
						<InlineTextInput
							label="Nom"
							discreet
							placeholder="Ajouter un·e autre"
							value=""
							onblur={() => {}}
						/>
						<br />
						<InlineTextInput
							label="Email"
							type="email"
							discreet
							placeholder="Addresse email"
							value=""
							onblur={() => {}}
						/>
					</div>
					<ButtonIcon help="Ajouter cet·te auteurice" submits onclick={() => {}}>
						<IconAdd />
					</ButtonIcon>
				</form>
			</li>
		</ul>
	</Field>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
	}

	ul {
		list-style: none;
		padding-left: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.5em 1.5em;
	}

	.authors li,
	.authors li.new form {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		width: 100%;
	}
</style>
