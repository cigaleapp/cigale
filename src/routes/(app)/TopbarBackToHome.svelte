<script lang="ts">
	import type { Snippet } from 'svelte';

	import IconBack from '~icons/ri/arrow-left-s-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { goto } from '$lib/paths.js';

	import ModalSubmitIssue from './ModalSubmitIssue.svelte';
	import TopbarContent from './TopbarContent.svelte';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();
</script>

<TopbarContent>
	<div class="back">
		<ButtonIcon
			help="Retour"
			onclick={async () => {
				await goto('/sessions/');
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
