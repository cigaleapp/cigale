type DropdownMenu<T extends string> = `${T}-open` | `${T}-options`;
type TabSettings<T extends string> =
	| DropdownMenu<`${T}-settings`>
	| `${T}-settings-${
			| `inference-model`
			| `sort`
			| `group-tolerances`
			| `group-by-${
					| 'metadataValue'
					| 'metadataPresence'
					| 'metadataConfidence'
					| 'none'}-metadata`}`;

type hasOptions<T> = T extends `${infer Id}-options` ? Id : never;
type candidates = hasOptions<PlaywrightTestId>;
type hasOpen<T extends string> = `${T}-open` extends PlaywrightTestId ? T : never;

export type PlaywrightTestIdBaseForDropdownMenu = hasOpen<candidates>;

export type PlaywrightTestId =
	| 'sidepanel'
	| 'app-nav'
	| 'goto-home'
	| 'goto-current-session'
	| 'goto-import'
	| 'goto-crop'
	| 'goto-classify'
	| 'goto-results'
	| 'goto-sessions'
	| 'goto-protocols'
	| 'goto-accounts'
	| 'mobile-goto-current-session'
	| 'mobile-goto-import'
	| 'mobile-goto-camera'
	| 'mobile-goto-crop'
	| 'mobile-goto-classify'
	| 'mobile-goto-results'
	| 'toasts-area'
	| 'crop-subject-image'
	| 'actions-top'
	| 'floating-messages'
	| 'current'
	| 'descriptors'
	| 'remaining-candidates'
	| 'fullscreen-header'
	| 'app-main'
	| 'export-results'
	| 'zip-preview'
	| 'protocols-list'
	| 'observations-area'
	| 'card-observation-bounding-box'
	| 'session-metadata'
	| DropdownMenu<'protocol'>
	| TabSettings<'import' | 'crop' | 'classify'>
	| 'subject'
	| 'references'
	| 'panel'
	| 'layout-switcher'
	| 'focused-option'
	| 'cascades'
	| 'synonyms'
	| 'description'
	| 'metadata-combobox-viewport'
	| 'mobile-option-details'
	| `${string}-point-${number}`
	| `${string}-label-area`
	| `${string}-label-segment-${number}`;
