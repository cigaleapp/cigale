<!-- 
 @component --height for the height of the toasts container (default: 5lh)
-->

<script lang="ts">
	import { toasts } from '$lib/toasts.svelte.js';

	import { toastIcon, toastTheme } from './Toast.svelte';

	/**
	 * @typedef {object} Props
	 * @property {import('$lib/toasts.svelte.js').ToastPoolNames} pool
	 */
	const { pool } = $props();
</script>

<section class="toasts">
	<ul>
		{#each toasts.items(pool) as toast (toast.id)}
			<li style:color="var(--fg-{toastTheme(toast.type)})">
				{#await toastIcon(toast.type) then Icon}
					<Icon />
				{/await}
				{toast.message}
			</li>
		{/each}
	</ul>
</section>

<style>
	.toasts {
		overflow-y: auto;
		height: var(--height, 5lh);
	}

	.toasts ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.toasts li {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: var(--fg-secondary);
		min-width: 30ch;
	}
</style>
