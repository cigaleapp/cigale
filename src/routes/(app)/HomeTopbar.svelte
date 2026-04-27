<script lang="ts">
	import IconProtocols from '~icons/ri/file-list-3-line';
	import IconAccounts from '~icons/ri/group-line';
	import IconAbout from '~icons/ri/information-line';
	import IconManage from '~icons/ri/settings-3-line';
	import { version } from '$app/environment';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { plural } from '$lib/i18n.js';
	import { tables } from '$lib/idb.svelte.js';
	import Logo from '$lib/Logo.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto } from '$lib/paths.js';

	import TopbarContent from './TopbarContent.svelte';
</script>

<TopbarContent>
	<div class="title">
		<Logo />
		Cigale
	</div>
	<!-- Wrapper is because DropdownMenu creates another 0x0 element wrapper alongside its trigger... -->
	<div class="settings">
		<DropdownMenu
			items={[
				{
					items: [
						{
							type: 'clickable',
							data: {
								icon: IconProtocols,
								subtext: plural(tables.Protocol.state.length, [
									'# installé',
									'# installés',
								]),
							},
							label: 'Protocoles',
							onclick() {
								goto('/(app)/protocols');
							},
						},
						{
							type: 'clickable',
							data: {
								icon: IconAccounts,
								subtext: plural(tables.Account.state.length, [
									'# connecté',
									'# connectés',
								]),
							},
							label: 'Comptes',
							onclick() {
								goto('/(app)/accounts');
							},
						},
						{
							type: 'clickable',
							data: { icon: IconAbout, subtext: `Version ${version}` },
							label: 'À propos',
							onclick() {
								goto('/(app)/about');
							},
						},
					],
				},
			]}
		>
			{#snippet item({ icon: Icon, subtext }, { label })}
				<div class="settings-item">
					<div class="icon">
						<Icon />
					</div>
					<span>{label}</span>
					<span class="subtext">
						<OverflowableText text={subtext} />
					</span>
				</div>
			{/snippet}
			{#snippet trigger(props)}
				<ButtonIcon help="Réglages" {...props}>
					<IconManage />
				</ButtonIcon>
			{/snippet}
		</DropdownMenu>
	</div>
</TopbarContent>

<style>
	.title {
		display: flex;
		align-items: center;
		gap: 0.5rem;

		font-size: 1.3rem;
		text-transform: uppercase;
		/* font-family: var(--font-mono); */

		/* <Logo /> props */
		--size: 1.2em;
		--stroke-width: 4.5rem;
	}

	.settings-item {
		display: flex;
		align-items: center;
		gap: 1rem;

		.icon {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 1.5em;
			height: 1.5em;
		}

		.subtext {
			display: flex;
			align-items: center;
			margin-left: auto;
			color: var(--gay);
			font-size: 0.875rem;
		}
	}
</style>
