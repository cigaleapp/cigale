import { type } from 'arktype';

import type * as DB from '$lib/database';
import { MetadataRuntimeValue, type RuntimeValue } from '$lib/schemas/metadata';

export type TypedMetadataValue<Type extends DB.MetadataType = DB.MetadataType> = Omit<
	DB.MetadataValue,
	'value'
> & { value: RuntimeValue<Type> };

/**
 * Asserts that a metadata is of a certain type, inferring the correct runtime type for its value
 */
export function isType<Type extends DB.MetadataType, Value extends undefined | RuntimeValue>(
	testedtyp: Type,
	metadatatyp: DB.MetadataType,
	value: Value
): value is Value extends RuntimeValue ? RuntimeValue<Type> : undefined | RuntimeValue<Type> {
	/**
	 * @param {import('arktype').Type} v
	 * @returns boolean
	 */
	const ok = (v: import('arktype').Type) =>
		metadatatyp === testedtyp && (value === undefined || !(v(value) instanceof type.errors));

	switch (testedtyp) {
		case 'boolean':
			return ok(type('boolean'));
		case 'integer':
		case 'float':
			return ok(type('number'));
		case 'enum':
			return ok(type('string | number'));
		case 'date':
			return ok(type('Date'));
		case 'location':
			return ok(type({ latitude: 'number', longitude: 'number' }));
		case 'boundingbox':
			return ok(type({ x: 'number', y: 'number', w: 'number', h: 'number' }));
		case 'string':
			return ok(type('string'));
		default:
			throw new Error(`Type inconnu: ${testedtyp}`);
	}
}

type TypeswitchReturnTypes<R = any> = { [T in DB.MetadataType]: R };

type TypeswitchCases<ReturnTypes extends TypeswitchReturnTypes> = {
	[T in DB.MetadataType]: (...values: RuntimeValue<T>[]) => ReturnTypes[T];
};

type TypeswitchValues = RuntimeValue | [RuntimeValue, RuntimeValue] | RuntimeValue[];

/**
 * Run different code depending on metadata value's type
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

/**
 * Just like `isType`, but for an array of values
 */
export function areType<Type extends DB.MetadataType, Value extends undefined | RuntimeValue>(
	testedtyp: Type,
	metadatatyp: DB.MetadataType,
	value: Value[]
): value is Value extends RuntimeValue ? RuntimeValue<Type>[] : undefined | RuntimeValue<Type>[] {
	return value.every((v) => isType(testedtyp, metadatatyp, v));
}

export function hasRuntimeType<Type extends DB.MetadataType>(
	type: Type,
	value: any
): value is RuntimeValue<Type> {
	return isType(type, type, value);
}

export function assertIs<Type extends DB.MetadataType>(
	type: Type,
	value: unknown
): RuntimeValue<Type> {
	// @ts-ignore
	if (!isType(type, type, value))
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
