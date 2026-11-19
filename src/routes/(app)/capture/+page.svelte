<script lang="ts">
	import type { PageProps } from './$types.js';

	import IconFinish from '~icons/ri/check-line';
	import IconQuit from '~icons/ri/close-large-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import DebugOnly from '$lib/DebugOnly.svelte';
	import { percent } from '$lib/i18n.js';
	import LoadingScreen from '$lib/LoadingScreen.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { goto } from '$lib/paths.js';
	import { omit, round } from '$lib/utils.js';

	import AudioMonitor from './AudioMonitor.svelte';
	import ButtonGallery from './ButtonGallery.svelte';
	import ButtonShoot from './ButtonShoot.svelte';
	import CameraViewport from './CameraViewport.svelte';
	import { CaptureDevice } from './device.svelte.js';
	import DeviceOptions from './DeviceOptions.svelte';
	import DeviceTypeSwitcher from './DeviceTypeSwitcher.svelte';
	import FloatingArea from './FloatingArea.svelte';
	import StatusLine from './StatusLine.svelte';

	const { data }: PageProps = $props();
	const device = new CaptureDevice(data.deviceInit);

	let askBeforeQuitting = $state<() => Promise<boolean>>();
	async function quit() {
		// Modal not ready yet
		if (!askBeforeQuitting) return;

		if (device.storage.count > 0) {
			const quitAnyways = await askBeforeQuitting();
			if (!quitAnyways) return;
		}

		void device.storage.clear();
		device.resetShootingPhase();
		await goto('/import/');
	}

	async function finish() {
		const allOk = await device.storage.flush({
			onProgress({ done, total }) {
				device.floatingmsg.set('Import', `${done}/${total} (${percent(done / total)})`);
			},
		});

		if (allOk) {
			device.resetShootingPhase();
			await goto('/import/');
		}
	}
</script>

<!-- TODO: add other options: finish() (import & quit), quit without clearing -->
<ModalConfirm
	key="modal_confirm_cancel_capture"
	cancel="Ne pas quitter"
	confirm="Quitter"
	title="Photos en attente"
	dangerous
	bind:show={askBeforeQuitting}
>
	Il y a {device.storage?.count ?? 0} photos en attente qui seront supprimées si tu quitte
</ModalConfirm>

<main data-snapping={device.camera.snapping} data-transparent={device.needsTransparentDocument}>
	<div class="debuginfo">
		<DebugOnly
			data={{
				phase: device.shootingPhase,
				lap: round((device.timer?.lapProgress ?? 0) * 100, 3),
				global: round((device.timer?.globalProgress ?? 0) * 100, 3),
				timer: device.timer?.config ? omit(device.timer.config, 'messages') : null,
			}}
		/>
	</div>

	<header class="actions" pw-testid="actions-top">
		<section class="left">
			<DeviceOptions {device} />
		</section>

		<section class="center">
			{#if device.timer?.started}
				<StatusLine {device} />
			{:else}
				<DeviceTypeSwitcher {device} />
			{/if}
		</section>

		<section class="quit">
			<ButtonIcon help="Quitter" loading onclick={quit}>
				<IconQuit />
			</ButtonIcon>
		</section>
	</header>

	<div class="notready">
		<LoadingScreen failure={device.failure} loading={!device.ready} />
	</div>

	{#if device.type === 'photo'}
		<CameraViewport {device} />
	{:else if device.type === 'sound'}
		<AudioMonitor {device} />
	{/if}

	<FloatingArea {device} />

	<footer class="actions" data-is-shooting={device.shooting}>
		<section class="left">
			<ButtonGallery {device} />
		</section>

		<section class="shoot">
			<ButtonShoot {device} />
		</section>

		<section class="right">
			<ButtonSecondary subtle loading onclick={finish}>
				{#snippet children({ loading })}
					{#if !loading}
						<IconFinish />
					{/if}
					Fini
				{/snippet}
			</ButtonSecondary>
		</section>
	</footer>
</main>

<style>
	main {
		color-scheme: dark;
		/** Prevent zooming the UI itself when pinching to zoom */
		touch-action: none;

		--bottom-actions-height: 110px;
		--top-actions-height: 70px;
		--ui-surfaces: rgba(0 0 0 / 25%);
	}

	.notready {
		position: fixed;
		inset: 0;
		/* background: var(--bg-neutral); */
		color-scheme: dark;
		z-index: 10;
	}

	.actions {
		z-index: 20;
		position: fixed;
		inset-inline: 0;
		display: grid;
		grid-template-columns: 1fr 1.5fr 1fr;
		padding-inline: 1em;

		/* ButtonIcon & ButtonInk colors */
		--fg: white;
		--bg: var(--ui-surfaces);
		--bg-hover: var(--ui-surfaces);

		& > * {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.25em;
			transition: opacity 500ms;

			&:first-child {
				justify-content: flex-start;
			}

			&:last-child {
				justify-content: flex-end;
			}
		}

		&[data-is-shooting='true'] > *:not(.shoot) {
			opacity: 0;
		}

		&:is(header) {
			top: 0;

			/* XXX: so that floating-actions can be positioned right */
			height: var(--top-actions-height);
		}

		&:is(footer) {
			bottom: 0;

			/* XXX: so that floating-messages can be positioned right */
			height: var(--bottom-actions-height);
		}
	}

	main {
		height: 100vh;

		&:not([data-transparent='true']) {
			background: black;
		}
	}

	.debuginfo {
		position: absolute;
		top: 7rem;
		left: 0;
		color: var(--fg-neutral);
	}
</style>
