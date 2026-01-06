<script lang="ts">
	import type { Component } from 'svelte';

	import IconCroppedImage from '~icons/ri/crop-line';
	import IconCsvFile from '~icons/ri/file-chart-line';
	import IconJsonFile from '~icons/ri/file-code-line';
	import IconZipFile from '~icons/ri/file-zip-line';
	import IconFolder from '~icons/ri/folder-2-line';
	import IconFolderNew from '~icons/ri/folder-add-line';
	import IconFullImage from '~icons/ri/image-2-line';
	import type { NodeProvenance, TreeNode } from '$lib/file-tree.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { toasts } from '$lib/toasts.svelte.js';
	import Tooltip from '$lib/Tooltip.svelte';

	import Badge from './Badge.svelte';
	import { plural } from './i18n.js';
	import { scrollfader } from './scrollfader.js';

	interface Props {
		tree: TreeNode;
		editable?: boolean;
		// idk why it thinks it's unused, i mean yeah it's an interface's method signature ??
		// eslint-disable-next-line no-unused-vars
		onedit?: (provenance: NodeProvenance, path: string) => void | Promise<void>;
		/** Help text for the root of the tree */
		rootHelp?: string;
	}

	const { tree: root, editable = false, onedit, rootHelp }: Props = $props();

	async function editMany(children: TreeNode, dirname: string) {
		for (const child of children) {
			if ('folder' in child) {
				await editMany(child.children, `${dirname}/${child.folder}`);
			} else {
				await onedit?.(child.provenance, `${dirname}/${child.filename}`);
			}
		}
	}

	const iconOfNode = (provenance: NodeProvenance): Component => {
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
</script>

<ul class="tree">
	<li>
		<IconZipFile />
		<div class="text">
			<span class="filename">results.zip</span>
			{#if rootHelp}
				<span class="help">{rootHelp}</span>
			{/if}
		</div>
	</li>
	{@render tree(root, '')}
</ul>

{#snippet tree(children: TreeNode, dirname: string = '')}
	{@const hasOnlyLeaves =
		Array.isArray(children) && children.every((child) => !('children' in child))}

	<ul
		class="tree"
		class:leaves-only={hasOnlyLeaves}
		{@attach hasOnlyLeaves ? scrollfader : () => {}}
	>
		{#if editable}
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
		{/if}
		{#each children as child ('folder' in child ? child.folder : child.filename)}
			<li>
				{#if 'folder' in child}
					{@const Icon = child.icon ?? IconFolder}
					<Icon />
					<div class="text">
						{#if editable}
							<InlineTextInput
								discreet
								value={child.folder}
								label="Nom du dossier"
								onblur={async (newName) => {
									child.folder = newName;
									await editMany(child.children, `${dirname}/${newName}`);
								}}
							/>
						{:else}
							{child.folder}
						{/if}
					</div>
					{#if 'children' in child && child.children.length > 5}
						<Badge>
							{plural(child.children.length, ['# élément', '# éléments'])}
						</Badge>
					{/if}
				{:else}
					{@const Icon = iconOfNode(child.provenance)}
					<Icon />
					<div class="text">
						<span class="filename">
							{#if !editable}
								{child.filename}
							{:else if child.provenance === 'metadata.json'}
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
										await onedit?.(child.provenance, `${dirname}/${newName}`);
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
		{:else}
			<li class="empty">
				<i>Dossier vide</i>
			</li>
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

	ul.leaves-only {
		max-height: 12rem;
		overflow: auto;
		position: relative;
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

	.empty {
		color: var(--gay);
	}
</style>
