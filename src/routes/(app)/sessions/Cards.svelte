<script
	lang="ts"
	generics="Session extends {id: string, protocol: string, name: string, downloaded?: boolean }"
>
	import type { Snippet } from 'svelte';

	import { onDestroy } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	import IconAdd from '~icons/ri/add-line';
	import IconDownloaded from '~icons/ri/hard-drive-2-line';
	import AsyncEach from '$lib/AsyncEach.svelte';
	import Card from '$lib/Card.svelte';
	import { errorMessage } from '$lib/i18n.js';
	import { tables } from '$lib/idb.svelte.js';
	import IfInViewport from '$lib/IfInViewport.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import Logo from '$lib/Logo.svelte';
	import { tooltip } from '$lib/tooltips.js';

	interface Props {
		cache?: { key: string; entries: Map<string, NoInfer<Session>[]> };
		thumbnails: (session: Session) => AsyncIterable<string>;
		sessions: () => AsyncIterable<Session | { total: number }>;
		subtitle: Snippet<[Session]>;
		actions: Snippet<[Session]>;
		create?: undefined | (() => Promise<void>);
		card: (session: Session) => {
			loading: string;
			tooltip: string;
			onclick: (e: MouseEvent, mutator: import('$lib/Card.svelte').Mutator) => Promise<void>;
			highlighted: boolean;
		};
	}

	const { thumbnails, sessions, subtitle, actions, card, cache, create }: Props = $props();

	const thumbnailsCache = new SvelteMap<string, string[]>();

	onDestroy(() => {
		thumbnailsCache.clear();
	});

	$inspect({ thumbnailsCache });
</script>

<AsyncEach {cache} items={sessions} key={(s, i) => s.id + i}>
	{#snippet children(session)}
		{@const protocol = tables.Protocol.getFromState(session.protocol)}
		{@const props = card(session)}
		<Card {...props} --card-border={props.highlighted ? 'var(--bg-primary)' : ''}>
			<div class="content">
				{#if session.downloaded}
					<div class="indicator-downloaded" use:tooltip={"Disponible sur l'appareil"}>
						<IconDownloaded />
					</div>
				{/if}
				<div class="gallery">
					<IfInViewport>
						{#if thumbnailsCache.has(session.id)}
							{#each thumbnailsCache.get(session.id)! as src, i (src + i)}
								<img {src} in:fade={{ duration: 200 }} />
							{/each}
						{:else}
							<AsyncEach
								items={() => thumbnails(session)}
								key={(src, i) => src + i}
								onloaded={(sources) => {
									thumbnailsCache.set(session.id, $state.snapshot(sources));
								}}
							>
								{#snippet children(src)}
									<img {src} in:fade={{ duration: 200 }} />
								{/snippet}
							</AsyncEach>
						{/if}
					</IfInViewport>
				</div>
				<header>
					<p class="protocol">
						{#if protocol}
							{protocol.name}
						{:else}
							<em class="unavailable">Protocole indisponible</em>
						{/if}
					</p>
					<h2>{session.name}</h2>
					<div class="date">
						{@render subtitle(session)}
					</div>
				</header>
				<footer>
					{@render actions(session)}
				</footer>
			</div>
		</Card>
	{/snippet}
	<!-- // XXX: DONT MERGE -->
	<!-- {#snippet empty()}
	{/snippet} -->

	{#snippet ghost()}
		<Card>
			<div class="content">
				<div class="gallery"></div>
				<header>
					<p class="protocol">
						<LoadingText value={Loading} />
					</p>
					<h2><LoadingText value={Loading} /></h2>
					<div class="date">
						<LoadingText value={Loading} />
					</div>
				</header>
				<footer>
					<LoadingText value={Loading} />
				</footer>
			</div></Card
		>
	{/snippet}
	{#snippet loading()}
		<div class="error-screen" in:fade={{ duration: 500 }}>
			<LoadingSpinner --size="5rem" --stroke="3" />
			Chargement…
		</div>
	{/snippet}
	{#snippet empty()}
		{#if create}
			<Card
				testid="new-session-card"
				tooltip="Créer une nouvelle session"
				onclick={async () => {
					await create();
				}}
			>
				<div class="content new">
					<IconAdd />
				</div>
			</Card>
		{:else}
			<div class="error-screen" in:fade={{ duration: 300 }}>
				<Logo --size="5rem" variant="empty" />
				Aucune session
			</div>
		{/if}
	{/snippet}
	{#snippet error(e)}
		<div class="error-screen" in:fade={{ duration: 300 }}>
			<Logo --size="5rem" variant="error" />
			{errorMessage(e, 'Impossible de charger les sessions distantes')}
		</div>
	{/snippet}
</AsyncEach>

<style>
	.content {
		display: grid;
		grid-template-rows: 3fr max-content 50px;
		grid-template-columns: 100%;
		gap: 1rem;
		width: 100%;
		height: 100%;
		position: relative;
	}

	.indicator-downloaded {
		position: absolute;
		top: 1.1em;
		right: 1.1em;
		font-size: 1.05em;
		color: var(--gay);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.content.new {
		place-items: center;
		grid-template-rows: 1fr;
		font-size: 3rem;
	}

	.content .gallery {
		display: flex;
		gap: 0.5rem;
		padding: 1rem 1rem 0;
		height: 100%;
		overflow: hidden;

		img {
			border-radius: var(--corner-radius);
		}
	}

	.content header {
		padding: 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5em;

		h2 {
			line-height: 1;
		}

		.protocol,
		.date {
			color: var(--gay);
		}
	}

	.content footer {
		display: flex;
		justify-content: center;
		flex-grow: 0;
	}

	.error-screen {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;
		text-align: center;
		min-height: 50vh;
	}
</style>
