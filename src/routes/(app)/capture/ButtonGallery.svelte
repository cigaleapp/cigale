<script lang="ts">
	import '@layflags/rolling-number';

	import type { CaptureDevice } from './device.svelte.js';

	import IconGallery from '~icons/ri/multi-image-line';
	import ButtonSecondary from '#lib/ButtonSecondary.svelte';
	import { plural } from '#lib/i18n.js';
	import LoadingText, { Loading } from '#lib/LoadingText.svelte';
	import { goto } from '#lib/paths.js';

	interface Props {
		device: CaptureDevice;
	}

	const { device }: Props = $props();
</script>

<ButtonSecondary
	subtle
	onclick={async () => goto('/capture/gallery/')}
	aria-label={plural(device.storage.count ?? 0, [
		'Voir la photo prise',
		'Voir les # photos prises',
	])}
	help="Voir les photos prises"
>
	<IconGallery />
	<span class="photo-count">
		<LoadingText value={device.storage.count ?? Loading} mask="0">
			{#snippet loaded(count)}
				<layflags-rolling-number
					style:--roll-duration="250ms"
					{@attach (node: HTMLElement & { value: number }) => {
						node.value = count;
					}}
				>
					{count}
				</layflags-rolling-number>
			{/snippet}
		</LoadingText>
	</span>
</ButtonSecondary>

<style>
	.photo-count {
		font-size: 1rem;
		font-weight: normal;
		font-variant-numeric: tabular-nums;
		background: none;
		font-size: 1rem;
	}
</style>
