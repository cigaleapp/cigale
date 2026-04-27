<script lang="ts">
	import IconBack from '~icons/ri/arrow-left-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';

	import TopbarContent from './TopbarContent.svelte';
	import { goto } from '$lib/paths.js';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();
</script>

<TopbarContent>
	<div class="back">
		<ButtonIcon
			help="Toutes les sessions"
			onclick={async () => {
				await goto('/sessions/');
			}}
		>
			<IconBack />
		</ButtonIcon>

		{@render children()}
	</div>
</TopbarContent>

<style>
	.back {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
</style>
