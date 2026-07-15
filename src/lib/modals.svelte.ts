type GlobalModalKey =
	`modal_${'keyboard_shortcuts_help' | 'prepare_for_offline_use' | 'debug_ui_state' | 'submit_report_bug' | 'submit_feature_request'}`;

type Opener = () => void;

export const globalModals = $state<Record<GlobalModalKey, { open: Opener | undefined }>>({
	modal_keyboard_shortcuts_help: { open: undefined },
	modal_prepare_for_offline_use: { open: undefined },
	modal_debug_ui_state: { open: undefined },
	modal_submit_feature_request: { open: undefined },
	modal_submit_report_bug: { open: undefined },
});
