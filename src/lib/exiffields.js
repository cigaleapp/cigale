export const EXIF_REGULAR_FIELDS = /** @type {const} */ ({
	InteropIndex: 0x0001,
	InteropVersion: 0x0002,
	ProcessingSoftware: 0x000b,
	SubfileType: 0x00fe,
	OldSubfileType: 0x00ff,
	ImageWidth: 0x0100,
	ImageHeight: 0x0101,
	BitsPerSample: 0x0102,
	Compression: 0x0103,
	PhotometricInterpretation: 0x0106,
	Thresholding: 0x0107,
	CellWidth: 0x0108,
	CellLength: 0x0109,
	FillOrder: 0x010a,
	DocumentName: 0x010d,
	ImageDescription: 0x010e,
	Make: 0x010f,
	Model: 0x0110,
	StripOffsets: 0x0111,
	Orientation: 0x0112,
	SamplesPerPixel: 0x0115,
	RowsPerStrip: 0x0116,
	StripByteCounts: 0x0117,
	MinSampleValue: 0x0118,
	MaxSampleValue: 0x0119,
	XResolution: 0x011a,
	YResolution: 0x011b,
	PlanarConfiguration: 0x011c,
	PageName: 0x011d,
	XPosition: 0x011e,
	YPosition: 0x011f,
	FreeOffsets: 0x0120,
	FreeByteCounts: 0x0121,
	GrayResponseUnit: 0x0122,
	GrayResponseCurve: 0x0123,
	T4Options: 0x0124,
	T6Options: 0x0125,
	ResolutionUnit: 0x0128,
	PageNumber: 0x0129,
	ColorResponseUnit: 0x012c,
	TransferFunction: 0x012d,
	Software: 0x0131,
	ModifyDate: 0x0132,
	Artist: 0x013b,
	HostComputer: 0x013c,
	Predictor: 0x013d,
	WhitePoint: 0x013e,
	PrimaryChromaticities: 0x013f,
	ColorMap: 0x0140,
	HalftoneHints: 0x0141,
	TileWidth: 0x0142,
	TileLength: 0x0143,
	TileOffsets: 0x0144,
	TileByteCounts: 0x0145,
	BadFaxLines: 0x0146,
	CleanFaxData: 0x0147,
	ConsecutiveBadFaxLines: 0x0148,
	SubIFD: 0x014a,
	InkSet: 0x014c,
	InkNames: 0x014d,
	NumberofInks: 0x014e,
	DotRange: 0x0150,
	TargetPrinter: 0x0151,
	ExtraSamples: 0x0152,
	SampleFormat: 0x0153,
	SMinSampleValue: 0x0154,
	SMaxSampleValue: 0x0155,
	TransferRange: 0x0156,
	ClipPath: 0x0157,
	XClipPathUnits: 0x0158,
	YClipPathUnits: 0x0159,
	Indexed: 0x015a,
	JPEGTables: 0x015b,
	OPIProxy: 0x015f,
	GlobalParametersIFD: 0x0190,
	ProfileType: 0x0191,
	FaxProfile: 0x0192,
	CodingMethods: 0x0193,
	VersionYear: 0x0194,
	ModeNumber: 0x0195,
	Decode: 0x01b1,
	DefaultImageColor: 0x01b2,
	T82Options: 0x01b3,
	// JPEGTables: 0x01b5,
	JPEGProc: 0x0200,
	ThumbnailOffset: 0x0201,
	ThumbnailLength: 0x0202,
	JPEGRestartInterval: 0x0203,
	JPEGLosslessPredictors: 0x0205,
	JPEGPointTransforms: 0x0206,
	JPEGQTables: 0x0207,
	JPEGDCTables: 0x0208,
	JPEGACTables: 0x0209,
	YCbCrCoefficients: 0x0211,
	YCbCrSubSampling: 0x0212,
	YCbCrPositioning: 0x0213,
	ReferenceBlackWhite: 0x0214,
	StripRowCounts: 0x022f,
	ApplicationNotes: 0x02bc,
	USPTOMiscellaneous: 0x03e7,
	RelatedImageFileFormat: 0x1000,
	RelatedImageWidth: 0x1001,
	RelatedImageHeight: 0x1002,
	Rating: 0x4746,
	XP_DIP_XML: 0x4747,
	StitchInfo: 0x4748,
	RatingPercent: 0x4749,
	ImageID: 0x800d,
	WangTag1: 0x80a3,
	WangAnnotation: 0x80a4,
	WangTag3: 0x80a5,
	WangTag4: 0x80a6,
	Matteing: 0x80e3,
	DataType: 0x80e4,
	ImageDepth: 0x80e5,
	TileDepth: 0x80e6,
	Model2: 0x827d,
	CFARepeatPatternDim: 0x828d,
	CFAPattern2: 0x828e,
	BatteryLevel: 0x828f,
	KodakIFD: 0x8290,
	Copyright: 0x8298,
	ExposureTime: 0x829a,
	FNumber: 0x829d,
	MDFileTag: 0x82a5,
	MDScalePixel: 0x82a6,
	MDColorTable: 0x82a7,
	MDLabName: 0x82a8,
	MDSampleInfo: 0x82a9,
	MDPrepDate: 0x82aa,
	MDPrepTime: 0x82ab,
	MDFileUnits: 0x82ac,
	PixelScale: 0x830e,
	AdventScale: 0x8335,
	AdventRevision: 0x8336,
	UIC1Tag: 0x835c,
	UIC2Tag: 0x835d,
	UIC3Tag: 0x835e,
	UIC4Tag: 0x835f,
	'IPTC-NAA': 0x83bb,
	IntergraphPacketData: 0x847e,
	IntergraphFlagRegisters: 0x847f,
	IntergraphMatrix: 0x8480,
	INGRReserved: 0x8481,
	ModelTiePoint: 0x8482,
	Site: 0x84e0,
	ColorSequence: 0x84e1,
	IT8Header: 0x84e2,
	RasterPadding: 0x84e3,
	BitsPerRunLength: 0x84e4,
	BitsPerExtendedRunLength: 0x84e5,
	ColorTable: 0x84e6,
	ImageColorIndicator: 0x84e7,
	BackgroundColorIndicator: 0x84e8,
	ImageColorValue: 0x84e9,
	BackgroundColorValue: 0x84ea,
	PixelIntensityRange: 0x84eb,
	TransparencyIndicator: 0x84ec,
	ColorCharacterization: 0x84ed,
	HCUsage: 0x84ee,
	TrapIndicator: 0x84ef,
	CMYKEquivalent: 0x84f0,
	SEMInfo: 0x8546,
	AFCP_IPTC: 0x8568,
	PixelMagicJBIGOptions: 0x85b8,
	ModelTransform: 0x85d8,
	WB_GRGBLevels: 0x8602,
	LeafData: 0x8606,
	PhotoshopSettings: 0x8649,
	ExifOffset: 0x8769,
	ICC_Profile: 0x8773,
	TIFF_FXExtensions: 0x877f,
	MultiProfiles: 0x8780,
	SharedData: 0x8781,
	T88Options: 0x8782,
	ImageLayer: 0x87ac,
	GeoTiffDirectory: 0x87af,
	GeoTiffDoubleParams: 0x87b0,
	GeoTiffAsciiParams: 0x87b1,
	ExposureProgram: 0x8822,
	SpectralSensitivity: 0x8824,
	GPSInfo: 0x8825,
	ISO: 0x8827,
	'Opto-ElectricConvFactor': 0x8828,
	Interlace: 0x8829,
	TimeZoneOffset: 0x882a,
	SelfTimerMode: 0x882b,
	SensitivityType: 0x8830,
	StandardOutputSensitivity: 0x8831,
	RecommendedExposureIndex: 0x8832,
	ISOSpeed: 0x8833,
	ISOSpeedLatitudeyyy: 0x8834,
	ISOSpeedLatitudezzz: 0x8835,
	FaxRecvParams: 0x885c,
	FaxSubAddress: 0x885d,
	FaxRecvTime: 0x885e,
	LeafSubIFD: 0x888a,
	ExifVersion: 0x9000,
	DateTimeOriginal: 0x9003,
	CreateDate: 0x9004,
	ComponentsConfiguration: 0x9101,
	CompressedBitsPerPixel: 0x9102,
	ShutterSpeedValue: 0x9201,
	ApertureValue: 0x9202,
	BrightnessValue: 0x9203,
	ExposureCompensation: 0x9204,
	MaxApertureValue: 0x9205,
	SubjectDistance: 0x9206,
	MeteringMode: 0x9207,
	LightSource: 0x9208,
	Flash: 0x9209,
	FocalLength: 0x920a,
	FlashEnergy: 0x920b,
	SpatialFrequencyResponse: 0x920c,
	Noise: 0x920d,
	FocalPlaneXResolution: 0x920e,
	FocalPlaneYResolution: 0x920f,
	FocalPlaneResolutionUnit: 0x9210,
	ImageNumber: 0x9211,
	SecurityClassification: 0x9212,
	ImageHistory: 0x9213,
	SubjectArea: 0x9214,
	ExposureIndex: 0x9215,
	'TIFF-EPStandardID': 0x9216,
	SensingMethod: 0x9217,
	CIP3DataFile: 0x923a,
	CIP3Sheet: 0x923b,
	CIP3Side: 0x923c,
	StoNits: 0x923f,
	MakerNote: 0x927c,
	UserComment: 0x9286,
	SubSecTime: 0x9290,
	SubSecTimeOriginal: 0x9291,
	SubSecTimeDigitized: 0x9292,
	MSDocumentText: 0x932f,
	MSPropertySetStorage: 0x9330,
	MSDocumentTextPosition: 0x9331,
	ImageSourceData: 0x935c,
	XPTitle: 0x9c9b,
	XPComment: 0x9c9c,
	XPAuthor: 0x9c9d,
	XPKeywords: 0x9c9e,
	XPSubject: 0x9c9f,
	FlashpixVersion: 0xa000,
	ColorSpace: 0xa001,
	ExifImageWidth: 0xa002,
	ExifImageHeight: 0xa003,
	RelatedSoundFile: 0xa004,
	InteropOffset: 0xa005,
	// FlashEnergy: 0xa20b,
	// SpatialFrequencyResponse: 0xa20c,
	// Noise: 0xa20d,
	// FocalPlaneXResolution: 0xa20e,
	// FocalPlaneYResolution: 0xa20f,
	// FocalPlaneResolutionUnit: 0xa210,
	// ImageNumber: 0xa211,
	// SecurityClassification: 0xa212,
	// ImageHistory: 0xa213,
	SubjectLocation: 0xa214,
	// ExposureIndex: 0xa215,
	// 'TIFF-EPStandardID': 0xa216,
	// SensingMethod: 0xa217,
	FileSource: 0xa300,
	SceneType: 0xa301,
	CFAPattern: 0xa302,
	CustomRendered: 0xa401,
	ExposureMode: 0xa402,
	WhiteBalance: 0xa403,
	DigitalZoomRatio: 0xa404,
	FocalLengthIn35mmFormat: 0xa405,
	SceneCaptureType: 0xa406,
	GainControl: 0xa407,
	Contrast: 0xa408,
	Saturation: 0xa409,
	Sharpness: 0xa40a,
	DeviceSettingDescription: 0xa40b,
	SubjectDistanceRange: 0xa40c,
	ImageUniqueID: 0xa420,
	OwnerName: 0xa430,
	SerialNumber: 0xa431,
	LensInfo: 0xa432,
	LensMake: 0xa433,
	LensModel: 0xa434,
	LensSerialNumber: 0xa435,
	GDALMetadata: 0xa480,
	GDALNoData: 0xa481,
	Gamma: 0xa500,
	ExpandSoftware: 0xafc0,
	ExpandLens: 0xafc1,
	ExpandFilm: 0xafc2,
	ExpandFilterLens: 0xafc3,
	ExpandScanner: 0xafc4,
	ExpandFlashLamp: 0xafc5,
	PixelFormat: 0xbc01,
	Transformation: 0xbc02,
	Uncompressed: 0xbc03,
	ImageType: 0xbc04,
	// ImageWidth: 0xbc80,
	// ImageHeight: 0xbc81,
	WidthResolution: 0xbc82,
	HeightResolution: 0xbc83,
	ImageOffset: 0xbcc0,
	ImageByteCount: 0xbcc1,
	AlphaOffset: 0xbcc2,
	AlphaByteCount: 0xbcc3,
	ImageDataDiscard: 0xbcc4,
	AlphaDataDiscard: 0xbcc5,
	OceScanjobDesc: 0xc427,
	OceApplicationSelector: 0xc428,
	OceIDNumber: 0xc429,
	OceImageLogic: 0xc42a,
	Annotations: 0xc44f,
	PrintIM: 0xc4a5,
	USPTOOriginalContentType: 0xc580,
	DNGVersion: 0xc612,
	DNGBackwardVersion: 0xc613,
	UniqueCameraModel: 0xc614,
	LocalizedCameraModel: 0xc615,
	CFAPlaneColor: 0xc616,
	CFALayout: 0xc617,
	LinearizationTable: 0xc618,
	BlackLevelRepeatDim: 0xc619,
	BlackLevel: 0xc61a,
	BlackLevelDeltaH: 0xc61b,
	BlackLevelDeltaV: 0xc61c,
	WhiteLevel: 0xc61d,
	DefaultScale: 0xc61e,
	DefaultCropOrigin: 0xc61f,
	DefaultCropSize: 0xc620,
	ColorMatrix1: 0xc621,
	ColorMatrix2: 0xc622,
	CameraCalibration1: 0xc623,
	CameraCalibration2: 0xc624,
	ReductionMatrix1: 0xc625,
	ReductionMatrix2: 0xc626,
	AnalogBalance: 0xc627,
	AsShotNeutral: 0xc628,
	AsShotWhiteXY: 0xc629,
	BaselineExposure: 0xc62a,
	BaselineNoise: 0xc62b,
	BaselineSharpness: 0xc62c,
	BayerGreenSplit: 0xc62d,
	LinearResponseLimit: 0xc62e,
	CameraSerialNumber: 0xc62f,
	DNGLensInfo: 0xc630,
	ChromaBlurRadius: 0xc631,
	AntiAliasStrength: 0xc632,
	ShadowScale: 0xc633,
	DNGPrivateData: 0xc634,
	MakerNoteSafety: 0xc635,
	RawImageSegmentation: 0xc640,
	CalibrationIlluminant1: 0xc65a,
	CalibrationIlluminant2: 0xc65b,
	BestQualityScale: 0xc65c,
	RawDataUniqueID: 0xc65d,
	AliasLayerMetadata: 0xc660,
	OriginalRawFileName: 0xc68b,
	OriginalRawFileData: 0xc68c,
	ActiveArea: 0xc68d,
	MaskedAreas: 0xc68e,
	AsShotICCProfile: 0xc68f,
	AsShotPreProfileMatrix: 0xc690,
	CurrentICCProfile: 0xc691,
	CurrentPreProfileMatrix: 0xc692,
	ColorimetricReference: 0xc6bf,
	PanasonicTitle: 0xc6d2,
	PanasonicTitle2: 0xc6d3,
	CameraCalibrationSig: 0xc6f3,
	ProfileCalibrationSig: 0xc6f4,
	ProfileIFD: 0xc6f5,
	AsShotProfileName: 0xc6f6,
	NoiseReductionApplied: 0xc6f7,
	ProfileName: 0xc6f8,
	ProfileHueSatMapDims: 0xc6f9,
	ProfileHueSatMapData1: 0xc6fa,
	ProfileHueSatMapData2: 0xc6fb,
	ProfileToneCurve: 0xc6fc,
	ProfileEmbedPolicy: 0xc6fd,
	ProfileCopyright: 0xc6fe,
	ForwardMatrix1: 0xc714,
	ForwardMatrix2: 0xc715,
	PreviewApplicationName: 0xc716,
	PreviewApplicationVersion: 0xc717,
	PreviewSettingsName: 0xc718,
	PreviewSettingsDigest: 0xc719,
	PreviewColorSpace: 0xc71a,
	PreviewDateTime: 0xc71b,
	RawImageDigest: 0xc71c,
	OriginalRawFileDigest: 0xc71d,
	SubTileBlockSize: 0xc71e,
	RowInterleaveFactor: 0xc71f,
	ProfileLookTableDims: 0xc725,
	ProfileLookTableData: 0xc726,
	OpcodeList1: 0xc740,
	OpcodeList2: 0xc741,
	OpcodeList3: 0xc74e,
	NoiseProfile: 0xc761,
	TimeCodes: 0xc763,
	FrameRate: 0xc764,
	TStop: 0xc772,
	ReelName: 0xc789,
	OriginalDefaultFinalSize: 0xc791,
	OriginalBestQualitySize: 0xc792,
	OriginalDefaultCropSize: 0xc793,
	CameraLabel: 0xc7a1,
	ProfileHueSatMapEncoding: 0xc7a3,
	ProfileLookTableEncoding: 0xc7a4,
	BaselineExposureOffset: 0xc7a5,
	DefaultBlackRender: 0xc7a6,
	NewRawImageDigest: 0xc7a7,
	RawToPreviewGain: 0xc7a8,
	DefaultUserCrop: 0xc7b5,
	Padding: 0xea1c,
	OffsetSchema: 0xea1d,
	//  'OwnerName': 0xfde8,
	//  'SerialNumber': 0xfde9,
	Lens: 0xfdea,
	KDC_IFD: 0xfe00,
	RawFile: 0xfe4c,
	Converter: 0xfe4d,
	//  'WhiteBalance': 0xfe4e,
	Exposure: 0xfe51,
	Shadows: 0xfe52,
	Brightness: 0xfe53,
	//  'Contrast': 0xfe54,
	//  'Saturation': 0xfe55,
	//  'Sharpness': 0xfe56,
	Smoothness: 0xfe57,
	MoireFilter: 0xfe58
	// gps
});

export const EXIF_GPS_FIELDS = /** @type {const} */ ({
	GPSVersionID: 0x0000,
	GPSLatitudeRef: 0x0001,
	GPSLatitude: 0x0002,
	GPSLongitudeRef: 0x0003,
	GPSLongitude: 0x0004,
	GPSAltitudeRef: 0x0005,
	GPSAltitude: 0x0006,
	GPSTimeStamp: 0x0007,
	GPSSatellites: 0x0008,
	GPSStatus: 0x0009,
	GPSMeasureMode: 0x000a,
	GPSDOP: 0x000b,
	GPSSpeedRef: 0x000c,
	GPSSpeed: 0x000d,
	GPSTrackRef: 0x000e,
	GPSTrack: 0x000f,
	GPSImgDirectionRef: 0x0010,
	GPSImgDirection: 0x0011,
	GPSMapDatum: 0x0012,
	GPSDestLatitudeRef: 0x0013,
	GPSDestLatitude: 0x0014,
	GPSDestLongitudeRef: 0x0015,
	GPSDestLongitude: 0x0016,
	GPSDestBearingRef: 0x0017,
	GPSDestBearing: 0x0018,
	GPSDestDistanceRef: 0x0019,
	GPSDestDistance: 0x001a,
	GPSProcessingMethod: 0x001b,
	GPSAreaInformation: 0x001c,
	GPSDateStamp: 0x001d,
	GPSDifferential: 0x001e,
	GPSHPositioningError: 0x001f
});

/**
 * From https://github.com/bwindels/exif-parser/blob/master/lib/exif-tags.js
 */
export const EXIF_FIELDS = /** @type {const} */ ({
	...EXIF_REGULAR_FIELDS,
	...EXIF_GPS_FIELDS
});
