<script lang="ts" module>
	import IconFourPointCrop from '~icons/ri/apps-2-add-line';
	import IconUndo from '~icons/ri/arrow-go-back-fill';
	import IconRedo from '~icons/ri/arrow-go-forward-fill';
	import IconCollapse from '~icons/ri/contract-right-line';
	import IconTwoPointCrop from '~icons/ri/crosshair-2-line';
	import IconToolMove from '~icons/ri/drag-move-2-fill';
	import IconExpand from '~icons/ri/expand-left-line';
	import IconToolHand from '~icons/ri/hand';
	import IconToolDragCrop from '~icons/ri/shape-2-line';
	import { IsMobile } from '$lib/mobile.svelte';
	import { getSettings, toggleSetting } from '$lib/settings.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import { undo } from '$lib/undo.svelte.js';

	type ToolName = (typeof tools)[number]['name'];

	export interface Tool {
		name: string;
		help: string;
		/** Override help for mobile devices */
		mobileHelp?: string;
		icon: import('svelte').Component;
		shortcut: string;
		transformable: boolean;
		createMode: 'clickanddrag' | '2point' | '4point' | 'off';
		movable: boolean;
		cursor?: string;
	}

	export const tools = [
		{
			name: 'Glisser-recadrer',
			help: 'Cliquer et glisser pour créer une boîte de recadrage',
			mobileHelp:
				'Glisser pour créer une boîte de recadrage. Utiliser deux doigts pour se déplacer',
			icon: IconToolDragCrop,
			shortcut: 'r',
			transformable: true,
			createMode: 'clickanddrag',
			movable: true,
			cursor: 'crosshair',
		},
		{
			name: '2 points',
			help: 'Cliquer sur les 2 coins pour créer une boîte de recadrage',
			icon: IconTwoPointCrop,
			shortcut: 'p',
			transformable: false,
			createMode: '2point',
			movable: false,
			cursor: 'crosshair',
		},
		{
			name: '4 points',
			help: 'Cliquer sur les 4 extrémités pour créer une boîte de recadrage',
			icon: IconFourPointCrop,
			shortcut: 'Shift+p',
			transformable: false,
			createMode: '4point',
			movable: false,
			cursor: 'crosshair',
		},
		{
			name: 'Déplacer',
			help: 'Cliquer et glisser pour déplacer la boîte de recadrage',
			icon: IconToolMove,
			shortcut: 'v',
			transformable: false,
			createMode: 'off',
			movable: true,
			cursor: 'pointer',
		},
		{
			name: 'Main',
			help: "Cliquer et glisser pour se déplacer dans l'image",
			mobileHelp: "Se déplacer dans l'image avec le doigt",
			icon: IconToolHand,
			shortcut: 'h',
			transformable: false,
			createMode: 'off',
			movable: false,
			cursor: 'grab',
		},
	] as const satisfies Tool[];

	// Using $derived would require having access to props in <script module>, so no can do
	// eslint-disable-next-line svelte/prefer-writable-derived
	let activeToolName = $state<ToolName>();

	export function switchTool(name: ToolName) {
		activeToolName = name;
	}

	let active = $derived(tools.find(({ name }) => name === activeToolName) || tools[0]);

	export function activeTool() {
		return active;
	}
</script>

<script lang="ts">
	interface Props {
		initialTool: ToolName;
	}

	const { initialTool }: Props = $props();

	$effect(() => {
		activeToolName = initialTool;
	});

	const mobile = new IsMobile();

	const tooltipPlacement = $derived(mobile.current ? 'top' : 'left');
</script>

<div class="toolbar">
	<div class="toolbar-buttons">
		{#each tools as tool (tool.name)}
			<button
				aria-label="Choisir l'outil {tool.name}"
				class:active={tool.name === activeToolName}
				use:tooltip={mobile.current
					? undefined
					: {
							text: `${tool.name}: ${tool.help}`,
							keyboard: tool.shortcut,
							placement: tooltipPlacement,
						}}
				onclick={() => {
					activeToolName = tool.name;
				}}
			>
				<tool.icon />
			</button>
		{/each}
		<button
			aria-label="Annuler"
			use:tooltip={{
				text: 'Annuler',
				keyboard: '$mod+z',
				placement: tooltipPlacement,
			}}
			disabled={!undo.canPop}
			onclick={() => undo.pop()}
		>
			<IconUndo />
		</button>
		<button
			aria-label="Rétablir"
			use:tooltip={{
				text: 'Rétablir',
				keyboard: '$mod+Shift+z',
				placement: tooltipPlacement,
			}}
			disabled={!undo.canRewind}
			onclick={() => undo.rewind()}
		>
			<IconRedo />
		</button>
	</div>
	<div class="toolbar-buttons">
		{const sidebarCollapsed = $derived(getSettings().cropperSidebarCollapsed)}
		{const help = $derived(
			sidebarCollapsed ? 'Afficher la liste des boîtes' : 'Masquer la liste des boîtes'
		)}

		{#if !mobile.current}
			<button
				aria-label={help}
				use:tooltip={{
					text: help,
					placement: tooltipPlacement,
					keyboard: '$mod+h',
				}}
				onclick={async () => {
					await toggleSetting('cropperSidebarCollapsed');
				}}
			>
				{#if sidebarCollapsed}
					<IconExpand />
				{:else}
					<IconCollapse />
				{/if}
			</button>
		{/if}
	</div>
</div>

<style>
	.toolbar {
		--direction: column;
		display: flex;
		flex-direction: var(--direction);
		justify-content: space-between;
		height: 100%;
		--button-size: 2.5em;

		@media (max-width: 600px) {
			--direction: row;
			width: 100%;
			height: unset;
			justify-content: center;
			padding: 0 0.25em;
			--button-size: 2.75em;
			--active-marker: var(--fg-primary);

			overflow: hidden;
			color: white;
			color-scheme: dark;
		}
	}

	.toolbar-buttons {
		display: flex;
		flex-direction: var(--direction);
		align-items: center;
		padding: 0.25em;
	}

	.toolbar-buttons button {
		width: var(--button-size);
		height: var(--button-size);
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		background: none;
		cursor: pointer;
		position: relative;
		border-radius: var(--corner-radius);
		font-size: 1.2em;

		@media (max-width: 600px) {
			font-size: 1.1em;
		}

		&:disabled {
			color: var(--gray);
		}
	}

	.toolbar-buttons button.active {
		color: var(--fg-primary);
	}

	.toolbar-buttons button::after {
		content: '';
		position: absolute;
		bottom: 5px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 3px;
		border-radius: 1000000px;
		background: var(--active-marker, var(--bg-primary));
		transition: width 0.1s;
	}

	.toolbar-buttons button.active::after {
		width: 40%;
	}

	@media (min-width: 600px) {
		.toolbar-buttons button:is(:hover, :focus-visible) {
			color: var(--fg-primary);
			background: var(--bg-primary-translucent);
		}
	}
</style>
