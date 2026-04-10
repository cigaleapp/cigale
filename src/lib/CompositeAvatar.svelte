<script lang="ts">
	import { tooltip } from '$lib/tooltips.js';

	interface Props {
		sublogo: string | URL | undefined;
		avatar: string | URL | undefined;
		tooltip?: string;
	}
	const { sublogo, avatar, tooltip: tooltipText }: Props = $props();
</script>

<div class="composite-avatar" use:tooltip={tooltipText}>
	{#if sublogo}
		<img class="provider-logo" src={sublogo.toString()} />
	{/if}
	<img class="avatar" src="https://cors.gwen.works/{avatar?.toString() ?? ''}" />
</div>

<style>
	.composite-avatar {
		position: relative;
		font-size: 1.8em;
	}
	.provider-logo {
		position: absolute;
		bottom: -0.125em;
		right: -0.125em;
		height: 0.6em;
		width: 0.6em;
		background-color: var(--bg-neutral);
		border-radius: var(--corner-radius);
	}

	.avatar {
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		height: 1em;
		width: 1em;
	}
</style>
