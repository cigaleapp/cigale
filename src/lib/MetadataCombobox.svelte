<script lang="ts" module>
	export interface Props {
		type: 'single';
		value: string | undefined;
		multiple?: boolean;
		// eslint-disable-next-line no-unused-vars
		onValueChange: (newValue: string, newValues: string[]) => void | Promise<void>;
		metadata: Pick<DB.Metadata, 'id'>;
		options: DB.MetadataEnumVariant[] | undefined;
		id?: string;
		confidences?: Record<string, number>;
		/** Override the displayed options order */
		sorter?: Comparator<DB.MetadataEnumVariant>;
		/** to show as additionally selected when multiple=true */
		alternatives?: string[];
		// eslint-disable-next-line no-unused-vars
		focuser?: undefined | ((action: 'focus' | 'blur' | 'toggle') => void);
		// eslint-disable-next-line no-unused-vars
		optionIsDisabled?: (option: DB.MetadataEnumVariant) => boolean | string;
		enumOptionsExtraContent?: Snippet<
			[
				{
					option: DB.MetadataEnumVariant;
					disabled: boolean | string;
					selected: boolean;
					confidence: number | undefined;
				},
			]
		>;
	}

	export interface PropsForSubcomponent extends Props {
		sorter: Comparator<DB.MetadataEnumVariant>;
	}
</script>

<script lang="ts">
	import type { Comparator } from './utils.js';
	import type * as DB from '$lib/database.js';
	import type { Snippet } from 'svelte';

	import { serializeMetadataValue } from './metadata/serializing.js';
	import MetadataComboboxDesktop from './MetadataComboboxDesktop.svelte';
	import MetadataComboboxMobile from './MetadataComboboxMobile.svelte';
	import { IsMobile } from './mobile.svelte.js';
	import { compareBy } from './utils.js';

	let { focuser = $bindable(), ...props }: Props = $props();

	const mobile = new IsMobile();

	function isSelected({ key }: DB.MetadataEnumVariant) {
		return [props.value, ...(props.multiple ? (props.alternatives ?? []) : [])].includes(key);
	}

	const sorter = $derived(
		props.sorter ??
			compareBy<DB.MetadataEnumVariant>((opt) => {
				if (isSelected(opt)) return Number.NEGATIVE_INFINITY;
				if (props.optionIsDisabled?.(opt)) return Number.POSITIVE_INFINITY;
				return -(props.confidences?.[serializeMetadataValue(opt.key)] ?? 0);
			})
	);
</script>

{#if mobile.current}
	<MetadataComboboxMobile bind:focuser {...props} {sorter} />
{:else}
	<MetadataComboboxDesktop bind:focuser {...props} {sorter} />
{/if}
