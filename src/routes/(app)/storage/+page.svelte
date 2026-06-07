<script lang="ts" module>
	let estimating = $state(false);
	let estimate = $state<StorageEstimate>();

	export async function reestimateStorage() {
		estimating = true;
		try {
			estimate = await navigator.storage.estimate();
		} finally {
			estimating = false;
		}
	}
</script>

<script lang="ts">
	import IconInfo from '~icons/ri/information-line';
	import { formatBytesSize } from '$lib/i18n.js';
	import { list, listByIndex } from '$lib/idb.svelte.js';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { deleteSession } from '$lib/sessions.js';
	import { tooltip } from '$lib/tooltips.js';
	import { sum } from '$lib/utils.js';

	import Table from './Table.svelte';

	$effect(() => {
		void reestimateStorage();
	});

	async function cacheEntrySize(key: Request) {
		const res = await fetch(key);
		const body = await res.bytes();
		return body.length;
	}

	async function sizeOfSession(sessionId: string) {
		const imageFiles = await listByIndex('ImageFile', 'sessionId', sessionId);
		const imagePreviewFiles = await listByIndex('ImagePreviewFile', 'sessionId', sessionId);
		return sum([...imageFiles, ...imagePreviewFiles].map((f) => f.bytes.byteLength));
	}
</script>

<main>
	<header>
		<h1>Stockage</h1>
		{#if estimate?.quota && estimate.usage}
			<section class="quota">
				<ProgressBar alwaysActive progress={estimate.usage / estimate.quota} />
				<p class="summary">
					<LoadingText
						value={estimating ? Loading : formatBytesSize(estimate.usage)}
						mask={formatBytesSize(0)}
					/> utilisés sur <LoadingText
						value={estimating ? Loading : formatBytesSize(estimate.quota)}
						mask={formatBytesSize(0)}
					/>

					<span
						class="quota-help"
						use:tooltip={"Le quota de stockage est attribué par votre navigateur, en fonction de divers signaux comme la fréquence d'utilisation du site"}
					>
						<IconInfo />
					</span>
				</p>
			</section>
		{/if}
	</header>

	<section class="models">
		<h2>Modèles d'inférence</h2>

		{@render cacheTable('cache-models')}
	</section>

	<section class="sessions">
		<h2>Sessions</h2>

		<Table
			listEntries={async () => {
				const sessions = await list('Session');
				return sessions.map((session) => ({
					name: session.name,
					key: session.id,
					origin: '',
					originTooltip: '',
				}));
			}}
			deleteEntry={async (entry) => {
				await deleteSession(entry.key);
			}}
			entrySize={async (entry) => sizeOfSession(entry.key)}
		/>
	</section>

	<!-- TODO -->
	<!-- <section class="protocols">
		<h2>Protocoles</h2>

		<Table
			listEntries={async () => {
				const protocols = await list('Protocol');
				return protocols.map((protocol) => ({
					name: protocol.name,
					key: protocol.id,
					origin: '',
					originTooltip: '',
				}));
			}}
			deleteEntry={async (entry) => {
				// await deleteProtocol
				// TODO
			}}
			entrySize={async (entry) => {
				//  TODO
				return 0;
			}}
		/>
	</section> -->

	<section class="misc">
		<h2>Autres</h2>

		<Table
			listEntries={async () => {
				const names = await caches.keys();
				return names
					.filter((cache) => !['cache-dev', 'cache-models'].includes(cache))
					.map((cache) => ({
						name: cache,
						key: cache,
						origin: '',
						originTooltip: '',
					}));
			}}
			deleteEntry={async (entry) => {
				await caches.delete(entry.key);
			}}
			entrySize={async (entry) => {
				const cache = await caches.open(entry.key);
				const keys = await cache.keys();
				let totalSize = 0;
				for (const key of keys) {
					totalSize += await cacheEntrySize(key);
				}
				return totalSize;
			}}
		/>
	</section>

	{#snippet cacheTable(cacheName: string)}
		<Table
			listEntries={async () => {
				const cache = await caches.open(cacheName);
				const keys = await cache.keys();

				return keys.map((key) => ({
					request: key,
					name: new URL(key.url).pathname.split('/').at(-1) ?? key.url,
					origin: new URL(key.url).host,
					originTooltip: key.url,
					key: key.url,
				}));
			}}
			deleteEntry={async (entry) => {
				const cache = await caches.open(cacheName);
				await cache.delete(entry.request);
			}}
			entrySize={async (entry) => cacheEntrySize(entry.key)}
		/>
	{/snippet}
</main>

<style>
	main {
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
		display: flex;

		flex-direction: column;
		gap: 3rem;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	header .summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	header .quota-help {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.quota {
		--inactive-bg: var(--bg-primary);
		display: flex;
		flex-direction: column;
		align-items: end;
		gap: 0.5rem;
		width: 20rem;
	}

	section h2 {
		margin-bottom: 1rem;
	}
</style>
