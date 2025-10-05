<script>
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import IconLearnMore from '~icons/ph/info';
	import IconAuthors from '~icons/ph/users';
	import { updater } from '../updater.svelte.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import IconRemove from '~icons/ph/minus-circle';
	import IconAdd from '~icons/ph/plus';

	/**
	 * @import { Protocol } from '$lib/database.js';
	 * @typedef { Protocol['authors'][number] } Author
	 */

	const { data } = $props();

	let { learnMore, authors, description } = $derived(data);
</script>

<h2>Informations sur le protocole</h2>

<header>
	<textarea
		class="description"
		value={description}
		rows="10"
		onblur={updater((p, { target }) => {
			p.description = target.value;
		})}
		placeholder="Description du protocole..."
	></textarea>

	<FieldUrl
		Icon={IconLearnMore}
		value={learnMore ?? ''}
		label="Site du protocole"
		onblur={updater((p, value) => {
			learnMore = value;
			p.learnMore = value;
		})}
	/>

	{#if authors.length}
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
	{/if}
</header>

<style>
	header {
		margin-bottom: 2em;
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
