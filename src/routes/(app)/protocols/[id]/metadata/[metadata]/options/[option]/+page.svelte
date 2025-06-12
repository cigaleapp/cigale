<script>
	import { invalidateAll } from '$app/navigation';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';

	const { data } = $props();
	const { metadata, option } = $derived(data);

	/**
	 * @import { MetadataEnumVariant } from '$lib/schemas/metadata.js';
	 * @param {Partial<typeof MetadataEnumVariant.infer>} newData
	 */
	async function updateOption(newData) {
		await tables.Metadata.update(
			metadata.id,
			'options',
			$state.snapshot(
				metadata.options?.map((opt) => (opt.key === option.key ? { ...opt, ...newData } : opt))
			)
		);
		await invalidateAll();
		// TODO figure ts out 🥀
		// await invalidate((url) => {
		// 	console.log(`invalidate?`, url);
		// 	return url.hash.startsWith(
		// 		`#/protocols/${protocol.id}/metadata/${removeNamespaceFromMetadataId(metadata.id)}/options`
		// 	);
		// });
	}
</script>

<div class="inputs">
	<label>
		<span class="label">Clé</span>
		<InlineTextInput
			value={option.key}
			label="Clé de l'option"
			discreet
			onblur={async (newKey) => {
				await updateOption({ key: newKey });
			}}
		/>
	</label>

	<label>
		<span class="label">Label</span>
		<InlineTextInput
			value={option.label}
			label="Label de l'option"
			discreet
			onblur={async (newLabel) => {
				await updateOption({ label: newLabel });
			}}
		/>
	</label>
</div>

<style>
	.inputs {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		font-size: 1.2rem;
	}

	.label {
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 2px;
		font-size: 0.8em;
		margin-bottom: 0.5rem;
	}
</style>
