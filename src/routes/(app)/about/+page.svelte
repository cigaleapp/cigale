<script lang="ts">
	import JSONC from 'tiny-jsonc';

	import IconSuccess from '~icons/ri/checkbox-circle-line';
	import IconError from '~icons/ri/close-circle-line';
	import IconWarning from '~icons/ri/error-warning-line';
	import IconPrimary from '~icons/ri/information-line';
	import IconNeutral from '~icons/ri/quote-text';
	import { version } from '$app/environment';
	import lockfile from '$lib/../../bun.lock?raw';
	import Logo from '$lib/Logo.svelte';
	import { seo } from '$lib/seo.svelte';

	const { data } = $props();

	seo({ title: 'À propos' });

	/**
	 * @type {undefined | { node: string; chrome: string; electron: string; os?: { name: string; version: string; architecture: string; archIsUnusual: boolean }; sw: string[] }}
	 */
	let electronVersions = $state();

	$effect(() => {
		if (window.versions) {
			electronVersions = {
				node: window.versions.node(),
				chrome: window.versions.chrome(),
				electron: window.versions.electron()
			};

			void window.versions.os().then((os) => {
				if (!electronVersions) return;
				electronVersions.os = os;
				electronVersions.sw = os.serviceWorkers;
			});
		}
	});

	let logoDrawPercent = $state(0);
	$effect(() => {
		const interval = setInterval(() => {
			logoDrawPercent = Math.max(1, logoDrawPercent + 0.03);
		}, 10);
		return () => {
			if (logoDrawPercent >= 1) {
				clearInterval(interval);
			}
		};
	});

	const authors = [
		{ name: 'Céleste Tiano', gitlab: 'tianoc' },
		{ name: 'Gaetan Laumonier', gitlab: 'laumong' },
		{ name: 'Gwenn Le Bihan', gitlab: 'gwennlbh', url: 'https://gwen.works' },
		{ name: 'Ines Charles', gitlab: 'charlei' },
		{ name: 'Olivier Lamothe', gitlab: 'lamotho' }
	].map(({ gitlab, ...rest }) => ({ url: `https://git.inpt.fr/${gitlab}`, ...rest }));

	const supervisors = [
		{ name: 'Axel Carlier', url: 'https://github.com/axelcarlier' },
		{ name: 'Maxime Cauchois', url: 'https://github.com/mcauchoix' },
		{ name: 'Edgar Remy', url: 'https://github.com/edgaremy' },
		{ name: 'Thomas Forgione', url: 'https://github.com/tforgione' }
	];

	/**
	 * @returns {Promise<Array<[string, string]>>} Array of [package name, version used]
	 */
	async function showDependencies() {
		const { workspaces, packages } = JSONC.parse(lockfile);

		// Get list of package names
		const pkgs = [
			...Object.keys(workspaces[''].dependencies),
			...Object.keys(workspaces[''].devDependencies)
		];

		// Get resolved versions for each package
		return pkgs.map((name) => [name, packages[name][0].replace(`${name}@`, '')]);
	}
</script>

<header>
	<Logo drawpercent={logoDrawPercent} />
	<div class="text">
		<h1>C.i.g.a.l.e.</h1>
		<p class="subtitle">
			Classification Intelligente et Gestion des Arthropodes et de L'Entomofaune
		</p>
	</div>
</header>

<dl>
	<dt>Développé par</dt>
	<dd>
		{@render peoplelinks(authors)}
	</dd>
	<dt>Sous la supervision de</dt>
	<dd>
		{@render peoplelinks(supervisors)}
	</dd>
	<dt>Dans le cadre d'un</dt>
	<dd>
		“Projet long” de l'<a href="https://enseeiht.fr">INP-ENSEEIHT</a>
	</dd>
	<dt>Versions</dt>
	<dd>
		<dl>
			<dt>Appli</dt>
			<dd>{version}</dd>
			{#if electronVersions}
				<dt>Node.js</dt>
				<dd><code>{electronVersions.node}</code></dd>
				<dt>Chrome</dt>
				<dd><code>{electronVersions.chrome}</code></dd>
				<dt>Electron</dt>
				<dd><code>{electronVersions.electron}</code></dd>
				{#if 'os' in electronVersions}
					<dt>{electronVersions.os.name}</dt>
					<dd><code>{electronVersions.os.version}</code></dd>
					{#if electronVersions.os.archIsUnusual}
						<dd><code>{electronVersions.os.architecture}</code></dd>
					{/if}
					<dt>Service workers</dt>
					<dd>
						{#each electronVersions.sw as swurl, i (swurl)}
							{#if i > 0}
								,
							{/if}
							<code>{swurl}</code>
						{:else}
							(aucun)
						{/each}
					</dd>
				{/if}
			{/if}
		</dl>
	</dd>
	<dt>Parallélisme</dt>
	<dd>
		<dl>
			<dt>File de traitement</dt>
			<dd><code>{data.parallelism}</code> max.</dd>
			<dt>sw&rpc</dt>
			<dd><code>{data.parallelism}</code> nodes</dd>
			<dt>Hardware</dt>
			<dd><code>{navigator.hardwareConcurrency}</code> threads</dd>
		</dl>
	</dd>
	<dt>Code source</dt>
	<dd>
		<a href="https://github.com/cigaleapp/cigale">github.com/cigaleapp/cigale</a>
	</dd>
	<dt>Avec les données</dt>
	<dd>
		<dl>
			<dt>Aides à l'identification</dt>
			<dd>
				<a href="https://jessica-joachim.com/identification"
					>Les carnets nature de Jessica</a
				>
			</dd>
			<dt>Arbre taxonomique</dt>
			<dd>
				<a
					href="https://techdocs.gbif.org/en/openapi/v1/species#/Searching%20names/searchNames"
				>
					API de GBIF
				</a>
			</dd>
		</dl>
	</dd>
	<dt>Avec les modèles</dt>
	<dd>
		<dl>
			<dt>Détection & recadrage</dt>
			<dd>YOLO 11n</dd>
			<dt>Classification</dt>
			<dd>ResNet50</dd>
		</dl>
	</dd>
	<dt>Fontes</dt>
	<dd>
		<dl>
			<dt>
				<a href="https://elementtype.co/host-grotesk/">Host Grotesk</a>
			</dt>
			<dd>
				<!-- @wc-include -->
				<span>
					par <a href="https://doughkan.com/">Doğukan Karapınar</a> et
					<a href="https://ibrahimkactioglu.com/">İbrahim Kaçtıoğlu</a>, chez
					<a href="https://elementtype.co/"> Element Type Foundry </a>
				</span>
			</dd>
			<dt>
				<a href="https://evilmartians.com/products/martian-mono"
					><code>Martian Mono</code></a
				>
			</dt>
			<dd>
				<!-- @wc-include -->
				<code>
					par
					<a href="https://www.romanshamin.me/">Roman Shamin</a>, chez
					<a href="https://evilmartians.com">Evil Martians</a>
				</code>
			</dd>
		</dl>
	</dd>
	<dt>Icônes</dt>
	<dd>
		<a href="https://remixicon.com">Remix Icon</a>
		par <a href="https://www.zhangxiaochun.com/">Jimmy Cheung</a> et
		<a href="https://gaoquanquan.com/">Wendy Gao</a>
	</dd>

	<dt>Grâce aux bibliothèques</dt>
	<dd>
		{#await showDependencies()}
			<p>Chargement des dépendances…</p>
		{:then deps}
			<dl class="dependencies">
				{#each deps as [name, version] (name)}
					<dt>
						<a target="_blank" href="https://npmjs.com/package/{name}">{name}</a>
					</dt>
					<dd><code>{version}</code></dd>
				{/each}
			</dl>
		{:catch error}
			<p>Impossible de charger les dépendances</p>
			<p>{error}</p>
		{/await}
	</dd>

	<dt></dt>
	<dd>
		{@render colorswatch('error', IconError)}
		{@render colorswatch('warning', IconWarning)}
		{@render colorswatch('success', IconSuccess)}
		{@render colorswatch('primary', IconPrimary)}
		{@render colorswatch('neutral', IconNeutral)}
	</dd>
</dl>

{#snippet peoplelinks(/** @type {Array<{ name: string; url: string }>} */ people)}
	{#each people.sort(() => Math.random() - 0.5) as { url, name }, i (url || name)}
		{#if i > 0},
		{/if}
		{#if url}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a target="_blank" href={url}>{name}</a>
		{:else}
			{name}
		{/if}
	{/each}
{/snippet}

{#snippet colorswatch(/** @type {string} */ color, /** @type {import('svelte').Component}*/ Icon)}
	<div class="swatch" style:color="var(--fg-{color})" style:background-color="var(--bg-{color})">
		<Icon />
	</div>
{/snippet}

<style>
	header {
		display: flex;
		align-items: center;
		--size: 3rem;
		column-gap: 0.5em;
		row-gap: 0;
	}

	header p {
		margin-top: -0.25em;
	}

	dl {
		display: flex;
		flex-direction: column;
	}

	dd {
		padding-left: 0.5em;
		margin-bottom: 1em;
	}

	dl > dd > dl {
		display: grid;
		grid-template-columns: max-content max-content;
	}

	dl > dd > dl > dd {
		margin-bottom: 0;
	}

	.dependencies code {
		font-size: 0.85em;
	}

	.swatch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--corner-radius);
		margin-right: 1rem;
	}
</style>
