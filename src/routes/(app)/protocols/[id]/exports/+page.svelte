<script lang="ts">
	import { fade } from 'svelte/transition';

	import { page } from '$app/state';
	import { tables } from '$lib/idb.svelte.js';
	import { HANDLEBARS_HELPERS } from '$lib/schemas/common.js';
	import { seo } from '$lib/seo.svelte';
	import { getSettings } from '$lib/settings.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { entries } from '$lib/utils.js';
	import ZipContentsTree from '$lib/ZipContentsTree.svelte';

	import type { NodeProvenance } from '../../../../../lib/file-tree.js';
	import MetadataLink from '../MetadataLink.svelte';

	seo({ title: `Protocole ${page.params.id}: Export` });

	const { data } = $props();

	async function updateExportsPath(provenance: NodeProvenance, path: string) {
		const [dotpathParent, dotpathChild] = provenance.split('.');

		const { id, exports } = data.protocol;
		if (!exports) {
			toasts.error("Aucune configuration d'exports trouvée pour ce protocole.");
			return;
		}

		const newExports = {
			images: {
				cropped: exports.images.cropped.toJSON(),
				original: exports.images.original.toJSON()
			},
			metadata: {
				csv: exports.metadata.csv,
				json: exports.metadata.json
			}
		};

		// @ts-expect-error
		newExports[dotpathParent][dotpathChild] = path.replace(/^\//, '').replace(/\/$/, '');

		await tables.Protocol.update(id, 'exports', newExports);
	}
</script>

<main in:fade={{ duration: 100 }}>
	<h2>Exports .zip</h2>

	<h3>Dates de modification</h3>
	<MetadataLink
		definitions={data.metadataDefinitions}
		key={data.protocol.exports?.images.mtime}
		help="Métadonnée à utiliser pour la date de modification des fichers images"
		no-metadata="La date d'export sera utilisée comme date de modification des fichiers images"
	/>

	<h3>Arborescence</h3>

	<ZipContentsTree tree={data.initialTree} editable onedit={updateExportsPath} />

	<p>
		Pour les images recadrées et originales, il y a des variables dans le chemin, par exemple
		<strong><code>{'{{ comme_ceci }}'}</code></strong>. Un fichier sera créé par image exportée.
		On peut aussi utiliser quelques fonctions "helper", qui s'appliquent à une expression
	</p>

	<p>
		Ces expressions avec des {'{{}}'} sont en vérité des
		<a target="_blank" href="https://handlebarsjs.com/guide/">templates Handlebars</a>
	</p>

	<h3>Variables et helpers disponibles</h3>

	<dl class="variables-docs">
		<dt>
			{'{{ observation }}'}
			<br />
			{'{{ observation.label }}'}
			<br />
			{'{{ observation.protocolMetadata.species.confidence }}'}
			<br />
			etc.
		</dt>
		<dd>Observation à laquelle l'image appartient</dd>
		<dt>
			{'{{ image }}'}
			<br />
			{'{{ image.filename }}'}
			<br />
			{'{{ image.protocolMetadata.shoot_date.value }}'}
			<br />
			etc.
		</dt>
		<dd>Image en cours d'exportation</dd>
		<dt>{'{{ sequence }}'}</dt>
		<dd>Numéro de l'image dans l'observation, commençant à 1.</dd>
		<dt>{'{{ numberInObservation }}'}</dt>
		<dd>
			Un numéro de séquence, dont l'unicité est guarantie à travers toutes les images de
			l'export
		</dd>
		{#each entries(HANDLEBARS_HELPERS) as [name, { documentation, usage }] (name)}
			{@const [call, result] = usage.split('->').map((s) => s.trim())}
			<dt>
				{call}<br /> &rarr; {result}
			</dt>
			<dd>{documentation}</dd>
		{/each}
	</dl>

	{#if getSettings().showTechnicalMetadata}
		<pre class="debug">{JSON.stringify(
				tables.Protocol.state.find((p) => p.id === data.protocol.id)?.exports,
				null,
				2
			)}</pre>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
	}

	h3 {
		margin-top: 2rem;
		margin-bottom: 0.5rem;
	}

	pre.debug {
		margin-top: 3rem;
		font-size: 0.7em;
	}

	.variables-docs {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.5em 1em;
	}
</style>
