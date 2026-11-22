import { addMonths } from 'date-fns';
import { XMLParser } from 'fast-xml-parser';

import { ensureArray } from '#lib/utils.ts';

import { Datasource, DatasourceName, MultipleResponses } from './datasource';

export class Xper3 extends Datasource<
	| 'characters'
	| 'categoricalCharacter'
	| 'quantitativeCharacter'
	| 'character'
	| 'codedDescriptions'
	| 'taxa'
	| 'summaryDataOfCharacter',
	{
		characters: {};
		taxa: {};
		mediaObjects: {};
		character: { $id: `c${string}` };
		categoricalCharacter: { label: string };
		quantitativeCharacter: { label: string };
		codedDescriptions: Array<{
			clade: string;
			name: string;
		}>;
		summaryDataOfCharacter: {
			label: string;
		};
	},
	{
		taxa: { taxa: TaxonName[] };
		characters: { quantitative: QuantitativeCharacter[]; categorical: CategoricalCharacter[] };
		categoricalCharacter: undefined | CategoricalCharacter;
		quantitativeCharacter: undefined | QuantitativeCharacter;
		character: undefined | Character;
		codedDescriptions: { name: string; description: CodedDescription } | undefined;
		summaryDataOfCharacter: undefined | { summaryData: SingleSummaryData[] };
		mediaObjects: { objects: MediaObject };
	}
> {
	constructor(
		public name: DatasourceName,
		public url: URL
	) {
		super();
	}

	parsed: SDD | undefined;

	async init() {
		if (this.parsed) return;
		const response = await fetch(this.url);
		const raw = await response.text();
		if (!response.ok) throw new Error(raw);

		this.parsed = new XMLParser({
			textNodeName: '_',
			ignoreAttributes: false,
			attributeNamePrefix: '$',
		}).parse(raw);
	}

	expirations = {
		file: (now: Date) => addMonths(now, 1),
		entry: (now: Date) => addMonths(now, 1),
	};

	get dataset() {
		return this.parsed!.Datasets.Dataset;
	}

	get mkeyUrl() {
		const segments = this.url.pathname.split('/');
		segments.pop();
		const pathname = [...segments, 'mkey.html'].join('/');
		return new URL(pathname, this.url);
	}

	requests = {
		characters: async () => {
			return {
				quantitative: ensureArray(this.dataset.Characters.QuantitativeCharacter),
				categorical: ensureArray(this.dataset.Characters.CategoricalCharacter),
			};
		},

		taxa: async () => {
			return {
				taxa: this.dataset.TaxonNames.TaxonName,
			};
		},

		categoricalCharacter: async ({ label }: { label: string }) => {
			return ensureArray(this.dataset.Characters.CategoricalCharacter).find(
				(c) => c.Representation.Label === label
			);
		},

		quantitativeCharacter: async ({ label }: { label: string }) => {
			return ensureArray(this.dataset.Characters.QuantitativeCharacter).find(
				(c) => c.Representation.Label === label
			);
		},

		codedDescriptions: async (species: Array<{ clade: string; name: string }>) => {
			const response = new MultipleResponses<
				{ name: string; description: CodedDescription },
				{ clade: string; name: string }
			>();

			for (const sp of species) {
				if (sp.clade !== 'species') continue;

				const taxon = this.dataset.TaxonNames.TaxonName.find(
					(tx) => tx.Representation.Label === sp.name
				);

				if (!taxon) continue;
				const description = this.dataset.CodedDescriptions.CodedDescription.find(
					(coded) => coded.Scope.TaxonName.$ref === taxon.$id
				);
				if (!description) continue;

				response.push(sp, {
					name: sp.name,
					description,
				});
			}

			return response;
		},

		summaryDataOfCharacter: async ({ label }: { label: string }) => {
			const character = [
				...ensureArray(this.dataset.Characters.QuantitativeCharacter),
				...ensureArray(this.dataset.Characters.CategoricalCharacter),
			].find((char) => char.Representation.Label === label);

			if (!character) return undefined;

			return {
				summaryData: this.dataset.CodedDescriptions.CodedDescription.flatMap((coded) => {
					const { Categorical, Quantitative } = coded.SummaryData;

					return [...Categorical, ...ensureArray(Quantitative ?? [])];
				}).filter((summary) => summary.$ref === character.$id),
			};
		},
	};
}

type SingleSummaryData = ListItem<
	NonNullable<CodedDescription['SummaryData']['Categorical' | 'Quantitative']>
>;
export type MediaObject = ListItem<Dataset['MediaObjects']['MediaObject']>;
export type CodedDescription = ListItem<Dataset['CodedDescriptions']['CodedDescription']>;
type TaxonName = ListItem<Dataset['TaxonNames']['TaxonName']>;
export type Character = QuantitativeCharacter | CategoricalCharacter;
type QuantitativeCharacter = ListItem<Dataset['Characters']['QuantitativeCharacter']>;
type CategoricalCharacter = ListItem<Dataset['Characters']['CategoricalCharacter']>;
type Dataset = SDD['Datasets']['Dataset'];

type SDD = {
	Datasets: {
		Dataset: {
			/**
			 * @see https://sdd.tdwg.org/primer/DatasetMetadata.html
			 */
			Representation: {
				Label: string;
			};
			/**
			 * @see https://sdd.tdwg.org/primer/TaxonNames.html
			 */
			TaxonNames: {
				TaxonName: Array<{
					$id: `t${string}`;
					Representation: {
						Label: string;
						Detail: string;
						AlternativeName: ArrayOrSingle<string>;
						MediaObject?: ArrayOrSingle<{ $ref: `m${string}` }>;
					};
				}>;
			};
			/**
			 * @see https://sdd.tdwg.org/primer/SddCharacters.html
			 */
			Characters: {
				/**
				 * @see https://sdd.tdwg.org/primer/SddCharacters.html#3-6-1-categorical-characters
				 */
				QuantitativeCharacter: ArrayOrSingle<{
					$id: `c${string}`;
					$uniqueid: string;
					Representation: {
						Label: string;
						Detail: string;
						MediaObject?: ArrayOrSingle<{ $ref: `m${string}` }>;
					};
					MeasurementUnit: {
						Label: 'mm';
					};
				}>;
				/**
				 * @see https://sdd.tdwg.org/primer/SddCharacters.html#3-6-2-quantitative-characters
				 */
				CategoricalCharacter: Array<{
					$id: `c${string}`;
					$uniqueid: string;
					Representation: {
						Label: string;
						Detail: string;
						MediaObject?: ArrayOrSingle<{ $ref: `m${string}` }>;
					};
					States: {
						StateDefinition: ArrayOrSingle<{
							$uniqueid: string;
							$id: `s${string}`;
							Representation: {
								Label: string;
								Detail: string;
								MediaObject?: ArrayOrSingle<{ $ref: `m${string}` }>;
							};
						}>;
					};
				}>;
			};
			/**
			 * @see https://sdd.tdwg.org/primer/CharacterHierarchies.html
			 */
			CharacterTrees: {
				CharacterTree: Array<{
					$id: `ct${string}`;
					Representation: {
						Label: string;
						Detail: string;
					};
					ShouldContainAllCharacters?: 'true';
					Nodes: {
						CharNode: Array<{
							Character: { $ref: `c${string}` };
							DependencyRules?: {
								InapplicableIf: {
									State: ArrayOrSingle<{ $ref: `s${string}` }>;
								};
							};
						}>;
					};
				}>;
			};
			/**
			 * @see https://sdd.tdwg.org/primer/CodedData.html
			 */
			CodedDescriptions: {
				CodedDescription: Array<{
					$id: `D${string}`;
					Representation: {
						Label: string;
						Detail: string;
						AlternativeName?: ArrayOrSingle<string>;
					};
					Scope: {
						TaxonName: { $ref: `t${string}` };
					};
					SummaryData: {
						Categorical: Array<{
							$ref: `c${string}`;
							Ratings: {
								Rating: {
									$context: 'ObservationConvenience';
									$rating: `Rating${1 | 2 | 3 | 4 | 5}of5`;
								};
							};
							State?: ArrayOrSingle<{ $ref: `s${string}` }>;
							Status?: { $code: 'DataUnavailable' };
						}>;
						Quantitative?: ArrayOrSingle<{
							$ref: `c${string}`;
							Ratings: {
								Rating: {
									$context: 'ObservationConvenience';
									$rating: `Rating${1 | 2 | 3 | 4 | 5}of5`;
								};
							};
							Measure?: ArrayOrSingle<{
								$type: 'Min' | 'Max';
								$value: `${number}`;
							}>;
						}>;
					};
				}>;
			};
			/**
			 * @see https://sdd.tdwg.org/primer/SddMedia.html
			 */
			MediaObjects: {
				MediaObject: Array<{
					$id: `m${string}`;
					Type: 'Image';
					Source?: { $href: string };
					Author?: string;
					Representation: {
						Label: string;
						Detail?: string;
					};
				}>;
			};
		};
	};
};

type ArrayOrSingle<T> = T | T[];

type ListItem<V> = V extends unknown[] ? V[number] : V;
