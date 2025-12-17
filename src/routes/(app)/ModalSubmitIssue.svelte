<script>
	import { UAParser } from 'ua-parser-js';

	import IconBug from '~icons/ri/bug-2-line';
	import IconIdea from '~icons/ri/lightbulb-line';
	import { version } from '$app/environment';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import Field from '$lib/Field.svelte';
	import { databaseHandle, listByIndex } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import Modal from '$lib/Modal.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';

	/**
	 * @typedef {object} Props
	 * @property {"bug" | "feature"} type
	 */

	/** @type {Props} */
	const { type } = $props();

	let body = $state('');
	let title = $state('');
	let open = $state();
	let close = $state();

	const OpenIcon = $derived(type === 'bug' ? IconBug : IconIdea);
</script>

<Modal
	bind:open
	bind:close
	key="modal_submit_issue_{type}"
	title={type === 'bug' ? 'Signaler un bug' : 'Proposer une fonctionnalité'}
>
	<Field>
		{#snippet label()}
			Description
			{#if type === 'bug'}
				<p>
					Expliquer comment reproduire votre bug, étape par étape, et ce à quoi vous vous
					attendiez
				</p>
			{/if}
		{/snippet}
		<textarea bind:value={body} rows="6" />
	</Field>

	<Field label="Titre">
		<InlineTextInput label="Titre" bind:value={title} />
	</Field>

	<ButtonPrimary
		loading
		onclick={async () => {
			const ua = UAParser(navigator.userAgent);

			const sessionStats = uiState.currentSession
				? {
						images: await listByIndex('Image', 'sessionId', uiState.currentSession.id),
						observations: await listByIndex(
							'Observation',
							'sessionId',
							uiState.currentSession.id
						),
						toString() {
							return `${this.images.length} images, ${this.observations.length} observations`;
						}
					}
				: undefined;

			const db = databaseHandle();

			const response = await fetch('https://mkissue.cigale.gwen.works/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(
					/** @satisfies {typeof import('$lib/schemas/issue-creator').IssueCreatorRequest['infer']} */ ({
						type,
						title,
						body,
						metadata: {
							Version: version,
							'User Agent': navigator.userAgent,
							Page: window.location.href,
							OS: ua.os.toString(),
							Browser: ua.browser.toString(),
							Device: ua.device.toString(),
							Protocol: uiState.currentProtocol
								? `${uiState.currentProtocol.id} v${uiState.currentProtocol.version}`
								: '_None_',
							'Open session': sessionStats?.toString() || '_None_',
							'Database rev.': db.version.toString()
						}
					})
				)
			});

			close?.();

			if (response.ok) {
				const data = await response.json();

				toasts.success('Merci pour votre contribution!', {
					data: true,
					labels: {
						action: 'Voir'
					},
					action() {
						window.open(data.url, '_blank');
					}
				});
			} else {
				console.error(
					'Error submitting issue:',
					response.statusText,
					await response.text()
				);
				toasts.error(
					'Une erreur est survenue lors de la soumission de votre demande. Veuillez réessayer plus tard.'
				);
			}
		}}
	>
		Envoyer
	</ButtonPrimary>
</Modal>

<ButtonIcon
	onclick={() => open?.()}
	help={type === 'bug' ? 'Signaler un bug' : 'Proposer une fonctionnalité'}
>
	<OpenIcon />
</ButtonIcon>
