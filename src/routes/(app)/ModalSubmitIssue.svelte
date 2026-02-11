<script lang="ts">
	import { UAParser } from 'ua-parser-js';
	import xss from 'xss';

	import IconBug from '~icons/ri/bug-2-line';
	import IconIdea from '~icons/ri/lightbulb-line';
	import { version } from '$app/environment';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import type { MetadataError } from '$lib/database';
	import Field from '$lib/Field.svelte';
	import { databaseHandle, tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import Modal from '$lib/Modal.svelte';
	import type { IssueCreatorRequest } from '$lib/schemas/issue-creator';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';

	interface Props {
		type: 'bug' | 'feature';
	}

	const { type }: Props = $props();

	let body = $state('');
	let title = $state('');
	let open: undefined | (() => void) = $state();
	let close: undefined | (() => void) = $state();
	let submitting = $state(false);

	const OpenIcon = $derived(type === 'bug' ? IconBug : IconIdea);

	defineKeyboardShortcuts('general', {
		[type === 'bug' ? '$mod+!' : '$mod+*']: {
			help: type === 'bug' ? 'Signaler un bug' : 'Proposer une fonctionnalité',
			do: () => open?.()
		}
	});

	const collectedMetadata = $derived.by(() => {
		const ua = UAParser(navigator.userAgent);
		const db = databaseHandle();

		const pre = (text: string, lang = '') => '\n```' + lang + '\n' + text + '\n```';
		const jsonText = (obj: unknown) => pre(JSON.stringify(obj, null, 2), 'json');

		const formatErrors = (label: string, errors: Record<string, MetadataError[]>) =>
			Object.values(errors).flatMap((errs) =>
				errs.map(
					(err) =>
						`<dt>${label}</dt> <dd><code>(${err.kind}, ignored: ${err.ignored})</code> ${err.message} \n\t\t<details><summary>Stack trace</summary><pre>${xss(
							err.stack
						)}</pre></details></dd>`
				)
			);

		const errors = [
			...tables.Observation.state.flatMap((obs) =>
				formatErrors(obs.label, obs.metadataErrors)
			),
			...tables.Image.state.flatMap((img) => formatErrors(img.filename, img.metadataErrors))
		];

		return {
			Version: version,
			'User Agent': navigator.userAgent,
			Route: page.route.id,
			OS: ua.os.toString(),
			Browser: ua.browser.toString(),
			Device: ua.device.toString(),
			Protocol: uiState.currentProtocol
				? `${uiState.currentProtocol.id} v${uiState.currentProtocol.version}`
				: '_None_',
			'Database rev.': db.version.toString(),
			'Loaded objects': (['Observation', 'Image', 'Session', 'Metadata', 'Protocol'] as const)
				.map((table) => `${tables[table].state.length} ${table.toLowerCase()}s`)
				.join(', '),
			'Metadata Errors': `${errors.length}\n` + '<dl>' + errors.join('') + '</dl>\n',
			'Open session': jsonText(uiState.currentSession)
		};
	});
</script>

<Modal
	bind:open
	bind:close
	key="modal_submit_issue_{type}"
	title={type === 'bug' ? 'Signaler un bug' : 'Proposer une fonctionnalité'}
>
	<form
		onsubmit={async (e) => {
			submitting = true;
			e.preventDefault();
			const response = await fetch('https://mkissue.cigale.gwen.works/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					type,
					title,
					body,
					metadata: collectedMetadata
				} satisfies (typeof IssueCreatorRequest)['infer'])
			});
			submitting = false;
			close?.();
			if (response.ok) {
				const data = await response.json();
				toasts.success('Merci pour votre contribution!', {
					data: true,
					lifetime: Infinity,
					action: new URL(data.url),
					labels: {
						action: 'Voir'
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
		<Field>
			{#snippet label()}
				Description
				{#if type === 'bug'}
					<p>
						Expliquer comment reproduire votre bug, étape par étape, et ce à quoi vous
						vous attendiez
					</p>
				{/if}
			{/snippet}
			<textarea bind:value={body} rows="6"></textarea>
		</Field>
		<Field label="Titre">
			<InlineTextInput required label="Titre" bind:value={title} />
		</Field>
		<details>
			<summary>Métadonnées envoyées</summary>
			<Markdown
				source={Object.entries(collectedMetadata)
					.map(([key, value]) => `- **${key}**: ${value}`)
					.join('\n')}
			/>
		</details>
		<ButtonPrimary submits loading={submitting ? 'always' : false} onclick={undefined}>
			Envoyer
		</ButtonPrimary>
	</form>
</Modal>

<ButtonIcon
	onclick={() => open?.()}
	help={type === 'bug' ? 'Signaler un bug' : 'Proposer une fonctionnalité'}
	data-testid={type === 'bug' ? 'open-bug-report' : 'open-feature-request'}
>
	<OpenIcon />
</ButtonIcon>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
