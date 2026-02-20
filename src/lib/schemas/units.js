import { type } from 'arktype';
import { MeasureKind } from 'convert';

export const NumericUnit = type.enumerated(
	...ALL_UNITS().flatMap(({ units }) =>
		units.flatMap((unit) => [...unit.names, ...('symbols' in unit ? unit.symbols : [])])
	)
);

/**
 * 
 * @param {string} nameOrSymbol 
 * @returns {ReturnType<typeof ALL_UNITS>[number]['units'][number] | undefined}
 */
export function findUnit(nameOrSymbol) {
	return ALL_UNITS().flatMap((kind) => kind.units ).find((u) => u.names.includes(nameOrSymbol) || ('symbols' in u && u.symbols.includes(nameOrSymbol)));
}

/**
 *
 * @param {typeof NumericUnit.infer} unit
 */
export function availableUnitsFor(unit) {
	const kind = ALL_UNITS().find((kind) =>
		kind.units.some(
			(u) =>
				/** @type {readonly string[]} */ (u.names).includes(unit) ||
				('symbols' in u && /** @type {readonly string[]} */ (u.symbols).includes(unit))
		)
	);

	if (!kind) return [];


	return kind.units.map((u) => /** @type {const} */ ({
		names: u.names,
		symbols: 'symbols' in u ? u.symbols : []
	}));
}

function ALL_UNITS() {
	return /** @type {const} */ ([
		{
			kind: MeasureKind[0],
			best: ['deg'],
			units: [
				{ names: ['radian', 'radians'], symbols: ['rad', 'rads', 'r'], ratio: 1 },
				{ names: ['turn', 'turns'] },
				{ names: ['degree', 'degrees'], symbols: ['deg', 'degs', '°'] },
				{
					names: ['gradian', 'gradians'],
					symbols: ['gon', 'gons', 'grad', 'grads', 'grade', 'grades']
				},
				{
					names: ['arcminute', 'arcminutes', 'minutes of arc'],
					symbols: ['arcmin', 'arcmins']
				},
				{
					names: ['arcsecond', 'arcseconds', 'seconds of arc'],
					symbols: ['arcsec', 'arcsecs']
				}
			]
		},
		{
			kind: MeasureKind[1],
			best: {
				metric: ['mm2', 'cm2', 'm2', 'km2'],
				imperial: ['sq in', 'sq ft', 'ac', 'sq mi']
			},
			units: [
				{
					names: ['square meter', 'square meters', 'square metre', 'square metres'],
					symbols: ['m²', 'm2'],
					ratio: 1
				},
				{
					names: [
						'square petameter',
						'square petametre',
						'square petameters',
						'square petametres'
					],
					symbols: ['Pm²', 'Pm2'],
					ratio: '1e+30'
				},
				{
					names: [
						'square terameter',
						'square terametre',
						'square terameters',
						'square terametres'
					],
					symbols: ['Tm²', 'Tm2'],
					ratio: '1e+24'
				},
				{
					names: [
						'square gigameter',
						'square gigametre',
						'square gigameters',
						'square gigametres'
					],
					symbols: ['Gm²', 'Gm2'],
					ratio: '1000000000000000000'
				},
				{
					names: [
						'square megameter',
						'square megametre',
						'square megameters',
						'square megametres'
					],
					symbols: ['Mm²', 'Mm2'],
					ratio: '1000000000000'
				},
				{
					names: [
						'square kilometer',
						'square kilometre',
						'square kilometers',
						'square kilometres'
					],
					symbols: ['km²', 'km2'],
					ratio: '1000000'
				},
				{
					names: [
						'square hectometer',
						'square hectometre',
						'square hectometers',
						'square hectometres'
					],
					symbols: ['hm²', 'hm2'],
					ratio: '10000'
				},
				{
					names: [
						'square decameter',
						'square decametre',
						'square decameters',
						'square decametres'
					],
					symbols: ['dam²', 'dam2'],
					ratio: '100'
				},
				{
					names: [
						'square decimeter',
						'square decimetre',
						'square decimeters',
						'square decimetres'
					],
					symbols: ['dm²', 'dm2'],
					ratio: '0.1'
				},
				{
					names: [
						'square centimeter',
						'square centimetre',
						'square centimeters',
						'square centimetres'
					],
					symbols: ['cm²', 'cm2'],
					ratio: '0.0001'
				},
				{
					names: [
						'square millimeter',
						'square millimetre',
						'square millimeters',
						'square millimetres'
					],
					symbols: ['mm²', 'mm2'],
					ratio: '0.000001'
				},
				{
					names: [
						'square micrometer',
						'square micrometre',
						'square micrometers',
						'square micrometres'
					],
					symbols: ['μm²', 'µm²', 'μm2', 'µm2'],
					ratio: '1e-12'
				},
				{
					names: [
						'square nanometer',
						'square nanometre',
						'square nanometers',
						'square nanometres'
					],
					symbols: ['nm²', 'nm2'],
					ratio: '1e-18'
				},
				{
					names: [
						'square picometer',
						'square picometre',
						'square picometers',
						'square picometres'
					],
					symbols: ['pm²', 'pm2'],
					ratio: '1e-24'
				},
				{
					names: [
						'square femtometer',
						'square femtometre',
						'square femtometers',
						'square femtometres'
					],
					symbols: ['fm²', 'fm2'],
					ratio: '1e-30'
				},
				{ names: ['acre', 'acres'], symbols: ['ac'], ratio: 4046.8564224 },
				{ names: ['centiare', 'centiares'], symbols: ['ca'], ratio: 1 },
				{ names: ['deciare', 'deciares'], symbols: ['da'], ratio: 10 },
				{ names: ['are', 'ares'], ratio: 100 },
				{ names: ['decare', 'decares'], symbols: ['daa'], ratio: 1000 },
				{ names: ['hectare', 'hectares'], symbols: ['ha'], ratio: 10000 },
				{
					names: ['square foot', 'square feet'],
					symbols: ['sq ft', 'ft²', 'ft2'],
					ratio: 0.09290304
				},
				{
					names: ['square inch', 'square inches'],
					symbols: ['sq in', 'in²', 'in2'],
					ratio: 0.00064516
				},
				{
					names: ['square yard', 'square yards'],
					symbols: ['sq yd', 'yd²', 'yd2'],
					ratio: 0.83612736
				},
				{
					names: ['square mile', 'square miles'],
					symbols: ['sq mi', 'mi²', 'mi2'],
					ratio: 2589988.110336
				},
				{ names: ['mǔ', 'mu'], ratio: 666.6666666666666 }
			]
		},
		{
			kind: MeasureKind[2],
			best: {
				metric: ['bits', 'B', 'KB', 'MB', 'GB', 'TB', 'PB'],
				imperial: ['bits', 'B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
			},
			units: [
				{ names: ['bit', 'bits'], symbols: ['b'], ratio: 1 },
				{ names: ['pebibit', 'pebibits'], symbols: ['Pib'], ratio: '1125899906842624' },
				{ names: ['tebibit', 'tebibits'], symbols: ['Tib'], ratio: '1099511627776' },
				{ names: ['gibibit', 'gibibits'], symbols: ['Gib'], ratio: '1073741824' },
				{ names: ['mebibit', 'mebibits'], symbols: ['Mib'], ratio: '1048576' },
				{ names: ['kibibit', 'kibibits'], symbols: ['Kib'], ratio: '1024' },
				{ names: [], symbols: ['Kb'], ratio: 1000 },
				{ names: [], symbols: ['KB'], ratio: 8000 },
				{ names: ['petabit', 'petabits'], symbols: ['Pb'], ratio: '1000000000000000' },
				{ names: ['terabit', 'terabits'], symbols: ['Tb'], ratio: '1000000000000' },
				{ names: ['gigabit', 'gigabits'], symbols: ['Gb'], ratio: '1000000000' },
				{ names: ['megabit', 'megabits'], symbols: ['Mb'], ratio: '1000000' },
				{ names: ['kilobit', 'kilobits'], symbols: ['kb'], ratio: '1000' },
				{ names: ['hectobit', 'hectobits'], symbols: ['hb'], ratio: '100' },
				{ names: ['decabit', 'decabits'], symbols: ['dab'], ratio: '10' },
				{ names: ['decibit', 'decibits'], symbols: ['db'], ratio: '0.1' },
				{ names: ['centibit', 'centibits'], symbols: ['cb'], ratio: '0.01' },
				{ names: ['millibit', 'millibits'], symbols: ['mb'], ratio: '0.001' },
				{ names: ['microbit', 'microbits'], symbols: ['μb', 'µb'], ratio: '0.000001' },
				{ names: ['nanobit', 'nanobits'], symbols: ['nb'], ratio: '1e-9' },
				{ names: ['picobit', 'picobits'], symbols: ['pb'], ratio: '1e-12' },
				{ names: ['femtobit', 'femtobits'], symbols: ['fb'], ratio: '1e-15' },
				{
					names: [
						'nibble',
						'nibbles',
						'semioctet',
						'semioctets',
						'halfbyte',
						'halfbytes'
					],
					ratio: 4
				},
				{ names: ['byte', 'bytes', 'octect', 'octects'], symbols: ['B'], ratio: 8 },
				{ names: ['pebibyte', 'pebibytes'], symbols: ['PiB'], ratio: '9007199254740992' },
				{ names: ['tebibyte', 'tebibytes'], symbols: ['TiB'], ratio: '8796093022208' },
				{ names: ['gibibyte', 'gibibytes'], symbols: ['GiB'], ratio: '8589934592' },
				{ names: ['mebibyte', 'mebibytes'], symbols: ['MiB'], ratio: '8388608' },
				{ names: ['kibibyte', 'kibibytes'], symbols: ['KiB'], ratio: '8192' },
				{ names: ['petabyte', 'petabytes'], symbols: ['PB'], ratio: '8000000000000000' },
				{ names: ['terabyte', 'terabytes'], symbols: ['TB'], ratio: '8000000000000' },
				{ names: ['gigabyte', 'gigabytes'], symbols: ['GB'], ratio: '8000000000' },
				{ names: ['megabyte', 'megabytes'], symbols: ['MB'], ratio: '8000000' },
				{ names: ['kilobyte', 'kilobytes'], symbols: ['kB'], ratio: '8000' },
				{ names: ['hectobyte', 'hectobytes'], symbols: ['hB'], ratio: '800' },
				{ names: ['decabyte', 'decabytes'], symbols: ['daB'], ratio: '80' },
				{ names: ['decibyte', 'decibytes'], symbols: ['dB'], ratio: '0.8' },
				{ names: ['centibyte', 'centibytes'], symbols: ['cB'], ratio: '0.08' },
				{ names: ['millibyte', 'millibytes'], symbols: ['mB'], ratio: '0.008' },
				{ names: ['microbyte', 'microbytes'], symbols: ['μB', 'µB'], ratio: '0.000008' },
				{ names: ['nanobyte', 'nanobytes'], symbols: ['nB'], ratio: '8e-9' },
				{ names: ['picobyte', 'picobytes'], symbols: ['pB'], ratio: '8e-12' },
				{ names: ['femtobyte', 'femtobytes'], symbols: ['fB'], ratio: '8e-15' },
				{ names: ['hextet', 'hextets'], ratio: 16 }
			]
		},
		{
			kind: MeasureKind[3],
			best: ['J', 'Wh', 'kWh', 'MWh', 'GWh'],
			units: [
				{ names: ['joule', 'joules'], symbols: ['J'], ratio: 1 },
				{ names: ['petajoule', 'petajoules'], symbols: ['PJ'], ratio: '1000000000000000' },
				{ names: ['terajoule', 'terajoules'], symbols: ['TJ'], ratio: '1000000000000' },
				{ names: ['gigajoule', 'gigajoules'], symbols: ['GJ'], ratio: '1000000000' },
				{ names: ['megajoule', 'megajoules'], symbols: ['MJ'], ratio: '1000000' },
				{ names: ['kilojoule', 'kilojoules'], symbols: ['kJ'], ratio: '1000' },
				{ names: ['hectojoule', 'hectojoules'], symbols: ['hJ'], ratio: '100' },
				{ names: ['decajoule', 'decajoules'], symbols: ['daJ'], ratio: '10' },
				{ names: ['decijoule', 'decijoules'], symbols: ['dJ'], ratio: '0.1' },
				{ names: ['centijoule', 'centijoules'], symbols: ['cJ'], ratio: '0.01' },
				{ names: ['millijoule', 'millijoules'], symbols: ['mJ'], ratio: '0.001' },
				{ names: ['microjoule', 'microjoules'], symbols: ['μJ', 'µJ'], ratio: '0.000001' },
				{ names: ['nanojoule', 'nanojoules'], symbols: ['nJ'], ratio: '1e-9' },
				{ names: ['picojoule', 'picojoules'], symbols: ['pJ'], ratio: '1e-12' },
				{ names: ['femtojoule', 'femtojoules'], symbols: ['fJ'], ratio: '1e-15' },
				{ names: ['watt-hour'], symbols: ['W⋅h', 'W h', 'Wh'], ratio: 3600 },
				{
					names: ['petawatt-hour', 'petawatt-hours'],
					symbols: ['PW⋅h', 'PW h', 'PWh'],
					ratio: '3600000000000000000'
				},
				{
					names: ['terawatt-hour', 'terawatt-hours'],
					symbols: ['TW⋅h', 'TW h', 'TWh'],
					ratio: '3600000000000000'
				},
				{
					names: ['gigawatt-hour', 'gigawatt-hours'],
					symbols: ['GW⋅h', 'GW h', 'GWh'],
					ratio: '3600000000000'
				},
				{
					names: ['megawatt-hour', 'megawatt-hours'],
					symbols: ['MW⋅h', 'MW h', 'MWh'],
					ratio: '3600000000'
				},
				{
					names: ['kilowatt-hour', 'kilowatt-hours'],
					symbols: ['kW⋅h', 'kW h', 'kWh'],
					ratio: '3600000'
				},
				{
					names: ['hectowatt-hour', 'hectowatt-hours'],
					symbols: ['hW⋅h', 'hW h', 'hWh'],
					ratio: '360000'
				},
				{
					names: ['decawatt-hour', 'decawatt-hours'],
					symbols: ['daW⋅h', 'daW h', 'daWh'],
					ratio: '36000'
				},
				{
					names: ['deciwatt-hour', 'deciwatt-hours'],
					symbols: ['dW⋅h', 'dW h', 'dWh'],
					ratio: '360'
				},
				{
					names: ['centiwatt-hour', 'centiwatt-hours'],
					symbols: ['cW⋅h', 'cW h', 'cWh'],
					ratio: '36'
				},
				{
					names: ['milliwatt-hour', 'milliwatt-hours'],
					symbols: ['mW⋅h', 'mW h', 'mWh'],
					ratio: '3.6'
				},
				{
					names: ['microwatt-hour', 'microwatt-hours'],
					symbols: ['μW⋅h', 'µW⋅h', 'μW h', 'µW h', 'μWh', 'µWh'],
					ratio: '0.0036'
				},
				{
					names: ['nanowatt-hour', 'nanowatt-hours'],
					symbols: ['nW⋅h', 'nW h', 'nWh'],
					ratio: '0.0000036'
				},
				{
					names: ['picowatt-hour', 'picowatt-hours'],
					symbols: ['pW⋅h', 'pW h', 'pWh'],
					ratio: '3.6e-9'
				},
				{
					names: ['femtowatt-hour', 'femtowatt-hours'],
					symbols: ['fW⋅h', 'fW h', 'fWh'],
					ratio: '3.6e-12'
				}
			]
		},
		{
			kind: MeasureKind[4],
			best: { metric: ['N'], imperial: ['lbf'] },
			units: [
				{ names: ['newton', 'newtons'], symbols: ['N'], ratio: 1 },
				{
					names: ['petanewton', 'petanewtons'],
					symbols: ['PN'],
					ratio: '1000000000000000'
				},
				{ names: ['teranewton', 'teranewtons'], symbols: ['TN'], ratio: '1000000000000' },
				{ names: ['giganewton', 'giganewtons'], symbols: ['GN'], ratio: '1000000000' },
				{ names: ['meganewton', 'meganewtons'], symbols: ['MN'], ratio: '1000000' },
				{ names: ['kilonewton', 'kilonewtons'], symbols: ['kN'], ratio: '1000' },
				{ names: ['hectonewton', 'hectonewtons'], symbols: ['hN'], ratio: '100' },
				{ names: ['decanewton', 'decanewtons'], symbols: ['daN'], ratio: '10' },
				{ names: ['decinewton', 'decinewtons'], symbols: ['dN'], ratio: '0.1' },
				{ names: ['centinewton', 'centinewtons'], symbols: ['cN'], ratio: '0.01' },
				{ names: ['millinewton', 'millinewtons'], symbols: ['mN'], ratio: '0.001' },
				{
					names: ['micronewton', 'micronewtons'],
					symbols: ['μN', 'µN'],
					ratio: '0.000001'
				},
				{ names: ['nanonewton', 'nanonewtons'], symbols: ['nN'], ratio: '1e-9' },
				{ names: ['piconewton', 'piconewtons'], symbols: ['pN'], ratio: '1e-12' },
				{ names: ['femtonewton', 'femtonewtons'], symbols: ['fN'], ratio: '1e-15' },
				{ names: ['dyne', 'dynes'], symbols: ['dyn'], ratio: 0.00001 },
				{ names: ['pound of force', 'pound-force'], symbols: ['lbf'], ratio: 4.448222 },
				{ names: ['kip'], symbols: ['klb', 'kipf', 'klbf'], ratio: 4448.2216 },
				{ names: ['poundal', 'poundals'], symbols: ['pdl'], ratio: 0.138255 },
				{
					names: ['kilogram-force', 'kilopond', 'kiloponds'],
					symbols: ['kgf', 'kp'],
					ratio: 9.80665
				},
				{
					names: ['tonne-force', 'metric ton-force', 'megagram-force', 'megapond'],
					symbols: ['tf', 'Mp'],
					ratio: 9806.65
				}
			]
		},
		{
			kind: MeasureKind[5],
			best: ['Hz', 'kHz', 'MHz', 'GHz', 'THz', 'PHz'],
			units: [
				{ names: ['hertz'], symbols: ['Hz'], ratio: 1 },
				{ names: ['petahertz'], symbols: ['PHz'], ratio: '1000000000000000' },
				{ names: ['terahertz'], symbols: ['THz'], ratio: '1000000000000' },
				{ names: ['gigahertz'], symbols: ['GHz'], ratio: '1000000000' },
				{ names: ['megahertz'], symbols: ['MHz'], ratio: '1000000' },
				{ names: ['kilohertz'], symbols: ['kHz'], ratio: '1000' },
				{ names: ['hectohertz'], symbols: ['hHz'], ratio: '100' },
				{ names: ['decahertz'], symbols: ['daHz'], ratio: '10' },
				{ names: ['decihertz'], symbols: ['dHz'], ratio: '0.1' },
				{ names: ['centihertz'], symbols: ['cHz'], ratio: '0.01' },
				{ names: ['millihertz'], symbols: ['mHz'], ratio: '0.001' },
				{ names: ['microhertz'], symbols: ['μHz', 'µHz'], ratio: '0.000001' },
				{ names: ['nanohertz'], symbols: ['nHz'], ratio: '1e-9' },
				{ names: ['picohertz'], symbols: ['pHz'], ratio: '1e-12' },
				{ names: ['femtohertz'], symbols: ['fHz'], ratio: '1e-15' }
			]
		},
		{
			kind: MeasureKind[6],
			best: { metric: ['mm', 'cm', 'm', 'km'], imperial: ['in', 'ft', 'yd', 'mi'] },
			units: [
				{ names: ['meter', 'meters', 'metre', 'metres'], symbols: ['m'], ratio: 1 },
				{
					names: ['petameter', 'petametre', 'petameters', 'petametres'],
					symbols: ['Pm'],
					ratio: '1000000000000000'
				},
				{
					names: ['terameter', 'terametre', 'terameters', 'terametres'],
					symbols: ['Tm'],
					ratio: '1000000000000'
				},
				{
					names: ['gigameter', 'gigametre', 'gigameters', 'gigametres'],
					symbols: ['Gm'],
					ratio: '1000000000'
				},
				{
					names: ['megameter', 'megametre', 'megameters', 'megametres'],
					symbols: ['Mm'],
					ratio: '1000000'
				},
				{
					names: ['kilometer', 'kilometre', 'kilometers', 'kilometres'],
					symbols: ['km'],
					ratio: '1000'
				},
				{
					names: ['hectometer', 'hectometre', 'hectometers', 'hectometres'],
					symbols: ['hm'],
					ratio: '100'
				},
				{
					names: ['decameter', 'decametre', 'decameters', 'decametres'],
					symbols: ['dam'],
					ratio: '10'
				},
				{
					names: ['decimeter', 'decimetre', 'decimeters', 'decimetres'],
					symbols: ['dm'],
					ratio: '0.1'
				},
				{
					names: ['centimeter', 'centimetre', 'centimeters', 'centimetres'],
					symbols: ['cm'],
					ratio: '0.01'
				},
				{
					names: ['millimeter', 'millimetre', 'millimeters', 'millimetres'],
					symbols: ['mm'],
					ratio: '0.001'
				},
				{
					names: ['micrometer', 'micrometre', 'micrometers', 'micrometres'],
					symbols: ['μm', 'µm'],
					ratio: '0.000001'
				},
				{
					names: ['nanometer', 'nanometre', 'nanometers', 'nanometres'],
					symbols: ['nm'],
					ratio: '1e-9'
				},
				{
					names: ['picometer', 'picometre', 'picometers', 'picometres'],
					symbols: ['pm'],
					ratio: '1e-12'
				},
				{
					names: ['femtometer', 'femtometre', 'femtometers', 'femtometres'],
					symbols: ['fm'],
					ratio: '1e-15'
				},
				{ names: ['foot', 'feet'], symbols: ['ft', "'"], ratio: 0.3048 },
				{
					names: [
						'US survey foot',
						'US survey feet',
						'U.S. survey foot',
						'U.S. survey feet'
					],
					ratio: '0.30480060960121920244'
				},
				{ names: ['inch', 'inches'], symbols: ['in', '"'], ratio: 0.0254 },
				{ names: ['yard', 'yards'], symbols: ['yd'], ratio: 0.9144 },
				{ names: ['mile', 'miles'], symbols: ['mi'], ratio: 1609.344 },
				{
					names: ['nautical mile', 'nautical miles'],
					symbols: ['M', 'NM', 'nmi'],
					ratio: 1852
				},
				{
					names: ['light-year', 'light-years'],
					symbols: ['ly'],
					ratio: '9460730472580800'
				},
				{ names: ['parsec', 'parsecs'], symbols: ['pc'], ratio: '30856775814913673' },
				{ names: ['pica', 'picas'], ratio: 0.0042333 },
				{ names: ['point', 'points'], ratio: 0.0003528 }
			]
		},
		{
			kind: MeasureKind[7],
			best: { metric: ['mg', 'g', 'kg'], imperial: ['oz', 'lb'] },
			units: [
				{ names: ['gram', 'grams'], symbols: ['g'], ratio: 1 },
				{ names: ['petagram', 'petagrams'], symbols: ['Pg'], ratio: '1000000000000000' },
				{ names: ['teragram', 'teragrams'], symbols: ['Tg'], ratio: '1000000000000' },
				{ names: ['gigagram', 'gigagrams'], symbols: ['Gg'], ratio: '1000000000' },
				{ names: ['megagram', 'megagrams'], symbols: ['Mg'], ratio: '1000000' },
				{ names: ['kilogram', 'kilograms'], symbols: ['kg'], ratio: '1000' },
				{ names: ['hectogram', 'hectograms'], symbols: ['hg'], ratio: '100' },
				{ names: ['decagram', 'decagrams'], symbols: ['dag'], ratio: '10' },
				{ names: ['decigram', 'decigrams'], symbols: ['dg'], ratio: '0.1' },
				{ names: ['centigram', 'centigrams'], symbols: ['cg'], ratio: '0.01' },
				{ names: ['milligram', 'milligrams'], symbols: ['mg'], ratio: '0.001' },
				{ names: ['microgram', 'micrograms'], symbols: ['μg', 'µg'], ratio: '0.000001' },
				{ names: ['nanogram', 'nanograms'], symbols: ['ng'], ratio: '1e-9' },
				{ names: ['picogram', 'picograms'], symbols: ['pg'], ratio: '1e-12' },
				{ names: ['femtogram', 'femtograms'], symbols: ['fg'], ratio: '1e-15' },
				{ names: [], symbols: ['mcg'], ratio: 0.000001 },
				{
					names: ['tonne', 'tonnes', 'metric ton', 'metric tons'],
					symbols: ['t'],
					ratio: 1000000
				},
				{ names: ['kilotonne', 'kilotonnes'], symbols: ['kt'], ratio: 1000000000 },
				{ names: ['megatonne', 'megatonnes'], symbols: ['Mt'], ratio: 1000000000000 },
				{ names: ['gigatonne', 'gigatonnes'], symbols: ['Gt'], ratio: 1000000000000000 },
				{ names: ['pound', 'pounds'], symbols: ['lb', 'lbs'], ratio: '453.59237' },
				{ names: ['grain', 'grains'], symbols: ['gr'], ratio: 0.06479891 },
				{ names: ['stone', 'stones'], symbols: ['st'], ratio: '6350.29318' },
				{ names: ['ounce', 'ounces'], symbols: ['oz'], ratio: '28.349523125' },
				{ names: ['short hundredweight', 'cental'], ratio: 45360 },
				{
					names: ['long hundredweight', 'imperial hundredweight'],
					symbols: ['cwt'],
					ratio: 50800
				},
				{ names: ['short ton', 'short tons', 'US ton', 'US tons'], ratio: '907184.74' },
				{
					names: [
						'long ton',
						'long tons',
						'imperial ton',
						'imperial tons',
						'displacement ton',
						'displacement tons'
					],
					ratio: '1016046.9088'
				},
				{ names: ['troy ounce'], symbols: ['oz t', 'toz'], ratio: 31.1034768 }
			]
		},
		{
			kind: MeasureKind[8],
			best: ['W', 'kW', 'MW', 'GW', 'TW', 'PW'],
			units: [
				{ names: ['watt', 'watts'], symbols: ['W'], ratio: 1 },
				{ names: ['petawatt', 'petawatts'], symbols: ['PW'], ratio: '1000000000000000' },
				{ names: ['terawatt', 'terawatts'], symbols: ['TW'], ratio: '1000000000000' },
				{ names: ['gigawatt', 'gigawatts'], symbols: ['GW'], ratio: '1000000000' },
				{ names: ['megawatt', 'megawatts'], symbols: ['MW'], ratio: '1000000' },
				{ names: ['kilowatt', 'kilowatts'], symbols: ['kW'], ratio: '1000' },
				{ names: ['hectowatt', 'hectowatts'], symbols: ['hW'], ratio: '100' },
				{ names: ['decawatt', 'decawatts'], symbols: ['daW'], ratio: '10' },
				{ names: ['deciwatt', 'deciwatts'], symbols: ['dW'], ratio: '0.1' },
				{ names: ['centiwatt', 'centiwatts'], symbols: ['cW'], ratio: '0.01' },
				{ names: ['milliwatt', 'milliwatts'], symbols: ['mW'], ratio: '0.001' },
				{ names: ['microwatt', 'microwatts'], symbols: ['μW', 'µW'], ratio: '0.000001' },
				{ names: ['nanowatt', 'nanowatts'], symbols: ['nW'], ratio: '1e-9' },
				{ names: ['picowatt', 'picowatts'], symbols: ['pW'], ratio: '1e-12' },
				{ names: ['femtowatt', 'femtowatts'], symbols: ['fW'], ratio: '1e-15' },
				{
					names: ['horsepower', 'mechanical horsepower'],
					symbols: ['hp'],
					ratio: 745.699872
				}
			]
		},
		{
			kind: MeasureKind[9],
			best: { metric: ['Pa'], imperial: ['psi'] },
			units: [
				{ names: ['pascal', 'pascals'], symbols: ['Pa'], ratio: 1 },
				{
					names: ['petapascal', 'petapascals'],
					symbols: ['PPa'],
					ratio: '1000000000000000'
				},
				{ names: ['terapascal', 'terapascals'], symbols: ['TPa'], ratio: '1000000000000' },
				{ names: ['gigapascal', 'gigapascals'], symbols: ['GPa'], ratio: '1000000000' },
				{ names: ['megapascal', 'megapascals'], symbols: ['MPa'], ratio: '1000000' },
				{ names: ['kilopascal', 'kilopascals'], symbols: ['kPa'], ratio: '1000' },
				{ names: ['hectopascal', 'hectopascals'], symbols: ['hPa'], ratio: '100' },
				{ names: ['decapascal', 'decapascals'], symbols: ['daPa'], ratio: '10' },
				{ names: ['decipascal', 'decipascals'], symbols: ['dPa'], ratio: '0.1' },
				{ names: ['centipascal', 'centipascals'], symbols: ['cPa'], ratio: '0.01' },
				{ names: ['millipascal', 'millipascals'], symbols: ['mPa'], ratio: '0.001' },
				{
					names: ['micropascal', 'micropascals'],
					symbols: ['μPa', 'µPa'],
					ratio: '0.000001'
				},
				{ names: ['nanopascal', 'nanopascals'], symbols: ['nPa'], ratio: '1e-9' },
				{ names: ['picopascal', 'picopascals'], symbols: ['pPa'], ratio: '1e-12' },
				{ names: ['femtopascal', 'femtopascals'], symbols: ['fPa'], ratio: '1e-15' },
				{ names: ['bar', 'bars'], symbols: ['bar'], ratio: 100000 },
				{
					names: ['petabar', 'petabars'],
					symbols: ['Pbar'],
					ratio: '100000000000000000000'
				},
				{ names: ['terabar', 'terabars'], symbols: ['Tbar'], ratio: '100000000000000000' },
				{ names: ['gigabar', 'gigabars'], symbols: ['Gbar'], ratio: '100000000000000' },
				{ names: ['megabar', 'megabars'], symbols: ['Mbar'], ratio: '100000000000' },
				{ names: ['kilobar', 'kilobars'], symbols: ['kbar'], ratio: '100000000' },
				{ names: ['hectobar', 'hectobars'], symbols: ['hbar'], ratio: '10000000' },
				{ names: ['decabar', 'decabars'], symbols: ['dabar'], ratio: '1000000' },
				{ names: ['decibar', 'decibars'], symbols: ['dbar'], ratio: '10000' },
				{ names: ['centibar', 'centibars'], symbols: ['cbar'], ratio: '1000' },
				{ names: ['millibar', 'millibars'], symbols: ['mbar'], ratio: '100' },
				{ names: ['microbar', 'microbars'], symbols: ['μbar', 'µbar'], ratio: '0.1' },
				{ names: ['nanobar', 'nanobars'], symbols: ['nbar'], ratio: '0.0001' },
				{ names: ['picobar', 'picobars'], symbols: ['pbar'], ratio: '1e-7' },
				{ names: ['femtobar', 'femtobars'], symbols: ['fbar'], ratio: '1e-10' },
				{ names: ['torr', 'torrs'], symbols: ['Torr'], ratio: '133.32236842105263157895' },
				{ names: ['millitorr'], symbols: ['mTorr'], ratio: '0.13332236842105263158' },
				{ names: ['atmosphere', 'atmospheres'], symbols: ['atm'], ratio: 101325 },
				{
					names: ['pound per square inch', 'pounds per square inch'],
					symbols: ['psi', 'lbf/in2', 'lbf/in²'],
					ratio: 6894.757
				},
				{
					names: ['inch of water', 'inches of water'],
					symbols: ['inAq', 'Aq'],
					ratio: 249.0889
				},
				{
					names: ['inch of mercury', 'inches of mercury'],
					symbols: ['inHg', 'Hg'],
					ratio: 3386.389
				}
			]
		},
		{
			kind: MeasureKind[10],
			best: { metric: ['C'], imperial: ['F'] },
			units: [
				{ names: ['kelvin', 'kelvins'], symbols: ['K'], ratio: 1 },
				{
					names: ['petakelvin', 'petakelvins'],
					symbols: ['PK'],
					ratio: '1000000000000000'
				},
				{ names: ['terakelvin', 'terakelvins'], symbols: ['TK'], ratio: '1000000000000' },
				{ names: ['gigakelvin', 'gigakelvins'], symbols: ['GK'], ratio: '1000000000' },
				{ names: ['megakelvin', 'megakelvins'], symbols: ['MK'], ratio: '1000000' },
				{ names: ['kilokelvin', 'kilokelvins'], symbols: ['kK'], ratio: '1000' },
				{ names: ['hectokelvin', 'hectokelvins'], symbols: ['hK'], ratio: '100' },
				{ names: ['decakelvin', 'decakelvins'], symbols: ['daK'], ratio: '10' },
				{ names: ['decikelvin', 'decikelvins'], symbols: ['dK'], ratio: '0.1' },
				{ names: ['centikelvin', 'centikelvins'], symbols: ['cK'], ratio: '0.01' },
				{ names: ['millikelvin', 'millikelvins'], symbols: ['mK'], ratio: '0.001' },
				{
					names: ['microkelvin', 'microkelvins'],
					symbols: ['μK', 'µK'],
					ratio: '0.000001'
				},
				{ names: ['nanokelvin', 'nanokelvins'], symbols: ['nK'], ratio: '1e-9' },
				{ names: ['picokelvin', 'picokelvins'], symbols: ['pK'], ratio: '1e-12' },
				{ names: ['femtokelvin', 'femtokelvins'], symbols: ['fK'], ratio: '1e-15' },
				{ names: ['fahrenheit'], symbols: ['F', '°F'], difference: 459.67 },
				{ names: ['celsius'], symbols: ['C', '°C'], ratio: 1, difference: 273.15 },
				{ names: ['rankine'], symbols: ['R'] }
			]
		},
		{
			kind: MeasureKind[11],
			best: ['fs', 'ps', 'ns', 'µs', 'ms', 's', 'min', 'h', 'd', 'y'],
			units: [
				{ names: ['second', 'seconds'], symbols: ['s'], ratio: 1 },
				{
					names: ['petasecond', 'petaseconds'],
					symbols: ['Ps'],
					ratio: '1000000000000000'
				},
				{ names: ['terasecond', 'teraseconds'], symbols: ['Ts'], ratio: '1000000000000' },
				{ names: ['gigasecond', 'gigaseconds'], symbols: ['Gs'], ratio: '1000000000' },
				{ names: ['megasecond', 'megaseconds'], symbols: ['Ms'], ratio: '1000000' },
				{ names: ['kilosecond', 'kiloseconds'], symbols: ['ks'], ratio: '1000' },
				{ names: ['hectosecond', 'hectoseconds'], symbols: ['hs'], ratio: '100' },
				{ names: ['decasecond', 'decaseconds'], symbols: ['das'], ratio: '10' },
				{ names: ['decisecond', 'deciseconds'], symbols: ['ds'], ratio: '0.1' },
				{ names: ['centisecond', 'centiseconds'], symbols: ['cs'], ratio: '0.01' },
				{ names: ['millisecond', 'milliseconds'], symbols: ['ms'], ratio: '0.001' },
				{
					names: ['microsecond', 'microseconds'],
					symbols: ['μs', 'µs'],
					ratio: '0.000001'
				},
				{ names: ['nanosecond', 'nanoseconds'], symbols: ['ns'], ratio: '1e-9' },
				{ names: ['picosecond', 'picoseconds'], symbols: ['ps'], ratio: '1e-12' },
				{ names: ['femtosecond', 'femtoseconds'], symbols: ['fs'], ratio: '1e-15' },
				{ names: ['minute', 'minutes'], symbols: ['min'], ratio: 60 },
				{ names: ['hour', 'hours'], symbols: ['h'], ratio: 3600 },
				{ names: ['milliday', 'millidays'], symbols: ['md'], ratio: 86.4 },
				{ names: ['day', 'days'], symbols: ['d'], ratio: 86400 },
				{ names: ['week', 'weeks'], symbols: ['wk'], ratio: 604800 },
				{ names: ['fortnight', 'fortnights'], symbols: ['fn'], ratio: 1209600 },
				{ names: ['month', 'months'], symbols: ['mo'], ratio: 2592000 },
				{ names: ['year', 'years'], symbols: ['a', 'y', 'yr'], ratio: 31536000 },
				{ names: ['decade', 'decades'], symbols: ['dec'], ratio: 315569520 },
				{ names: ['century', 'centuries'], ratio: 3155695200 },
				{ names: ['millennium', 'millennia'], ratio: 31556952000 },
				{ names: ['moment', 'moments'], ratio: 90 },
				{ names: ['shake', 'shakes'], ratio: 1e-8 },
				{ names: ['time unit'], symbols: ['TU'], ratio: 0.001024 },
				{ names: ['svedberg', 'svedbergs'], symbols: ['S'], ratio: 1e-13 }
			]
		},
		{
			kind: MeasureKind[12],
			best: {
				metric: ['mL', 'L'],
				imperial: ['tsp', 'tbsp', 'fl oz', 'cup', 'pt', 'qt', 'gal']
			},
			units: [
				{
					names: [
						'cubic meter',
						'cubic meters',
						'cubic metre',
						'cubic metres',
						'stere',
						'steres'
					],
					symbols: ['m³', 'm3'],
					ratio: 1
				},
				{
					names: ['cubic petameter', 'cubic petameters'],
					symbols: ['Pm3', 'Pm³'],
					ratio: '1e+45'
				},
				{
					names: ['cubic terameter', 'cubic terameters'],
					symbols: ['Tm3', 'Tm³'],
					ratio: '1e+36'
				},
				{
					names: ['cubic gigameter', 'cubic gigameters'],
					symbols: ['Gm3', 'Gm³'],
					ratio: '1e+27'
				},
				{
					names: ['cubic megameter', 'cubic megameters'],
					symbols: ['Mm3', 'Mm³'],
					ratio: '1000000000000000000'
				},
				{
					names: ['cubic kilometer', 'cubic kilometers'],
					symbols: ['km3', 'km³'],
					ratio: '1000000000'
				},
				{
					names: ['cubic hectometer', 'cubic hectometers'],
					symbols: ['hm3', 'hm³'],
					ratio: '1000000'
				},
				{
					names: ['cubic decameter', 'cubic decameters'],
					symbols: ['dam3', 'dam³'],
					ratio: '1000'
				},
				{
					names: ['cubic decimeter', 'cubic decimeters'],
					symbols: ['dm3', 'dm³'],
					ratio: '0.001'
				},
				{
					names: ['cubic centimeter', 'cubic centimeters'],
					symbols: ['cm3', 'cm³'],
					ratio: '0.000001'
				},
				{
					names: ['cubic millimeter', 'cubic millimeters'],
					symbols: ['mm3', 'mm³'],
					ratio: '1e-9'
				},
				{
					names: ['cubic micrometer', 'cubic micrometers'],
					symbols: ['μm3', 'µm3', 'μm³', 'µm³'],
					ratio: '1e-18'
				},
				{
					names: ['cubic nanometer', 'cubic nanometers'],
					symbols: ['nm3', 'nm³'],
					ratio: '1e-27'
				},
				{
					names: ['cubic picometer', 'cubic picometers'],
					symbols: ['pm3', 'pm³'],
					ratio: '1e-36'
				},
				{
					names: ['cubic femtometer', 'cubic femtometers'],
					symbols: ['fm3', 'fm³'],
					ratio: '1e-45'
				},
				{
					names: ['liter', 'liters', 'litre', 'litres'],
					symbols: ['l', 'L'],
					ratio: 0.001
				},
				{
					names: ['petaliter', 'petaliters', 'petalitre', 'petalitres'],
					symbols: ['Pl', 'PL'],
					ratio: '1000000000000'
				},
				{
					names: ['teraliter', 'teraliters', 'teralitre', 'teralitres'],
					symbols: ['Tl', 'TL'],
					ratio: '1000000000'
				},
				{
					names: ['gigaliter', 'gigaliters', 'gigalitre', 'gigalitres'],
					symbols: ['Gl', 'GL'],
					ratio: '1000000'
				},
				{
					names: ['megaliter', 'megaliters', 'megalitre', 'megalitres'],
					symbols: ['Ml', 'ML'],
					ratio: '1000'
				},
				{
					names: ['kiloliter', 'kiloliters', 'kilolitre', 'kilolitres'],
					symbols: ['kl', 'kL'],
					ratio: '1'
				},
				{
					names: ['hectoliter', 'hectoliters', 'hectolitre', 'hectolitres'],
					symbols: ['hl', 'hL'],
					ratio: '0.1'
				},
				{
					names: ['decaliter', 'decaliters', 'decalitre', 'decalitres'],
					symbols: ['dal', 'daL'],
					ratio: '0.01'
				},
				{
					names: ['deciliter', 'deciliters', 'decilitre', 'decilitres'],
					symbols: ['dl', 'dL'],
					ratio: '0.0001'
				},
				{
					names: ['centiliter', 'centiliters', 'centilitre', 'centilitres'],
					symbols: ['cl', 'cL'],
					ratio: '0.00001'
				},
				{
					names: ['milliliter', 'milliliters', 'millilitre', 'millilitres'],
					symbols: ['ml', 'mL'],
					ratio: '0.000001'
				},
				{
					names: ['microliter', 'microliters', 'microlitre', 'microlitres'],
					symbols: ['μl', 'µl', 'μL', 'µL'],
					ratio: '1e-9'
				},
				{
					names: ['nanoliter', 'nanoliters', 'nanolitre', 'nanolitres'],
					symbols: ['nl', 'nL'],
					ratio: '1e-12'
				},
				{
					names: ['picoliter', 'picoliters', 'picolitre', 'picolitres'],
					symbols: ['pl', 'pL'],
					ratio: '1e-15'
				},
				{
					names: ['femtoliter', 'femtoliters', 'femtolitre', 'femtolitres'],
					symbols: ['fl', 'fL'],
					ratio: '1e-18'
				},
				{
					names: ['cubic mile', 'cubic miles'],
					symbols: ['cu mi', 'mi3', 'mi³'],
					ratio: 4200
				},
				{
					names: ['acre-foot', 'acre-feet'],
					symbols: ['ac⋅ft', 'ac ft'],
					ratio: 1233.48183754752
				},
				{
					names: ['cubic yard', 'cubic yards'],
					symbols: ['cu yd', 'yd3', 'yd³'],
					ratio: 0.764554857984
				},
				{
					names: ['cubic foot', 'cubic feet'],
					symbols: ['cu ft', 'ft3', 'ft³'],
					ratio: 0.028316846592
				},
				{ names: ['board foot', 'board feet'], ratio: 0.002359737 },
				{
					names: ['cubic inch', 'cubic inches'],
					symbols: ['cu in', 'in3', 'in³'],
					ratio: 0.000016387064
				},
				{ names: ['measurement ton', 'measurement tons'], symbols: ['MTON'], ratio: 1.133 },
				{
					names: ['imperial barrel', 'imperial barrels'],
					symbols: ['imp bbl'],
					ratio: 0.16
				},
				{
					names: ['imperial bushel', 'imperial bushels'],
					symbols: ['imp bsh', 'imp bu'],
					ratio: 0.03636872
				},
				{
					names: ['imperial peck', 'imperial pecks'],
					symbols: ['pk', 'imp pk'],
					ratio: 0.00909218
				},
				{
					names: ['imperial gallon', 'imperial gallons'],
					symbols: ['imp gal'],
					ratio: 0.00454609
				},
				{
					names: ['imperial quart', 'imperial quarts'],
					symbols: ['imp qt'],
					ratio: 0.0011365225
				},
				{
					names: ['imperial pint', 'imperial pints'],
					symbols: ['imp pt'],
					ratio: 0.00056826125
				},
				{
					names: ['imperial fluid ounce', 'imperial fluid ounces'],
					symbols: ['imp fl oz'],
					ratio: 0.0000284130625
				},
				{
					names: ['teaspoon', 'teaspoons', 'US teaspoon', 'US teaspoons'],
					symbols: ['tsp'],
					ratio: 0.00000492892159375
				},
				{
					names: ['tablespoon', 'tablespoons', 'US tablespoon', 'US tablespoons'],
					symbols: ['tbsp'],
					ratio: 0.00001478676478125
				},
				{
					names: ['US fluid ounce', 'US fluid ounces'],
					symbols: ['fl oz', 'fl. oz.', 'oz. fl.'],
					ratio: 0.0000295735295625
				},
				{ names: ['cup', 'cups'], symbols: ['c'], ratio: 0.0002365882365 },
				{ names: ['US legal cup', 'US legal cups'], symbols: ['US lc'], ratio: 0.00024 },
				{
					names: ['pint', 'pints', 'US liquid pint', 'US liquid pints'],
					symbols: ['pt', 'p'],
					ratio: 0.000473176473
				},
				{
					names: ['quart', 'quarts', 'US liquid quart', 'US liquid quarts'],
					symbols: ['qt'],
					ratio: 0.000946352946
				},
				{
					names: ['gallon', 'gallons', 'US liquid gallon', 'US liquid gallons'],
					symbols: ['gal'],
					ratio: 0.003785411784
				},
				{
					names: ['US bushel', 'US bushels'],
					symbols: ['US bsh', 'US bu'],
					ratio: 0.03523907016688
				},
				{ names: ['US peck'], symbols: ['US pk'], ratio: 0.00880976754172 },
				{ names: ['US dry gallon'], symbols: ['US dry gal'], ratio: 0.00440488377086 },
				{
					names: ['US dry barrel', 'US dry barrels'],
					symbols: ['US dry bbl'],
					ratio: 0.1156
				},
				{ names: ['US dry quart'], symbols: ['US dry qt'], ratio: 0.001101220942715 },
				{ names: ['US dry pint'], symbols: ['US dry pt'], ratio: 0.0005506104713575 }
			]
		}
	]);
}

// Make sure that we have all available units, otherwise the library was updated and we need to update the list as well
// This only detects new MeasureKinds though, so not that useful, but better than nothing

if (Object.keys(MeasureKind).length / 2 !== ALL_UNITS().length) {
	throw new Error(
		`The number of MeasureKinds (${Object.keys(MeasureKind).length / 2}) does not match the number of unit lists (${ALL_UNITS().length}). Please update the units list.`
	);
}
