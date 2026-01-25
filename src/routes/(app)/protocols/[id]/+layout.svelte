<script>
	import { fade } from 'svelte/transition';

	import IconAdd from '~icons/ri/add-line';
	import IconCollapse from '~icons/ri/arrow-left-double-fill';
	import IconBack from '~icons/ri/arrow-left-line';
	import IconExpand from '~icons/ri/arrow-right-double-fill';
	import IconVersioning from '~icons/ri/arrow-up-circle-line';
	import IconCropping from '~icons/ri/crop-line';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconExports from '~icons/ri/file-zip-line';
	import IconInfo from '~icons/ri/information-2-line';
	import IconMetadata from '~icons/ri/list-unordered';
	import IconExport from '~icons/ri/share-forward-line';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Badge from '$lib/Badge.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import { errorMessage, uppercaseFirst } from '$lib/i18n';
	import IconDatatype from '$lib/IconDatatype.svelte';
	import { databaseHandle, dependencyURI, tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import MetadataBadges from '$lib/MetadataBadges.svelte';
	import { resolve } from '$lib/paths';
	import { goto } from '$lib/paths.js';
	import { exportProtocol } from '$lib/protocols';
	import { namespacedMetadataId, removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
	import { seo } from '$lib/seo.svelte.js';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { tooltip } from '$lib/tooltips.js';
	import { slugify } from '$lib/utils';
	import { navbarAppearance } from '$routes/(app)/+layout.svelte';

	import ModalDeleteProtocol from '../ModalDeleteProtocol.svelte';
	import { updater } from './updater.svelte';

	seo({ title: `Protocole ${page.params.id}` });

	const { children, data } = $props();
	let { id, name, version, metadata, metadataDefinitions, metadataOrder } = $derived(data);

	/** @type {undefined | (() => void)}*/
	let deleteProtocol = $state(undefined);

	/** @type {HTMLElement|null} */
	let metadataNav = $state(null);

	let collapsedSidebar = $state(false);

	navbarAppearance('hidden');

	/**
	 * Available route IDs relative to here.
	 * @import { ChildRouteId, WithoutPrefix  } from '$lib/utils';
	 * @typedef {WithoutPrefix<"metadata/[metadata]", ChildRouteId<"/(app)/protocols/[id]">>} ProtocolRouteIds
	 */

	/**
	 *
	 * @param {SubmitEvent & { currentTarget: HTMLFormElement }} e
	 */
	async function onCreateMetadata(e) {
		e.preventDefault();
		const nameInput = /** @type {HTMLInputElement|null} */ (e.currentTarget.elements.item(0));
		if (!nameInput?.value) return;

		const name = nameInput.value.trim();

		try {
			let newId = namespacedMetadataId(id, slugify(name).replaceAll('-', '_'));
			if (metadata.includes(newId))
				newId += `_${metadata.filter((k) => k.startsWith(newId)).length + 1}`;

			await tables.Metadata.set({
				id: newId,
				label: name,
				description: '',
				type: 'string',
				mergeMethod: 'none',
				required: false
			});

			await tables.Protocol.update(id, 'metadata', [newId, ...metadata]);
			if (metadataOrder)
				await tables.Protocol.update(id, 'metadataOrder', [newId, ...metadataOrder]);

			await invalidate(dependencyURI('Protocol', id));

			const shortId = removeNamespaceFromMetadataId(newId);

			nameInput.value = '';
			metadataNav?.children
				.item(metadata.length - 1)
				?.scrollIntoView({ behavior: 'smooth', block: 'end' });

			toasts.success(`Métadonnée ${shortId} créée`);
			await goto('/(app)/protocols/[id]/metadata/[metadata]/infos', {
				id,
				metadata: shortId
			});
		} catch (error) {
			toasts.error(errorMessage(error, 'Impossible de créer la métadonnée'));
		}
	}

	/**
	 * @param {import('$lib/database').Metadata} def
	 */
	async function onDeleteMetadata(def) {
		const metadataOrderBefore = structuredClone(metadataOrder);
		const shortId = removeNamespaceFromMetadataId(def.id);

		const updateProtocol = updater((p, /** @type {'undo' | 'remove'} */ action) => {
			if (action === 'undo') {
				p.metadata.push(def.id);
				if (metadataOrderBefore) p.metadataOrder = metadataOrderBefore;
			} else {
				p.metadata = p.metadata.filter((k) => k !== def.id);
				if (p.metadataOrder) p.metadataOrder = p.metadataOrder.filter((k) => k !== def.id);
			}
		});

		await updateProtocol('remove');

		toasts.withUndo('success', `Métadonnée ${shortId} supprimée`, {
			undo: async () => updateProtocol('undo'),
			commit: async () => tables.Metadata.remove(def.id)
		});
	}

	/**
	 * @param {string} newid
	 * @param {(value: string) => void} setInputValue
	 */
	async function changeProtocolID(newid, setInputValue) {
		if (!newid) {
			setInputValue(id);
			return;
		}

		await tables.Protocol.update(id, 'id', newid);
		await tables.Protocol.remove(id);
		id = newid;

		if (!page.route?.id) return;
		// @ts-expect-error
		await goto(page.route.id, {
			...page.params,
			id: newid
		});
	}
</script>

<div class="sidebar-and-main" in:fade={{ duration: 100 }}>
	<aside class:collapsed={collapsedSidebar}>
		{#if !collapsedSidebar}
			<header in:fade>
				<div class="top-actions">
					<ButtonInk onclick={() => goto('/protocols')}>
						<IconBack />
						Retour
					</ButtonInk>

					<Badge
						tooltip="L'interface de modification de protocole n'est pas encore peaufinée. Certaines choses ne sont pas encore modifiables ici. Pour les changer, exportez les protocoles, modifiez l'export (fichier JSON) et ré-importez-le"
					>
						Beta
					</Badge>
				</div>

				<h1>
					<InlineTextInput
						label="Nom du protocole"
						discreet
						value={name}
						onblur={updater((p, newName) => {
							p.name = newName;
						})}
					/>
				</h1>
				<code class="subtitle">
					<InlineTextInput
						label="ID du protocole"
						discreet
						value={id}
						onblur={changeProtocolID}
					/>
				</code>

				<section class="actions">
					<ButtonInk
						onclick={async () => {
							await exportProtocol(databaseHandle(), resolve('/'), id).catch((e) =>
								toasts.error(e)
							);
						}}
					>
						<IconExport />
						Exporter
					</ButtonInk>

					<ButtonInk
						dangerous
						disabled={id === uiState.currentProtocolId && uiState.processing.total > 0}
						onclick={() => deleteProtocol?.()}
					>
						<IconDelete />
						Supprimer
					</ButtonInk>
				</section>
			</header>
		{:else}
			<header in:fade>
				<ButtonIcon
					help="Retour aux protocoles"
					tooltipParams={{ placement: 'right' }}
					onclick={() => goto('/protocols')}
				>
					<IconBack />
				</ButtonIcon>
			</header>
		{/if}

		<ModalDeleteProtocol {id} bind:open={deleteProtocol} ondelete={() => goto('/protocols')} />

		<nav>
			{@render navlink('Informations', 'infos', IconInfo)}
			{@render navlink(
				'Versionnage',
				'versioning',
				IconVersioning,
				version ? `v${version}` : undefined
			)}
			{@render navlink('Exports', 'exports', IconExports)}
			{@render navlink('Recadrage', 'cropping', IconCropping)}
			{@render navlink('Métadonnées', '', IconMetadata, metadataDefinitions.length)}
			{#if collapsedSidebar}
				<div class="navlink" in:fade>
					<div class="menu-icon">
						<ButtonIcon
							help="Ajouter une métadonnée"
							tooltipParams={{ placement: 'right' }}
							onclick={() => (collapsedSidebar = false)}
						>
							<IconAdd />
						</ButtonIcon>
					</div>
				</div>
			{:else}
				<form in:fade class="navlink" onsubmit={onCreateMetadata}>
					<div class="menu-icon standin"></div>
					<InlineTextInput
						label="Nom de la métadonnée"
						value=""
						discreet
						placeholder={{
							idle: 'Nouvelle métadonnée…',
							focused: 'Nom de la métadonnée'
						}}
						onblur={() => {}}
					/>
					<ButtonIcon help="Créer la métadonnée" submits onclick={() => {}}>
						<IconAdd />
					</ButtonIcon>
				</form>
			{/if}
			<nav class="metadata" bind:this={metadataNav}>
				{#each metadataDefinitions as def (def.id)}
					{@const shortId = removeNamespaceFromMetadataId(def.id)}
					{@const label = def.label || shortId}
					{@const url = resolve(
						// @ts-expect-error
						page.route.id?.includes('/protocols/[id]/metadata/[metadata]/')
							? page.route.id
							: '/(app)/protocols/[id]/metadata/[metadata]/infos',
						{
							...page.params,
							id,
							metadata: shortId
						}
					)}

					<div
						class="navlink"
						class:active={page.url.pathname.includes(`metadata/${shortId}/`)}
					>
						{#if collapsedSidebar}
							<a
								in:fade
								class="navlink"
								use:tooltip={{ text: label, placement: 'right' }}
								class:active={page.url.pathname.includes(`metadata/${shortId}/`)}
								href={url}
							>
								<div class="menu-icon">{uppercaseFirst(label).slice(0, 2)}</div>
								<div class="datatype-icon">
									<IconDatatype tooltip={false} type={def.type} />
								</div>
							</a>
						{:else}
							<div class="menu-icon standin"></div>
							<a in:fade href={url}>
								{def.label || shortId}
								<MetadataBadges metadata={def} protocol={data} />
							</a>

							<div class="action">
								<ButtonIcon
									dangerous
									help="Supprimer la métadonnée"
									onclick={async () => onDeleteMetadata(def)}
								>
									<IconDelete />
								</ButtonIcon>
							</div>
						{/if}
					</div>
				{/each}
			</nav>
		</nav>
		<div class="collapse-toggle">
			<ButtonIcon
				help={collapsedSidebar ? 'Déplier' : 'Replier'}
				onclick={() => {
					collapsedSidebar = !collapsedSidebar;
				}}
			>
				{#if collapsedSidebar}
					<IconExpand />
				{:else}
					<IconCollapse />
				{/if}
			</ButtonIcon>
		</div>
	</aside>
	<main class:padded={!page.route.id?.startsWith('/(app)/protocols/[id]/metadata/')}>
		{@render children()}
	</main>
</div>

{#snippet navlink(
	/** @type {string} */ name,
	/** @type {ProtocolRouteIds | ""} */ route,
	/** @type {import('svelte').Component} */ Icon,
	/** @type {string|number|undefined} */ badge = undefined
)}
	{@const path = route === '' ? route : resolve(`/(app)/protocols/[id]/${route}`, { id })}
	<svelte:element
		this={path ? 'a' : 'span'}
		href={path || undefined}
		class="navlink"
		class:active={route && page.route.id?.startsWith(`/(app)/protocols/[id]/${route}`)}
		use:tooltip={collapsedSidebar
			? {
					text: name,
					placement: 'right'
				}
			: undefined}
	>
		<div class="menu-icon">
			<Icon />
		</div>
		{name}
		{#if badge !== undefined}
			<span class="badge">{badge}</span>
		{/if}
	</svelte:element>
{/snippet}

<style>
	.sidebar-and-main {
		display: flex;
		height: 100%;
	}

	main {
		overflow-y: auto;
		width: 100%;
		&.padded {
			padding: 1.5em;
			display: flex;
			flex-direction: column;
			gap: 1rem;
		}
		&.padded > :global(*) {
			max-width: 45rem;
		}
	}

	aside.collapsed + main.padded > :global(*) {
		max-width: 60rem;
	}

	.badge {
		background-color: var(--bg-primary-translucent);
		font-size: 0.8em;
		font-weight: bold;
		padding: 0.1em 0.5em;
		border-radius: 10000px;
	}

	aside {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		height: 100%;
		border-right: 1px solid var(--gray);
		padding: 1.2em;
		overflow: hidden;
		transition: width 0.2s ease;

		&:not(.collapsed) {
			width: 30rem;
		}
		&.collapsed {
			width: 5rem;
		}
	}

	header {
		/* So that the height is stable when toggling collapsed state */
		height: 8rem;
	}

	header .top-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	h1 {
		font-weight: normal;
		font-size: 2em;
		line-height: 1;
	}

	.subtitle {
		color: var(--gray);
	}

	.actions {
		margin-top: 0.5em;
		display: flex;
		flex-flow: row;
		gap: 0.5em;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		overflow-y: auto;
		flex-grow: 1;
	}

	.navlink {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5em;
		text-decoration: none;
		/* Height is fixed for consistency since some navlinks have ButtonIcons in them that changes the content height */
		height: 1.75em;
		flex-shrink: 0;
	}

	.navlink a {
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	.navlink .action {
		margin-left: auto;
		opacity: 0;
	}

	.navlink:is(.active, :hover, :focus-visible) .action {
		opacity: 1;
	}

	.menu-icon {
		width: 1.5em;
		height: 1.5em;
		flex-shrink: 0;
		font-size: 1.2em;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	aside:not(.collapsed) .menu-icon {
		margin-left: calc(0.25em + 4px);
	}
	aside.collapsed .menu-icon {
		margin-left: 4px;
	}

	aside.collapsed nav.metadata .navlink {
		position: relative;

		.datatype-icon {
			position: absolute;
			top: -4px;
			right: -4px;
			font-size: 0.7em;
			/* background-color: var(--bg-neutral); */
		}
	}

	.navlink::before {
		content: '';
		position: absolute;
		height: 100%;
		width: 4px;
		border-radius: 10000px;
	}

	.navlink.active::before {
		background-color: var(--bg-primary);
	}

	a.navlink:not(.active):is(:hover, :focus-visible)::before,
	.navlink:not(.active):has(a):is(:hover, :focus-visible)::before {
		background-color: var(--bg-primary-translucent);
	}
</style>
