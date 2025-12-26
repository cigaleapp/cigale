<script>
	import IconAsterisk from '~icons/ri/asterisk';

	import { tooltip } from './tooltips.js';

	/** @type {{ help?: string }}*/
	const { help = 'Modifications non enregistrées' } = $props();
</script>

<div class="unsaved-changes-indicator" use:tooltip={help}>
	<IconAsterisk />
</div>

<style>
	div {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		font-size: 0.7em;
		color: var(--fg-primary);
	}
</style>
