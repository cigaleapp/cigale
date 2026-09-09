<!--  @component
 
Push new messages using the bound function.
The component takes care of removing old ones.

For example: 

Messages pushed | Messages shown
----------------|-----------------------------
Foo 1/3			| Foo 1/3
Bar 1/8			| Foo 1/3 > Bar 1/8
Bar 2/8			| Foo 1/3 > Bar 2/8
Baz				| Foo 1/3 > Bar 2/8 > Baz
Quux			| Foo 1/3 > Bar 2/8 > Baz, Quux
Bar 3/8			| Foo 1/3 > Bar 3/8
Foo 2/3			| Foo 2/3
Bar 1/8			| Foo 2/3 > Bar 1/8

-->

<script lang="ts" module>
	export type Message = {
		action: string;
		done?: number;
		total?: number;
		/** Force clearing of all previous messages */
		clear?: true;
		/** Force identing of this message (either to true or false) */
		indent?: boolean;
		/** done & total numbers are in a particular quantity */
		unit?: undefined | 'bytes';
		/** Display a cross inside of a checkmark when this step finishes */
		errored?: boolean;
		/** This action was canceled */
		canceled?: boolean;
		/** Display a checkmark even if the task is the last one and has no progress info */
		finished?: boolean;
	};
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';

	import IconDone from '~icons/ri/check-line';
	import IconCanceled from '~icons/ri/close-line';
	import IconError from '~icons/ri/error-warning-line';
	import { formatBytesSize } from '$lib/i18n.js';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';

	import ProgressBar from './ProgressBar.svelte';

	interface Props {
		/** Push a new message */
		push: undefined | ((message: Message) => void);
		/** Mark process as finished */
		finish: (state: 'ok' | 'error' | 'canceled') => void;
	}

	const messages = $state<Message[]>([]);

	let { push: _push = $bindable(), finish: _finish = $bindable() }: Props = $props();

	function push(message: Message) {
		if (message.clear) {
			messages.splice(0);
		}

		if (!message.action) return;

		const last = messages.at(0);
		if (!last) {
			messages.push(message);
			return;
		}

		if (message.total) {
			// Clear everything after current message that has the same text
			const previousIndex = messages.findIndex(({ action }) => action === message.action);
			if (previousIndex !== -1) {
				messages.splice(previousIndex);
				messages.push(message);
			}
		} else {
			messages.push(message);
		}
	}

	function finish(state: 'ok' | 'error' | 'canceled') {
		const i = messages.length - 1;
		if (i < 0) return;

		messages[i].finished = true;
		messages[i].errored = state === 'error';
		messages[i].canceled = state === 'canceled';
	}

	$effect(() => {
		_push = push;
		_finish = finish;
	});
</script>

{#snippet branch([message, ...rest]: Message[], indent = false)}
	<div
		class="branch"
		class:indent={message.indent ??
			Boolean(indent || message.total || rest.some((m) => m.total))}
	>
		{#key message.action}
			<div class="leaf" in:fade={{ duration: 300 }}>
				{const done = $derived(
					message.finished ||
						(message.total && message.done && message.done >= message.total) ||
						((!message.total || !message.done) && rest.length > 0)
				)}

				<div class="text">
					<div
						class="icon"
						class:success={done && !message.errored && !message.canceled}
						class:errored={done && message.errored}
						class:canceled={done && message.canceled}
					>
						{#if done && message.errored}
							<IconError />
						{:else if done && message.canceled}
							<IconCanceled />
						{:else if done}
							<IconDone />
						{:else}
							<LoadingSpinner />
						{/if}
					</div>

					<p class="action">{message.action}</p>
				</div>

				{#if message.total && message.done !== undefined}
					<div class="counts" class:with-units={Boolean(message.unit)}>
						{#if message.unit === 'bytes'}
							{formatBytesSize(message.done)} / {formatBytesSize(message.total)}
						{:else}
							{Math.ceil(message.done)} / {message.total}
						{/if}
					</div>
				{/if}

				<div class="bar">
					{#if message.total && message.done !== undefined}
						<ProgressBar progress={(message.done ?? 0) / message.total} alwaysActive />
					{/if}
				</div>
			</div>

			{#if rest.length > 0}
				<div class="rest">
					{@render branch(rest, Boolean(message.total))}
				</div>
			{/if}
		{/key}
	</div>
{/snippet}

<div class="tree">
	{#if messages.length > 0}
		{@render branch(messages)}
	{/if}
</div>

<style>
	.branch .branch.indent {
		margin-left: 1em;
	}

	.action,
	.counts {
		white-space: nowrap;
	}

	.leaf,
	.bar,
	.counts,
	.text {
		display: flex;
		align-items: center;
		gap: 1em;
		row-gap: 0.25em;
	}

	.text {
		gap: 0.25em;
	}

	.tree {
		container-type: inline-size;

		@container (width < 600px) {
			.leaf {
				display: grid;
				grid-template-columns: max-content auto;
				justify-content: space-between;
				margin-bottom: 0.25em;

				.counts {
					display: flex;
					justify-content: end;
				}

				.bar {
					grid-column: 1 / 3;
				}
			}
		}
	}

	.counts {
		flex-wrap: nowrap;
		min-width: 5ch;
	}

	.bar {
		width: 100%;
		height: 0.5lh;
		opacity: 1;
		transition: opacity 500ms ease;
		--inactive-bg: var(--faint);
	}

	.icon {
		width: 2ch;
		height: 2ch;

		display: flex;
		justify-content: center;
		align-items: center;

		&.success {
			color: var(--fg-success);
		}

		&.errored {
			color: var(--fg-error);
		}
	}

	.leaf:has(.icon.success) {
		.bar {
			opacity: 0;
		}
	}

	.leaf:has(.icon.errored) {
		.bar {
			--fill-color: var(--fg-error);
			--inactive-bg: var(--bg-error);
		}
		.action {
			color: var(--fg-error);
		}
	}

	.leaf:has(.icon.errored) {
		.bar {
			--fill-color: var(--gay);
		}
		.action {
			color: var(--gay);
		}
	}
</style>
