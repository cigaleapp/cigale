<script lang="ts">
	import { Portal } from 'bits-ui';

	// TODO: ask for a dashed circle icon at https://github.com/Remix-Design/RemixIcon/issues for IconUnconfirmed

	import IconPrev from '~icons/ri/arrow-left-s-line';
	import IconNext from '~icons/ri/arrow-right-s-line';
	import IconUnconfirmed from '~icons/ri/loader-line';
	import IconConfirmed from '~icons/ri/verified-badge-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfirmedOverlay from '$lib/ConfirmedOverlay.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import ProgressBar from '$lib/ProgressBar.svelte';

	import { topbarExtrasPortalId } from './+layout@(app).svelte';

	interface Props {
		keyboardShortcutsCategory: 'classification' | 'cropping';
		/** Bind: to this to get the function to flash the confirmed overlay */
		flashConfirmedOverlay: undefined | (() => Promise<void>);
		labels: {
			treated: string;
			confirmed: string;
			item: 'Observation' | 'Image';
		};
		navigation: {
			/** this must be 1-based, **not 0-based** */
			current: number;
			total: number;
			next: () => Promise<void>;
			nextUnconfirmed: () => Promise<void>;
			previous: () => Promise<void>;
		};
		currentIsConfirmed: boolean;
		progress: {
			total: number;
			treated: number;
			confirmed: number;
			// eslint-disable-next-line no-unused-vars
			mark: (status: 'unconfirmed' | 'confirmed') => Promise<void>;
		};
	}

	let {
		navigation,
		progress,
		labels,
		keyboardShortcutsCategory,
		currentIsConfirmed,
		flashConfirmedOverlay = $bindable(),
	}: Props = $props();

	async function confirmAndNext() {
		if (!currentIsConfirmed) {
			await flashConfirmedOverlay?.();
			await progress.mark('confirmed');
		}

		await navigation.nextUnconfirmed();
	}

	defineKeyboardShortcuts(keyboardShortcutsCategory, {
		Space: {
			help: 'Confirmer et passer à la prochaine non confirmée',
			do: confirmAndNext,
		},
		'$mod+ArrowRight': {
			help: `Aller à l'${labels.item.toLowerCase()} prochaine`,
			when: () => navigation.current !== navigation.total,
			do: async () => navigation.next(),
		},
		'$mod+ArrowLeft': {
			help: `Aller à l'${labels.item.toLowerCase()} précédente`,
			when: () => navigation.current !== 1,
			do: async () => navigation.previous(),
		},
		'Shift+Space': {
			help: `Aller à l'${labels.item.toLowerCase()} précédente`,
			do: async () => navigation.previous(),
		},
		'$mod+ArrowUp': {
			help: `Marquer l'${labels.item.toLowerCase()} comme confirmée`,
			do: async () => progress.mark('confirmed'),
		},
		'$mod+ArrowDown': {
			help: `Marquer l'${labels.item.toLowerCase()} comme non confirmée`,
			do: async () => progress.mark('unconfirmed'),
		},
	});

	let portalOnline = $state(false);
	$effect(() => {
		let element = document.getElementById(topbarExtrasPortalId);
		if (element) {
			portalOnline = true;
			return;
		}

		const observer = new MutationObserver(async () => {
			let element = document.getElementById(topbarExtrasPortalId);
			if (element) {
				portalOnline = true;
				observer.disconnect();
			}
		});

		observer.observe(location, {
			childList: true,
			subtree: true,
		});

		return () => observer.disconnect();
	});
</script>

<ConfirmedOverlay bind:show={flashConfirmedOverlay} />

{#if portalOnline}
	<Portal to="#{topbarExtrasPortalId}">
		<div class="confirmation" class:confirmed={currentIsConfirmed}>
			{#if currentIsConfirmed}
				<ButtonIcon
					help="Marquer comme non-confirmée"
					keyboard="$mod+ArrowDown"
					onclick={async () => progress.mark('unconfirmed')}
					loading
				>
					<IconConfirmed />
				</ButtonIcon>
			{:else}
				<ButtonIcon
					help="Marquer comme confirmée"
					keyboard="$mod+ArrowUp"
					onclick={async () => progress.mark('confirmed')}
					loading
				>
					<IconUnconfirmed />
				</ButtonIcon>
			{/if}
		</div>

		<div class="progress">
			<ProgressBar
				progress={[progress.treated / progress.total, progress.confirmed / progress.total]}
				phases={[labels.treated, labels.confirmed]}
			/>
		</div>

		<nav>
			<div class="image-switcher">
				<ButtonIcon
					help="{labels.item} précédente"
					keyboard="$mod+ArrowLeft"
					disabled={navigation.current === 1}
					onclick={async () => navigation.previous()}
					loading
				>
					<IconPrev />
				</ButtonIcon>
				<code class="numbers">
					{navigation.current}
					<div class="separator">⁄</div>
					{navigation.total}
				</code>
				<ButtonIcon
					help="{labels.item} suivante"
					keyboard="$mod+ArrowRight"
					disabled={navigation.current === navigation.total}
					onclick={async () => navigation.next()}
					loading
				>
					<IconNext />
				</ButtonIcon>
			</div>
		</nav>

		<div class="continue">
			<ButtonSecondary
				tight
				keyboard="Space"
				help="Marquer l'{labels.item.toLowerCase()} comme confirmée et passer à la prochaine non confirmée"
				onclick={async () => confirmAndNext()}
				loading
			>
				Continuer
			</ButtonSecondary>
		</div>
	</Portal>
{/if}

<style>
	.progress {
		width: 100%;
		min-width: 60px;
		max-width: 150px;
		--height: 0.5em;
		--inactive-bg: rgb(from var(--gray) r g b / 50%);
		--full-bg: var(--fg-primary);
		--corners: var(--corner-radius);
	}

	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-left: 1em;
	}

	.image-switcher {
		display: flex;
		align-items: center;
		gap: 0.5em;

		.numbers {
			display: flex;
			align-items: center;
			gap: 0.2em;
			font-family: var(--font-mono);
		}
	}

	.confirmation {
		display: inline-flex;

		&.confirmed {
			--fg: var(--fg-success);
		}

		&:not(.confirmed) {
			--fg: var(--gay);
		}
	}
</style>
