<script lang="ts">
	import IconBack from '~icons/ri/arrow-left-s-line';
	import IconDeleteAll from '~icons/ri/delete-bin-2-line';
	import IconDelete from '~icons/ri/delete-bin-6-line';
	import IconMore from '~icons/ri/more-2-line';
	import AreaObservations from '$lib/AreaObservations.svelte';
	import AudioPlayer from '$lib/audio/AudioPlayer.svelte';
	import { decodeToMono } from '$lib/audio/decode.js';
	import { renderWaveformSvg } from '$lib/audio/waveform.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import CardMedia from '$lib/CardMedia.svelte';
	import DebugOnly from '$lib/DebugOnly.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { errorMessage, plural } from '$lib/i18n.js';
	import Lightbox from '$lib/Lightbox.svelte';
	import LoadingScreen from '$lib/LoadingScreen.svelte';
	import Logo from '$lib/Logo.svelte';
	import { goto } from '$lib/paths.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { compareBy, ensureRegularNumber } from '$lib/utils.js';
	import TopbarContent from '$routes/(app)/TopbarContent.svelte';

	import { PendingStorage } from '../pendingstorage.svelte.js';

	let storage = $state<PendingStorage>();
	let files = $state<File[]>();

	const waveformHeightPx = 300;

	async function load() {
		if (!uiState.currentSession) return goto('/(app)/sessions');
		storage = await PendingStorage.open(uiState.currentSession.id);
		files = await Array.fromAsync(storage.files('photos', 'audio'));
		files.sort(compareBy((file) => -file.lastModified));
	}

	async function decodeAudio(filename: string) {
		const file = files?.find((f) => f.name === filename && f.type.startsWith('audio/'));
		if (!file) throw new Error(`Fichier audio ${filename} invalide`);

		return await decodeToMono(await file.arrayBuffer());
	}

	async function renderWaveform(decoded: DecodedAudioMono) {
		return renderWaveformSvg(decoded, {
			height: waveformHeightPx,
			loudest: 0.5,
			normalize: false,
		});
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
		{plural(files.length, ['# média capturé', '# médias capturés'])}
	{:else}
		Médias capturés
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
				sort={null}
				items={(files ?? []).map((file) => ({
					sessionId: uiState.currentSessionId!,
					id: file.name,
					name: file.name,
					addedAt: file.lastModified,
					virtual: false,
					metadata: {},
					data: { src: URL.createObjectURL(file), type: file.type, filename: file.name },
				}))}
			>
				{#snippet item({ src, type, filename }, { name })}
					{const isImage = $derived(type.startsWith('image/'))}
					{const isAudio = $derived(type.startsWith('audio/'))}

					<Lightbox
						// For audio files, the lightbox contains an audio player that needs to be clickable
						interactive={isAudio}
					>
						{#snippet trigger({ onclick })}
							<CardMedia
								{onclick}
								id={name}
								title={name}
								dimensions={windowDimensions}
								// TODO: allow selecting cards and doing sth with them
								selectable={false}
								image={isImage ? src : undefined}
								{type}
								status="ok"
							/>
						{/snippet}

						{#snippet content()}
							{#if isImage}
								<img class="lightbox" {src} alt={name} />

								<div class="lightbox-info">
									<p>{name}</p>
								</div>
							{:else if isAudio}
								<div class="lightbox" data-lightbox-close-on-click>
									{#await decodeAudio(filename)}
										<div class="waveform" style:height="{waveformHeightPx}px">
											<Logo loading />
										</div>

										<AudioPlayer
											// src=undefined to prevent <audio> trying to load
											// the file before the element being destroyed
											// due to decodeAudio finishing
											src={undefined}
										/>
									{:then decoded}
										{let progress = $state(0)}

										<div
											class="waveform"
											style:height="{waveformHeightPx}px"
											style:--audio-progress={ensureRegularNumber(
												progress,
												0
											)}
										>
											{#await renderWaveform(decoded)}
												<Logo loading />
											{:then rendered}
												<!-- TODO: add <Playhead draggable /> here instead of the progress overlay thingy -->

												{@html rendered.image}
											{/await}
										</div>

										<AudioPlayer
											autoplay
											bind:progress
											precomputedDuration={decoded.duration * 1e3}
											{src}
										/>
									{:catch error}
										<div
											class="waveform error"
											style:height="{waveformHeightPx}px"
										>
											Impossible de générer la forme d'onde: {error}
										</div>
										<AudioPlayer autoplay {src} />
									{/await}
								</div>

								<div class="lightbox-info">
									<p>{name}</p>
								</div>
							{/if}

							<section class="lightbox-actions">
								<ButtonInk
									dangerous
									onclick={async () => {
										if (!storage) return;
										if (!files) return;

										await storage.delete(isImage ? 'photos' : 'audio', name);
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

			<DebugOnly
				data={(files ?? []).map((f) => ({
					name: f.name,
					type: f.type,
					lastModified: new Date(f.lastModified),
				}))}
			/>
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
		height: 60vh;
		width: 80vw;
		object-fit: contain;
		color-scheme: dark;
	}

	.waveform {
		color-scheme: light dark;
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

	.lightbox {
		--audio-player-padding: 0.5rem 0;
	}

	.waveform {
		--waveform-color: var(--fg-neutral);
		--logo-size: 6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;

		background: var(--bg-neutral);
		border-radius: var(--corner-radius);

		&.error {
			color: var(--fg-error);
		}

		:global(svg) {
			/** So that the waveform is in sync with the progress overlay */
			width: 100%;
		}

		& {
			position: relative;
			overflow: clip;

			&::after {
				content: '';
				position: absolute;
				inset: 0;
				width: calc(var(--audio-progress) * 100%);
				background: rgba(from var(--fg-primary) r g b / 20%);
				pointer-events: none;
			}
		}
	}
</style>
