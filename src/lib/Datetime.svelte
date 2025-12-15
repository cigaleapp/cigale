<!-- 
@component Display a machine-readable (<time>) datetime with a optional relative part
-->

<script lang="ts">
	import * as dates from 'date-fns';

	import { tooltip } from './tooltips';

	/**
	 * @typedef {object} Props
	 * @property {string | Date} value
	 * @property {"absolute" | "relative" | "both"} [show="absolute"] what to display
	 */

	/** @type {Props & Record<string, unknown>} */
	const { value, show = 'absolute', ...rest } = $props();

	const parsedDate = $derived(typeof value === 'string' ? new Date(value) : value);

	const absolute = $derived(dates.format(parsedDate, 'PPpp'));
	const relative = $derived(dates.formatDistanceToNow(parsedDate, { addSuffix: true }));
</script>

<time
	{...rest}
	datetime={parsedDate.toISOString()}
	use:tooltip={show === 'relative' ? absolute : undefined}
>
	{#if show === 'absolute'}
		{absolute}
	{:else if show == 'relative'}
		{relative}
	{:else}
		{absolute} ({relative})
	{/if}
</time>
