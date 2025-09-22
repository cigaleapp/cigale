<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import { errorMessage } from '$lib/i18n';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { metadataDefinitionComparator } from '$lib/metadata.js';
	import { m } from '$lib/paraglide/messages.js';
	import { goto, href } from '$lib/paths.js';
	import { exportProtocol } from '$lib/protocols';
	import { namespacedMetadataId, removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
	import { seo } from '$lib/seo.svelte.js';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { tooltip } from '$lib/tooltips.js';
	import { slugify } from '$lib/utils';
	import { setContext } from 'svelte';
	import IconVersioning from '~icons/ph/arrow-circle-up';
	import IconBack from '~icons/ph/arrow-left';
	import IconCropping from '~icons/ph/crop';
	import IconExports from '~icons/ph/file-archive';
	import IconInfo from '~icons/ph/info';
	import IconMetadata from '~icons/ph/list-bullets';
	import IconInferred from '~icons/ph/magic-wand';
	import IconAdd from '~icons/ph/plus';
	import IconExport from '~icons/ph/share';
	import IconTag from '~icons/ph/tag';
	import IconDelete from '~icons/ph/trash';
	import IconTechnical from '~icons/ph/wrench';
	import ModalDeleteProtocol from '../ModalDeleteProtocol.svelte';
	import { updater } from './updater.svelte';

	seo({ title: `Protocole ${page.params.id}` });

	const { children, data } = $props();
	let { id, name, version, metadata, metadataOrder } = $derived(data);

	setContext('setSidebarVersion', (/** @type {number} */ newVersion) => {
		version = newVersion;
		data.version = newVersion;
	});

	/** @type {undefined | (() => void)}*/
	let deleteProtocol = $state(undefined);

	/** @type {HTMLElement|null} */
	let metadataNav;

	const displayedMetadata = $derived(
		metadata
			.filter((k) => ![data.crop.metadata, data.crop.confirmationMetadata].includes(k))
			.toSorted(metadataDefinitionComparator({ metadataOrder }))
	);

	/**
	 *
	 * @param {string} name
	 * @returns {Promise<string>} the new metadata ID
	 */
	async function createMetadata(name) {
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

		await tables.Protocol.update(id, 'metadata', $state.snapshot(metadata));
		await tables.Protocol.update(id, 'metadataOrder', $state.snapshot(metadataOrder));

		return newId;
	}
</script>

<div class="sidebar-and-main">
	<aside>
		<heading>
			<ButtonInk onclick={() => goto('/protocols')}>
				<IconBack />
				{m.back()}
			</ButtonInk>

			<h1>
				<InlineTextInput
					label="Nom du protocole"
					discreet
					value={name}
					onblur={async (newname) => {
						await tables.Protocol.update(id, 'name', newname);
						name = newname;
					}}
				/>
			</h1>
			<code class="subtitle">
				<InlineTextInput
					label="ID du protocole"
					discreet
					value={id}
					onblur={async (newid) => {
						await tables.Protocol.update(id, 'id', newid);
						id = newid;
					}}
				/>
			</code>

			<section class="actions">
				<ButtonInk
					onclick={async () => {
						await exportProtocol(resolve('/'), id).catch((e) => toasts.error(e));
					}}
				>
					<IconExport />
					{m.export()}
				</ButtonInk>

				<ButtonInk
					dangerous
					disabled={id === uiState.currentProtocolId && uiState.processing.total > 0}
					onclick={() => deleteProtocol?.()}
				>
					<IconDelete />
					{m.delete()}
				</ButtonInk>
			</section>
		</heading>

		<ModalDeleteProtocol {id} bind:open={deleteProtocol} ondelete={() => goto('/protocols')} />

		<nav>
			{@render navlink('Informations', 'infos', IconInfo)}
			{@render navlink(
				'Versioning',
				'versioning',
				IconVersioning,
				version ? `v${version}` : undefined
			)}
			{@render navlink('Exports', 'exports', IconExports)}
			{@render navlink('Recadrage', 'cropping', IconCropping)}
			{@render navlink('Métadonnées', '', IconMetadata, displayedMetadata.length)}
			<form
				class="navlink"
				onsubmit={async (e) => {
					e.preventDefault();
					const nameInput = /** @type {HTMLInputElement|null} */ (e.currentTarget.elements.item(0));
					if (!nameInput?.value) return;

					try {
						const metadataId = await createMetadata(nameInput.value);

						metadata.push(metadataId);
						metadataOrder?.push(metadataId);

						const shortId = removeNamespaceFromMetadataId(metadataId);

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
				}}
			>
				<div class="menu-icon standin"></div>
				<InlineTextInput
					label="Nom de la métadonnée"
					value=""
					discreet
					placeholder={{ idle: 'Nouvelle métadonnée…', focused: 'Nom de la métadonnée' }}
					onblur={() => {}}
				/>
				<ButtonIcon help="Créer la métadonnée" submits onclick={() => {}}>
					<IconAdd />
				</ButtonIcon>
			</form>
			<nav class="metadata" bind:this={metadataNav}>
				{#each displayedMetadata as key (key)}
					{#await tables.Metadata.get(key) then def}
						{#if def}
							<div
								class="navlink"
								class:active={page.url.hash.includes(
									`metadata/${removeNamespaceFromMetadataId(key)}/`
								)}
							>
								<div class="menu-icon standin"></div>
								<a
									href={href('/protocols/[id]/metadata/[metadata]/infos', {
										id,
										metadata: removeNamespaceFromMetadataId(key)
									})}
								>
									{#if def?.label}
										{def.label}
									{:else}
										<code>{removeNamespaceFromMetadataId(key)}</code>
										<span
											use:tooltip={m.technical_metadata_tooltip()}
											style:color="var(--fg-error)"
										>
											<IconTechnical />
										</span>
									{/if}
									{#if def.id === data.crop?.metadata || (def.infer && 'neural' in def.infer)}
										<span
											use:tooltip={m.inferred_metadata_tooltip()}
											style:color="var(--fg-primary)"
										>
											<IconInferred />
										</span>
									{:else if def.infer && ('exif' in def.infer || ('latitude' in def.infer && 'exif' in def.infer.latitude))}
										<span
											use:tooltip={'exif' in def.infer
												? m.inferred_from_single_exif({ exif: def.infer.exif })
												: m.inferred_from_two_exif({
														latitude: def.infer.latitude.exif,
														longitude: def.infer.longitude.exif
													})}
											style:color="var(--fg-primary)"
										>
											<IconTag />
										</span>
									{/if}
								</a>

								<div class="action">
									<ButtonIcon
										dangerous
										help="Supprimer la métadonnée"
										onclick={updater(async (p) => {
											p.metadata = p.metadata.filter((k) => k !== def.id);
											if (p.metadataOrder)
												p.metadataOrder = p.metadataOrder.filter((k) => k !== def.id);
											await tables.Metadata.remove(def.id);
										})}
									>
										<IconDelete />
									</ButtonIcon>
								</div>
							</div>
						{/if}
					{/await}
				{/each}
			</nav>
		</nav>
	</aside>
	<main class:padded={!page.route.id?.startsWith('/(app)/protocols/[id]/metadata/')}>
		{@render children()}
	</main>
</div>

{#snippet navlink(
	/** @type {string} */ name,
	/** @type {string} */ path,
	/** @type {import('svelte').Component} */ Icon,
	/** @type {string|number|undefined} */ badge = undefined
)}
	<svelte:element
		this={path ? 'a' : 'span'}
		href={path ? `#/protocols/${id}/${path}` : undefined}
		class="navlink"
		class:active={path && page.route.id?.includes(`/protocols/[id]/${path}`)}
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
		overflow: auto;
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
		flex-flow: row wrap;
		gap: 0.5em;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		overflow: auto;
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
		margin-left: calc(0.25em + 4px);
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
