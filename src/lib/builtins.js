export const BUILTIN_METADATA_IDS = /** @type {const} */ ({
	crop: 'crop',
	shoot_date: 'shoot_date',
	shoot_location: 'shoot_location',
	cuteness: 'cuteness',
	species: 'species',
	genus: 'genus',
	family: 'family',
	order: 'order',
	class: 'class',
	phylum: 'phylum',
	kingdom: 'kingdom'
});

/**
 * @type {Array<typeof import('./database').Schemas.Metadata.inferIn & { id: keyof typeof BUILTIN_METADATA_IDS }>}
 */
export const BUILTIN_METADATA = [
	{
		id: 'cuteness',
		description: "À quel point l'arthropode est trop cute 😖",
		label: '🥺',
		type: 'float',
		mergeMethod: 'average',
		required: false
	},
	{
		id: 'crop',
		description: "Boîte de recadrage pour l'image",
		label: '',
		type: 'boundingbox',
		mergeMethod: 'none',
		required: false
	},
	{
		id: 'shoot_date',
		description: '',
		label: 'Date de prise de vue',
		type: 'date',
		mergeMethod: 'average',
		required: true
	},
	{
		id: 'shoot_location',
		description: 'Localisation de la prise de vue',
		label: 'Lieu',
		type: 'location',
		mergeMethod: 'average',
		required: false
	}
];
