<script lang="ts">
	import Toast from '$lib/Toast.svelte';
	import { toasts } from '$lib/toasts.svelte.js';
</script>

<section class="toasts" data-testid="toasts-area">
	{#each toasts.items('default') as toast (toast.id)}
		<Toast
			{...toast}
			action={toast.labels.action}
			dismiss={toast.labels.close}
			onaction={toast.callbacks.action instanceof URL
				? toast.callbacks.action
				: async () => toast.callbacks.action?.(toast)}
			ondismiss={async () => {
				await toast.callbacks.closed?.(toast);
				toasts.remove(toast.id);
			}}
		/>
	{/each}
</section>

<style>
	.toasts {
		position: fixed;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1em;
		bottom: 1em;
		left: 0;
		right: 0;
		z-index: 1000;
	}
</style>
