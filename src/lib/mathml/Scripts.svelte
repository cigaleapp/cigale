<script>
	import Atom from './Atom.svelte';

	/**
	 * @typedef {object} Props
	 * @property {string} [base]
	 * @property {import('svelte').Snippet} [children]
	 * @property {string | import('svelte').Snippet} [sub]
	 * @property {string | import('svelte').Snippet} [super]
	 */

	/** @type {Props} */
	const { children, base, sub, super: sup } = $props();
</script>

{#if sup}
	<msup>
		{#if sub}
			<msub>
				{#if children}
					{@render children()}
				{:else if base}
					<Atom expr={base} />
				{/if}
				{#if typeof sub === 'string'}
					<Atom expr={sub} />
				{:else}
					{@render sub()}
				{/if}
			</msub>
		{:else if children}
			{@render children()}
		{:else if base}
			<Atom expr={base} />
		{/if}

		{#if typeof sup === 'string'}
			<Atom expr={sup} />
		{:else}
			{@render sup()}
		{/if}
	</msup>
{:else if sub}
	<msub>
		{#if children}
			{@render children()}
		{:else if base}
			<Atom expr={base} />
		{/if}

		{#if typeof sub === 'string'}
			<Atom expr={sub} />
		{:else}
			{@render sub()}
		{/if}
	</msub>
{:else if children}
	{@render children()}
{:else if base}
	<Atom expr={base} />
{/if}
