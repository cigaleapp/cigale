<script>
	import { tables } from '$lib/idb.svelte.js';
	import SelectWithSearch from '$lib/SelectWithSearch.svelte';
</script>

<h1>C'est le réglages des protocooooooooooooooles</h1>
<p>On peut changer les paramètres des protocoles ici</p>

<div>
	{#await tables.Protocol.list()}
		<p>C'est beau la vie hein ?</p>
	{:then protocols}
		<ul style="list-style-type: none;">
			{#each protocols as protocol (protocol.id)}
				<li>
					<div class="protoCard">
						<ul style="list-style-type: none;">
							<li>Nom du protocole : {protocol.name}</li>
							<li>Id : {protocol.id}</li>
							<li>Source : {protocol.source}</li>

							<li>Metadonnées :</li>
							<SelectWithSearch options={protocol.metadata} searchQuery="" selectedValue="" />
							<li>Email de l'auteur.ice : {protocol.author.email}</li>
							<li>Nom de l'auteur.ice : {protocol.author.name}</li>
						</ul>
					</div>
				</li>
			{/each}
		</ul>
	{:catch error}
		<p>Erreur : {error}</p>
	{/await}
</div>

<style>
	h1 {
		padding-top: 40px;
		color: var(--fg-primary);
	}
	.protoCard {
		display: flex;
		flex-direction: column;
		background-color: var(--bg-primary-translucent);
		padding: 10px;
		margin: 10px;
		border-radius: 10px;
		width: fit-content;
		font-weight: bold;
	}
	ul {
		list-style-position: inside;
		padding-left: 0;
	}
</style>
