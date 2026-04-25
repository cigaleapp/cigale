type GlobalModalKey = `modal_${'keyboard_shortcuts_help' | 'prepare_for_offline_use'}`;

type Opener = () => void;

export const globalModals = $state<Record<GlobalModalKey, { open: Opener | undefined }>>({
	modal_keyboard_shortcuts_help: { open: undefined },
	modal_prepare_for_offline_use: { open: undefined },
});
