<script>
	import Logo from '$lib/Logo.svelte';
	import { seo } from '$lib/seo.svelte';
	import lockfile from '$lib/../../package-lock.json' with { type: 'json' };

	seo({ title: 'À propos' });

	/**
	 * @type {undefined | { node: string; chrome: string; electron: string; os: { name: string; version: string; architecture: string; archIsUnusual: boolean } }}
	 */
	let electronVersions = $state();

	$effect(() => {
		if (window.versions) {
			electronVersions = {
				node: window.versions.node(),
				chrome: window.versions.chrome(),
				electron: window.versions.electron(),
				os: window.versions.os()
			};
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
		{ name: 'Achraf Khairoun', gitlab: 'khairoa' },
		{ name: 'Céleste Tiano', gitlab: 'tianoc' },
		{ name: 'Gaetan Laumonier', gitlab: 'laumong' },
		{ name: 'Gwenn Le Bihan', gitlab: 'gwennlbh', url: 'https://gwen.works' },
		{ name: 'Ines Charles', gitlab: 'charlei' },
		{ name: 'Olivier Lamothe', gitlab: 'lamotho' }
	].map(({ name, gitlab, url }) => ({ name, url: url ?? `https://git.inpt.fr/${gitlab}` }));

	const supervisors = [
		// Waiting for approval to show full names
		{ name: 'Axel C.', url: '' },
		{ name: 'Maxime C.', url: '' },
		{ name: 'Rémy E.', url: '' },
		{ name: 'Thomas F.', url: '' }
	];

	/**
	 * @returns {Promise<Array<[string, string]>>} Array of [package name, version used]
	 */
	async function showDependencies() {
		// Get list of package names
		const pkgs = [
			...Object.keys(lockfile.packages[''].dependencies),
			...Object.keys(lockfile.packages[''].devDependencies)
		];

		// Get resolved versions for each package
		// @ts-expect-error
		return pkgs.map((name) => [name, lockfile.packages[`node_modules/${name}`].version]);
	}
</script>

{#snippet peoplelinks(/** @type {Array<{ name: string; url: string }>} */ people)}
	{#each people.sort(() => Math.random() - 0.5) as { url, name }, i (url || name)}
		{#if i > 0},
		{/if}
		{#if url}
			<a target="_blank" href={url}>{name}</a>
		{:else}
			{name}
		{/if}
	{/each}
{/snippet}

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
	{#if electronVersions}
		<dt>Versions</dt>
		<dd>
			<dl>
				<dt>Node.js</dt>
				<dd><code>{electronVersions.node}</code></dd>
				<dt>Chrome</dt>
				<dd><code>{electronVersions.chrome}</code></dd>
				<dt>Electron</dt>
				<dd><code>{electronVersions.electron}</code></dd>
				<dt>{electronVersions.os.name}</dt>
				<dd><code>{electronVersions.os.version}</code></dd>
				{#if electronVersions.os.archIsUnusual}
					<dd><code>{electronVersions.os.architecture}</code></dd>
				{/if}
			</dl>
		</dd>
	{/if}
	<dt>Code source</dt>
	<dd>
		<a href="https://github.com/cigaleapp/cigale">github.com/cigaleapp/cigale</a>
	</dd>
	<dt>Avec les données</dt>
	<dd>
		<dl>
			<dt>Aides à l'identification</dt>
			<dd>
				<a href="https://jessica-joachim.com/identification">Les carnets nature de Jessica</a>
			</dd>
			<dt>Arbre taxonomique</dt>
			<dd>
				<a href="https://techdocs.gbif.org/en/openapi/v1/species#/Searching%20names/searchNames">
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
				par <a href="https://doughkan.com/">Doğukan Karapınar</a> et
				<a href="https://ibrahimkactioglu.com/">İbrahim Kaçtıoğlu</a>, chez
				<a href="https://elementtype.co/"> Element Type Foundry </a>
			</dd>
			<dt>
				<a href="https://github.com/weiweihuanghuang/fragment-mono/"><code>Fragment Mono</code></a>
			</dt>
			<dd>
				<code>
					par
					<a href="https://weiweihuanghuang.github.io/">Wei Huang</a>, chez
					<a href="https://studiolin.org/projects/374-2/">Studio Lin</a>
				</code>
			</dd>
		</dl>
	</dd>
	<dt>Icônes</dt>
	<dd>
		<a href="https://phosphoricons.com/">Phosphor Icons</a> par
		<a href="https://helenazhang.com">Helena Zhang</a>
		et <a href="https://tobiasfried.com">Tobias Fried</a>
	</dd>

	<dt>Grâce aux bibliothèques</dt>
	<dd>
		{#await showDependencies()}
			<p>Chargement des dépendances…</p>
		{:then deps}
			<dl>
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
</dl>

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
</style>
