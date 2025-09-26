<script>
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { errorMessage } from '$lib/i18n.js';
	import { dependencyURI, drop, set } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { goto, href } from '$lib/paths.js';
	import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { slugify } from '$lib/utils.js';
	import { error } from '@sveltejs/kit';
	import VirtualList from '@sveltejs/svelte-virtual-list';
	import IconSearch from '~icons/ph/magnifying-glass';
	import IconAdd from '~icons/ph/plus';
	import IconDelete from '~icons/ph/trash';
	import IconClose from '~icons/ph/x';

	const { data, children } = $props();
	let options = $derived(data.options ?? []);

	let q = $state('');

	// Using Fuse would be very expensive for metadata with 10k+ options
	const searchResults = $derived(
		options.filter((o) =>
			[o.key, o.label].some((field) => !q || field.toLowerCase().includes(q.toLowerCase()))
		)
	);

	/**
	 * @param {SubmitEvent & { currentTarget: HTMLFormElement }} e
	 */
	async function onCreateOption(e) {
		e.preventDefault();
		const nameInput = /** @type {HTMLInputElement|null} */ (e.currentTarget.elements.item(0));

		if (!nameInput?.value) return;

		let key = slugify(nameInput.value).replaceAll('-', '_');
		if (options.find((o) => o.key === key)) {
			key += '_' + options.filter((o) => o.key.startsWith(key)).length;
		}

		try {
			await set('MetadataOption', {
				id: `${data.metadata.id}:${key}`,
				metadataId: data.metadata.id,
				key,
				label: nameInput.value,
				description: ''
			});

			nameInput.value = '';

			await invalidate(dependencyURI('Metadata', data.metadata.id, 'options'));
			await goto('/(app)/protocols/[id]/metadata/[metadata]/options/[option]', {
				id: data.protocol.id,
				metadata: removeNamespaceFromMetadataId(data.metadata.id),
				option: key
			});
		} catch (error) {
			toasts.error(errorMessage(error, "Impossible de créer l'option"));
		}
	}

	/**
	 * @param {string} key
	 * @param {string} label
	 */
	async function onDeleteOption(key, label) {
		const option = structuredClone(options.find((o) => o.key === key));
		if (!option) throw error(404, `Option avec clé ${key} introuvable`);

		options = options.filter((o) => o.key !== key);

		toasts.withUndo('info', `Option ${label || key} supprimée`, {
			undo: async () => {
				// We're within a async callback, Svelte won't track reactive
				// state changes here, so we invalidate options instead of just
				// re-adding to the writable $derived options state variable
				await invalidate(dependencyURI('Metadata', data.metadata.id, 'options'));
			},
			commit: async () => drop('MetadataOption', option.id)
		});
	}
</script>

<div class="aside-and-main">
	<aside>
		<form class="new-option" onsubmit={onCreateOption}>
			<InlineTextInput
				discreet
				label="Nom de la nouvelle option"
				placeholder="Nouvelle option…"
				value=""
				onblur={() => {}}
			/>
			<ButtonIcon submits help="Créer la nouvelle option" onclick={() => {}}>
				<IconAdd />
			</ButtonIcon>
		</form>
		<search>
			<IconSearch />
			<InlineTextInput
				discreet
				label="Rechercher une option"
				placeholder="Rechercher…"
				bind:value={q}
				onblur={() => {}}
			/>
			<ButtonIcon --font-size="0.7em" onclick={() => (q = '')} help="Effacer la recherche">
				<IconClose />
			</ButtonIcon>
		</search>
		<nav>
			<VirtualList items={searchResults} let:item>
				{@const { key, label } = item}
				<div class="navlink" class:active={page.params.option === key}>
					<a
						href={href('/(app)/protocols/[id]/metadata/[metadata]/options/[option]', {
							id: data.protocol.id,
							metadata: removeNamespaceFromMetadataId(data.metadata.id),
							option: key
						})}
					>
						{label}
					</a>
					<div class="delete">
						<ButtonIcon
							dangerous
							help="Supprimer {label || key}"
							onclick={async () => onDeleteOption(key, label)}
						>
							<IconDelete />
						</ButtonIcon>
					</div>
				</div>
			</VirtualList>
		</nav>
	</aside>
	<div class="content">
		{@render children()}
	</div>
</div>

<style>
	.aside-and-main {
		display: grid;
		grid-template-columns: 300px 1fr;
		height: 100%;
		overflow: hidden;
	}

	aside {
		padding: 2rem;
		border-right: 1px solid var(--gay);
		display: grid;
		grid-template-rows: max-content max-content 1fr;
		overflow: hidden;
	}

	.content {
		flex-grow: 1;
		overflow: auto;
		padding: 2rem;
	}

	search {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 1rem;
		border: 2px solid var(--gay);
		border-radius: 0.5rem;
		padding: 0.25rem 0.25rem;
	}

	.new-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	nav {
		display: flex;
		height: 100%;
		width: 100%;
		min-height: 0;
	}

	nav :global(svelte-virtual-list-viewport) {
		width: 100%;
	}

	.navlink {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text);
		position: relative;
		margin-left: 8px;
	}

	.navlink a {
		text-decoration: none;
		width: 100%;
	}

	.navlink:is(:hover, :focus-visible) {
		color: var(--fg-primary);
	}

	.navlink::after {
		content: '';
		position: absolute;
		left: -8px;
		top: 0;
		bottom: 0;
		width: 3px;
		border-radius: 10000px;
	}

	.navlink.active::after {
		background-color: var(--bg-primary);
	}

	.navlink .delete {
		opacity: 0;
		pointer-events: none;
	}

	.navlink:is(:hover, :focus-visible, .active) .delete {
		opacity: 1;
		pointer-events: auto;
	}
</style>
