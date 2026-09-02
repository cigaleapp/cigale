<script lang="ts">
	import type { Pathname } from '$app/types';
	import type { Snippet } from 'svelte';

	import IconBack from '~icons/ri/arrow-left-s-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { goto } from '$lib/paths.js';

	import ModalSubmitIssue from './ModalSubmitIssue.svelte';
	import TopbarContent from './TopbarContent.svelte';

	interface Props {
		children: Snippet;
		/** Home by default */
		to?: Pathname;
	}

	const { children, to = '/sessions/' }: Props = $props();
</script>

<TopbarContent>
	<div class="back">
		<ButtonIcon
			help="Retour"
			onclick={async () => {
				await goto(to);
			}}
		>
			<IconBack />
		</ButtonIcon>

		{@render children()}
	</div>

	<div class="actions">
		<ModalSubmitIssue type="bug" />
	</div>
</TopbarContent>

<style>
	.back {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
</style>
