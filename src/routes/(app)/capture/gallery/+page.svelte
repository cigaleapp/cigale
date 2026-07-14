<script lang="ts">
	import IconBack from '~icons/ri/arrow-left-s-line';
	import IconDeleteAll from '~icons/ri/delete-bin-2-line';
	import IconDelete from '~icons/ri/delete-bin-6-line';
	import IconMore from '~icons/ri/more-2-line';
	import AreaObservations from '$lib/AreaObservations.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import CardMedia from '$lib/CardMedia.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { errorMessage, plural } from '$lib/i18n.js';
	import Lightbox from '$lib/Lightbox.svelte';
	import LoadingScreen from '$lib/LoadingScreen.svelte';
	import { goto } from '$lib/paths.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import TopbarContent from '$routes/(app)/TopbarContent.svelte';

	import { PendingStorage } from '../pendingstorage.svelte.js';

	let storage = $state<PendingStorage>();
	let files = $state<File[]>();

	async function load() {
		if (!uiState.currentSession) return goto('/(app)/sessions');
		storage = await PendingStorage.open(uiState.currentSession.id);
		files = await Array.fromAsync(storage.files());
	}

	const windowDimensions = $state<{ height: number; width: number }>({ height: 0, width: 0 });
</script>

<svelte:window
	bind:innerHeight={windowDimensions.height}
	bind:innerWidth={windowDimensions.width}
/>

<TopbarContent desktop>
	<ButtonIcon help="Retour à la caméra" onclick={async () => goto('/(app)/capture')}>
		<IconBack />
	</ButtonIcon>

	{#if files}
		{plural(files.length, ['# photo capturée', '# photos capturées'])}
	{:else}
		Photos capturées
	{/if}

	<div class="more">
		<DropdownMenu
			items={[
				{
					label: '',
					items: [
						{
							icon: IconDeleteAll,
							label: 'Tout supprimer et recommencer',
							type: 'clickable',
							data: null,
							danger: true,
							async onclick() {
								await storage?.clear();
								await goto('/(app)/capture');
							},
						},
					],
				},
			]}
		>
			{#snippet trigger(props)}
				<ButtonIcon {...props} help="Plus">
					<IconMore />
				</ButtonIcon>
			{/snippet}
		</DropdownMenu>
	</div>
</TopbarContent>

<main>
	{#await load()}
		<LoadingScreen loading />
	{:then}
		{#if (files ?? []).length > 0}
			<AreaObservations
				zone="pending"
				items={(files ?? []).map((file) => ({
					sessionId: uiState.currentSessionId!,
					id: file.name,
					name: file.name,
					addedAt: file.lastModified,
					virtual: false,
					metadata: {},
					data: { src: URL.createObjectURL(file) },
				}))}
			>
				{#snippet item({ src }, { name })}
					<Lightbox>
						{#snippet trigger()}
							<CardMedia
								id={name}
								title={name}
								dimensions={windowDimensions}
								image={src}
								status="ok"
							/>
						{/snippet}
						{#snippet content()}
							<img class="lightbox" {src} alt={name} />
							<div class="lightbox-info">
								<p>{name}</p>
							</div>
							<section class="lightbox-actions">
								<ButtonInk
									dangerous
									onclick={async () => {
										if (!storage) return;
										if (!files) return;

										await storage.delete(name);
										files = files.filter((f) => f.name !== name);
									}}
								>
									<IconDelete />
									Supprimer
								</ButtonInk>
							</section>
						{/snippet}
					</Lightbox>
				{/snippet}
			</AreaObservations>
		{:else}
			<LoadingScreen empty />
		{/if}
	{:catch error}
		<LoadingScreen failure={errorMessage(error)} />
	{/await}
</main>

<style>
	main {
		min-height: 100vh;
	}

	.lightbox {
		height: 70vh;
		width: 80vw;
		object-fit: contain;
	}

	.lightbox-info {
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		margin: 2rem 0 1rem 0;
	}

	.lightbox-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		color-scheme: dark;
		--bg: transparent;
	}
</style>
