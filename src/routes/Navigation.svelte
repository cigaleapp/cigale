<script>
	import Sup from '~icons/ph/greater-than';
	import Download from '~icons/ph/download-simple';
	import logo from '../favicon.png';
</script>

<div class="navigation">
	<div class="divLogo">
		<img class="logo" src={logo} alt="logo" />
		C.i.g.a.l.e.
	</div>

	<p>Import</p>

	<Sup></Sup>
	<p>Crop top</p>

	<Sup></Sup>
	<p>Classification</p>

	<Sup></Sup>
	<div class="download">
		<Download></Download>
		<p>Résultats</p>
	</div>
</div>

<style>
	.navigation {
		background-color: var(--bg-primary-translucent);
		height: 8%;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding-left: 10px;
		padding-right: 50px;
		resize: vertical;
	}

	.logo {
		width: 60px;
		height: 40px;
	}
	.divLogo {
		display: flex;
		align-items: center;
		font-weight: bold;
		text-transform: uppercase;
	}

	.download {
		display: flex;
		align-items: center;
		gap: 1em;
	}
</style>
