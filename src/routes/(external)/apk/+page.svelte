<script lang="ts">
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import { openFileFromUrl } from '$lib/download.js';
	import QRCode from '$lib/QRCode.svelte';
	import { APK_DOWNLOAD_URL } from '$lib/update-bundles.js';

	const { data } = $props();
	const info = $derived(data.info);
</script>

<main>
	<h1>Télécharger l'app mobile</h1>

	<ButtonPrimary onclick={async () => openFileFromUrl(APK_DOWNLOAD_URL)}>
		Télécharger
	</ButtonPrimary>

	<section class="qrcode">
		<QRCode kind="url" url={APK_DOWNLOAD_URL} />
	</section>

	{#if info}
		<section class="info">
			<dl>
				<dt>Version</dt>
				<dd>{info.version}</dd>

				<dt>Commit</dt>
				<dd>
					<a class="commit" href="https://github.com/cigaleapp/cigale/commit/{info.sha}">
						{info.sha}
					</a>
				</dd>

				<!-- <dt>Date du build</dt>
				<dd>
					<Datetime value={info.built_at} />
				</dd> -->

				<dt>Version du code natif</dt>
				<dd>
					{info.android_native_code_version}
				</dd>
			</dl>
		</section>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
		gap: 2em;
		padding: 2em;
	}

	.qrcode {
		width: 100%;
		height: 100%;
		max-width: 50vw;
		max-height: 33vh;
	}

	.commit {
		word-break: break-all;
	}

	dl dd {
		margin-bottom: 1em;
	}
</style>
