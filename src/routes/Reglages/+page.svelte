<script>
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import Switch from '$lib/Switch.svelte';
	import Gears from '~icons/ph/gear-light';
	import Sun from '~icons/ph/sun-light';
	import Moon from '~icons/ph/moon-light';
	import Cross from '~icons/ph/x-circle-light';

	let open = false;
	$effect(() => {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
			if (matches) console.log('sombr');
			else console.log('clèr');
		});
	});

	function onGearClose() {
		open = !open;
		let listParam = document.querySelector('.listParam');
		if (listParam instanceof HTMLElement) {
			if (open) {
				listParam.style.visibility = 'visible';
				listParam.style.display = 'flex';
			} else {
				listParam.style.visibility = 'hidden';
				listParam.style.display = 'none';
			}
		}
	}
	function onButtonClose() {
		let listParam = document.querySelector('.listParam');
		if (listParam instanceof HTMLElement) {
			listParam.style.visibility = 'hidden';
		}
		open = false;
	}

	function onSizeChange(event) {
		const target = event.target;
		if (target instanceof HTMLInputElement) {
			console.log(target.value);
		}
	}
</script>

<div class="container">
	<div class="IconButton">
		<ButtonIcon onclick={onGearClose}>
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
						onButtonClose();
					}}
				></Cross>
			</div>
			<input
				type="range"
				id="size"
				name="size"
				min="1"
				max="20"
				class="slider"
				onchange={onSizeChange}
			/>
		</div>
		<div class="Language">
			Langue :
			<ButtonPrimary
				onclick={() => {
					console.log("J'aime le français");
				}}>Français</ButtonPrimary
			>
			<ButtonPrimary
				onclick={() => {
					console.log("J'aime le Anglais");
				}}>English</ButtonPrimary
			>
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
		position: fixed;
		width: 100%;
		padding-left: 25px;
		padding-right: 25px;
		z-index: 10;
	}

	.IconButton {
		margin: inherit;
		float: right;
	}
	.listParam {
		margin: inherit;
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
