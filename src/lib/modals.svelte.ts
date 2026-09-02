import type { Schemas } from '$lib/database.js';

type GlobalModalKey =
	`modal_${'keyboard_shortcuts_help' | 'prepare_for_offline_use' | 'debug_ui_state' | 'submit_report_bug' | 'submit_feature_request' | 'create_custom_neural_network'}`;

type Opener<T extends unknown[] = []> = undefined | ((...args: T) => void);

export const globalModals = $state({
	modal_keyboard_shortcuts_help: { open: undefined as Opener },
	modal_prepare_for_offline_use: { open: undefined as Opener },
	modal_debug_ui_state: { open: undefined as Opener },
	modal_submit_feature_request: { open: undefined as Opener },
	modal_submit_report_bug: { open: undefined as Opener },
	modal_create_custom_neural_network: {
		open: undefined as Opener<
			[prefill: Partial<(typeof Schemas.CustomNeuralNetwork)['inferIn']>]
		>,
	},
} satisfies Record<GlobalModalKey, { open: Opener<unknown[]> }>);
