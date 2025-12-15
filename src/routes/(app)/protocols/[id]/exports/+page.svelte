<script lang="ts">
	import { fade } from 'svelte/transition';

	import IconCroppedImage from '~icons/ri/crop-line';
	import IconCsvFile from '~icons/ri/file-chart-line';
	import IconJsonFile from '~icons/ri/file-code-line';
	import IconZipFile from '~icons/ri/file-zip-line';
	import IconFolder from '~icons/ri/folder-2-line';
	import IconFolderNew from '~icons/ri/folder-add-line';
	import IconFullImage from '~icons/ri/image-2-line';
	import { page } from '$app/state';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { HANDLEBARS_HELPERS } from '$lib/schemas/protocols.js';
	import { seo } from '$lib/seo.svelte';
	import { getSettings } from '$lib/settings.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import { entries } from '$lib/utils.js';

	import MetadataLink from '../MetadataLink.svelte';

	/**
	 * @import { TreeNode, NodeProvenance } from './utils.js';
	 */

	/**
	 *
	 * @param {NodeProvenance} provenance
	 * @returns {import('svelte').Component}
	 */
	const iconOfNode = (provenance) => {
		switch (provenance) {
			case 'metadata.csv':
				return IconCsvFile;
			case 'metadata.json':
				return IconJsonFile;
			case 'images.cropped':
				return IconCroppedImage;
			case 'images.original':
				return IconFullImage;
		}
	};

	seo({ title: `Protocole ${page.params.id}: Export` });

	const { data } = $props();
	const treeNodes = $state(data.initialTree ?? []);

	/**
	 * @param {NodeProvenance} provenance
	 * @param {string} path
	 */
	async function updateExportsPath(provenance, path) {
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

	/**
	 * @param {TreeNode} children
	 * @param {string} dirname
	 */
	async function updateExportPaths(children, dirname) {
		for (const child of children) {
			if ('folder' in child) {
				await updateExportPaths(child.children, `${dirname}/${child.folder}`);
			} else {
				await updateExportsPath(child.provenance, `${dirname}/${child.filename}`);
			}
		}
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

	<ul class="tree">
		<li>
			<IconZipFile />
			<span class="filename">Résultats.zip</span>
		</li>
		{@render tree(treeNodes, '')}
	</ul>

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

{#snippet tree(/** @type {TreeNode} */ children, /** @type {string} */ dirname = '')}
	<ul class="tree">
		<li class="new-folder">
			<button>
				<IconFolderNew />
				<InlineTextInput
					discreet
					value=""
					placeholder="Nouveau dossier"
					label="Nom du dossier à créer"
					onblur={(folder, setValue) => {
						if (!folder.trim()) {
							toasts.error('Le nom du dossier ne peut pas être vide.');
							return;
						}

						setValue('');
						children.push({ folder, children: [] });
					}}
				/>
			</button>
		</li>
		{#each children as child ('folder' in child ? child.folder : child.filename)}
			<li>
				{#if 'folder' in child}
					{@const Icon = child.icon ?? IconFolder}
					<Icon />
					<div class="text">
						<InlineTextInput
							discreet
							value={child.folder}
							label="Nom du dossier"
							onblur={async (newName) => {
								child.folder = newName;
								await updateExportPaths(child.children, `${dirname}/${newName}`);
							}}
						/>
					</div>
				{:else}
					{@const Icon = iconOfNode(child.provenance)}
					<Icon />
					<div class="text">
						<span class="filename">
							{#if child.provenance === 'metadata.json'}
								<Tooltip
									text="Impossible de modifier le chemin du fichier JSON, car CIGALE doit connaître son emplacement dans le .zip pour pouvoir importer des analyses."
								>
									{child.filename}
								</Tooltip>
							{:else}
								<InlineTextInput
									discreet
									value={child.filename}
									label="Nom du fichier"
									onblur={async (newName) => {
										child.filename = newName;
										await updateExportsPath(
											child.provenance,
											`${dirname}/${newName}`
										);
									}}
								/>
							{/if}
						</span>
						<span class="help">{child.help}</span>
					</div>
				{/if}
			</li>
			{#if 'children' in child}
				{@render tree(child.children, `${dirname}/${child.folder}`)}
			{/if}
		{/each}
	</ul>
{/snippet}

<style>
	ul {
		--indent: 2rem;
		list-style: none;
		padding-left: var(--indent);
		padding-top: 0.75rem;
		gap: 0.75rem;
		display: flex;
		flex-direction: column;
	}

	main {
		display: flex;
		flex-direction: column;
	}

	h3 {
		margin-top: 2rem;
		margin-bottom: 0.5rem;
	}

	.text {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		margin-left: 0.5rem;
	}

	.text .help {
		font-size: 0.9em;
		color: var(--gray);
	}

	ul ul {
		position: relative;
	}
	ul ul::before {
		content: '';
		position: absolute;
		width: 2px;
		background-color: var(--fg-neutral);
		/* XXX the -3px is pixel-perfect-fiddling because icons are a little slimmer than their whole bounding width. visual alignement, basically */
		left: calc(var(--indent) / 2 - 2px - 3px);
		top: 0;
		bottom: 0;
	}

	ul ul li {
		position: relative;
	}
	ul ul li::before {
		content: '';
		position: absolute;
		left: calc(-1 * var(--indent) / 2 - 2px - 3px);
		width: calc(var(--indent) / 2);
		height: 2px;
		background-color: var(--fg-neutral);
	}

	li,
	li > button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	button {
		font-size: 1rem;
		border: none;
		padding: 0;
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
