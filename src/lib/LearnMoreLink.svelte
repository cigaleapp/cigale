<script lang="ts">
	import IconArrowRight from '~icons/ri/arrow-right-line';

	const { href }: { href: string } = $props();
</script>

<a {href} rel="external" target="_blank" class="learn-more">
	<IconArrowRight />
	<div class="text">
		<span>En savoir plus</span>
		<code class="domain">{new URL(href).hostname}</code>
	</div>
</a>

<style>
	.learn-more {
		display: flex;
		align-items: center;
		color: var(--fg-primary);
		text-decoration: none;
		gap: 1em;
	}

	.text {
		display: flex;
		flex-direction: column;
	}

	.domain {
		font-size: 0.8em;
		color: var(--gay);
	}
</style>
