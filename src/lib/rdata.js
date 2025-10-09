// @wc-ignore-file

/**
 * @import { Analysis } from './schemas/results.js';
 * @typedef {typeof Analysis.infer.observations} Observations
 * @typedef {Observations[keyof Observations]} Observation
 */

import { entries, extendBufferWith, logexpr, range } from './utils.js';

/**
 * @param {Observations} input
 * @returns {Uint8Array}
 */
export function toRData(input) {
	const trailer = new Uint8Array([0x00, 0x00, 0x00, 0xfe]);

	const output = new Uint8Array(new ArrayBuffer(0, { maxByteLength: 500 * 1024 * 1024 }));

	new UnparserXDR({
		write(data) {
			extendBufferWith(output, data);
		}
	}).unparseRData({
		extra: { encoding: 'UTF-8' },
		versions: { format: 3, serialized: 263425, minimum: 197888 },
		object: logexpr(
			'obj',
			convertJsToRObject({
				test: 1,
				hmmm: 4
			})
		)
		// object: logexpr(
		// 	'convertJsToObject',
		// 	convertJsToRObject({
		// 		observations: entries(input).map(([id, observation]) => ({ id, ...observation }))
		// 	})
		// )
	});

	extendBufferWith(output, trailer);

	return output;
}

/**
 *
 * @param {Uint8Array<ArrayBuffer>} data
 */
function fixHeader(data) {
	const invalidHeader = [
		0x58, 0x0a, 0x00, 0x00, 0x00, 0x03, 0x00, 0x04, 0x05, 0x01, 0x00, 0x03, 0x05, 0x00, 0x00,
		0x00, 0x00, 0x05, 0x55, 0x54, 0x46, 0x2d, 0x38, 0x00, 0x00, 0x03, 0x13, 0x00, 0x00, 0x00,
		0x01, 0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x01, 0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x10, 0x00,
		0x00, 0x00, 0x01, 0x00, 0x00, 0x00
	];

	const correctHeader = new Uint8Array([
		0x52, 0x44, 0x58, 0x33, 0x0a, 0x58, 0x0a, 0x00, 0x00, 0x00, 0x03, 0x00, 0x04, 0x05, 0x01,
		0x00, 0x03, 0x05, 0x00, 0x00, 0x00, 0x00, 0x05, 0x55, 0x54, 0x46, 0x2d, 0x38, 0x00, 0x00,
		0x04, 0x02, 0x00, 0x00, 0x00, 0x01, 0x00, 0x04, 0x00
	]);

	const buf = data.buffer;
}

/**
 * @typedef {Object} RObjectType
 * @property {string} name
 * @property {number} value
 */

/**
 * @typedef {Object} RObjectInfo
 * @property {RObjectType} type
 * @property {boolean} object
 * @property {boolean} attributes
 * @property {boolean} tag
 * @property {number} gp
 * @property {number} reference
 */

/**
 * @typedef {Object} RObject
 * @property {RObjectInfo} info
 * @property {any} value
 * @property {RObject=} attributes
 * @property {RObject=} tag
 * @property {RObject=} referenced_object
 */

/**
 * @typedef {Object} RVersions
 * @property {number} format
 * @property {number} serialized
 * @property {number} minimum
 */

/**
 * @typedef {Object} RExtraInfo
 * @property {string|null} encoding
 */

/**
 * @typedef {Object} RData
 * @property {RVersions} versions
 * @property {RExtraInfo} extra
 * @property {RObject} object
 */

/**
 * @typedef {Object} WriteableBinaryFile
 * @property {function(Uint8Array<ArrayBuffer>): any} write
 */

const RObjectTypes = /** @type {const} @satisfies {Record<string, RObjectType>} */ ({
	/** NULL */
	NIL: { name: 'NIL', value: 0 },
	/** symbols */
	SYM: { name: 'SYM', value: 1 },
	/** pairlists */
	LIST: { name: 'LIST', value: 2 },
	/** closures */
	CLO: { name: 'CLO', value: 3 },
	/** environments */
	ENV: { name: 'ENV', value: 4 },
	/** promises */
	PROM: { name: 'PROM', value: 5 },
	/** language objects */
	LANG: { name: 'LANG', value: 6 },
	/** special functions */
	SPECIAL: { name: 'SPECIAL', value: 7 },
	/** builtin functions */
	BUILTIN: { name: 'BUILTIN', value: 8 },
	/** internal character strings */
	CHAR: { name: 'CHAR', value: 9 },
	/** logical vectors */
	LGL: { name: 'LGL', value: 10 },
	/** integer vectors */
	INT: { name: 'INT', value: 13 },
	/** numeric vectors */
	REAL: { name: 'REAL', value: 14 },
	/** complex vectors */
	CPLX: { name: 'CPLX', value: 15 },
	/** character vectors */
	STR: { name: 'STR', value: 16 },
	/** dot-dot-dot object */
	DOT: { name: 'DOT', value: 17 },
	/** make “any” args work */
	ANY: { name: 'ANY', value: 18 },
	/** list (generic vector) */
	VEC: { name: 'VEC', value: 19 },
	/** expression vector */
	EXPR: { name: 'EXPR', value: 20 },
	/** byte code */
	BCODE: { name: 'BCODE', value: 21 },
	/** external pointer */
	EXTPTR: { name: 'EXTPTR', value: 22 },
	/** weak reference */
	WEAKREF: { name: 'WEAKREF', value: 23 },
	/** raw vector */
	RAW: { name: 'RAW', value: 24 },
	/** S4 classes not of simple type */
	S4: { name: 'S4', value: 25 },
	/** Alternative representations */
	ALTREP: { name: 'ALTREP', value: 238 },
	/** Bytecode attribute */
	ATTRLIST: { name: 'ATTRLIST', value: 239 },
	/** Bytecode attribute */
	ATTRLANG: { name: 'ATTRLANG', value: 240 },
	/** Base environment */
	BASEENV: { name: 'BASEENV', value: 241 },
	/** Empty environment */
	EMPTYENV: { name: 'EMPTYENV', value: 242 },
	/** Bytecode repetition reference */
	BCREPREF: { name: 'BCREPREF', value: 243 },
	/** Bytecode repetition definition */
	BCREPDEF: { name: 'BCREPDEF', value: 244 },
	/** Missinf argument */
	MISSINGARG: { name: 'MISSINGARG', value: 251 },
	/** Global environment */
	GLOBALENV: { name: 'GLOBALENV', value: 253 },
	/** NIL value */
	NILVALUE: { name: 'NILVALUE', value: 254 },
	/** Reference */
	REF: { name: 'REF', value: 255 }
});

/**
 * Packs RObjectInfo to an integer.
 * @param {RObjectInfo} info
 * @returns {number}
 */
function packRObjectInfo(info) {
	let bits;
	if (info.type.name === 'NILVALUE') {
		bits = '0'.repeat(24);
	} else if (info.type.name === 'REF') {
		bits = (info.reference >>> 0).toString(2).padStart(24, '0');
	} else {
		bits =
			(0).toString(2).padStart(4, '0') +
			(info.gp >>> 0).toString(2).padStart(16, '0') +
			(0).toString(2).padStart(1, '0') +
			(info.tag ? '1' : '0') +
			(info.attributes ? '1' : '0') +
			(info.object ? '1' : '0');
	}
	bits += info.type.value.toString(2).padStart(8, '0');
	if (bits.length !== 32) throw new Error('Packed bits length is not 32');
	return parseInt(bits, 2);
}

/**
 * Abstract Unparser class for R files.
 * @abstract
 */
class Unparser {
	/**
	 * Unparse magic bits.
	 * @abstract
	 */
	unparseMagic() {
		throw new Error('unparseMagic() must be implemented by subclass');
	}

	/**
	 * Unparse header.
	 * @param {RVersions} versions
	 * @param {RExtraInfo} extra
	 */
	unparseHeader(versions, extra) {
		this.unparseInt(versions.format);
		this.unparseInt(versions.serialized);
		this.unparseInt(versions.minimum);
		const minVersionWithEncoding = 3;
		if (versions.format >= minVersionWithEncoding) {
			if (!extra.encoding) throw new Error('encoding is required');
			this.unparseString(new TextEncoder().encode(extra.encoding));
		}
	}

	/**
	 * Unparse an integer value.
	 * @param {number} value
	 */
	unparseInt(value) {
		this._unparseArrayValues(new Int32Array([value]));
	}

	/**
	 * Unparse a 1D array of values.
	 * @param {Int32Array|Float64Array|Uint8Array} array
	 */
	unparseArray(array) {
		if (!('length' in array)) throw new Error('array must be 1D');
		this.unparseInt(array.length);
		this._unparseArrayValues(array);
	}

	/**
	 * Unparse the values of an array.
	 * @param {Int32Array|Float64Array|Uint8Array} array
	 */
	_unparseArrayValues(array) {
		if (array instanceof Uint8Array) {
			array = new Int32Array(array);
		}
		if (!(array instanceof Int32Array) && !(array instanceof Float64Array)) {
			throw new Error('Array must be Int32Array or Float64Array');
		}
		this._unparseArrayValuesRaw(array);
	}

	/**
	 * Unparse the values of an array as such.
	 * @abstract
	 * @param {Int32Array|Float64Array} array
	 */
	_unparseArrayValuesRaw(array) {
		throw new Error('_unparseArrayValuesRaw() must be implemented by subclass');
	}

	/**
	 * Unparse a string.
	 * @param {Uint8Array|null} value
	 */
	unparseString(value) {
		if (value == null) {
			this.unparseInt(-1);
			return;
		}
		this.unparseInt(value.length);
		this._unparseStringCharacters(value);
	}

	/**
	 * Unparse characters of a string (not None).
	 * @abstract
	 * @param {Uint8Array} value
	 */
	_unparseStringCharacters(value) {
		throw new Error('_unparseStringCharacters() must be implemented by subclass');
	}

	/**
	 * Unparse an RData object.
	 * @param {RData} rData
	 */
	unparseRData(rData) {
		this.unparseMagic();
		this.unparseHeader(rData.versions, rData.extra);
		this.unparseRObject(rData.object);
	}

	/**
	 * Unparse an RObject object.
	 * @param {RObject} obj
	 */
	unparseRObject(obj) {
		let attributesDone = false,
			tagDone = false;
		const info = obj.info;
		this.unparseInt(packRObjectInfo(info));
		const value = obj.value;

		switch (info.type.name) {
			case 'NIL':
			case 'NILVALUE':
			case 'REF':
				if (value != null) throw new Error('Value should be null for NIL/NILVALUE/REF');
				break;
			case 'SYM':
				this.unparseRObject(value);
				break;
			case 'LIST':
			case 'LANG':
			case 'ALTREP':
				if (info.attributes) {
					if (!obj.attributes) throw new Error('attributes required');
					this.unparseRObject(obj.attributes);
					attributesDone = true;
				}
				if (info.tag) {
					if (!obj.tag) throw new Error('tag required');
					this.unparseRObject(obj.tag);
					tagDone = true;
				}
				for (const element of value) this.unparseRObject(element);
				break;
			case 'CHAR':
			case 'BUILTIN':
				this.unparseString(value);
				break;
			case 'LGL':
			case 'INT':
			case 'REAL':
			case 'CPLX':
				this.unparseArray(value);
				break;
			case 'STR':
			case 'VEC':
			case 'EXPR':
				this.unparseInt(value.length);
				for (const element of value) this.unparseRObject(element);
				break;
			default:
				throw new Error(`type ${info.type.name} not implemented`);
		}
		if (info.attributes && !attributesDone) {
			if (!obj.attributes) throw new Error('attributes required');
			this.unparseRObject(obj.attributes);
		}
		if (info.tag && !tagDone) {
			throw new Error(`Tag not implemented for type ${info.type.name}`);
		}
	}
}

/**
 * Unparser for files in XDR format.
 * @extends Unparser
 */
class UnparserXDR extends Unparser {
	/**
	 * @param {WriteableBinaryFile} file
	 */
	constructor(file) {
		super();
		/** @type {WriteableBinaryFile} */
		this.file = file;
	}

	/**
	 * Unparse magic bits.
	 */
	unparseMagic() {
		this.file.write(new TextEncoder().encode('RDX3\nX\n'));
	}

	/**
	 * Unparse the values of an array as raw big-endian bytes.
	 * @param {Int32Array|Float64Array|Uint8Array} array
	 */
	_unparseArrayValuesRaw(array) {
		let bytes;
		if (array instanceof Int32Array) {
			bytes = new Uint8Array(array.length * 4);
			const view = new DataView(bytes.buffer);
			for (let i = 0; i < array.length; i++) {
				view.setInt32(i * 4, array[i], false); // big-endian
			}
		} else if (array instanceof Float64Array) {
			bytes = new Uint8Array(array.length * 8);
			const view = new DataView(bytes.buffer);
			for (let i = 0; i < array.length; i++) {
				view.setFloat64(i * 8, array[i], false); // big-endian
			}
		} else if (array instanceof Uint8Array) {
			bytes = array; // no endianness for bytes
		} else {
			throw new Error('Unsupported array type for XDR serialization');
		}
		this.file.write(bytes);
	}

	/**
	 * Unparse characters of a string (not None).
	 * @param {Uint8Array} value
	 */
	_unparseStringCharacters(value) {
		this.file.write(value);
	}
}

/**
 * Converts an arbitrary JS POJO to a RObject.
 * This is a minimal implementation based on the Python converter.
 * @param {any} data
 * @returns {RObject}
 */
function convertJsToRObject(data) {
	// Helper: create info
	/**
	 *
	 * @param {RObjectType} type
	 * @param {Partial<Omit<RObjectInfo, "type">>} opts
	 * @returns
	 */
	function makeInfo(type, opts = {}) {
		return {
			type,
			object: !!opts.object,
			attributes: !!opts.attributes,
			tag: !!opts.tag,
			gp: opts.gp || 0,
			reference: opts.reference || 0
		};
	}

	// Helper: encode string
	/**
	 *
	 * @param {string} str
	 * @returns
	 */
	function encodeString(str) {
		return new TextEncoder().encode(str);
	}

	// Null/undefined
	if (data === null || data === undefined) {
		return {
			info: makeInfo(RObjectTypes.NILVALUE),
			value: null
		};
	}
	// Boolean
	if (typeof data === 'boolean') {
		return {
			info: makeInfo(RObjectTypes.LGL),
			value: new Int32Array([data ? 1 : 0])
		};
	}
	// Number
	if (typeof data === 'number') {
		return {
			info: makeInfo(RObjectTypes.REAL),
			value: new Float64Array([data])
		};
	}
	// String
	if (typeof data === 'string') {
		return {
			info: makeInfo(RObjectTypes.STR),
			value: [convertJsToRObject(encodeString(data))]
		};
	}
	// TypedArray
	if (data instanceof Int32Array) {
		return { info: makeInfo(RObjectTypes.INT), value: data };
	}
	if (data instanceof Float64Array) {
		return { info: makeInfo(RObjectTypes.REAL), value: data };
	}
	if (data instanceof Uint8Array) {
		return { info: makeInfo(RObjectTypes.CHAR), value: data };
	}
	// Array
	if (Array.isArray(data)) {
		return {
			info: makeInfo(RObjectTypes.VEC),
			value: data.map(convertJsToRObject)
		};
	}
	// Plain Object (Dictionary)
	if (typeof data === 'object') {
		// Attributes: names
		return {
			info: makeInfo(RObjectTypes.VEC, { object: true, attributes: true }),
			value: [],
			attributes: {
				info: makeInfo(RObjectTypes.LIST),
				value: entries(data).map(([k, v]) => ({
					info: makeInfo(RObjectTypes.LIST),
					value: [convertJsToRObject(k), convertJsToRObject(v)]
				}))
			}
		};
	}
	throw new Error(`Cannot convert JS value of type ${typeof data}`);
}
