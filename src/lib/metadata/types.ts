import type * as DB from '$lib/database';
import { MetadataRuntimeValue, type RuntimeValue } from '$lib/schemas/metadata';

export type TypedMetadataValue<Type extends DB.MetadataType = DB.MetadataType> = Omit<
	DB.MetadataValue,
	'value'
> & { value: RuntimeValue<Type> };

export type RuntimeValuesPerType = { [K in DB.MetadataType]: RuntimeValue<K> };

type TypeswitchReturnTypes<R> = { [T in DB.MetadataType]: R };

type TypeswitchCases<ReturnTypes extends TypeswitchReturnTypes<any>> = {
	[T in DB.MetadataType]: (...values: RuntimeValue<T>[]) => ReturnTypes[T];
};

type TypeswitchValues = RuntimeValue | [RuntimeValue, RuntimeValue] | RuntimeValue[];

/**
 * Run different code depending on metadata value's type.
 * Return types for the branches can be specified in two ways:
 * - by specifying R: a common return type for all branches
 * - by specifying RT: a mapping of return types per metadata type. For example, RuntimeValuesPerType if you want each branch to preserve its own runtime type. When specifying RT, you can set R to `any` to avoid TS errors.
 */
export function switchOnMetadataType<
	R,
	RT extends TypeswitchReturnTypes<R> = TypeswitchReturnTypes<R>
>(type: DB.MetadataType, value: TypeswitchValues, cases: TypeswitchCases<RT>): RT[DB.MetadataType];
export function switchOnMetadataType<
	R,
	RT extends TypeswitchReturnTypes<R> = TypeswitchReturnTypes<R>
>(
	type: DB.MetadataType,
	value: TypeswitchValues,
	cases: Partial<TypeswitchCases<RT>>,
	fallback: (...values: RuntimeValue[]) => RT[DB.MetadataType]
): RT[DB.MetadataType];
export function switchOnMetadataType<
	R,
	RT extends TypeswitchReturnTypes<R> = TypeswitchReturnTypes<R>
>(
	type: DB.MetadataType,
	value: TypeswitchValues,
	cases: Partial<TypeswitchCases<RT>>,
	fallback?: (...values: RuntimeValue[]) => RT[DB.MetadataType]
): RT[DB.MetadataType] {
	const values = Array.isArray(value) ? value : [value];
	const typeds = values.map((v) => MetadataRuntimeValue[type].assert(v));

	// @ts-expect-error typescript can't link the type of value and type parameter
	return (cases[type] ?? fallback)(...typeds);
}

export function hasRuntimeType<Type extends DB.MetadataType>(
	type: Type,
	value: any
): value is RuntimeValue<Type> {
	return MetadataRuntimeValue[type].allows(value);
}

export function assertIs<Type extends DB.MetadataType>(type: Type, value: any): RuntimeValue<Type> {
	if (!hasRuntimeType(type, value))
		throw new Error(`La valeur n'est pas de type ${type}: ${JSON.stringify(value)}`);

	return value;
}

/**
 * Get a strongly-typed metadata value from an image (Image ONLY, not Observation).
 */
export function getMetadataValue<Type extends DB.MetadataType>(
	image: DB.Image,
	type: Type,
	metadataId: string
): TypedMetadataValue<Type> | undefined {
	const value = image.metadata[metadataId];
	if (value === undefined) return undefined;

	return {
		...value,
		value: assertIs(type, value.value)
	};
}
