<!-- 

@component
A component to render different branches based on the runtime type of a value, using one snippet per metadata type.

If you don't specify snippets for all types, you have to provide a `fallback` snippet that will be used for types without a specific snippet.

For syntax limitation reasons, the `enum` type snippet must be named `enum_`.

You can also provide a `numeric` snippet that will be used for both `integer` and `float` types, unless you provide specific snippets for those types.

-->

<script lang="ts">
	import { ArkErrors } from 'arktype';
	import type { Snippet } from 'svelte';

	import type { Metadata, MetadataType } from '$lib/database';
	import { MetadataRuntimeValue, type RuntimeValue } from '$lib/schemas/metadata';

	type Branch<T extends MetadataType> = Snippet<
		[undefined | RuntimeValue<T>, Extract<Metadata, { type: T }>]
	>;

	type Cases = {
		[T in Exclude<MetadataType, 'enum'>]: Branch<T>;
	} & {
		// enum is a reserved TS word
		enum_: Branch<'enum'>;
	};

	type Branches =
		| Cases
		| (Omit<Cases, 'integer' | 'float'> & {
				numeric: Branch<'integer' | 'float'>;
		  });

	type Props = {
		definition: Metadata;
		error: Snippet<[ArkErrors]>;
		value: undefined | RuntimeValue;
	} & (
		| (Branches & { fallback?: never })
		| (Partial<Branches> & { fallback: Snippet<[RuntimeValue | undefined]> })
	);

	const { definition, value, error, fallback, ...branches }: Props = $props();
	const typ = $derived(definition.type);

	const branch = $derived.by(() => {
		switch (typ) {
			case 'enum':
				return branches.enum_;
			case 'integer':
				if ('integer' in branches) return branches.integer;
				if ('numeric' in branches) return branches.numeric;
				return undefined;
			case 'float':
				if ('float' in branches) return branches.float;
				if ('numeric' in branches) return branches.numeric;
				return undefined;
			default:
				return branches[typ];
		}
	});

	const validated = $derived(value === undefined ? undefined : MetadataRuntimeValue[typ](value));
</script>

{#if validated instanceof ArkErrors}
	{@render error(validated)}
{:else if branch}
	{@render (branch as Branch<MetadataType>)(validated, definition)}
{:else}
	{@render fallback!(validated)}
{/if}
