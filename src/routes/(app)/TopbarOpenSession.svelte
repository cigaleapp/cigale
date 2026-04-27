
<script lang="ts">
	import { goto } from "$lib/paths.js";
	import ButtonIcon from "$lib/ButtonIcon.svelte";
	import IconClose from "~icons/ri/close-line";
	import OverflowableText from "$lib/OverflowableText.svelte";
	import { switchSession } from "$lib/sessions.js";
	import { uiState } from "$lib/state.svelte.js";
	import TopbarContent from "./TopbarContent.svelte";

</script>

<TopbarContent>

	<OverflowableText text={uiState.currentSession?.name ?? ""} />

	<ButtonIcon
	help="Fermer la session"
		onclick={async () => {
			await switchSession(null);
			await goto('/sessions/');
		}}
	>
		<IconClose />
	</ButtonIcon>
</TopbarContent>
