<script lang="ts">
	import type * as DropdownMenuTypes from '$lib/DropdownMenu.svelte';

	import { Portal } from 'bits-ui';

	import IconPrev from '~icons/ri/arrow-left-s-line';
	import IconNext from '~icons/ri/arrow-right-s-line';
	import IconUnconfirmed from '~icons/ri/loader-line';
	import IconMore from '~icons/ri/more-2-fill';
	import IconConfirmed from '~icons/ri/verified-badge-line';
	// TODO: ask for a dashed circle icon at https://github.com/Remix-Design/RemixIcon/issues for IconUnconfirmed
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfirmedOverlay from '$lib/ConfirmedOverlay.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { percent } from '$lib/i18n';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import { IsMobile } from '$lib/mobile.svelte';
	import { globalModals } from '$lib/modals.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { isDebugMode, toggleSetting } from '$lib/settings.svelte';

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
		/** Only shown on mobile. Always in the menu: Report a bug & toggle debug mode (at the bottom) */
		moreMenu?: DropdownMenuTypes.ItemsGroup<{}, {}>[];
	}

	let {
		navigation,
		progress,
		labels,
		keyboardShortcutsCategory,
		currentIsConfirmed,
		flashConfirmedOverlay = $bindable(),
		moreMenu: _moreMenu = [],
	}: Props = $props();

	const mobile = new IsMobile();

	const moreMenu = $derived.by(() => {
		const others = _moreMenu ?? [];
		let last = others.pop() ?? { label: '', items: [] };

		return [
			...others,
			{
				...last,
				items: [
					...last.items,
					{
						type: 'selectable',
						key: 'debugmode',
						label: 'Mode debug',
						data: {},
						selected: isDebugMode(),
						closeOnSelect: false,
						async onclick() {
							await toggleSetting('debugMode');
						},
					},
					{
						type: 'clickable',
						label: 'Signaler un bug',
						onclick() {
							globalModals.modal_submit_report_bug.open?.();
						},
					},
				],
			},
		];
	});

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
			alternatives: ['d'],
			when: () => navigation.current !== navigation.total,
			do: async () => navigation.next(),
		},
		'$mod+ArrowLeft': {
			help: `Aller à l'${labels.item.toLowerCase()} précédente`,
			alternatives: ['q', 'a', 'shift+space'],
			when: () => navigation.current !== 1,
			do: async () => navigation.previous(),
		},
		'$mod+ArrowUp': {
			help: `Marquer l'${labels.item.toLowerCase()} comme confirmée`,
			alternatives: ['z', 'w'],
			do: async () => progress.mark('confirmed'),
		},
		'$mod+ArrowDown': {
			help: `Marquer l'${labels.item.toLowerCase()} comme non confirmée`,
			alternatives: ['s'],
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

		<div class="confirmation" class:confirmed={currentIsConfirmed}>
			{const alt = $derived(
				currentIsConfirmed ? <T,>(value: T, _: T) => value : <T,>(_: T, value: T) => value
			)}

			<ButtonIcon
				help={alt('Marquer comme non-confirmée', 'Marquer comme confirmée')}
				keyboard={alt('$mod+ArrowDown', '$mod+ArrowUp')}
				onclick={async () => progress.mark(alt('unconfirmed', 'confirmed'))}
				loading
			>
				{const Icon = $derived(alt(IconConfirmed, IconUnconfirmed))}
				<Icon />
			</ButtonIcon>
		</div>

		{#if !mobile.current}
			<div class="progress">
				<ProgressBar
					progress={[
						progress.treated / progress.total,
						progress.confirmed / progress.total,
					]}
					phases={[labels.treated, labels.confirmed]}
				/>
			</div>
		{/if}

		{#if mobile.current}
			<div class="more">
				<DropdownMenu
					items={moreMenu}
					title="Progression: {percent(
						progress.treated / progress.total
					)} traitées, {percent(progress.confirmed / progress.total)} confirmées"
				>
					{#snippet trigger(props)}
						<ButtonIcon {...props}>
							<IconMore />
						</ButtonIcon>
					{/snippet}
				</DropdownMenu>
			</div>
		{/if}

		<div class="continue">
			<ButtonSecondary
				tight
				keyboard="Space"
				help="Marquer l'{labels.item.toLowerCase()} comme confirmée et passer à la prochaine non confirmée"
				onclick={async () => confirmAndNext()}
				loading
			>
				Suivante
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

		@media (max-width: 600px) {
			margin-left: 0;
		}
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

		@media (max-width: 600px) {
			margin-right: auto;
			gap: 0.25em;
			.numbers {
				gap: 0;
			}
		}
	}

	.confirmation {
		display: inline-flex;

		@media (max-width: 600px) {
			margin-left: auto;
		}

		&.confirmed {
			--fg: var(--fg-success);
		}

		&:not(.confirmed) {
			--fg: var(--gay);
		}
	}
</style>
