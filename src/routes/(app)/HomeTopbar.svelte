<script lang="ts">
	import IconProtocols from '~icons/ri/file-list-3-line';
	import IconAccounts from '~icons/ri/group-line';
	import IconAbout from '~icons/ri/information-line';
	import Settings from './Settings.svelte';
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
{#snippet children(props)}
	<div class="title">
		<Logo />
		Cigale
	</div>
	<!-- Wrapper is because DropdownMenu creates another 0x0 element wrapper alongside its trigger... -->
	<div class="settings">
		

		<Settings {...props} />
	</div>
	{/snippet}
</TopbarContent>

<style>
	.title {
		display: flex;
		align-items: center;
		gap: 0.5rem;

		font-size: 1.1rem;
		text-transform: uppercase;
		letter-spacing: 0.125ch;
		font-weight: 200;
		/* font-family: var(--font-mono); */

		/* <Logo /> props */
		--size: 1.4em;
		--stroke-width: 4rem;
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
