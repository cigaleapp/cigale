<!-- 
@component Display a machine-readable (<time>) datetime with a optional relative part
-->

<script>
	import * as dates from 'date-fns';

	import { tooltip } from './tooltips.js';

	/**
	 * @typedef {object} Props
	 * @property {string | Date} value
	 * @property {"absolute" | "relative" | "both"} [show="absolute"] what to display
	 * @property {"date" | "time" | "both"} [parts="both"] what parts of the datetime to display. only relevant if show=absolute
	 */

	/** @type {Props & Record<string, unknown>} */
	const { value, show = 'absolute', parts = 'both', ...rest } = $props();

	const parsedDate = $derived(typeof value === 'string' ? new Date(value) : value);

	const relative = $derived(dates.formatDistanceToNow(parsedDate, { addSuffix: true }));
	const absolute = $derived(
		dates.format(parsedDate, { both: 'PPpp', date: 'PP', time: 'pp' }[parts])
	);
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
