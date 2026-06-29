/**
 * These are the Exif tags as defined in the Exif 2.3 standard.
 * IFD1 tags are not listed separately. All IFD0 tags may also be present in IFD1, according to the standard. The second part of the Exiv2 key of an IFD1 tag is Thumbnail (instead of Image), the other two parts of the key are the same as for IFD0 tags.
 * @see https://exiv2.org/tags.html
 * @see https://www.cipa.jp/std/documents/e/DC-008-2012_E.pdf
 */
export const FIELDS = [
	{
		tag: 0x000b,
		ifd: 'Image',
		key: 'ProcessingSoftware',
		datatype: 'Ascii',
		description: 'The name and version of the software used to post-process the picture.',
	},
	{
		tag: 0x00fe,
		ifd: 'Image',
		key: 'NewSubfileType',
		datatype: 'Long',
		description: 'A general indication of the kind of data contained in this subfile.',
	},
	{
		tag: 0x00ff,
		ifd: 'Image',
		key: 'SubfileType',
		datatype: 'Short',
		description:
			'A general indication of the kind of data contained in this subfile. This field is deprecated. The NewSubfileType field should be used instead.',
	},
	{
		tag: 0x0100,
		ifd: 'Image',
		key: 'ImageWidth',
		datatype: 'Long',
		description:
			'The number of columns of image data, equal to the number of pixels per row. In JPEG compressed data a JPEG marker is used instead of this tag.',
	},
	{
		tag: 0x0101,
		ifd: 'Image',
		key: 'ImageLength',
		datatype: 'Long',
		description:
			'The number of rows of image data. In JPEG compressed data a JPEG marker is used instead of this tag.',
	},
	{
		tag: 0x0102,
		ifd: 'Image',
		key: 'BitsPerSample',
		datatype: 'Short',
		description:
			'The number of bits per image component. In this standard each component of the image is 8 bits, so the value for this tag is 8. See also <SamplesPerPixel>. In JPEG compressed data a JPEG marker is used instead of this tag.',
	},
	{
		tag: 0x0103,
		ifd: 'Image',
		key: 'Compression',
		datatype: 'Short',
		description:
			'The compression scheme used for the image data. When a primary image is JPEG compressed, this designation is not necessary and is omitted. When thumbnails use JPEG compression, this tag value is set to 6.',
	},
	{
		tag: 0x0106,
		ifd: 'Image',
		key: 'PhotometricInterpretation',
		datatype: 'Short',
		description:
			'The pixel composition. In JPEG compressed data a JPEG marker is used instead of this tag.',
	},
	{
		tag: 0x0107,
		ifd: 'Image',
		key: 'Thresholding',
		datatype: 'Short',
		description:
			'For black and white TIFF files that represent shades of gray, the technique used to convert from gray to black and white pixels.',
	},
	{
		tag: 0x0108,
		ifd: 'Image',
		key: 'CellWidth',
		datatype: 'Short',
		description:
			'The width of the dithering or halftoning matrix used to create a dithered or halftoned bilevel file.',
	},
	{
		tag: 0x0109,
		ifd: 'Image',
		key: 'CellLength',
		datatype: 'Short',
		description:
			'The length of the dithering or halftoning matrix used to create a dithered or halftoned bilevel file.',
	},
	{
		tag: 0x010a,
		ifd: 'Image',
		key: 'FillOrder',
		datatype: 'Short',
		description: 'The logical order of bits within a byte',
	},
	{
		tag: 0x010d,
		ifd: 'Image',
		key: 'DocumentName',
		datatype: 'Ascii',
		description: 'The name of the document from which this image was scanned.',
	},
	{
		tag: 0x010e,
		ifd: 'Image',
		key: 'ImageDescription',
		datatype: 'Ascii',
		description:
			'A character string giving the title of the image. It may be a comment such as "1988 company picnic" or the like. Two-bytes character codes cannot be used. When a 2-bytes code is necessary, the Exif Private tag <UserComment> is to be used.',
	},
	{
		tag: 0x010f,
		ifd: 'Image',
		key: 'Make',
		datatype: 'Ascii',
		description:
			'The manufacturer of the recording equipment. This is the manufacturer of the DSC, scanner, video digitizer or other equipment that generated the image. When the field is left blank, it is treated as unknown.',
	},
	{
		tag: 0x0110,
		ifd: 'Image',
		key: 'Model',
		datatype: 'Ascii',
		description:
			'The model name or model number of the equipment. This is the model name or number of the DSC, scanner, video digitizer or other equipment that generated the image. When the field is left blank, it is treated as unknown.',
	},
	{
		tag: 0x0111,
		ifd: 'Image',
		key: 'StripOffsets',
		datatype: 'Long',
		description:
			'For each strip, the byte offset of that strip. It is recommended that this be selected so the number of strip bytes does not exceed 64 Kbytes. With JPEG compressed data this designation is not needed and is omitted. See also <RowsPerStrip> and <StripByteCounts>.',
	},
	{
		tag: 0x0112,
		ifd: 'Image',
		key: 'Orientation',
		datatype: 'Short',
		description: 'The image orientation viewed in terms of rows and columns.',
	},
	{
		tag: 0x0115,
		ifd: 'Image',
		key: 'SamplesPerPixel',
		datatype: 'Short',
		description:
			'The number of components per pixel. Since this standard applies to RGB and YCbCr images, the value set for this tag is 3. In JPEG compressed data a JPEG marker is used instead of this tag.',
	},
	{
		tag: 0x0116,
		ifd: 'Image',
		key: 'RowsPerStrip',
		datatype: 'Long',
		description:
			'The number of rows per strip. This is the number of rows in the image of one strip when an image is divided into strips. With JPEG compressed data this designation is not needed and is omitted. See also <StripOffsets> and <StripByteCounts>.',
	},
	{
		tag: 0x0117,
		ifd: 'Image',
		key: 'StripByteCounts',
		datatype: 'Long',
		description:
			'The total number of bytes in each strip. With JPEG compressed data this designation is not needed and is omitted.',
	},
	{
		tag: 0x011a,
		ifd: 'Image',
		key: 'XResolution',
		datatype: 'Rational',
		description:
			'The number of pixels per <ResolutionUnit> in the <ImageWidth> direction. When the image resolution is unknown, 72 [dpi] is designated.',
	},
	{
		tag: 0x011b,
		ifd: 'Image',
		key: 'YResolution',
		datatype: 'Rational',
		description:
			'The number of pixels per <ResolutionUnit> in the <ImageLength> direction. The same value as <XResolution> is designated.',
	},
	{
		tag: 0x011c,
		ifd: 'Image',
		key: 'PlanarConfiguration',
		datatype: 'Short',
		description:
			'Indicates whether pixel components are recorded in a chunky or planar format. In JPEG compressed files a JPEG marker is used instead of this tag. If this field does not exist, the TIFF default of 1 (chunky) is assumed.',
	},
	{
		tag: 0x011d,
		ifd: 'Image',
		key: 'PageName',
		datatype: 'Ascii',
		description: 'The name of the page from which this image was scanned.',
	},
	{
		tag: 0x011e,
		ifd: 'Image',
		key: 'XPosition',
		datatype: 'Rational',
		description:
			'X position of the image. The X offset in ResolutionUnits of the left side of the image, with respect to the left side of the page.',
	},
	{
		tag: 0x011f,
		ifd: 'Image',
		key: 'YPosition',
		datatype: 'Rational',
		description:
			'Y position of the image. The Y offset in ResolutionUnits of the top of the image, with respect to the top of the page. In the TIFF coordinate scheme, the positive Y direction is down, so that YPosition is always positive.',
	},
	{
		tag: 0x0122,
		ifd: 'Image',
		key: 'GrayResponseUnit',
		datatype: 'Short',
		description: 'The precision of the information contained in the GrayResponseCurve.',
	},
	{
		tag: 0x0123,
		ifd: 'Image',
		key: 'GrayResponseCurve',
		datatype: 'Short',
		description: 'For grayscale data, the optical density of each possible pixel value.',
	},
	{
		tag: 0x0124,
		ifd: 'Image',
		key: 'T4Options',
		datatype: 'Long',
		description: 'T.4-encoding options.',
	},
	{
		tag: 0x0125,
		ifd: 'Image',
		key: 'T6Options',
		datatype: 'Long',
		description: 'T.6-encoding options.',
	},
	{
		tag: 0x0128,
		ifd: 'Image',
		key: 'ResolutionUnit',
		datatype: 'Short',
		description:
			'The unit for measuring <XResolution> and <YResolution>. The same unit is used for both <XResolution> and <YResolution>. If the image resolution is unknown, 2 (inches) is designated.',
	},
	{
		tag: 0x0129,
		ifd: 'Image',
		key: 'PageNumber',
		datatype: 'Short',
		description: 'The page number of the page from which this image was scanned.',
	},
	{
		tag: 0x012d,
		ifd: 'Image',
		key: 'TransferFunction',
		datatype: 'Short',
		description:
			'A transfer function for the image, described in tabular style. Normally this tag is not necessary, since color space is specified in the color space information tag (<ColorSpace>).',
	},
	{
		tag: 0x0131,
		ifd: 'Image',
		key: 'Software',
		datatype: 'Ascii',
		description:
			'This tag records the name and version of the software or firmware of the camera or image input device used to generate the image. The detailed format is not specified, but it is recommended that the example shown below be followed. When the field is left blank, it is treated as unknown.',
	},
	{
		tag: 0x0132,
		ifd: 'Image',
		key: 'DateTime',
		datatype: 'Ascii',
		description:
			'The date and time of image creation. In Exif standard, it is the date and time the file was changed.',
	},
	{
		tag: 0x013b,
		ifd: 'Image',
		key: 'Artist',
		datatype: 'Ascii',
		description:
			'This tag records the name of the camera owner, photographer or image creator. The detailed format is not specified, but it is recommended that the information be written as in the example below for ease of Interoperability. When the field is left blank, it is treated as unknown. Ex.) "Camera owner, John Smith; Photographer, Michael Brown; Image creator, Ken James"',
	},
	{
		tag: 0x013c,
		ifd: 'Image',
		key: 'HostComputer',
		datatype: 'Ascii',
		description:
			'This tag records information about the host computer used to generate the image.',
	},
	{
		tag: 0x013d,
		ifd: 'Image',
		key: 'Predictor',
		datatype: 'Short',
		description:
			'A predictor is a mathematical operator that is applied to the image data before an encoding scheme is applied.',
	},
	{
		tag: 0x013e,
		ifd: 'Image',
		key: 'WhitePoint',
		datatype: 'Rational',
		description:
			'The chromaticity of the white point of the image. Normally this tag is not necessary, since color space is specified in the colorspace information tag (<ColorSpace>).',
	},
	{
		tag: 0x013f,
		ifd: 'Image',
		key: 'PrimaryChromaticities',
		datatype: 'Rational',
		description:
			'The chromaticity of the three primary colors of the image. Normally this tag is not necessary, since colorspace is specified in the colorspace information tag (<ColorSpace>).',
	},
	{
		tag: 0x0140,
		ifd: 'Image',
		key: 'ColorMap',
		datatype: 'Short',
		description:
			'A color map for palette color images. This field defines a Red-Green-Blue color map (often called a lookup table) for palette-color images. In a palette-color image, a pixel value is used to index into an RGB lookup table.',
	},
	{
		tag: 0x0141,
		ifd: 'Image',
		key: 'HalftoneHints',
		datatype: 'Short',
		description:
			'The purpose of the HalftoneHints field is to convey to the halftone function the range of gray levels within a colorimetrically-specified image that should retain tonal detail.',
	},
	{
		tag: 0x0142,
		ifd: 'Image',
		key: 'TileWidth',
		datatype: 'Long',
		description: 'The tile width in pixels. This is the number of columns in each tile.',
	},
	{
		tag: 0x0143,
		ifd: 'Image',
		key: 'TileLength',
		datatype: 'Long',
		description: 'The tile length (height) in pixels. This is the number of rows in each tile.',
	},
	{
		tag: 0x0144,
		ifd: 'Image',
		key: 'TileOffsets',
		datatype: 'Short',
		description:
			'For each tile, the byte offset of that tile, as compressed and stored on disk. The offset is specified with respect to the beginning of the TIFF file. Note that this implies that each tile has a location independent of the locations of other tiles.',
	},
	{
		tag: 0x0145,
		ifd: 'Image',
		key: 'TileByteCounts',
		datatype: 'Long',
		description:
			'For each tile, the number of (compressed) bytes in that tile. See TileOffsets for a description of how the byte counts are ordered.',
	},
	{
		tag: 0x014a,
		ifd: 'Image',
		key: 'SubIFDs',
		datatype: 'Long',
		description: 'Defined by Adobe Corporation to enable TIFF Trees within a TIFF file.',
	},
	{
		tag: 0x014c,
		ifd: 'Image',
		key: 'InkSet',
		datatype: 'Short',
		description: 'The set of inks used in a separated (PhotometricInterpretation=5) image.',
	},
	{
		tag: 0x014d,
		ifd: 'Image',
		key: 'InkNames',
		datatype: 'Ascii',
		description:
			'The name of each ink used in a separated (PhotometricInterpretation=5) image.',
	},
	{
		tag: 0x014e,
		ifd: 'Image',
		key: 'NumberOfInks',
		datatype: 'Short',
		description:
			'The number of inks. Usually equal to SamplesPerPixel, unless there are extra samples.',
	},
	{
		tag: 0x0150,
		ifd: 'Image',
		key: 'DotRange',
		datatype: 'Byte',
		description: 'The component values that correspond to a 0% dot and 100% dot.',
	},
	{
		tag: 0x0151,
		ifd: 'Image',
		key: 'TargetPrinter',
		datatype: 'Ascii',
		description:
			'A description of the printing environment for which this separation is intended.',
	},
	{
		tag: 0x0152,
		ifd: 'Image',
		key: 'ExtraSamples',
		datatype: 'Short',
		description:
			'Specifies that each pixel has m extra components whose interpretation is defined by one of the values listed below.',
	},
	{
		tag: 0x0153,
		ifd: 'Image',
		key: 'SampleFormat',
		datatype: 'Short',
		description: 'This field specifies how to interpret each data sample in a pixel.',
	},
	{
		tag: 0x0154,
		ifd: 'Image',
		key: 'SMinSampleValue',
		datatype: 'Short',
		description: 'This field specifies the minimum sample value.',
	},
	{
		tag: 0x0155,
		ifd: 'Image',
		key: 'SMaxSampleValue',
		datatype: 'Short',
		description: 'This field specifies the maximum sample value.',
	},
	{
		tag: 0x0156,
		ifd: 'Image',
		key: 'TransferRange',
		datatype: 'Short',
		description: 'Expands the range of the TransferFunction',
	},
	{
		tag: 0x0157,
		ifd: 'Image',
		key: 'ClipPath',
		datatype: 'Byte',
		description:
			"A TIFF ClipPath is intended to mirror the essentials of PostScript's path creation functionality.",
	},
	{
		tag: 0x0158,
		ifd: 'Image',
		key: 'XClipPathUnits',
		datatype: 'SShort',
		description:
			'The number of units that span the width of the image, in terms of integer ClipPath coordinates.',
	},
	{
		tag: 0x0159,
		ifd: 'Image',
		key: 'YClipPathUnits',
		datatype: 'SShort',
		description:
			'The number of units that span the height of the image, in terms of integer ClipPath coordinates.',
	},
	{
		tag: 0x015a,
		ifd: 'Image',
		key: 'Indexed',
		datatype: 'Short',
		description:
			'Indexed images are images where the "pixels" do not represent color values, but rather an index (usually 8-bit) into a separate color table, the ColorMap.',
	},
	{
		tag: 0x015b,
		ifd: 'Image',
		key: 'JPEGTables',
		datatype: 'Undefined',
		description:
			'This optional tag may be used to encode the JPEG quantization and Huffman tables for subsequent use by the JPEG decompression process.',
	},
	{
		tag: 0x015f,
		ifd: 'Image',
		key: 'OPIProxy',
		datatype: 'Short',
		description:
			'OPIProxy gives information concerning whether this image is a low-resolution proxy of a high-resolution image (Adobe OPI).',
	},
	{
		tag: 0x0200,
		ifd: 'Image',
		key: 'JPEGProc',
		datatype: 'Long',
		description: 'This field indicates the process used to produce the compressed data',
	},
	{
		tag: 0x0201,
		ifd: 'Image',
		key: 'JPEGInterchangeFormat',
		datatype: 'Long',
		description:
			'The offset to the start byte (SOI) of JPEG compressed thumbnail data. This is not used for primary image JPEG data.',
	},
	{
		tag: 0x0202,
		ifd: 'Image',
		key: 'JPEGInterchangeFormatLength',
		datatype: 'Long',
		description:
			'The number of bytes of JPEG compressed thumbnail data. This is not used for primary image JPEG data. JPEG thumbnails are not divided but are recorded as a continuous JPEG bitstream from SOI to EOI. Appn and COM markers should not be recorded. Compressed thumbnails must be recorded in no more than 64 Kbytes, including all other data to be recorded in APP1.',
	},
	{
		tag: 0x0203,
		ifd: 'Image',
		key: 'JPEGRestartInterval',
		datatype: 'Short',
		description:
			'This Field indicates the length of the restart interval used in the compressed image data.',
	},
	{
		tag: 0x0205,
		ifd: 'Image',
		key: 'JPEGLosslessPredictors',
		datatype: 'Short',
		description:
			'This Field points to a list of lossless predictor-selection values, one per component.',
	},
	{
		tag: 0x0206,
		ifd: 'Image',
		key: 'JPEGPointTransforms',
		datatype: 'Short',
		description: 'This Field points to a list of point transform values, one per component.',
	},
	{
		tag: 0x0207,
		ifd: 'Image',
		key: 'JPEGQTables',
		datatype: 'Long',
		description:
			'This Field points to a list of offsets to the quantization tables, one per component.',
	},
	{
		tag: 0x0208,
		ifd: 'Image',
		key: 'JPEGDCTables',
		datatype: 'Long',
		description:
			'This Field points to a list of offsets to the DC Huffman tables or the lossless Huffman tables, one per component.',
	},
	{
		tag: 0x0209,
		ifd: 'Image',
		key: 'JPEGACTables',
		datatype: 'Long',
		description:
			'This Field points to a list of offsets to the Huffman AC tables, one per component.',
	},
	{
		tag: 0x0211,
		ifd: 'Image',
		key: 'YCbCrCoefficients',
		datatype: 'Rational',
		description:
			'The matrix coefficients for transformation from RGB to YCbCr image data. No default is given in TIFF; but here the value given in Appendix E, "Color Space Guidelines", is used as the default. The color space is declared in a color space information tag, with the default being the value that gives the optimal image characteristics Interoperability this condition.',
	},
	{
		tag: 0x0212,
		ifd: 'Image',
		key: 'YCbCrSubSampling',
		datatype: 'Short',
		description:
			'The sampling ratio of chrominance components in relation to the luminance component. In JPEG compressed data a JPEG marker is used instead of this tag.',
	},
	{
		tag: 0x0213,
		ifd: 'Image',
		key: 'YCbCrPositioning',
		datatype: 'Short',
		description:
			'The position of chrominance components in relation to the luminance component. This field is designated only for JPEG compressed data or uncompressed YCbCr data. The TIFF default is 1 (centered); but when Y:Cb:Cr = 4:2:2 it is recommended in this standard that 2 (co-sited) be used to record data, in order to improve the image quality when viewed on TV systems. When this field does not exist, the reader shall assume the TIFF default. In the case of Y:Cb:Cr = 4:2:0, the TIFF default (centered) is recommended. If the reader does not have the capability of supporting both kinds of <YCbCrPositioning>, it shall follow the TIFF default regardless of the value in this field. It is preferable that readers be able to support both centered and co-sited positioning.',
	},
	{
		tag: 0x0214,
		ifd: 'Image',
		key: 'ReferenceBlackWhite',
		datatype: 'Rational',
		description:
			'The reference black point value and reference white point value. No defaults are given in TIFF, but the values below are given as defaults here. The color space is declared in a color space information tag, with the default being the value that gives the optimal image characteristics Interoperability these conditions.',
	},
	{
		tag: 0x02bc,
		ifd: 'Image',
		key: 'XMLPacket',
		datatype: 'Byte',
		description: 'XMP Metadata (Adobe technote 9-14-02)',
	},
	{
		tag: 0x4746,
		ifd: 'Image',
		key: 'Rating',
		datatype: 'Short',
		description: 'Rating tag used by Windows',
	},
	{
		tag: 0x4749,
		ifd: 'Image',
		key: 'RatingPercent',
		datatype: 'Short',
		description: 'Rating tag used by Windows, value in percent',
	},
	{
		tag: 0x7032,
		ifd: 'Image',
		key: 'VignettingCorrParams',
		datatype: 'SShort',
		description: 'Sony vignetting correction parameters',
	},
	{
		tag: 0x7035,
		ifd: 'Image',
		key: 'ChromaticAberrationCorrParams',
		datatype: 'SShort',
		description: 'Sony chromatic aberration correction parameters',
	},
	{
		tag: 0x7037,
		ifd: 'Image',
		key: 'DistortionCorrParams',
		datatype: 'SShort',
		description: 'Sony distortion correction parameters',
	},
	{
		tag: 0x800d,
		ifd: 'Image',
		key: 'ImageID',
		datatype: 'Ascii',
		description:
			'ImageID is the full pathname of the original, high-resolution image, or any other identifying string that uniquely identifies the original image (Adobe OPI).',
	},
	{
		tag: 0x828d,
		ifd: 'Image',
		key: 'CFARepeatPatternDim',
		datatype: 'Short',
		description:
			'Contains two values representing the minimum rows and columns to define the repeating patterns of the color filter array',
	},
	{
		tag: 0x828e,
		ifd: 'Image',
		key: 'CFAPattern',
		datatype: 'Byte',
		description:
			'Indicates the color filter array (CFA) geometric pattern of the image sensor when a one-chip color area sensor is used. It does not apply to all sensing methods',
	},
	{
		tag: 0x828f,
		ifd: 'Image',
		key: 'BatteryLevel',
		datatype: 'Rational',
		description: 'Contains a value of the battery level as a fraction or string',
	},
	{
		tag: 0x8298,
		ifd: 'Image',
		key: 'Copyright',
		datatype: 'Ascii',
		description:
			'Copyright information. In this standard the tag is used to indicate both the photographer and editor copyrights. It is the copyright notice of the person or organization claiming rights to the image. The Interoperability copyright statement including date and rights should be written in this field; e.g., "Copyright, John Smith, 19xx. All rights reserved.". In this standard the field records both the photographer and editor copyrights, with each recorded in a separate part of the statement. When there is a clear distinction between the photographer and editor copyrights, these are to be written in the order of photographer followed by editor copyright, separated by NULL (in this case since the statement also ends with a NULL, there are two NULL codes). When only the photographer copyright is given, it is terminated by one NULL code. When only the editor copyright is given, the photographer copyright part consists of one space followed by a terminating NULL code, then the editor copyright is given. When the field is left blank, it is treated as unknown.',
	},
	{
		tag: 0x829a,
		ifd: 'Image',
		key: 'ExposureTime',
		datatype: 'Rational',
		description: 'Exposure time, given in seconds.',
	},
	{
		tag: 0x829d,
		ifd: 'Image',
		key: 'FNumber',
		datatype: 'Rational',
		description: 'The F number.',
	},
	{
		tag: 0x83bb,
		ifd: 'Image',
		key: 'IPTCNAA',
		datatype: 'Long',
		description: 'Contains an IPTC/NAA record',
	},
	{
		tag: 0x8649,
		ifd: 'Image',
		key: 'ImageResources',
		datatype: 'Byte',
		description: 'Contains information embedded by the Adobe Photoshop application',
	},
	{
		tag: 0x8769,
		ifd: 'Image',
		key: 'ExifTag',
		datatype: 'Long',
		description:
			'A pointer to the Exif IFD. Interoperability, Exif IFD has the same structure as that of the IFD specified in TIFF. ordinarily, however, it does not contain image data as in the case of TIFF.',
	},
	{
		tag: 0x8773,
		ifd: 'Image',
		key: 'InterColorProfile',
		datatype: 'Undefined',
		description:
			'Contains an InterColor Consortium (ICC) format color space characterization/profile',
	},
	{
		tag: 0x8822,
		ifd: 'Image',
		key: 'ExposureProgram',
		datatype: 'Short',
		description:
			'The class of the program used by the camera to set exposure when the picture is taken.',
	},
	{
		tag: 0x8824,
		ifd: 'Image',
		key: 'SpectralSensitivity',
		datatype: 'Ascii',
		description: 'Indicates the spectral sensitivity of each channel of the camera used.',
	},
	{
		tag: 0x8825,
		ifd: 'Image',
		key: 'GPSTag',
		datatype: 'Long',
		description:
			'A pointer to the GPS Info IFD. The Interoperability structure of the GPS Info IFD, like that of Exif IFD, has no image data.',
	},
	{
		tag: 0x8827,
		ifd: 'Image',
		key: 'ISOSpeedRatings',
		datatype: 'Short',
		description:
			'Indicates the ISO Speed and ISO Latitude of the camera or input device as specified in ISO 12232.',
	},
	{
		tag: 0x8828,
		ifd: 'Image',
		key: 'OECF',
		datatype: 'Undefined',
		description:
			'Indicates the Opto-Electric Conversion Function (OECF) specified in ISO 14524.',
	},
	{
		tag: 0x8829,
		ifd: 'Image',
		key: 'Interlace',
		datatype: 'Short',
		description: 'Indicates the field number of multifield images.',
	},
	{
		tag: 0x882a,
		ifd: 'Image',
		key: 'TimeZoneOffset',
		datatype: 'SShort',
		description:
			'This optional tag encodes the time zone of the camera clock (relative to Greenwich Mean Time) used to create the DataTimeOriginal tag-value when the picture was taken. It may also contain the time zone offset of the clock used to create the DateTime tag-value when the image was modified.',
	},
	{
		tag: 0x882b,
		ifd: 'Image',
		key: 'SelfTimerMode',
		datatype: 'Short',
		description: 'Number of seconds image capture was delayed from button press.',
	},
	{
		tag: 0x9003,
		ifd: 'Image',
		key: 'DateTimeOriginal',
		datatype: 'Ascii',
		description: 'The date and time when the original image data was generated.',
	},
	{
		tag: 0x9102,
		ifd: 'Image',
		key: 'CompressedBitsPerPixel',
		datatype: 'Rational',
		description: 'Specific to compressed data; states the compressed bits per pixel.',
	},
	{
		tag: 0x9201,
		ifd: 'Image',
		key: 'ShutterSpeedValue',
		datatype: 'SRational',
		description: 'Shutter speed.',
	},
	{
		tag: 0x9202,
		ifd: 'Image',
		key: 'ApertureValue',
		datatype: 'Rational',
		description: 'The lens aperture.',
	},
	{
		tag: 0x9203,
		ifd: 'Image',
		key: 'BrightnessValue',
		datatype: 'SRational',
		description: 'The value of brightness.',
	},
	{
		tag: 0x9204,
		ifd: 'Image',
		key: 'ExposureBiasValue',
		datatype: 'SRational',
		description: 'The exposure bias.',
	},
	{
		tag: 0x9205,
		ifd: 'Image',
		key: 'MaxApertureValue',
		datatype: 'Rational',
		description: 'The smallest F number of the lens.',
	},
	{
		tag: 0x9206,
		ifd: 'Image',
		key: 'SubjectDistance',
		datatype: 'SRational',
		description: 'The distance to the subject, given in meters.',
	},
	{
		tag: 0x9207,
		ifd: 'Image',
		key: 'MeteringMode',
		datatype: 'Short',
		description: 'The metering mode.',
	},
	{
		tag: 0x9208,
		ifd: 'Image',
		key: 'LightSource',
		datatype: 'Short',
		description: 'The kind of light source.',
	},
	{
		tag: 0x9209,
		ifd: 'Image',
		key: 'Flash',
		datatype: 'Short',
		description: 'Indicates the status of flash when the image was shot.',
	},
	{
		tag: 0x920a,
		ifd: 'Image',
		key: 'FocalLength',
		datatype: 'Rational',
		description: 'The actual focal length of the lens, in mm.',
	},
	{
		tag: 0x920b,
		ifd: 'Image',
		key: 'FlashEnergy',
		datatype: 'Rational',
		description: 'Amount of flash energy (BCPS).',
	},
	{
		tag: 0x920c,
		ifd: 'Image',
		key: 'SpatialFrequencyResponse',
		datatype: 'Undefined',
		description: 'SFR of the camera.',
	},
	{
		tag: 0x920d,
		ifd: 'Image',
		key: 'Noise',
		datatype: 'Undefined',
		description: 'Noise measurement values.',
	},
	{
		tag: 0x920e,
		ifd: 'Image',
		key: 'FocalPlaneXResolution',
		datatype: 'Rational',
		description:
			'Number of pixels per FocalPlaneResolutionUnit (37392) in ImageWidth direction for main image.',
	},
	{
		tag: 0x920f,
		ifd: 'Image',
		key: 'FocalPlaneYResolution',
		datatype: 'Rational',
		description:
			'Number of pixels per FocalPlaneResolutionUnit (37392) in ImageLength direction for main image.',
	},
	{
		tag: 0x9210,
		ifd: 'Image',
		key: 'FocalPlaneResolutionUnit',
		datatype: 'Short',
		description:
			'Unit of measurement for FocalPlaneXResolution(37390) and FocalPlaneYResolution(37391).',
	},
	{
		tag: 0x9211,
		ifd: 'Image',
		key: 'ImageNumber',
		datatype: 'Long',
		description: 'Number assigned to an image, e.g., in a chained image burst.',
	},
	{
		tag: 0x9212,
		ifd: 'Image',
		key: 'SecurityClassification',
		datatype: 'Ascii',
		description: 'Security classification assigned to the image.',
	},
	{
		tag: 0x9213,
		ifd: 'Image',
		key: 'ImageHistory',
		datatype: 'Ascii',
		description: 'Record of what has been done to the image.',
	},
	{
		tag: 0x9214,
		ifd: 'Image',
		key: 'SubjectLocation',
		datatype: 'Short',
		description: 'Indicates the location and area of the main subject in the overall scene.',
	},
	{
		tag: 0x9215,
		ifd: 'Image',
		key: 'ExposureIndex',
		datatype: 'Rational',
		description: 'Encodes the camera exposure index setting when image was captured.',
	},
	{
		tag: 0x9216,
		ifd: 'Image',
		key: 'TIFFEPStandardID',
		datatype: 'Byte',
		description:
			'Contains four ASCII characters representing the TIFF/EP standard version of a TIFF/EP file, eg "1", "0", "0", "0"',
	},
	{
		tag: 0x9217,
		ifd: 'Image',
		key: 'SensingMethod',
		datatype: 'Short',
		description: 'Type of image sensor.',
	},
	{
		tag: 0x9c9b,
		ifd: 'Image',
		key: 'XPTitle',
		datatype: 'Byte',
		description: 'Title tag used by Windows, encoded in UCS2',
	},
	{
		tag: 0x9c9c,
		ifd: 'Image',
		key: 'XPComment',
		datatype: 'Byte',
		description: 'Comment tag used by Windows, encoded in UCS2',
	},
	{
		tag: 0x9c9d,
		ifd: 'Image',
		key: 'XPAuthor',
		datatype: 'Byte',
		description: 'Author tag used by Windows, encoded in UCS2',
	},
	{
		tag: 0x9c9e,
		ifd: 'Image',
		key: 'XPKeywords',
		datatype: 'Byte',
		description: 'Keywords tag used by Windows, encoded in UCS2',
	},
	{
		tag: 0x9c9f,
		ifd: 'Image',
		key: 'XPSubject',
		datatype: 'Byte',
		description: 'Subject tag used by Windows, encoded in UCS2',
	},
	{
		tag: 0xc4a5,
		ifd: 'Image',
		key: 'PrintImageMatching',
		datatype: 'Undefined',
		description: 'Print Image Matching, description needed.',
	},
	{
		tag: 0xc612,
		ifd: 'Image',
		key: 'DNGVersion',
		datatype: 'Byte',
		description:
			'This tag encodes the DNG four-tier version number. For files compliant with version 1.1.0.0 of the DNG specification, this tag should contain the bytes: 1, 1, 0, 0.',
	},
	{
		tag: 0xc613,
		ifd: 'Image',
		key: 'DNGBackwardVersion',
		datatype: 'Byte',
		description:
			'This tag specifies the oldest version of the Digital Negative specification for which a file is compatible. Readers shouldnot attempt to read a file if this tag specifies a version number that is higher than the version number of the specification the reader was based on. In addition to checking the version tags, readers should, for all tags, check the types, counts, and values, to verify it is able to correctly read the file.',
	},
	{
		tag: 0xc614,
		ifd: 'Image',
		key: 'UniqueCameraModel',
		datatype: 'Ascii',
		description:
			"Defines a unique, non-localized name for the camera model that created the image in the raw file. This name should include the manufacturer's name to avoid conflicts, and should not be localized, even if the camera name itself is localized for different markets (see LocalizedCameraModel). This string may be used by reader software to index into per-model preferences and replacement profiles.",
	},
	{
		tag: 0xc615,
		ifd: 'Image',
		key: 'LocalizedCameraModel',
		datatype: 'Byte',
		description:
			'Similar to the UniqueCameraModel field, except the name can be localized for different markets to match the localization of the camera name.',
	},
	{
		tag: 0xc616,
		ifd: 'Image',
		key: 'CFAPlaneColor',
		datatype: 'Byte',
		description:
			'Provides a mapping between the values in the CFAPattern tag and the plane numbers in LinearRaw space. This is a required tag for non-RGB CFA images.',
	},
	{
		tag: 0xc617,
		ifd: 'Image',
		key: 'CFALayout',
		datatype: 'Short',
		description: 'Describes the spatial layout of the CFA.',
	},
	{
		tag: 0xc618,
		ifd: 'Image',
		key: 'LinearizationTable',
		datatype: 'Short',
		description:
			'Describes a lookup table that maps stored values into linear values. This tag is typically used to increase compression ratios by storing the raw data in a non-linear, more visually uniform space with fewer total encoding levels. If SamplesPerPixel is not equal to one, this single table applies to all the samples for each pixel.',
	},
	{
		tag: 0xc619,
		ifd: 'Image',
		key: 'BlackLevelRepeatDim',
		datatype: 'Short',
		description: 'Specifies repeat pattern size for the BlackLevel tag.',
	},
	{
		tag: 0xc61a,
		ifd: 'Image',
		key: 'BlackLevel',
		datatype: 'Rational',
		description:
			'Specifies the zero light (a.k.a. thermal black or black current) encoding level, as a repeating pattern. The origin of this pattern is the top-left corner of the ActiveArea rectangle. The values are stored in row-column-sample scan order.',
	},
	{
		tag: 0xc61b,
		ifd: 'Image',
		key: 'BlackLevelDeltaH',
		datatype: 'SRational',
		description:
			'If the zero light encoding level is a function of the image column, BlackLevelDeltaH specifies the difference between the zero light encoding level for each column and the baseline zero light encoding level. If SamplesPerPixel is not equal to one, this single table applies to all the samples for each pixel.',
	},
	{
		tag: 0xc61c,
		ifd: 'Image',
		key: 'BlackLevelDeltaV',
		datatype: 'SRational',
		description:
			'If the zero light encoding level is a function of the image row, this tag specifies the difference between the zero light encoding level for each row and the baseline zero light encoding level. If SamplesPerPixel is not equal to one, this single table applies to all the samples for each pixel.',
	},
	{
		tag: 0xc61d,
		ifd: 'Image',
		key: 'WhiteLevel',
		datatype: 'Long',
		description:
			"This tag specifies the fully saturated encoding level for the raw sample values. Saturation is caused either by the sensor itself becoming highly non-linear in response, or by the camera's analog to digital converter clipping.",
	},
	{
		tag: 0xc61e,
		ifd: 'Image',
		key: 'DefaultScale',
		datatype: 'Rational',
		description:
			'DefaultScale is required for cameras with non-square pixels. It specifies the default scale factors for each direction to convert the image to square pixels. Typically these factors are selected to approximately preserve total pixel count. For CFA images that use CFALayout equal to 2, 3, 4, or 5, such as the Fujifilm SuperCCD, these two values should usually differ by a factor of 2.0.',
	},
	{
		tag: 0xc61f,
		ifd: 'Image',
		key: 'DefaultCropOrigin',
		datatype: 'Long',
		description:
			'Raw images often store extra pixels around the edges of the final image. These extra pixels help prevent interpolation artifacts near the edges of the final image. DefaultCropOrigin specifies the origin of the final image area, in raw image coordinates (i.e., before the DefaultScale has been applied), relative to the top-left corner of the ActiveArea rectangle.',
	},
	{
		tag: 0xc620,
		ifd: 'Image',
		key: 'DefaultCropSize',
		datatype: 'Long',
		description:
			'Raw images often store extra pixels around the edges of the final image. These extra pixels help prevent interpolation artifacts near the edges of the final image. DefaultCropSize specifies the size of the final image area, in raw image coordinates (i.e., before the DefaultScale has been applied).',
	},
	{
		tag: 0xc621,
		ifd: 'Image',
		key: 'ColorMatrix1',
		datatype: 'SRational',
		description:
			'ColorMatrix1 defines a transformation matrix that converts XYZ values to reference camera native color space values, under the first calibration illuminant. The matrix values are stored in row scan order. The ColorMatrix1 tag is required for all non-monochrome DNG files.',
	},
	{
		tag: 0xc622,
		ifd: 'Image',
		key: 'ColorMatrix2',
		datatype: 'SRational',
		description:
			'ColorMatrix2 defines a transformation matrix that converts XYZ values to reference camera native color space values, under the second calibration illuminant. The matrix values are stored in row scan order.',
	},
	{
		tag: 0xc623,
		ifd: 'Image',
		key: 'CameraCalibration1',
		datatype: 'SRational',
		description:
			'CameraCalibration1 defines a calibration matrix that transforms reference camera native space values to individual camera native space values under the first calibration illuminant. The matrix is stored in row scan order. This matrix is stored separately from the matrix specified by the ColorMatrix1 tag to allow raw converters to swap in replacement color matrices based on UniqueCameraModel tag, while still taking advantage of any per-individual camera calibration performed by the camera manufacturer.',
	},
	{
		tag: 0xc624,
		ifd: 'Image',
		key: 'CameraCalibration2',
		datatype: 'SRational',
		description:
			'CameraCalibration2 defines a calibration matrix that transforms reference camera native space values to individual camera native space values under the second calibration illuminant. The matrix is stored in row scan order. This matrix is stored separately from the matrix specified by the ColorMatrix2 tag to allow raw converters to swap in replacement color matrices based on UniqueCameraModel tag, while still taking advantage of any per-individual camera calibration performed by the camera manufacturer.',
	},
	{
		tag: 0xc625,
		ifd: 'Image',
		key: 'ReductionMatrix1',
		datatype: 'SRational',
		description:
			'ReductionMatrix1 defines a dimensionality reduction matrix for use as the first stage in converting color camera native space values to XYZ values, under the first calibration illuminant. This tag may only be used if ColorPlanes is greater than 3. The matrix is stored in row scan order.',
	},
	{
		tag: 0xc626,
		ifd: 'Image',
		key: 'ReductionMatrix2',
		datatype: 'SRational',
		description:
			'ReductionMatrix2 defines a dimensionality reduction matrix for use as the first stage in converting color camera native space values to XYZ values, under the second calibration illuminant. This tag may only be used if ColorPlanes is greater than 3. The matrix is stored in row scan order.',
	},
	{
		tag: 0xc627,
		ifd: 'Image',
		key: 'AnalogBalance',
		datatype: 'Rational',
		description:
			'Normally the stored raw values are not white balanced, since any digital white balancing will reduce the dynamic range of the final image if the user decides to later adjust the white balance; however, if camera hardware is capable of white balancing the color channels before the signal is digitized, it can improve the dynamic range of the final image. AnalogBalance defines the gain, either analog (recommended) or digital (not recommended) that has been applied the stored raw values.',
	},
	{
		tag: 0xc628,
		ifd: 'Image',
		key: 'AsShotNeutral',
		datatype: 'Short',
		description:
			'Specifies the selected white balance at time of capture, encoded as the coordinates of a perfectly neutral color in linear reference space values. The inclusion of this tag precludes the inclusion of the AsShotWhiteXY tag.',
	},
	{
		tag: 0xc629,
		ifd: 'Image',
		key: 'AsShotWhiteXY',
		datatype: 'Rational',
		description:
			'Specifies the selected white balance at time of capture, encoded as x-y chromaticity coordinates. The inclusion of this tag precludes the inclusion of the AsShotNeutral tag.',
	},
	{
		tag: 0xc62a,
		ifd: 'Image',
		key: 'BaselineExposure',
		datatype: 'SRational',
		description:
			'Camera models vary in the trade-off they make between highlight headroom and shadow noise. Some leave a significant amount of highlight headroom during a normal exposure. This allows significant negative exposure compensation to be applied during raw conversion, but also means normal exposures will contain more shadow noise. Other models leave less headroom during normal exposures. This allows for less negative exposure compensation, but results in lower shadow noise for normal exposures. Because of these differences, a raw converter needs to vary the zero point of its exposure compensation control from model to model. BaselineExposure specifies by how much (in EV units) to move the zero point. Positive values result in brighter default results, while negative values result in darker default results.',
	},
	{
		tag: 0xc62b,
		ifd: 'Image',
		key: 'BaselineNoise',
		datatype: 'Rational',
		description:
			'Specifies the relative noise level of the camera model at a baseline ISO value of 100, compared to a reference camera model. Since noise levels tend to vary approximately with the square root of the ISO value, a raw converter can use this value, combined with the current ISO, to estimate the relative noise level of the current image.',
	},
	{
		tag: 0xc62c,
		ifd: 'Image',
		key: 'BaselineSharpness',
		datatype: 'Rational',
		description:
			'Specifies the relative amount of sharpening required for this camera model, compared to a reference camera model. Camera models vary in the strengths of their anti-aliasing filters. Cameras with weak or no filters require less sharpening than cameras with strong anti-aliasing filters.',
	},
	{
		tag: 0xc62d,
		ifd: 'Image',
		key: 'BayerGreenSplit',
		datatype: 'Long',
		description:
			'Only applies to CFA images using a Bayer pattern filter array. This tag specifies, in arbitrary units, how closely the values of the green pixels in the blue/green rows track the values of the green pixels in the red/green rows. A value of zero means the two kinds of green pixels track closely, while a non-zero value means they sometimes diverge. The useful range for this tag is from 0 (no divergence) to about 5000 (quite large divergence).',
	},
	{
		tag: 0xc62e,
		ifd: 'Image',
		key: 'LinearResponseLimit',
		datatype: 'Rational',
		description:
			'Some sensors have an unpredictable non-linearity in their response as they near the upper limit of their encoding range. This non-linearity results in color shifts in the highlight areas of the resulting image unless the raw converter compensates for this effect. LinearResponseLimit specifies the fraction of the encoding range above which the response may become significantly non-linear.',
	},
	{
		tag: 0xc62f,
		ifd: 'Image',
		key: 'CameraSerialNumber',
		datatype: 'Ascii',
		description:
			'CameraSerialNumber contains the serial number of the camera or camera body that captured the image.',
	},
	{
		tag: 0xc630,
		ifd: 'Image',
		key: 'LensInfo',
		datatype: 'Rational',
		description:
			'Contains information about the lens that captured the image. If the minimum f-stops are unknown, they should be encoded as 0/0.',
	},
	{
		tag: 0xc631,
		ifd: 'Image',
		key: 'ChromaBlurRadius',
		datatype: 'Rational',
		description:
			"ChromaBlurRadius provides a hint to the DNG reader about how much chroma blur should be applied to the image. If this tag is omitted, the reader will use its default amount of chroma blurring. Normally this tag is only included for non-CFA images, since the amount of chroma blur required for mosaic images is highly dependent on the de-mosaic algorithm, in which case the DNG reader's default value is likely optimized for its particular de-mosaic algorithm.",
	},
	{
		tag: 0xc632,
		ifd: 'Image',
		key: 'AntiAliasStrength',
		datatype: 'Rational',
		description:
			"Provides a hint to the DNG reader about how strong the camera's anti-alias filter is. A value of 0.0 means no anti-alias filter (i.e., the camera is prone to aliasing artifacts with some subjects), while a value of 1.0 means a strong anti-alias filter (i.e., the camera almost never has aliasing artifacts).",
	},
	{
		tag: 0xc633,
		ifd: 'Image',
		key: 'ShadowScale',
		datatype: 'SRational',
		description:
			'This tag is used by Adobe Camera Raw to control the sensitivity of its "Shadows" slider.',
	},
	{
		tag: 0xc634,
		ifd: 'Image',
		key: 'DNGPrivateData',
		datatype: 'Byte',
		description:
			'Provides a way for camera manufacturers to store private data in the DNG file for use by their own raw converters, and to have that data preserved by programs that edit DNG files.',
	},
	{
		tag: 0xc635,
		ifd: 'Image',
		key: 'MakerNoteSafety',
		datatype: 'Short',
		description:
			'MakerNoteSafety lets the DNG reader know whether the EXIF MakerNote tag is safe to preserve along with the rest of the EXIF data. File browsers and other image management software processing an image with a preserved MakerNote should be aware that any thumbnail image embedded in the MakerNote may be stale, and may not reflect the current state of the full size image.',
	},
	{
		tag: 0xc65a,
		ifd: 'Image',
		key: 'CalibrationIlluminant1',
		datatype: 'Short',
		description:
			'The illuminant used for the first set of color calibration tags (ColorMatrix1, CameraCalibration1, ReductionMatrix1). The legal values for this tag are the same as the legal values for the LightSource EXIF tag. If set to 255 (Other), then the IFD must also include a IlluminantData1 tag to specify the x-y chromaticity or spectral power distribution function for this illuminant.',
	},
	{
		tag: 0xc65b,
		ifd: 'Image',
		key: 'CalibrationIlluminant2',
		datatype: 'Short',
		description:
			'The illuminant used for an optional second set of color calibration tags (ColorMatrix2, CameraCalibration2, ReductionMatrix2). The legal values for this tag are the same as the legal values for the CalibrationIlluminant1 tag; however, if both are included, neither is allowed to have a value of 0 (unknown). If set to 255 (Other), then the IFD must also include a IlluminantData2 tag to specify the x-y chromaticity or spectral power distribution function for this illuminant.',
	},
	{
		tag: 0xc65c,
		ifd: 'Image',
		key: 'BestQualityScale',
		datatype: 'Rational',
		description:
			'For some cameras, the best possible image quality is not achieved by preserving the total pixel count during conversion. For example, Fujifilm SuperCCD images have maximum detail when their total pixel count is doubled. This tag specifies the amount by which the values of the DefaultScale tag need to be multiplied to achieve the best quality image size.',
	},
	{
		tag: 0xc65d,
		ifd: 'Image',
		key: 'RawDataUniqueID',
		datatype: 'Byte',
		description:
			"This tag contains a 16-byte unique identifier for the raw image data in the DNG file. DNG readers can use this tag to recognize a particular raw image, even if the file's name or the metadata contained in the file has been changed. If a DNG writer creates such an identifier, it should do so using an algorithm that will ensure that it is very unlikely two different images will end up having the same identifier.",
	},
	{
		tag: 0xc68b,
		ifd: 'Image',
		key: 'OriginalRawFileName',
		datatype: 'Byte',
		description:
			'If the DNG file was converted from a non-DNG raw file, then this tag contains the file name of that original raw file.',
	},
	{
		tag: 0xc68c,
		ifd: 'Image',
		key: 'OriginalRawFileData',
		datatype: 'Undefined',
		description:
			'If the DNG file was converted from a non-DNG raw file, then this tag contains the compressed contents of that original raw file. The contents of this tag always use the big-endian byte order. The tag contains a sequence of data blocks. Future versions of the DNG specification may define additional data blocks, so DNG readers should ignore extra bytes when parsing this tag. DNG readers should also detect the case where data blocks are missing from the end of the sequence, and should assume a default value for all the missing blocks. There are no padding or alignment bytes between data blocks.',
	},
	{
		tag: 0xc68d,
		ifd: 'Image',
		key: 'ActiveArea',
		datatype: 'Long',
		description:
			'This rectangle defines the active (non-masked) pixels of the sensor. The order of the rectangle coordinates is: top, left, bottom, right.',
	},
	{
		tag: 0xc68e,
		ifd: 'Image',
		key: 'MaskedAreas',
		datatype: 'Long',
		description:
			"This tag contains a list of non-overlapping rectangle coordinates of fully masked pixels, which can be optionally used by DNG readers to measure the black encoding level. The order of each rectangle's coordinates is: top, left, bottom, right. If the raw image data has already had its black encoding level subtracted, then this tag should not be used, since the masked pixels are no longer useful.",
	},
	{
		tag: 0xc68f,
		ifd: 'Image',
		key: 'AsShotICCProfile',
		datatype: 'Undefined',
		description:
			'This tag contains an ICC profile that, in conjunction with the AsShotPreProfileMatrix tag, provides the camera manufacturer with a way to specify a default color rendering from camera color space coordinates (linear reference values) into the ICC profile connection space. The ICC profile connection space is an output referred colorimetric space, whereas the other color calibration tags in DNG specify a conversion into a scene referred colorimetric space. This means that the rendering in this profile should include any desired tone and gamut mapping needed to convert between scene referred values and output referred values.',
	},
	{
		tag: 0xc690,
		ifd: 'Image',
		key: 'AsShotPreProfileMatrix',
		datatype: 'SRational',
		description:
			'This tag is used in conjunction with the AsShotICCProfile tag. It specifies a matrix that should be applied to the camera color space coordinates before processing the values through the ICC profile specified in the AsShotICCProfile tag. The matrix is stored in the row scan order. If ColorPlanes is greater than three, then this matrix can (but is not required to) reduce the dimensionality of the color data down to three components, in which case the AsShotICCProfile should have three rather than ColorPlanes input components.',
	},
	{
		tag: 0xc691,
		ifd: 'Image',
		key: 'CurrentICCProfile',
		datatype: 'Undefined',
		description:
			'This tag is used in conjunction with the CurrentPreProfileMatrix tag. The CurrentICCProfile and CurrentPreProfileMatrix tags have the same purpose and usage as the AsShotICCProfile and AsShotPreProfileMatrix tag pair, except they are for use by raw file editors rather than camera manufacturers.',
	},
	{
		tag: 0xc692,
		ifd: 'Image',
		key: 'CurrentPreProfileMatrix',
		datatype: 'SRational',
		description:
			'This tag is used in conjunction with the CurrentICCProfile tag. The CurrentICCProfile and CurrentPreProfileMatrix tags have the same purpose and usage as the AsShotICCProfile and AsShotPreProfileMatrix tag pair, except they are for use by raw file editors rather than camera manufacturers.',
	},
	{
		tag: 0xc6bf,
		ifd: 'Image',
		key: 'ColorimetricReference',
		datatype: 'Short',
		description:
			'The DNG color model documents a transform between camera colors and CIE XYZ values. This tag describes the colorimetric reference for the CIE XYZ values. 0 = The XYZ values are scene-referred. 1 = The XYZ values are output-referred, using the ICC profile perceptual dynamic range. This tag allows output-referred data to be stored in DNG files and still processed correctly by DNG readers.',
	},
	{
		tag: 0xc6f3,
		ifd: 'Image',
		key: 'CameraCalibrationSignature',
		datatype: 'Byte',
		description:
			'A UTF-8 encoded string associated with the CameraCalibration1 and CameraCalibration2 tags. The CameraCalibration1 and CameraCalibration2 tags should only be used in the DNG color transform if the string stored in the CameraCalibrationSignature tag exactly matches the string stored in the ProfileCalibrationSignature tag for the selected camera profile.',
	},
	{
		tag: 0xc6f4,
		ifd: 'Image',
		key: 'ProfileCalibrationSignature',
		datatype: 'Byte',
		description:
			'A UTF-8 encoded string associated with the camera profile tags. The CameraCalibration1 and CameraCalibration2 tags should only be used in the DNG color transfer if the string stored in the CameraCalibrationSignature tag exactly matches the string stored in the ProfileCalibrationSignature tag for the selected camera profile.',
	},
	{
		tag: 0xc6f5,
		ifd: 'Image',
		key: 'ExtraCameraProfiles',
		datatype: 'Long',
		description:
			'A list of file offsets to extra Camera Profile IFDs. Note that the primary camera profile tags should be stored in IFD 0, and the ExtraCameraProfiles tag should only be used if there is more than one camera profile stored in the DNG file.',
	},
	{
		tag: 0xc6f6,
		ifd: 'Image',
		key: 'AsShotProfileName',
		datatype: 'Byte',
		description:
			'A UTF-8 encoded string containing the name of the "as shot" camera profile, if any.',
	},
	{
		tag: 0xc6f7,
		ifd: 'Image',
		key: 'NoiseReductionApplied',
		datatype: 'Rational',
		description:
			'This tag indicates how much noise reduction has been applied to the raw data on a scale of 0.0 to 1.0. A 0.0 value indicates that no noise reduction has been applied. A 1.0 value indicates that the "ideal" amount of noise reduction has been applied, i.e. that the DNG reader should not apply additional noise reduction by default. A value of 0/0 indicates that this parameter is unknown.',
	},
	{
		tag: 0xc6f8,
		ifd: 'Image',
		key: 'ProfileName',
		datatype: 'Byte',
		description:
			'A UTF-8 encoded string containing the name of the camera profile. This tag is optional if there is only a single camera profile stored in the file but is required for all camera profiles if there is more than one camera profile stored in the file.',
	},
	{
		tag: 0xc6f9,
		ifd: 'Image',
		key: 'ProfileHueSatMapDims',
		datatype: 'Long',
		description:
			'This tag specifies the number of input samples in each dimension of the hue/saturation/value mapping tables. The data for these tables are stored in ProfileHueSatMapData1, ProfileHueSatMapData2 and ProfileHueSatMapData3 tags. The most common case has ValueDivisions equal to 1, so only hue and saturation are used as inputs to the mapping table.',
	},
	{
		tag: 0xc6fa,
		ifd: 'Image',
		key: 'ProfileHueSatMapData1',
		datatype: 'Float',
		description:
			'This tag contains the data for the first hue/saturation/value mapping table. Each entry of the table contains three 32-bit IEEE floating-point values. The first entry is hue shift in degrees; the second entry is saturation scale factor; and the third entry is a value scale factor. The table entries are stored in the tag in nested loop order, with the value divisions in the outer loop, the hue divisions in the middle loop, and the saturation divisions in the inner loop. All zero input saturation entries are required to have a value scale factor of 1.0.',
	},
	{
		tag: 0xc6fb,
		ifd: 'Image',
		key: 'ProfileHueSatMapData2',
		datatype: 'Float',
		description:
			'This tag contains the data for the second hue/saturation/value mapping table. Each entry of the table contains three 32-bit IEEE floating-point values. The first entry is hue shift in degrees; the second entry is a saturation scale factor; and the third entry is a value scale factor. The table entries are stored in the tag in nested loop order, with the value divisions in the outer loop, the hue divisions in the middle loop, and the saturation divisions in the inner loop. All zero input saturation entries are required to have a value scale factor of 1.0.',
	},
	{
		tag: 0xc6fc,
		ifd: 'Image',
		key: 'ProfileToneCurve',
		datatype: 'Float',
		description:
			'This tag contains a default tone curve that can be applied while processing the image as a starting point for user adjustments. The curve is specified as a list of 32-bit IEEE floating-point value pairs in linear gamma. Each sample has an input value in the range of 0.0 to 1.0, and an output value in the range of 0.0 to 1.0. The first sample is required to be (0.0, 0.0), and the last sample is required to be (1.0, 1.0). Interpolated the curve using a cubic spline.',
	},
	{
		tag: 0xc6fd,
		ifd: 'Image',
		key: 'ProfileEmbedPolicy',
		datatype: 'Long',
		description:
			'This tag contains information about the usage rules for the associated camera profile.',
	},
	{
		tag: 0xc6fe,
		ifd: 'Image',
		key: 'ProfileCopyright',
		datatype: 'Byte',
		description:
			'A UTF-8 encoded string containing the copyright information for the camera profile. This string always should be preserved along with the other camera profile tags.',
	},
	{
		tag: 0xc714,
		ifd: 'Image',
		key: 'ForwardMatrix1',
		datatype: 'SRational',
		description:
			'This tag defines a matrix that maps white balanced camera colors to XYZ D50 colors.',
	},
	{
		tag: 0xc715,
		ifd: 'Image',
		key: 'ForwardMatrix2',
		datatype: 'SRational',
		description:
			'This tag defines a matrix that maps white balanced camera colors to XYZ D50 colors.',
	},
	{
		tag: 0xc716,
		ifd: 'Image',
		key: 'PreviewApplicationName',
		datatype: 'Byte',
		description:
			'A UTF-8 encoded string containing the name of the application that created the preview stored in the IFD.',
	},
	{
		tag: 0xc717,
		ifd: 'Image',
		key: 'PreviewApplicationVersion',
		datatype: 'Byte',
		description:
			'A UTF-8 encoded string containing the version number of the application that created the preview stored in the IFD.',
	},
	{
		tag: 0xc718,
		ifd: 'Image',
		key: 'PreviewSettingsName',
		datatype: 'Byte',
		description:
			'A UTF-8 encoded string containing the name of the conversion settings (for example, snapshot name) used for the preview stored in the IFD.',
	},
	{
		tag: 0xc719,
		ifd: 'Image',
		key: 'PreviewSettingsDigest',
		datatype: 'Byte',
		description:
			'A unique ID of the conversion settings (for example, MD5 digest) used to render the preview stored in the IFD.',
	},
	{
		tag: 0xc71a,
		ifd: 'Image',
		key: 'PreviewColorSpace',
		datatype: 'Long',
		description:
			'This tag specifies the color space in which the rendered preview in this IFD is stored. The default value for this tag is sRGB for color previews and Gray Gamma 2.2 for monochrome previews.',
	},
	{
		tag: 0xc71b,
		ifd: 'Image',
		key: 'PreviewDateTime',
		datatype: 'Ascii',
		description:
			'This tag is an ASCII string containing the name of the date/time at which the preview stored in the IFD was rendered. The date/time is encoded using ISO 8601 format.',
	},
	{
		tag: 0xc71c,
		ifd: 'Image',
		key: 'RawImageDigest',
		datatype: 'Undefined',
		description:
			'This tag is an MD5 digest of the raw image data. All pixels in the image are processed in row-scan order. Each pixel is zero padded to 16 or 32 bits deep (16-bit for data less than or equal to 16 bits deep, 32-bit otherwise). The data for each pixel is processed in little-endian byte order.',
	},
	{
		tag: 0xc71d,
		ifd: 'Image',
		key: 'OriginalRawFileDigest',
		datatype: 'Undefined',
		description: 'This tag is an MD5 digest of the data stored in the OriginalRawFileData tag.',
	},
	{
		tag: 0xc71e,
		ifd: 'Image',
		key: 'SubTileBlockSize',
		datatype: 'Long',
		description:
			'Normally, the pixels within a tile are stored in simple row-scan order. This tag specifies that the pixels within a tile should be grouped first into rectangular blocks of the specified size. These blocks are stored in row-scan order. Within each block, the pixels are stored in row-scan order. The use of a non-default value for this tag requires setting the DNGBackwardVersion tag to at least 1.2.0.0.',
	},
	{
		tag: 0xc71f,
		ifd: 'Image',
		key: 'RowInterleaveFactor',
		datatype: 'Long',
		description:
			'This tag specifies that rows of the image are stored in interleaved order. The value of the tag specifies the number of interleaved fields. The use of a non-default value for this tag requires setting the DNGBackwardVersion tag to at least 1.2.0.0.',
	},
	{
		tag: 0xc725,
		ifd: 'Image',
		key: 'ProfileLookTableDims',
		datatype: 'Long',
		description:
			'This tag specifies the number of input samples in each dimension of a default "look" table. The data for this table is stored in the ProfileLookTableData tag.',
	},
	{
		tag: 0xc726,
		ifd: 'Image',
		key: 'ProfileLookTableData',
		datatype: 'Float',
		description:
			'This tag contains a default "look" table that can be applied while processing the image as a starting point for user adjustment. This table uses the same format as the tables stored in the ProfileHueSatMapData1 and ProfileHueSatMapData2 tags, and is applied in the same color space. However, it should be applied later in the processing pipe, after any exposure compensation and/or fill light stages, but before any tone curve stage. Each entry of the table contains three 32-bit IEEE floating-point values. The first entry is hue shift in degrees, the second entry is a saturation scale factor, and the third entry is a value scale factor. The table entries are stored in the tag in nested loop order, with the value divisions in the outer loop, the hue divisions in the middle loop, and the saturation divisions in the inner loop. All zero input saturation entries are required to have a value scale factor of 1.0.',
	},
	{
		tag: 0xc740,
		ifd: 'Image',
		key: 'OpcodeList1',
		datatype: 'Undefined',
		description:
			'Specifies the list of opcodes that should be applied to the raw image, as read directly from the file.',
	},
	{
		tag: 0xc741,
		ifd: 'Image',
		key: 'OpcodeList2',
		datatype: 'Undefined',
		description:
			'Specifies the list of opcodes that should be applied to the raw image, just after it has been mapped to linear reference values.',
	},
	{
		tag: 0xc74e,
		ifd: 'Image',
		key: 'OpcodeList3',
		datatype: 'Undefined',
		description:
			'Specifies the list of opcodes that should be applied to the raw image, just after it has been demosaiced.',
	},
	{
		tag: 0xc761,
		ifd: 'Image',
		key: 'NoiseProfile',
		datatype: 'Double',
		description:
			'NoiseProfile describes the amount of noise in a raw image. Specifically, this tag models the amount of signal-dependent photon (shot) noise and signal-independent sensor readout noise, two common sources of noise in raw images. The model assumes that the noise is white and spatially independent, ignoring fixed pattern effects and other sources of noise (e.g., pixel response non-uniformity, spatially-dependent thermal effects, etc.).',
	},
	{
		tag: 0xc763,
		ifd: 'Image',
		key: 'TimeCodes',
		datatype: 'Byte',
		description:
			'The optional TimeCodes tag shall contain an ordered array of time codes. All time codes shall be 8 bytes long and in binary format. The tag may contain from 1 to 10 time codes. When the tag contains more than one time code, the first one shall be the default time code. This specification does not prescribe how to use multiple time codes. Each time code shall be as defined for the 8-byte time code structure in SMPTE 331M-2004, Section 8.3. See also SMPTE 12-1-2008 and SMPTE 309-1999.',
	},
	{
		tag: 0xc764,
		ifd: 'Image',
		key: 'FrameRate',
		datatype: 'SRational',
		description:
			'The optional FrameRate tag shall specify the video frame rate in number of image frames per second, expressed as a signed rational number. The numerator shall be non-negative and the denominator shall be positive. This field value is identical to the sample rate field in SMPTE 377-1-2009.',
	},
	{
		tag: 0xc772,
		ifd: 'Image',
		key: 'TStop',
		datatype: 'SRational',
		description:
			'The optional TStop tag shall specify the T-stop of the actual lens, expressed as an unsigned rational number. T-stop is also known as T-number or the photometric aperture of the lens. (F-number is the geometric aperture of the lens.) When the exact value is known, the T-stop shall be specified using a single number. Alternately, two numbers shall be used to indicate a T-stop range, in which case the first number shall be the minimum T-stop and the second number shall be the maximum T-stop.',
	},
	{
		tag: 0xc789,
		ifd: 'Image',
		key: 'ReelName',
		datatype: 'Ascii',
		description:
			'The optional ReelName tag shall specify a name for a sequence of images, where each image in the sequence has a unique image identifier (including but not limited to file name, frame number, date time, time code).',
	},
	{
		tag: 0xc7a1,
		ifd: 'Image',
		key: 'CameraLabel',
		datatype: 'Ascii',
		description:
			'The optional CameraLabel tag shall specify a text label for how the camera is used or assigned in this clip. This tag is similar to CameraLabel in XMP.',
	},
	{
		tag: 0xc791,
		ifd: 'Image',
		key: 'OriginalDefaultFinalSize',
		datatype: 'Long',
		description:
			'If this file is a proxy for a larger original DNG file, this tag specifics the default final size of the larger original file from which this proxy was generated. The default value for this tag is default final size of the current DNG file, which is DefaultCropSize * DefaultScale.',
	},
	{
		tag: 0xc792,
		ifd: 'Image',
		key: 'OriginalBestQualityFinalSize',
		datatype: 'Long',
		description:
			'If this file is a proxy for a larger original DNG file, this tag specifics the best quality final size of the larger original file from which this proxy was generated. The default value for this tag is the OriginalDefaultFinalSize, if specified. Otherwise the default value for this tag is the best quality size of the current DNG file, which is DefaultCropSize * DefaultScale * BestQualityScale.',
	},
	{
		tag: 0xc793,
		ifd: 'Image',
		key: 'OriginalDefaultCropSize',
		datatype: 'Long',
		description:
			'If this file is a proxy for a larger original DNG file, this tag specifics the DefaultCropSize of the larger original file from which this proxy was generated. The default value for this tag is OriginalDefaultFinalSize, if specified. Otherwise, the default value for this tag is the DefaultCropSize of the current DNG file.',
	},
	{
		tag: 0xc7a3,
		ifd: 'Image',
		key: 'ProfileHueSatMapEncoding',
		datatype: 'Long',
		description:
			'Provides a way for color profiles to specify how indexing into a 3D HueSatMap is performed during raw conversion. This tag is not applicable to 2.5D HueSatMap tables (i.e., where the Value dimension is 1).',
	},
	{
		tag: 0xc7a4,
		ifd: 'Image',
		key: 'ProfileLookTableEncoding',
		datatype: 'Long',
		description:
			'Provides a way for color profiles to specify how indexing into a 3D LookTable is performed during raw conversion. This tag is not applicable to a 2.5D LookTable (i.e., where the Value dimension is 1).',
	},
	{
		tag: 0xc7a5,
		ifd: 'Image',
		key: 'BaselineExposureOffset',
		datatype: 'SRational',
		description:
			'Provides a way for color profiles to increase or decrease exposure during raw conversion. BaselineExposureOffset specifies the amount (in EV units) to add to the BaselineExposure tag during image rendering. For example, if the BaselineExposure value for a given camera model is +0.3, and the BaselineExposureOffset value for a given camera profile used to render an image for that camera model is -0.7, then the actual default exposure value used during rendering will be +0.3 - 0.7 = -0.4.',
	},
	{
		tag: 0xc7a6,
		ifd: 'Image',
		key: 'DefaultBlackRender',
		datatype: 'Long',
		description:
			'This optional tag in a color profile provides a hint to the raw converter regarding how to handle the black point (e.g., flare subtraction) during rendering. If set to Auto, the raw converter should perform black subtraction during rendering. If set to None, the raw converter should not perform any black subtraction during rendering.',
	},
	{
		tag: 0xc7a7,
		ifd: 'Image',
		key: 'NewRawImageDigest',
		datatype: 'Byte',
		description:
			'This tag is a modified MD5 digest of the raw image data. It has been updated from the algorithm used to compute the RawImageDigest tag be more multi-processor friendly, and to support lossy compression algorithms.',
	},
	{
		tag: 0xc7a8,
		ifd: 'Image',
		key: 'RawToPreviewGain',
		datatype: 'Double',
		description:
			'The gain (what number the sample values are multiplied by) between the main raw IFD and the preview IFD containing this tag.',
	},
	{
		tag: 0xc7b5,
		ifd: 'Image',
		key: 'DefaultUserCrop',
		datatype: 'Rational',
		description:
			'Specifies a default user crop rectangle in relative coordinates. The values must satisfy: 0.0 <= top < bottom <= 1.0, 0.0 <= left < right <= 1.0.The default values of (top = 0, left = 0, bottom = 1, right = 1) correspond exactly to the default crop rectangle (as specified by the DefaultCropOrigin and DefaultCropSize tags).',
	},
	{
		tag: 0xc7e9,
		ifd: 'Image',
		key: 'DepthFormat',
		datatype: 'Short',
		description:
			'Specifies the encoding of any depth data in the file. Can be unknown (apart from nearer distances being closer to zero, and farther distances being closer to the maximum value), linear (values vary linearly from zero representing DepthNear to the maximum value representing DepthFar), or inverse (values are stored inverse linearly, with zero representing DepthNear and the maximum value representing DepthFar).',
	},
	{
		tag: 0xc7ea,
		ifd: 'Image',
		key: 'DepthNear',
		datatype: 'Rational',
		description:
			'Specifies distance from the camera represented by the zero value in the depth map. 0/0 means unknown.',
	},
	{
		tag: 0xc7eb,
		ifd: 'Image',
		key: 'DepthFar',
		datatype: 'Rational',
		description:
			'Specifies distance from the camera represented by the maximum value in the depth map. 0/0 means unknown. 1/0 means infinity, which is valid for unknown and inverse depth formats.',
	},
	{
		tag: 0xc7ec,
		ifd: 'Image',
		key: 'DepthUnits',
		datatype: 'Short',
		description: 'Specifies the measurement units for the DepthNear and DepthFar tags.',
	},
	{
		tag: 0xc7ed,
		ifd: 'Image',
		key: 'DepthMeasureType',
		datatype: 'Short',
		description:
			'Specifies the measurement geometry for the depth map. Can be unknown, measured along the optical axis, or measured along the optical ray passing through each pixel.',
	},
	{
		tag: 0xc7ee,
		ifd: 'Image',
		key: 'EnhanceParams',
		datatype: 'Ascii',
		description: 'A string that documents how the enhanced image data was processed.',
	},
	{
		tag: 0xcd2d,
		ifd: 'Image',
		key: 'ProfileGainTableMap',
		datatype: 'Undefined',
		description:
			'Contains spatially varying gain tables that can be applied while processing the image as a starting point for user adjustments.',
	},
	{
		tag: 0xcd2e,
		ifd: 'Image',
		key: 'SemanticName',
		datatype: 'Ascii',
		description: 'A string that identifies the semantic mask.',
	},
	{
		tag: 0xcd30,
		ifd: 'Image',
		key: 'SemanticInstanceID',
		datatype: 'Ascii',
		description: 'A string that identifies a specific instance in a semantic mask.',
	},
	{
		tag: 0xcd31,
		ifd: 'Image',
		key: 'CalibrationIlluminant3',
		datatype: 'Short',
		description:
			'The illuminant used for an optional third set of color calibration tags (ColorMatrix3, CameraCalibration3, ReductionMatrix3). The legal values for this tag are the same as the legal values for the LightSource EXIF tag; CalibrationIlluminant1 and CalibrationIlluminant2 must also be present. If set to 255 (Other), then the IFD must also include a IlluminantData3 tag to specify the x-y chromaticity or spectral power distribution function for this illuminant.',
	},
	{
		tag: 0xcd32,
		ifd: 'Image',
		key: 'CameraCalibration3',
		datatype: 'SRational',
		description:
			'CameraCalibration3 defines a calibration matrix that transforms reference camera native space values to individual camera native space values under the third calibration illuminant. The matrix is stored in row scan order. This matrix is stored separately from the matrix specified by the ColorMatrix3 tag to allow raw converters to swap in replacement color matrices based on UniqueCameraModel tag, while still taking advantage of any per-individual camera calibration performed by the camera manufacturer.',
	},
	{
		tag: 0xcd33,
		ifd: 'Image',
		key: 'ColorMatrix3',
		datatype: 'SRational',
		description:
			'ColorMatrix3 defines a transformation matrix that converts XYZ values to reference camera native color space values, under the third calibration illuminant. The matrix values are stored in row scan order.',
	},
	{
		tag: 0xcd34,
		ifd: 'Image',
		key: 'ForwardMatrix3',
		datatype: 'SRational',
		description:
			'This tag defines a matrix that maps white balanced camera colors to XYZ D50 colors.',
	},
	{
		tag: 0xcd35,
		ifd: 'Image',
		key: 'IlluminantData1',
		datatype: 'Undefined',
		description:
			'When the CalibrationIlluminant1 tag is set to 255 (Other), then the IlluminantData1 tag is required and specifies the data for the first illuminant. Otherwise, this tag is ignored. The illuminant data may be specified as either a x-y chromaticity coordinate or as a spectral power distribution function.',
	},
	{
		tag: 0xcd36,
		ifd: 'Image',
		key: 'IlluminantData2',
		datatype: 'Undefined',
		description:
			'When the CalibrationIlluminant2 tag is set to 255 (Other), then the IlluminantData2 tag is required and specifies the data for the second illuminant. Otherwise, this tag is ignored. The format of the data is the same as IlluminantData1.',
	},
	{
		tag: 0xcd37,
		ifd: 'Image',
		key: 'IlluminantData3',
		datatype: 'Undefined',
		description:
			'When the CalibrationIlluminant3 tag is set to 255 (Other), then the IlluminantData3 tag is required and specifies the data for the third illuminant. Otherwise, this tag is ignored. The format of the data is the same as IlluminantData1.',
	},
	{
		tag: 0xcd38,
		ifd: 'Image',
		key: 'MaskSubArea',
		datatype: 'Long',
		description:
			"This tag identifies the crop rectangle of this IFD's mask, relative to the main image.",
	},
	{
		tag: 0xcd39,
		ifd: 'Image',
		key: 'ProfileHueSatMapData3',
		datatype: 'Float',
		description:
			'This tag contains the data for the third hue/saturation/value mapping table. Each entry of the table contains three 32-bit IEEE floating-point values. The first entry is hue shift in degrees; the second entry is saturation scale factor; and the third entry is a value scale factor. The table entries are stored in the tag in nested loop order, with the value divisions in the outer loop, the hue divisions in the middle loop, and the saturation divisions in the inner loop. All zero input saturation entries are required to have a value scale factor of 1.0.',
	},
	{
		tag: 0xcd3a,
		ifd: 'Image',
		key: 'ReductionMatrix3',
		datatype: 'SRational',
		description:
			'ReductionMatrix3 defines a dimensionality reduction matrix for use as the first stage in converting color camera native space values to XYZ values, under the third calibration illuminant. This tag may only be used if ColorPlanes is greater than 3. The matrix is stored in row scan order.',
	},
	{
		tag: 0xcd3f,
		ifd: 'Image',
		key: 'RGBTables',
		datatype: 'Undefined',
		description:
			'This tag specifies color transforms that can be applied to masked image regions. Color transforms are specified using RGB-to-RGB color lookup tables. These tables are associated with Semantic Masks to limit the color transform to a sub-region of the image. The overall color transform is a linear combination of the color tables, weighted by their corresponding Semantic Masks.',
	},
	{
		tag: 0xcd40,
		ifd: 'Image',
		key: 'ProfileGainTableMap2',
		datatype: 'Undefined',
		description: 'This tag is an extended version of ProfileGainTableMap.',
	},
	{
		tag: 0xcd43,
		ifd: 'Image',
		key: 'ColumnInterleaveFactor',
		datatype: 'Long',
		description:
			'This tag specifies that columns of the image are stored in interleaved order. The value of the tag specifies the number of interleaved fields. The use of a non-default value for this tag requires setting the DNGBackwardVersion tag to at least 1.7.1.0.',
	},
	{
		tag: 0xcd44,
		ifd: 'Image',
		key: 'ImageSequenceInfo',
		datatype: 'Undefined',
		description:
			'This is an informative tag that describes how the image file relates to other image files captured in a sequence. Applications include focus stacking, merging multiple frames to reduce noise, time lapses, exposure brackets, stitched images for super resolution, and so on.',
	},
	{
		tag: 0xcd46,
		ifd: 'Image',
		key: 'ImageStats',
		datatype: 'Undefined',
		description:
			'This is an informative tag that provides basic statistical information about the pixel values of the image in this IFD. Possible applications include normalizing brightness of images when multiple images are displayed together (especially when mixing Standard Dynamic Range and High Dynamic Range images), identifying underexposed or overexposed images, and so on.',
	},
	{
		tag: 0xcd47,
		ifd: 'Image',
		key: 'ProfileDynamicRange',
		datatype: 'Undefined',
		description:
			'This tag describes the intended rendering output dynamic range for a given camera profile.',
	},
	{
		tag: 0xcd48,
		ifd: 'Image',
		key: 'ProfileGroupName',
		datatype: 'Ascii',
		description:
			'A UTF-8 encoded string containing the "group name" of the camera profile. The purpose of this tag is to associate two or more related camera profiles into a common group.',
	},
	{
		tag: 0xcd49,
		ifd: 'Image',
		key: 'JXLDistance',
		datatype: 'Float',
		description:
			'This optional tag specifies the distance parameter used to encode the JPEG XL data in this IFD. A value of 0.0 means lossless compression, while values greater than 0.0 means lossy compression.',
	},
	{
		tag: 0xcd4a,
		ifd: 'Image',
		key: 'JXLEffort',
		datatype: 'Long',
		description:
			'This optional tag specifies the effort parameter used to encode the JPEG XL data in this IFD. Values range from 1 (low) to 9 (high).',
	},
	{
		tag: 0xcd4b,
		ifd: 'Image',
		key: 'JXLDecodeSpeed',
		datatype: 'Long',
		description:
			'This optional tag specifies the decode speed parameter used to encode the JPEG XL data in this IFD. Values range from 1 (slow) to 4 (fast).',
	},
	{
		tag: 0x829a,
		ifd: 'Photo',
		key: 'ExposureTime',
		datatype: 'Rational',
		description: 'Exposure time, given in seconds (sec).',
	},
	{
		tag: 0x829d,
		ifd: 'Photo',
		key: 'FNumber',
		datatype: 'Rational',
		description: 'The F number.',
	},
	{
		tag: 0x8822,
		ifd: 'Photo',
		key: 'ExposureProgram',
		datatype: 'Short',
		description:
			'The class of the program used by the camera to set exposure when the picture is taken.',
	},
	{
		tag: 0x8824,
		ifd: 'Photo',
		key: 'SpectralSensitivity',
		datatype: 'Ascii',
		description:
			'Indicates the spectral sensitivity of each channel of the camera used. The tag value is an ASCII string compatible with the standard developed by the ASTM Technical Committee.',
	},
	{
		tag: 0x8827,
		ifd: 'Photo',
		key: 'ISOSpeedRatings',
		datatype: 'Short',
		description:
			'Indicates the ISO Speed and ISO Latitude of the camera or input device as specified in ISO 12232.',
	},
	{
		tag: 0x8828,
		ifd: 'Photo',
		key: 'OECF',
		datatype: 'Undefined',
		description:
			'Indicates the Opto-Electoric Conversion Function (OECF) specified in ISO 14524. <OECF> is the relationship between the camera optical input and the image values.',
	},
	{
		tag: 0x8830,
		ifd: 'Photo',
		key: 'SensitivityType',
		datatype: 'Short',
		description:
			'The SensitivityType tag indicates which one of the parameters of ISO12232 is the PhotographicSensitivity tag. Although it is an optional tag, it should be recorded when a PhotographicSensitivity tag is recorded. Value = 4, 5, 6, or 7 may be used in case that the values of plural parameters are the same.',
	},
	{
		tag: 0x8831,
		ifd: 'Photo',
		key: 'StandardOutputSensitivity',
		datatype: 'Long',
		description:
			'This tag indicates the standard output sensitivity value of a camera or input device defined in ISO 12232. When recording this tag, the PhotographicSensitivity and SensitivityType tags shall also be recorded.',
	},
	{
		tag: 0x8832,
		ifd: 'Photo',
		key: 'RecommendedExposureIndex',
		datatype: 'Long',
		description:
			'This tag indicates the recommended exposure index value of a camera or input device defined in ISO 12232. When recording this tag, the PhotographicSensitivity and SensitivityType tags shall also be recorded.',
	},
	{
		tag: 0x8833,
		ifd: 'Photo',
		key: 'ISOSpeed',
		datatype: 'Long',
		description:
			'This tag indicates the ISO speed value of a camera or input device that is defined in ISO 12232. When recording this tag, the PhotographicSensitivity and SensitivityType tags shall also be recorded.',
	},
	{
		tag: 0x8834,
		ifd: 'Photo',
		key: 'ISOSpeedLatitudeyyy',
		datatype: 'Long',
		description:
			'This tag indicates the ISO speed latitude yyy value of a camera or input device that is defined in ISO 12232. However, this tag shall not be recorded without ISOSpeed and ISOSpeedLatitudezzz.',
	},
	{
		tag: 0x8835,
		ifd: 'Photo',
		key: 'ISOSpeedLatitudezzz',
		datatype: 'Long',
		description:
			'This tag indicates the ISO speed latitude zzz value of a camera or input device that is defined in ISO 12232. However, this tag shall not be recorded without ISOSpeed and ISOSpeedLatitudeyyy.',
	},
	{
		tag: 0x9000,
		ifd: 'Photo',
		key: 'ExifVersion',
		datatype: 'Undefined',
		description:
			'The version of this standard supported. Nonexistence of this field is taken to mean nonconformance to the standard.',
	},
	{
		tag: 0x9003,
		ifd: 'Photo',
		key: 'DateTimeOriginal',
		datatype: 'Ascii',
		description:
			'The date and time when the original image data was generated. For a digital still camera the date and time the picture was taken are recorded.',
	},
	{
		tag: 0x9004,
		ifd: 'Photo',
		key: 'DateTimeDigitized',
		datatype: 'Ascii',
		description: 'The date and time when the image was stored as digital data.',
	},
	{
		tag: 0x9010,
		ifd: 'Photo',
		key: 'OffsetTime',
		datatype: 'Ascii',
		description:
			'Time difference from Universal Time Coordinated including daylight saving time of DateTime tag.',
	},
	{
		tag: 0x9011,
		ifd: 'Photo',
		key: 'OffsetTimeOriginal',
		datatype: 'Ascii',
		description:
			'Time difference from Universal Time Coordinated including daylight saving time of DateTimeOriginal tag.',
	},
	{
		tag: 0x9012,
		ifd: 'Photo',
		key: 'OffsetTimeDigitized',
		datatype: 'Ascii',
		description:
			'Time difference from Universal Time Coordinated including daylight saving time of DateTimeDigitized tag.',
	},
	{
		tag: 0x9101,
		ifd: 'Photo',
		key: 'ComponentsConfiguration',
		datatype: 'Undefined',
		description:
			'Information specific to compressed data. The channels of each component are arranged in order from the 1st component to the 4th. For uncompressed data the data arrangement is given in the <PhotometricInterpretation> tag. However, since <PhotometricInterpretation> can only express the order of Y, Cb and Cr, this tag is provided for cases when compressed data uses components other than Y, Cb, and Cr and to enable support of other sequences.',
	},
	{
		tag: 0x9102,
		ifd: 'Photo',
		key: 'CompressedBitsPerPixel',
		datatype: 'Rational',
		description:
			'Information specific to compressed data. The compression mode used for a compressed image is indicated in unit bits per pixel.',
	},
	{
		tag: 0x9201,
		ifd: 'Photo',
		key: 'ShutterSpeedValue',
		datatype: 'SRational',
		description:
			'Shutter speed. The unit is the APEX (Additive System of Photographic Exposure) setting.',
	},
	{
		tag: 0x9202,
		ifd: 'Photo',
		key: 'ApertureValue',
		datatype: 'Rational',
		description: 'The lens aperture. The unit is the APEX value.',
	},
	{
		tag: 0x9203,
		ifd: 'Photo',
		key: 'BrightnessValue',
		datatype: 'SRational',
		description:
			'The value of brightness. The unit is the APEX value. Ordinarily it is given in the range of -99.99 to 99.99.',
	},
	{
		tag: 0x9204,
		ifd: 'Photo',
		key: 'ExposureBiasValue',
		datatype: 'SRational',
		description:
			'The exposure bias. The units is the APEX value. Ordinarily it is given in the range of -99.99 to 99.99.',
	},
	{
		tag: 0x9205,
		ifd: 'Photo',
		key: 'MaxApertureValue',
		datatype: 'Rational',
		description:
			'The smallest F number of the lens. The unit is the APEX value. Ordinarily it is given in the range of 00.00 to 99.99, but it is not limited to this range.',
	},
	{
		tag: 0x9206,
		ifd: 'Photo',
		key: 'SubjectDistance',
		datatype: 'Rational',
		description: 'The distance to the subject, given in meters.',
	},
	{
		tag: 0x9207,
		ifd: 'Photo',
		key: 'MeteringMode',
		datatype: 'Short',
		description: 'The metering mode.',
	},
	{
		tag: 0x9208,
		ifd: 'Photo',
		key: 'LightSource',
		datatype: 'Short',
		description: 'The kind of light source.',
	},
	{
		tag: 0x9209,
		ifd: 'Photo',
		key: 'Flash',
		datatype: 'Short',
		description: 'This tag is recorded when an image is taken using a strobe light (flash).',
	},
	{
		tag: 0x920a,
		ifd: 'Photo',
		key: 'FocalLength',
		datatype: 'Rational',
		description:
			'The actual focal length of the lens, in mm. Conversion is not made to the focal length of a 35 mm film camera.',
	},
	{
		tag: 0x9214,
		ifd: 'Photo',
		key: 'SubjectArea',
		datatype: 'Short',
		description:
			'This tag indicates the location and area of the main subject in the overall scene.',
	},
	{
		tag: 0x927c,
		ifd: 'Photo',
		key: 'MakerNote',
		datatype: 'Undefined',
		description:
			'A tag for manufacturers of Exif writers to record any desired information. The contents are up to the manufacturer.',
	},
	{
		tag: 0x9286,
		ifd: 'Photo',
		key: 'UserComment',
		datatype: 'Comment',
		description:
			'A tag for Exif users to write keywords or comments on the image besides those in <ImageDescription>, and without the character code limitations of the <ImageDescription> tag.',
	},
	{
		tag: 0x9290,
		ifd: 'Photo',
		key: 'SubSecTime',
		datatype: 'Ascii',
		description: 'A tag used to record fractions of seconds for the <DateTime> tag.',
	},
	{
		tag: 0x9291,
		ifd: 'Photo',
		key: 'SubSecTimeOriginal',
		datatype: 'Ascii',
		description: 'A tag used to record fractions of seconds for the <DateTimeOriginal> tag.',
	},
	{
		tag: 0x9292,
		ifd: 'Photo',
		key: 'SubSecTimeDigitized',
		datatype: 'Ascii',
		description: 'A tag used to record fractions of seconds for the <DateTimeDigitized> tag.',
	},
	{
		tag: 0x9400,
		ifd: 'Photo',
		key: 'Temperature',
		datatype: 'SRational',
		description:
			'Temperature as the ambient situation at the shot, for example the room temperature where the photographer was holding the camera. The unit is degrees C.',
	},
	{
		tag: 0x9401,
		ifd: 'Photo',
		key: 'Humidity',
		datatype: 'Rational',
		description:
			'Humidity as the ambient situation at the shot, for example the room humidity where the photographer was holding the camera. The unit is %.',
	},
	{
		tag: 0x9402,
		ifd: 'Photo',
		key: 'Pressure',
		datatype: 'Rational',
		description:
			'Pressure as the ambient situation at the shot, for example the room atmosphere where the photographer was holding the camera or the water pressure under the sea. The unit is hPa.',
	},
	{
		tag: 0x9403,
		ifd: 'Photo',
		key: 'WaterDepth',
		datatype: 'SRational',
		description:
			'Water depth as the ambient situation at the shot, for example the water depth of the camera at underwater photography. The unit is m.',
	},
	{
		tag: 0x9404,
		ifd: 'Photo',
		key: 'Acceleration',
		datatype: 'Rational',
		description:
			'Acceleration (a scalar regardless of direction) as the ambient situation at the shot, for example the driving acceleration of the vehicle which the photographer rode on at the shot. The unit is mGal (10e-5 m/s^2).',
	},
	{
		tag: 0x9405,
		ifd: 'Photo',
		key: 'CameraElevationAngle',
		datatype: 'SRational',
		description:
			'Elevation/depression. angle of the orientation of the camera(imaging optical axis) as the ambient situation at the shot. The unit is degrees.',
	},
	{
		tag: 0xa000,
		ifd: 'Photo',
		key: 'FlashpixVersion',
		datatype: 'Undefined',
		description: 'The FlashPix format version supported by a FPXR file.',
	},
	{
		tag: 0xa001,
		ifd: 'Photo',
		key: 'ColorSpace',
		datatype: 'Short',
		description:
			'The color space information tag is always recorded as the color space specifier. Normally sRGB is used to define the color space based on the PC monitor conditions and environment. If a color space other than sRGB is used, Uncalibrated is set. Image data recorded as Uncalibrated can be treated as sRGB when it is converted to FlashPix.',
	},
	{
		tag: 0xa002,
		ifd: 'Photo',
		key: 'PixelXDimension',
		datatype: 'Long',
		description:
			'Information specific to compressed data. When a compressed file is recorded, the valid width of the meaningful image must be recorded in this tag, whether or not there is padding data or a restart marker. This tag should not exist in an uncompressed file.',
	},
	{
		tag: 0xa003,
		ifd: 'Photo',
		key: 'PixelYDimension',
		datatype: 'Long',
		description:
			'Information specific to compressed data. When a compressed file is recorded, the valid height of the meaningful image must be recorded in this tag, whether or not there is padding data or a restart marker. This tag should not exist in an uncompressed file. Since data padding is unnecessary in the vertical direction, the number of lines recorded in this valid image height tag will in fact be the same as that recorded in the SOF.',
	},
	{
		tag: 0xa004,
		ifd: 'Photo',
		key: 'RelatedSoundFile',
		datatype: 'Ascii',
		description:
			'This tag is used to record the name of an audio file related to the image data. The only relational information recorded here is the Exif audio file name and extension (an ASCII string consisting of 8 characters + "." + 3 characters). The path is not recorded.',
	},
	{
		tag: 0xa005,
		ifd: 'Photo',
		key: 'InteroperabilityTag',
		datatype: 'Long',
		description:
			'Interoperability IFD is composed of tags which stores the information to ensure the Interoperability and pointed by the following tag located in Exif IFD. The Interoperability structure of Interoperability IFD is the same as TIFF defined IFD structure but does not contain the image data characteristically compared with normal TIFF IFD.',
	},
	{
		tag: 0xa20b,
		ifd: 'Photo',
		key: 'FlashEnergy',
		datatype: 'Rational',
		description:
			'Indicates the strobe energy at the time the image is captured, as measured in Beam Candle Power Seconds (BCPS).',
	},
	{
		tag: 0xa20c,
		ifd: 'Photo',
		key: 'SpatialFrequencyResponse',
		datatype: 'Undefined',
		description:
			'This tag records the camera or input device spatial frequency table and SFR values in the direction of image width, image height, and diagonal direction, as specified in ISO 12233.',
	},
	{
		tag: 0xa20e,
		ifd: 'Photo',
		key: 'FocalPlaneXResolution',
		datatype: 'Rational',
		description:
			'Indicates the number of pixels in the image width (X) direction per <FocalPlaneResolutionUnit> on the camera focal plane.',
	},
	{
		tag: 0xa20f,
		ifd: 'Photo',
		key: 'FocalPlaneYResolution',
		datatype: 'Rational',
		description:
			'Indicates the number of pixels in the image height (V) direction per <FocalPlaneResolutionUnit> on the camera focal plane.',
	},
	{
		tag: 0xa210,
		ifd: 'Photo',
		key: 'FocalPlaneResolutionUnit',
		datatype: 'Short',
		description:
			'Indicates the unit for measuring <FocalPlaneXResolution> and <FocalPlaneYResolution>. This value is the same as the <ResolutionUnit>.',
	},
	{
		tag: 0xa214,
		ifd: 'Photo',
		key: 'SubjectLocation',
		datatype: 'Short',
		description:
			'Indicates the location of the main subject in the scene. The value of this tag represents the pixel at the center of the main subject relative to the left edge, prior to rotation processing as per the <Rotation> tag. The first value indicates the X column number and second indicates the Y row number.',
	},
	{
		tag: 0xa215,
		ifd: 'Photo',
		key: 'ExposureIndex',
		datatype: 'Rational',
		description:
			'Indicates the exposure index selected on the camera or input device at the time the image is captured.',
	},
	{
		tag: 0xa217,
		ifd: 'Photo',
		key: 'SensingMethod',
		datatype: 'Short',
		description: 'Indicates the image sensor type on the camera or input device.',
	},
	{
		tag: 0xa300,
		ifd: 'Photo',
		key: 'FileSource',
		datatype: 'Undefined',
		description:
			'Indicates the image source. If a DSC recorded the image, this tag value of this tag always be set to 3, indicating that the image was recorded on a DSC.',
	},
	{
		tag: 0xa301,
		ifd: 'Photo',
		key: 'SceneType',
		datatype: 'Undefined',
		description:
			'Indicates the type of scene. If a DSC recorded the image, this tag value must always be set to 1, indicating that the image was directly photographed.',
	},
	{
		tag: 0xa302,
		ifd: 'Photo',
		key: 'CFAPattern',
		datatype: 'Undefined',
		description:
			'Indicates the color filter array (CFA) geometric pattern of the image sensor when a one-chip color area sensor is used. It does not apply to all sensing methods.',
	},
	{
		tag: 0xa401,
		ifd: 'Photo',
		key: 'CustomRendered',
		datatype: 'Short',
		description:
			'This tag indicates the use of special processing on image data, such as rendering geared to output. When special processing is performed, the reader is expected to disable or minimize any further processing.',
	},
	{
		tag: 0xa402,
		ifd: 'Photo',
		key: 'ExposureMode',
		datatype: 'Short',
		description:
			'This tag indicates the exposure mode set when the image was shot. In auto-bracketing mode, the camera shoots a series of frames of the same scene at different exposure settings.',
	},
	{
		tag: 0xa403,
		ifd: 'Photo',
		key: 'WhiteBalance',
		datatype: 'Short',
		description: 'This tag indicates the white balance mode set when the image was shot.',
	},
	{
		tag: 0xa404,
		ifd: 'Photo',
		key: 'DigitalZoomRatio',
		datatype: 'Rational',
		description:
			'This tag indicates the digital zoom ratio when the image was shot. If the numerator of the recorded value is 0, this indicates that digital zoom was not used.',
	},
	{
		tag: 0xa405,
		ifd: 'Photo',
		key: 'FocalLengthIn35mmFilm',
		datatype: 'Short',
		description:
			'This tag indicates the equivalent focal length assuming a 35mm film camera, in mm. A value of 0 means the focal length is unknown. Note that this tag differs from the <FocalLength> tag.',
	},
	{
		tag: 0xa406,
		ifd: 'Photo',
		key: 'SceneCaptureType',
		datatype: 'Short',
		description:
			'This tag indicates the type of scene that was shot. It can also be used to record the mode in which the image was shot. Note that this differs from the <SceneType> tag.',
	},
	{
		tag: 0xa407,
		ifd: 'Photo',
		key: 'GainControl',
		datatype: 'Short',
		description: 'This tag indicates the degree of overall image gain adjustment.',
	},
	{
		tag: 0xa408,
		ifd: 'Photo',
		key: 'Contrast',
		datatype: 'Short',
		description:
			'This tag indicates the direction of contrast processing applied by the camera when the image was shot.',
	},
	{
		tag: 0xa409,
		ifd: 'Photo',
		key: 'Saturation',
		datatype: 'Short',
		description:
			'This tag indicates the direction of saturation processing applied by the camera when the image was shot.',
	},
	{
		tag: 0xa40a,
		ifd: 'Photo',
		key: 'Sharpness',
		datatype: 'Short',
		description:
			'This tag indicates the direction of sharpness processing applied by the camera when the image was shot.',
	},
	{
		tag: 0xa40b,
		ifd: 'Photo',
		key: 'DeviceSettingDescription',
		datatype: 'Undefined',
		description:
			'This tag indicates information on the picture-taking conditions of a particular camera model. The tag is used only to indicate the picture-taking conditions in the reader.',
	},
	{
		tag: 0xa40c,
		ifd: 'Photo',
		key: 'SubjectDistanceRange',
		datatype: 'Short',
		description: 'This tag indicates the distance to the subject.',
	},
	{
		tag: 0xa420,
		ifd: 'Photo',
		key: 'ImageUniqueID',
		datatype: 'Ascii',
		description:
			'This tag indicates an identifier assigned uniquely to each image. It is recorded as an ASCII string equivalent to hexadecimal notation and 128-bit fixed length.',
	},
	{
		tag: 0xa430,
		ifd: 'Photo',
		key: 'CameraOwnerName',
		datatype: 'Ascii',
		description:
			'This tag records the owner of a camera used in photography as an ASCII string.',
	},
	{
		tag: 0xa431,
		ifd: 'Photo',
		key: 'BodySerialNumber',
		datatype: 'Ascii',
		description:
			'This tag records the serial number of the body of the camera that was used in photography as an ASCII string.',
	},
	{
		tag: 0xa432,
		ifd: 'Photo',
		key: 'LensSpecification',
		datatype: 'Rational',
		description:
			'This tag notes minimum focal length, maximum focal length, minimum F number in the minimum focal length, and minimum F number in the maximum focal length, which are specification information for the lens that was used in photography. When the minimum F number is unknown, the notation is 0/0',
	},
	{
		tag: 0xa433,
		ifd: 'Photo',
		key: 'LensMake',
		datatype: 'Ascii',
		description: 'This tag records the lens manufactor as an ASCII string.',
	},
	{
		tag: 0xa434,
		ifd: 'Photo',
		key: 'LensModel',
		datatype: 'Ascii',
		description: "This tag records the lens's model name and model number as an ASCII string.",
	},
	{
		tag: 0xa435,
		ifd: 'Photo',
		key: 'LensSerialNumber',
		datatype: 'Ascii',
		description:
			'This tag records the serial number of the interchangeable lens that was used in photography as an ASCII string.',
	},
	{
		tag: 0xa436,
		ifd: 'Photo',
		key: 'ImageTitle',
		datatype: 'Ascii',
		description: 'This tag records the title of the image.',
	},
	{
		tag: 0xa437,
		ifd: 'Photo',
		key: 'Photographer',
		datatype: 'Ascii',
		description: 'This tag records the name of the photographer.',
	},
	{
		tag: 0xa438,
		ifd: 'Photo',
		key: 'ImageEditor',
		datatype: 'Ascii',
		description:
			'This tag records the name of the main person who edited the image. Preferably, a single name is written (individual name, group/organization name, etc.), but multiple main editors may be entered.',
	},
	{
		tag: 0xa439,
		ifd: 'Photo',
		key: 'CameraFirmware',
		datatype: 'Ascii',
		description:
			'This tag records the name and version of the software or firmware of the camera used to generate the image.',
	},
	{
		tag: 0xa43a,
		ifd: 'Photo',
		key: 'RAWDevelopingSoftware',
		datatype: 'Ascii',
		description:
			'This tag records the name and version of the software used to develop the RAW image.',
	},
	{
		tag: 0xa43b,
		ifd: 'Photo',
		key: 'ImageEditingSoftware',
		datatype: 'Ascii',
		description:
			'This tag records the name and version of the main software used for processing and editing the image. Preferably, a single software is written, but multiple main software may be entered.',
	},
	{
		tag: 0xa43c,
		ifd: 'Photo',
		key: 'MetadataEditingSoftware',
		datatype: 'Ascii',
		description:
			'This tag records the name and version of one software used to edit the metadata of the image without processing or editing of the image data itself.',
	},
	{
		tag: 0xa460,
		ifd: 'Photo',
		key: 'CompositeImage',
		datatype: 'Short',
		description: 'Indicates whether the recorded image is a composite image or not.',
	},
	{
		tag: 0xa461,
		ifd: 'Photo',
		key: 'SourceImageNumberOfCompositeImage',
		datatype: 'Short',
		description:
			'Indicates the number of the source images (tentatively recorded images) captured for a composite Image.',
	},
	{
		tag: 0xa462,
		ifd: 'Photo',
		key: 'SourceExposureTimesOfCompositeImage',
		datatype: 'Undefined',
		description:
			'For a composite image, records the parameters relating exposure time of the exposures for generating the said composite image, such as respective exposure times of captured source images (tentatively recorded images).',
	},
	{
		tag: 0xa500,
		ifd: 'Photo',
		key: 'Gamma',
		datatype: 'Rational',
		description:
			'Indicates the value of coefficient gamma. The formula of transfer function used for image reproduction is expressed as follows: (reproduced value) = (input value)^gamma. Both reproduced value and input value indicate normalized value, whose minimum value is 0 and maximum value is 1.',
	},
	{
		tag: 0x0001,
		ifd: 'Iop',
		key: 'InteroperabilityIndex',
		datatype: 'Ascii',
		description:
			'Indicates the identification of the Interoperability rule. Use "R98" for stating ExifR98 Rules. Four bytes used including the termination code (NULL). see the separate volume of Recommended Exif Interoperability Rules (ExifR98) for other tags used for ExifR98.',
	},
	{
		tag: 0x0002,
		ifd: 'Iop',
		key: 'InteroperabilityVersion',
		datatype: 'Undefined',
		description: 'Interoperability version',
	},
	{
		tag: 0x1000,
		ifd: 'Iop',
		key: 'RelatedImageFileFormat',
		datatype: 'Ascii',
		description: 'File format of image file',
	},
	{
		tag: 0x1001,
		ifd: 'Iop',
		key: 'RelatedImageWidth',
		datatype: 'Long',
		description: 'Image width',
	},
	{
		tag: 0x1002,
		ifd: 'Iop',
		key: 'RelatedImageLength',
		datatype: 'Long',
		description: 'Image height',
	},
	{
		tag: 0x0000,
		ifd: 'GPSInfo',
		key: 'GPSVersionID',
		datatype: 'Byte',
		description:
			'Indicates the version of <GPSInfoIFD>. The version is given as 2.0.0.0. This tag is mandatory when <GPSInfo> tag is present. (Note: The <GPSVersionID> tag is given in bytes, unlike the <ExifVersion> tag. When the version is 2.0.0.0, the tag value is 02000000.H).',
	},
	{
		tag: 0x0001,
		ifd: 'GPSInfo',
		key: 'GPSLatitudeRef',
		datatype: 'Ascii',
		description:
			'Indicates whether the latitude is north or south latitude. The ASCII value "N" indicates north latitude, and "S" is south latitude.',
	},
	{
		tag: 0x0002,
		ifd: 'GPSInfo',
		key: 'GPSLatitude',
		datatype: 'Rational',
		description:
			'Indicates the latitude. The latitude is expressed as three RATIONAL values giving the degrees, minutes, and seconds, respectively. When degrees, minutes and seconds are expressed, the format is dd/1,mm/1,ss/1. When degrees and minutes are used and, for example, fractions of minutes are given up to two decimal places, the format is dd/1,mmmm/100,0/1.',
	},
	{
		tag: 0x0003,
		ifd: 'GPSInfo',
		key: 'GPSLongitudeRef',
		datatype: 'Ascii',
		description:
			'Indicates whether the longitude is east or west longitude. ASCII "E" indicates east longitude, and "W" is west longitude.',
	},
	{
		tag: 0x0004,
		ifd: 'GPSInfo',
		key: 'GPSLongitude',
		datatype: 'Rational',
		description:
			'Indicates the longitude. The longitude is expressed as three RATIONAL values giving the degrees, minutes, and seconds, respectively. When degrees, minutes and seconds are expressed, the format is ddd/1,mm/1,ss/1. When degrees and minutes are used and, for example, fractions of minutes are given up to two decimal places, the format is ddd/1,mmmm/100,0/1.',
	},
	{
		tag: 0x0005,
		ifd: 'GPSInfo',
		key: 'GPSAltitudeRef',
		datatype: 'Byte',
		description:
			'Indicates the altitude used as the reference altitude. If the reference is sea level and the altitude is above sea level, 0 is given. If the altitude is below sea level, a value of 1 is given and the altitude is indicated as an absolute value in the GSPAltitude tag. The reference unit is meters. Note that this tag is BYTE type, unlike other reference tags.',
	},
	{
		tag: 0x0006,
		ifd: 'GPSInfo',
		key: 'GPSAltitude',
		datatype: 'Rational',
		description:
			'Indicates the altitude based on the reference in GPSAltitudeRef. Altitude is expressed as one RATIONAL value. The reference unit is meters.',
	},
	{
		tag: 0x0007,
		ifd: 'GPSInfo',
		key: 'GPSTimeStamp',
		datatype: 'Rational',
		description:
			'Indicates the time as UTC (Coordinated Universal Time). <TimeStamp> is expressed as three RATIONAL values giving the hour, minute, and second (atomic clock).',
	},
	{
		tag: 0x0008,
		ifd: 'GPSInfo',
		key: 'GPSSatellites',
		datatype: 'Ascii',
		description:
			'Indicates the GPS satellites used for measurements. This tag can be used to describe the number of satellites, their ID number, angle of elevation, azimuth, SNR and other information in ASCII notation. The format is not specified. If the GPS receiver is incapable of taking measurements, value of the tag is set to NULL.',
	},
	{
		tag: 0x0009,
		ifd: 'GPSInfo',
		key: 'GPSStatus',
		datatype: 'Ascii',
		description:
			'Indicates the status of the GPS receiver when the image is recorded. "A" means measurement is in progress, and "V" means the measurement is Interoperability.',
	},
	{
		tag: 0x000a,
		ifd: 'GPSInfo',
		key: 'GPSMeasureMode',
		datatype: 'Ascii',
		description:
			'Indicates the GPS measurement mode. "2" means two-dimensional measurement and "3" means three-dimensional measurement is in progress.',
	},
	{
		tag: 0x000b,
		ifd: 'GPSInfo',
		key: 'GPSDOP',
		datatype: 'Rational',
		description:
			'Indicates the GPS DOP (data degree of precision). An HDOP value is written during two-dimensional measurement, and PDOP during three-dimensional measurement.',
	},
	{
		tag: 0x000c,
		ifd: 'GPSInfo',
		key: 'GPSSpeedRef',
		datatype: 'Ascii',
		description:
			'Indicates the unit used to express the GPS receiver speed of movement. "K" "M" and "N" represents kilometers per hour, miles per hour, and knots.',
	},
	{
		tag: 0x000d,
		ifd: 'GPSInfo',
		key: 'GPSSpeed',
		datatype: 'Rational',
		description: 'Indicates the speed of GPS receiver movement.',
	},
	{
		tag: 0x000e,
		ifd: 'GPSInfo',
		key: 'GPSTrackRef',
		datatype: 'Ascii',
		description:
			'Indicates the reference for giving the direction of GPS receiver movement. "T" denotes true direction and "M" is magnetic direction.',
	},
	{
		tag: 0x000f,
		ifd: 'GPSInfo',
		key: 'GPSTrack',
		datatype: 'Rational',
		description:
			'Indicates the direction of GPS receiver movement. The range of values is from 0.00 to 359.99.',
	},
	{
		tag: 0x0010,
		ifd: 'GPSInfo',
		key: 'GPSImgDirectionRef',
		datatype: 'Ascii',
		description:
			'Indicates the reference for giving the direction of the image when it is captured. "T" denotes true direction and "M" is magnetic direction.',
	},
	{
		tag: 0x0011,
		ifd: 'GPSInfo',
		key: 'GPSImgDirection',
		datatype: 'Rational',
		description:
			'Indicates the direction of the image when it was captured. The range of values is from 0.00 to 359.99.',
	},
	{
		tag: 0x0012,
		ifd: 'GPSInfo',
		key: 'GPSMapDatum',
		datatype: 'Ascii',
		description:
			'Indicates the geodetic survey data used by the GPS receiver. If the survey data is restricted to Japan, the value of this tag is "TOKYO" or "WGS-84".',
	},
	{
		tag: 0x0013,
		ifd: 'GPSInfo',
		key: 'GPSDestLatitudeRef',
		datatype: 'Ascii',
		description:
			'Indicates whether the latitude of the destination point is north or south latitude. The ASCII value "N" indicates north latitude, and "S" is south latitude.',
	},
	{
		tag: 0x0014,
		ifd: 'GPSInfo',
		key: 'GPSDestLatitude',
		datatype: 'Rational',
		description:
			'Indicates the latitude of the destination point. The latitude is expressed as three RATIONAL values giving the degrees, minutes, and seconds, respectively. If latitude is expressed as degrees, minutes and seconds, a typical format would be dd/1,mm/1,ss/1. When degrees and minutes are used and, for example, fractions of minutes are given up to two decimal places, the format would be dd/1,mmmm/100,0/1.',
	},
	{
		tag: 0x0015,
		ifd: 'GPSInfo',
		key: 'GPSDestLongitudeRef',
		datatype: 'Ascii',
		description:
			'Indicates whether the longitude of the destination point is east or west longitude. ASCII "E" indicates east longitude, and "W" is west longitude.',
	},
	{
		tag: 0x0016,
		ifd: 'GPSInfo',
		key: 'GPSDestLongitude',
		datatype: 'Rational',
		description:
			'Indicates the longitude of the destination point. The longitude is expressed as three RATIONAL values giving the degrees, minutes, and seconds, respectively. If longitude is expressed as degrees, minutes and seconds, a typical format would be ddd/1,mm/1,ss/1. When degrees and minutes are used and, for example, fractions of minutes are given up to two decimal places, the format would be ddd/1,mmmm/100,0/1.',
	},
	{
		tag: 0x0017,
		ifd: 'GPSInfo',
		key: 'GPSDestBearingRef',
		datatype: 'Ascii',
		description:
			'Indicates the reference used for giving the bearing to the destination point. "T" denotes true direction and "M" is magnetic direction.',
	},
	{
		tag: 0x0018,
		ifd: 'GPSInfo',
		key: 'GPSDestBearing',
		datatype: 'Rational',
		description:
			'Indicates the bearing to the destination point. The range of values is from 0.00 to 359.99.',
	},
	{
		tag: 0x0019,
		ifd: 'GPSInfo',
		key: 'GPSDestDistanceRef',
		datatype: 'Ascii',
		description:
			'Indicates the unit used to express the distance to the destination point. "K", "M" and "N" represent kilometers, miles and nautical miles.',
	},
	{
		tag: 0x001a,
		ifd: 'GPSInfo',
		key: 'GPSDestDistance',
		datatype: 'Rational',
		description: 'Indicates the distance to the destination point.',
	},
	{
		tag: 0x001b,
		ifd: 'GPSInfo',
		key: 'GPSProcessingMethod',
		datatype: 'Comment',
		description:
			'A character string recording the name of the method used for location finding. The string encoding is defined using the same scheme as UserComment.',
	},
	{
		tag: 0x001c,
		ifd: 'GPSInfo',
		key: 'GPSAreaInformation',
		datatype: 'Comment',
		description:
			'A character string recording the name of the GPS area.The string encoding is defined using the same scheme as UserComment.',
	},
	{
		tag: 0x001d,
		ifd: 'GPSInfo',
		key: 'GPSDateStamp',
		datatype: 'Ascii',
		description:
			'A character string recording date and time information relative to UTC (Coordinated Universal Time). The format is "YYYY:MM:DD.".',
	},
	{
		tag: 0x001e,
		ifd: 'GPSInfo',
		key: 'GPSDifferential',
		datatype: 'Short',
		description: 'Indicates whether differential correction is applied to the GPS receiver.',
	},
	{
		tag: 0x001f,
		ifd: 'GPSInfo',
		key: 'GPSHPositioningError',
		datatype: 'Rational',
		description: 'This tag indicates horizontal positioning errors in meters.',
	},
	{
		tag: 0xb000,
		ifd: 'MpfInfo',
		key: 'MPFVersion',
		datatype: 'Ascii',
		description: 'MPF Version',
	},
	{
		tag: 0xb001,
		ifd: 'MpfInfo',
		key: 'MPFNumberOfImages',
		datatype: 'Undefined',
		description: 'MPF Number of Images',
	},
	{
		tag: 0xb002,
		ifd: 'MpfInfo',
		key: 'MPFImageList',
		datatype: 'Ascii',
		description: 'MPF Image List',
	},
	{
		tag: 0xb003,
		ifd: 'MpfInfo',
		key: 'MPFImageUIDList',
		datatype: 'Long',
		description: 'MPF Image UID List',
	},
	{
		tag: 0xb004,
		ifd: 'MpfInfo',
		key: 'MPFTotalFrames',
		datatype: 'Long',
		description: 'MPF Total Frames',
	},
	{
		tag: 0xb101,
		ifd: 'MpfInfo',
		key: 'MPFIndividualNum',
		datatype: 'Long',
		description: 'MPF Individual Num',
	},
	{
		tag: 0xb201,
		ifd: 'MpfInfo',
		key: 'MPFPanOrientation',
		datatype: 'Long',
		description: 'MPFPanOrientation',
	},
	{
		tag: 0xb202,
		ifd: 'MpfInfo',
		key: 'MPFPanOverlapH',
		datatype: 'Long',
		description: 'MPF Pan Overlap Horizontal',
	},
	{
		tag: 0xb203,
		ifd: 'MpfInfo',
		key: 'MPFPanOverlapV',
		datatype: 'Long',
		description: 'MPF Pan Overlap Vertical',
	},
	{
		tag: 0xb204,
		ifd: 'MpfInfo',
		key: 'MPFBaseViewpointNum',
		datatype: 'Long',
		description: 'MPF Base Viewpoint Number',
	},
	{
		tag: 0xb205,
		ifd: 'MpfInfo',
		key: 'MPFConvergenceAngle',
		datatype: 'Long',
		description: 'MPF Convergence Angle',
	},
	{
		tag: 0xb206,
		ifd: 'MpfInfo',
		key: 'MPFBaselineLength',
		datatype: 'Long',
		description: 'MPF Baseline Length',
	},
	{
		tag: 0xb207,
		ifd: 'MpfInfo',
		key: 'MPFVerticalDivergence',
		datatype: 'Long',
		description: 'MPF Vertical Divergence',
	},
	{
		tag: 0xb208,
		ifd: 'MpfInfo',
		key: 'MPFAxisDistanceX',
		datatype: 'Long',
		description: 'MPF Axis Distance X',
	},
	{
		tag: 0xb209,
		ifd: 'MpfInfo',
		key: 'MPFAxisDistanceY',
		datatype: 'Long',
		description: 'MPF Axis Distance Y',
	},
	{
		tag: 0xb20a,
		ifd: 'MpfInfo',
		key: 'MPFAxisDistanceZ',
		datatype: 'Long',
		description: 'MPF Axis Distance Z',
	},
	{
		tag: 0xb20b,
		ifd: 'MpfInfo',
		key: 'MPFYawAngle',
		datatype: 'Long',
		description: 'MPF Yaw Angle',
	},
	{
		tag: 0xb20c,
		ifd: 'MpfInfo',
		key: 'MPFPitchAngle',
		datatype: 'Long',
		description: 'MPF Pitch Angle',
	},
	{
		tag: 0xb20d,
		ifd: 'MpfInfo',
		key: 'MPFRollAngle',
		datatype: 'Long',
		description: 'MPF Roll Angle',
	},
] as const;

export type ExifFieldKey = (typeof FIELDS)[number]['key'];
