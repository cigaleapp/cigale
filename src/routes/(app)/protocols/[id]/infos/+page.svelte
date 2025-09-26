<script>
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import IconLearnMore from '~icons/ph/info';
	import IconAuthors from '~icons/ph/users';
	import { updater } from '../updater.svelte.js';

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
		{/snippet}

		<Field composite Icon={IconAuthors} label="Auteurices">
			<ul>
				{#each authors as a, i (a.email + a.name)}
					<li>{@render author(a, i)}</li>
				{/each}
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
		gap: 0.5em;
	}
</style>
