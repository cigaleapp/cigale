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
	import { getSettings, toggleSetting } from '$lib/settings.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import { undo } from '$lib/undo.svelte.js';

	export interface Tool {
		name: string;
		help: string;
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
			shortcut: 'z',
			transformable: false,
			createMode: '2point',
			movable: false,
			cursor: 'crosshair',
		},
		{
			name: '4 points',
			help: 'Cliquer sur les 4 extrémités pour créer une boîte de recadrage',
			icon: IconFourPointCrop,
			shortcut: 'Shift+z',
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
			icon: IconToolHand,
			shortcut: 'h',
			transformable: false,
			createMode: 'off',
			movable: false,
			cursor: 'grab',
		},
	] as const satisfies Tool[];

	let activeToolName = $state<(typeof tools)[number]['name']>('Glisser-recadrer');

	export function switchTool(name: typeof activeToolName) {
		activeToolName = name;
	}

	let active = $derived(tools.find(({ name }) => name === activeToolName) || tools[0]);

	export function activeTool() {
		return active;
	}
</script>

<div class="toolbar">
	<div class="toolbar-buttons">
		{#each tools as tool (tool.name)}
			<button
				aria-label="Choisir l'outil {tool.name}"
				class:active={tool.name === activeToolName}
				use:tooltip={{
					text: `${tool.name}: ${tool.help}`,
					keyboard: tool.shortcut,
					placement: 'right',
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
			use:tooltip={{ text: 'Annuler', keyboard: '$mod+z', placement: 'right' }}
			onclick={() => undo.pop()}
		>
			<IconUndo />
		</button>
		<button
			aria-label="Rétablir"
			use:tooltip={{ text: 'Rétablir', keyboard: '$mod+Shift+z', placement: 'right' }}
			onclick={() => undo.rewind()}
		>
			<IconRedo />
		</button>
	</div>
	<!-- svelte-ignore state_referenced_locally -->
	<div class="toolbar-buttons">
		{const sidebarCollapsed = $derived(getSettings().cropperSidebarCollapsed)}
		<!-- Wuchale already adds a $derived(), so don't add one -->
		<!-- See https://github.com/wuchalejs/wuchale/issues/416 -->
		{const help = sidebarCollapsed
			? 'Afficher la liste des boîtes'
			: 'Masquer la liste des boîtes'}

		<button
			aria-label={help}
			use:tooltip={{
				text: help,
				placement: 'right',
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
	</div>
</div>

<style>
	.toolbar {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
	}

	.toolbar-buttons {
		--width: 2.5em;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.25em;
	}

	.toolbar-buttons button {
		font-size: 1.2em;
		width: var(--width);
		height: var(--width);
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		background: none;
		cursor: pointer;
		position: relative;
		border-radius: var(--corner-radius);
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
		background: var(--bg-primary);
		transition: width 0.1s;
	}

	.toolbar-buttons button.active::after {
		width: 40%;
	}

	.toolbar-buttons button:is(:hover, :focus-visible) {
		color: var(--fg-primary);
		background: var(--bg-primary-translucent);
	}
</style>
