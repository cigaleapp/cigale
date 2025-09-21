<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import { metadataDefinitionComparator } from '$lib/metadata.js';
	import { m } from '$lib/paraglide/messages.js';
	import { goto, href } from '$lib/paths.js';
	import { exportProtocol } from '$lib/protocols';
	import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
	import { seo } from '$lib/seo.svelte.js';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { tooltip } from '$lib/tooltips.js';
	import IconVersioning from '~icons/ph/arrow-circle-up';
	import IconBack from '~icons/ph/arrow-left';
	import IconCropping from '~icons/ph/crop';
	import IconExports from '~icons/ph/file-archive';
	import IconInfo from '~icons/ph/info';
	import IconMetadata from '~icons/ph/list-bullets';
	import IconInferred from '~icons/ph/magic-wand';
	import IconExport from '~icons/ph/share';
	import IconTag from '~icons/ph/tag';
	import IconDelete from '~icons/ph/trash';
	import IconTechnical from '~icons/ph/wrench';
	import ModalDeleteProtocol from '../ModalDeleteProtocol.svelte';
	import { setContext } from 'svelte';

	seo({ title: `Protocole ${page.params.id}` });

	const { children, data } = $props();
	let { id, name, version } = $derived(data);

	setContext('setSidebarVersion', (/** @type {number} */ newVersion) => {
		version = newVersion;
		data.version = newVersion;
	});

	/** @type {undefined | (() => void)}*/
	let deleteProtocol = $state(undefined);
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
			{@render navlink('Métadonnées', 'metadata', IconMetadata, data.metadata.length)}
			<nav class="metadata">
				{#each data.metadata.toSorted(metadataDefinitionComparator(data)) as key (key)}
					{#await tables.Metadata.get(key) then def}
						{#if def}
							<a
								href={href('/protocols/[id]/metadata/[metadata]/infos', {
									id,
									metadata: removeNamespaceFromMetadataId(key)
								})}
								class:active={page.url.hash.includes(
									`metadata/${removeNamespaceFromMetadataId(key)}/`
								)}
							>
								<div class="menu-icon standin"></div>
								{#if def?.label}
									{def.label}
								{:else}
									<code>{removeNamespaceFromMetadataId(key)}</code>
									<span use:tooltip={m.technical_metadata_tooltip()} style:color="var(--fg-error)">
										<IconTechnical />
									</span>
								{/if}

								{#if def.id === data.crop?.metadata || (def.infer && 'neural' in def.infer)}
									<sup use:tooltip={m.inferred_metadata_tooltip()} style:color="var(--fg-primary)">
										<IconInferred />
									</sup>
								{:else if def.infer && ('exif' in def.infer || ('latitude' in def.infer && 'exif' in def.infer.latitude))}
									<sup
										use:tooltip={'exif' in def.infer
											? m.inferred_from_single_exif({ exif: def.infer.exif })
											: m.inferred_from_two_exif({
													latitude: def.infer.latitude.exif,
													longitude: def.infer.longitude.exif
												})}
										style:color="var(--fg-primary)"
									>
										<IconTag />
									</sup>
								{/if}
							</a>
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
	/** @type {string} */ href,
	/** @type {import('svelte').Component} */ Icon,
	/** @type {string|number|undefined} */ badge = undefined
)}
	<a
		href="#/protocols/{id}/{href}"
		class="navlink"
		class:active={page.route.id?.includes(`/protocols/[id]/${href}`)}
	>
		<div class="menu-icon">
			<Icon />
		</div>
		{name}
		{#if badge !== undefined}
			<span class="badge">{badge}</span>
		{/if}
	</a>
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
	}

	nav a {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5em;
		text-decoration: none;
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

	nav a .menu-icon {
		margin-left: calc(0.25em + 4px);
	}

	nav a::before {
		content: '';
		position: absolute;
		height: 100%;
		width: 4px;
		border-radius: 10000px;
	}

	nav a.active::before {
		background-color: var(--bg-primary);
	}

	nav a:not(.active):is(:hover, :focus-visible)::before {
		background-color: var(--bg-primary-translucent);
	}
</style>
