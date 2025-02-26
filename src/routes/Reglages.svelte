<script>
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import Switch from '$lib/Switch.svelte';
	import Gears from '~icons/ph/gear-light';
	import Sun from '~icons/ph/sun-light';
	import Moon from '~icons/ph/moon-light';
	import Cross from '~icons/ph/x-circle-light';

	/**    let Screentheme = window.matchMedia('(prefers-color-scheme: dark)').addEventListener(({ matches }) => {
                        if (matches) "Sombre"
                        else "Clair"
                        }) */
	let open = false;
</script>

<div class="container">
	<div class="IconButton">
		<ButtonIcon
			onclick={() => {
				open = !open;
				let listParam = document.querySelector('.listParam');
				if (open) listParam.style.visibility = 'visible';
				else listParam.style.visibility = 'hidden';
				console.log(open);
			}}
		>
			<Gears className="Gears"></Gears>
		</ButtonIcon>
	</div>
	<div class="listParam">
		<div class="Sizeimage">
			<div class="TextFermeture">
				Nombre d'images par ligne :
				<Cross
					cursor="pointer"
					onclick={() => {
						let listParam = document.querySelector('.listParam');
						listParam.style.visibility = 'hidden';
						open = false;
					}}
				></Cross>
			</div>
			<input type="range" id="size" name="size" min="1" max="20" class="slider" />
		</div>
		<div class="Language">
			Langue :
			<ButtonPrimary onclick={() => {}}>Français</ButtonPrimary>
			<ButtonPrimary onclick={() => {}}>English</ButtonPrimary>
		</div>
		<div class="Theme">
			Thème :
			<Switch icons={{ on: Sun, off: Moon }}></Switch>
		</div>
	</div>
</div>

<style>
	.TextFermeture {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}
	.container {
		margin-left: auto;
		margin-right: 0;
		display: flex;
		flex-direction: column;
	}

	.IconButton {
		margin: inherit;
		float: right;
	}
	.listParam {
		margin: inherit;
		display: flex;
		width: 30%;
		flex-direction: column;
		gap: 1em;
		align-items: center;
		background-color: var(--bg-primary-translucent);
		padding-left: 10px;
		padding-right: 20px;
		padding-top: 10px;
		padding-bottom: 10px;
		border-top-left-radius: 5px;
		border-bottom-right-radius: 5px;
		border-bottom-left-radius: 5px;
		border-width: 3px;
		border-color: var(--gay);
		font-size: smaller;
		font-weight: bold;
		color: var(--fg-primary);
		visibility: hidden;
	}
	.Sizeimage {
		width: 100%;
	}

	.slider {
		width: 100%;
		height: 5px;
		background: var(--gray);
		outline: none;
		opacity: 0.7;
		-webkit-transition: 0.2s;
		transition: opacity 0.2s;
		border-radius: 3px;
	}

	.slider:hover {
		opacity: 1;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 25px;
		height: 25px;
		background: var(--bg-primary);
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		width: 10px;
		height: 10px;
		background: var(--bg-primary);
		cursor: pointer;
	}
	.Language {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1em;
	}
	.Theme {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1em;
	}
</style>
