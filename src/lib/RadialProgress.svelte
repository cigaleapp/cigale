<!-- 
 
@component CSS variables:

- `--fill`: color of the component

-->

<script lang="ts">
	import { tooltip } from './tooltips.js';

	interface Props {
		/** Between 0 and 1 */
		progress: number;
		help: string;
	}

	const { progress, help }: Props = $props();
</script>

<div
	use:tooltip={help}
	aria-label={help}
	role="progressbar"
	aria-valuenow={Math.round(progress * 100)}
	aria-valuemax="100"
	class="progress"
	style:--progress={progress}
></div>

<style>
	@property --progress {
		syntax: '<number>';
		inherits: false;
		initial-value: 0;
	}

	.progress {
		--_fill: var(--fill, var(--fg-neutral));

		appearance: none;
		border: 1px solid var(--_fill);
		background: conic-gradient(
			var(--_fill) 0deg calc(var(--progress) * 1turn),
			transparent calc(var(--progress) * 1turn)
		);
		transition: --progress 0.2s;
		width: 1lh;
		height: 1lh;
		border-radius: 50%;
	}
</style>
