<script lang="ts" module>
	let loadingText = $state('');
	let open = $state<() => void>();

	let onpicked = $state(
		(data: { protocolId: string | null; closer: undefined | (() => void) }) => {
			data.closer?.();
		}
	);

	export async function pickProtocol({
		after,
	}: {
		// eslint-disable-next-line no-unused-vars
		after?: { loadingText: string; do: (picked: undefined | DB.Protocol) => Promise<void> };
	}): Promise<undefined | DB.Protocol> {
		open?.();

		let closeModal: undefined | (() => void);
		const picked = await new Promise<undefined | DB.Protocol>((resolve) => {
			onpicked = ({ closer, protocolId }) => {
				resolve(tables.Protocol.getFromState(protocolId ?? ''));
				closeModal = closer;
			};
		});

		loadingText = after?.loadingText ?? '';
		try {
			await after?.do(picked);
		} finally {
			loadingText = '';
		}

		closeModal?.();

		return picked;
	}
</script>

<script lang="ts">
	import type * as DB from '$lib/database.js';

	import { fade } from 'svelte/transition';

	import IconManageProtocols from '~icons/ri/settings-3-line';

	import ButtonInk from './ButtonInk.svelte';
	import { tables } from './idb.svelte.js';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import Logo from './Logo.svelte';
	import Modal from './Modal.svelte';
	import OverflowableText from './OverflowableText.svelte';
	import { goto } from './paths.js';
</script>

<Modal
	key="modal_pick_protocol"
	title="Choisir un protocole pour la session"
	--modal-width="700px"
	bind:open
>
	{#snippet children({ close })}
		<div class="content">
			{#if loadingText}
				<section class="loading" in:fade={{ duration: 300 }}>
					<LoadingSpinner --size="3em" --stroke="2px" />
					<p>{loadingText || 'Chargement…'}</p>
				</section>
			{/if}

			<div class="choices" role="menu" in:fade={{ duration: 200 }}>
				{#each tables.Protocol.state as { id, name, logo, version, summary, description } (id)}
					<button
						role="menuitem"
						aria-label={name}
						onclick={() => {
							onpicked({ protocolId: id, closer: close });
						}}
						class="choice"
					>
						<div class="logo">
							{#if logo}
								<img src={logo} alt={`${name} logo`} />
							{:else}
								<Logo />
							{/if}
						</div>
						<div class="text">
							<div class="title">
								<span class="name">
									<OverflowableText text={name} />
								</span>
								{#if version}
									<code class="version">v{version}</code>
								{/if}
							</div>
							<div class="description">
								<OverflowableText text={summary || description} />
							</div>
						</div>
					</button>
				{/each}
			</div>

			<section class="others">
				<ButtonInk
					onclick={async () => {
						onpicked({ protocolId: null, closer: close });
						await goto('/protocols/');
						close?.();
					}}
				>
					<IconManageProtocols />
					Gérer les protocoles
				</ButtonInk>
			</section>
		</div>
	{/snippet}
</Modal>

<style>
	.content {
		position: relative;

		.loading {
			position: absolute;
			inset: 0;
		}
	}
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1em;
		height: 100%;
		font-size: 1.2em;
		background-color: var(--bg-neutral);
		z-index: 1;
	}

	.choices {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.choice {
		display: grid;
		align-items: center;
		grid-template-columns: max-content 1fr;
		gap: 1em;
		font-size: 1rem;
		padding: 0.5em 1em;
		text-align: left;

		&:hover,
		&:focus-visible {
			background-color: var(--bg-primary-translucent);
		}
	}

	.name,
	.text {
		overflow: hidden;
		max-width: 100%;
	}

	code {
		font-size: 0.8em;
		color: var(--gay);
	}

	.logo {
		--sz: 2.2em;
		width: var(--sz);
		height: var(--sz);
		flex-shrink: 0;
		--size: calc(var(--sz) * 0.8); /* Logo size */
		--stroke: var(--gray);
		--stroke-width: 5em;

		display: flex;
		align-items: center;
		justify-content: center;

		img {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
		}
	}

	.description {
		font-size: 0.9em;
		color: var(--gay);
	}

	.title,
	.description {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.others {
		display: flex;
		justify-content: center;
		margin-top: 2em;
	}
</style>
