import{c as Se,a as w,t as L}from"../chunks/Yi9iuJrU.js";import{ag as Ie,G as j,f as ve,ah as Fe,g as D,s as De,M,c as A,a as O,r as B,t as $,ai as Pe,b as be}from"../chunks/QTVBrZQz.js";import{s as Te}from"../chunks/BijaW5W9.js";import{a as Ae}from"../chunks/rnCxOP1T.js";import{i as Be}from"../chunks/DC0ZX6qe.js";import{b as Re,a as ye}from"../chunks/DPbpzs5i.js";import{p as we}from"../chunks/DE1d3na4.js";import _e from"../chunks/C-BegKnv.js";import{t as Le}from"../chunks/g6gg4Xl4.js";import{a as Oe,b as Me}from"../chunks/CXhtr36u.js";import Ue from"../chunks/DDvrT1qJ.js";import{h as Ge,o as pe,B as J,t as y,g as Ne}from"../chunks/DpDfwQNo.js";import{s as ge}from"../chunks/DlNUTHgY.js";import{t as Y}from"../chunks/DEGt8sW1.js";import{i as K,f as Q,b as ze,d as Ve,c as We,g as Z,s as ke}from"../chunks/CyML6FGS.js";import{e as Xe,T as He,a as qe,h as ee,l as Ye}from"../chunks/DF3AhSVV.js";import U from"../chunks/BIWbyXLX.js";import{u as P}from"../chunks/BXkCq4b2.js";import{a as T}from"../chunks/6--iqVZy.js";function te(e,t){const a=Ge(e,t==null?void 0:t.in);if(isNaN(+a))throw new RangeError("Invalid time value");let r="",x="";const i="-",o=":";{const n=T(a.getDate(),2),s=T(a.getMonth()+1,2);r=`${T(a.getFullYear(),4)}${i}${s}${i}${n}`}{const n=a.getTimezoneOffset();if(n!==0){const u=Math.abs(n),g=T(Math.trunc(u/60),2),m=T(u%60,2);x=`${n<0?"+":"-"}${g}:${m}`}else x="Z";const s=T(a.getHours(),2),d=T(a.getMinutes(),2),h=T(a.getSeconds(),2),E=r===""?"":"T",f=[s,d,h].join(o);r=`${r}${E}${f}${x}`}return r}var G,re;function je(){return re||(re=1,G={parseSections:function(e,t){var a,r;for(e.setBigEndian(!0);e.remainingLength()>0&&r!==218;){if(e.nextUInt8()!==255)throw new Error("Invalid JPEG section offset");r=e.nextUInt8(),r>=208&&r<=217||r===218?a=0:a=e.nextUInt16()-2,t(r,e.branch(0,a)),e.skip(a)}},getSizeFromSOFSection:function(e){return e.skip(1),{height:e.nextUInt16(),width:e.nextUInt16()}},getSectionName:function(e){var t,a;switch(e){case 216:t="SOI";break;case 196:t="DHT";break;case 219:t="DQT";break;case 221:t="DRI";break;case 218:t="SOS";break;case 254:t="COM";break;case 217:t="EOI";break;default:e>=224&&e<=239?(t="APP",a=e-224):e>=192&&e<=207&&e!==196&&e!==200&&e!==204?(t="SOF",a=e-192):e>=208&&e<=215&&(t="RST",a=e-208);break}var r={name:t};return typeof a=="number"&&(r.index=a),r}}),G}var N,ae;function Ce(){if(ae)return N;ae=1;function e(i,o){switch(i){case 1:return o.nextUInt8();case 3:return o.nextUInt16();case 4:return o.nextUInt32();case 5:return[o.nextUInt32(),o.nextUInt32()];case 6:return o.nextInt8();case 8:return o.nextUInt16();case 9:return o.nextUInt32();case 10:return[o.nextInt32(),o.nextInt32()];case 11:return o.nextFloat();case 12:return o.nextDouble();default:throw new Error("Invalid format while decoding: "+i)}}function t(i){switch(i){case 1:case 2:case 6:case 7:return 1;case 3:case 8:return 2;case 4:case 9:case 11:return 4;case 5:case 10:case 12:return 8;default:return 0}}function a(i,o){var n=o.nextUInt16(),s=o.nextUInt16(),d=t(s),h=o.nextUInt32(),E=d*h,f,u;if(E>4&&(o=i.openWithOffset(o.nextUInt32())),s===2){f=o.nextString(h);var g=f.indexOf("\0");g!==-1&&(f=f.substr(0,g))}else if(s===7)f=o.nextBuffer(h);else if(s!==0)for(f=[],u=0;u<h;++u)f.push(e(s,o));return E<4&&o.skip(4-E),[n,f,s]}function r(i,o,n){var s=o.nextUInt16(),d,h;for(h=0;h<s;++h)d=a(i,o),n(d[0],d[1],d[2])}function x(i){var o=i.nextString(6);if(o!=="Exif\0\0")throw new Error("Invalid EXIF header");var n=i.mark(),s=i.nextUInt16();if(s===18761)i.setBigEndian(!1);else if(s===19789)i.setBigEndian(!0);else throw new Error("Invalid TIFF header");if(i.nextUInt16()!==42)throw new Error("Invalid TIFF data");return n}return N={IFD0:1,IFD1:2,GPSIFD:3,SubIFD:4,InteropIFD:5,parseTags:function(i,o){var n;try{n=x(i)}catch{return!1}var s,d,h,E=n.openWithOffset(i.nextUInt32()),f=this.IFD0;r(n,E,function(C,S,F){switch(C){case 34853:d=S[0];break;case 34665:s=S[0];break;default:o(f,C,S,F);break}});var u=E.nextUInt32();if(u!==0){var g=n.openWithOffset(u);r(n,g,o.bind(null,this.IFD1))}if(d){var m=n.openWithOffset(d);r(n,m,o.bind(null,this.GPSIFD))}if(s){var p=n.openWithOffset(s),c=this.InteropIFD;r(n,p,function(C,S,F){C===40965?h=S[0]:o(c,C,S,F)})}if(h){var l=n.openWithOffset(h);r(n,l,o.bind(null,this.InteropIFD))}return!0}},N}var z,ie;function $e(){if(ie)return z;ie=1;function e(n){return parseInt(n,10)}var t=3600,a=60;function r(n,s){n=n.map(e),s=s.map(e);var d=n[0],h=n[1]-1,E=n[2],f=s[0],u=s[1],g=s[2],m=Date.UTC(d,h,E,f,u,g,0),p=m/1e3;return p}function x(n){var s=n.substr(0,10).split("-"),d=n.substr(11,8).split(":"),h=n.substr(19,6),E=h.split(":").map(e),f=E[0]*t+E[1]*a,u=r(s,d);if(u-=f,typeof u=="number"&&!isNaN(u))return u}function i(n){var s=n.split(" "),d=s[0].split(":"),h=s[1].split(":"),E=r(d,h);if(typeof E=="number"&&!isNaN(E))return E}function o(n){var s=n.length===19&&n.charAt(4)===":",d=n.length===25&&n.charAt(10)==="T";if(d)return x(n);if(s)return i(n)}return z={parseDateWithSpecFormat:i,parseDateWithTimezoneFormat:x,parseExifDate:o},z}var V,ne;function Je(){if(ne)return V;ne=1;var e=Ce(),t=$e(),a=[{section:e.GPSIFD,type:2,name:"GPSLatitude",refType:1,refName:"GPSLatitudeRef",posVal:"N"},{section:e.GPSIFD,type:4,name:"GPSLongitude",refType:3,refName:"GPSLongitudeRef",posVal:"E"}],r=[{section:e.SubIFD,type:306,name:"ModifyDate"},{section:e.SubIFD,type:36867,name:"DateTimeOriginal"},{section:e.SubIFD,type:36868,name:"CreateDate"},{section:e.SubIFD,type:306,name:"ModifyDate"}];return V={castDegreeValues:function(x,i){a.forEach(function(o){var n=x(o);if(n){var s=x({section:o.section,type:o.refType,name:o.refName}),d=s===o.posVal?1:-1,h=(n[0]+n[1]/60+n[2]/3600)*d;i(o,h)}})},castDateValues:function(x,i){r.forEach(function(o){var n=x(o);if(n){var s=t.parseExifDate(n);typeof s<"u"&&i(o,s)}})},simplifyValue:function(x,i){return Array.isArray(x)&&(x=x.map(function(o){return i===10||i===5?o[0]/o[1]:o}),x.length===1&&(x=x[0])),x}},V}var W,oe;function Ke(){return oe||(oe=1,W={exif:{1:"InteropIndex",2:"InteropVersion",11:"ProcessingSoftware",254:"SubfileType",255:"OldSubfileType",256:"ImageWidth",257:"ImageHeight",258:"BitsPerSample",259:"Compression",262:"PhotometricInterpretation",263:"Thresholding",264:"CellWidth",265:"CellLength",266:"FillOrder",269:"DocumentName",270:"ImageDescription",271:"Make",272:"Model",273:"StripOffsets",274:"Orientation",277:"SamplesPerPixel",278:"RowsPerStrip",279:"StripByteCounts",280:"MinSampleValue",281:"MaxSampleValue",282:"XResolution",283:"YResolution",284:"PlanarConfiguration",285:"PageName",286:"XPosition",287:"YPosition",288:"FreeOffsets",289:"FreeByteCounts",290:"GrayResponseUnit",291:"GrayResponseCurve",292:"T4Options",293:"T6Options",296:"ResolutionUnit",297:"PageNumber",300:"ColorResponseUnit",301:"TransferFunction",305:"Software",306:"ModifyDate",315:"Artist",316:"HostComputer",317:"Predictor",318:"WhitePoint",319:"PrimaryChromaticities",320:"ColorMap",321:"HalftoneHints",322:"TileWidth",323:"TileLength",324:"TileOffsets",325:"TileByteCounts",326:"BadFaxLines",327:"CleanFaxData",328:"ConsecutiveBadFaxLines",330:"SubIFD",332:"InkSet",333:"InkNames",334:"NumberofInks",336:"DotRange",337:"TargetPrinter",338:"ExtraSamples",339:"SampleFormat",340:"SMinSampleValue",341:"SMaxSampleValue",342:"TransferRange",343:"ClipPath",344:"XClipPathUnits",345:"YClipPathUnits",346:"Indexed",347:"JPEGTables",351:"OPIProxy",400:"GlobalParametersIFD",401:"ProfileType",402:"FaxProfile",403:"CodingMethods",404:"VersionYear",405:"ModeNumber",433:"Decode",434:"DefaultImageColor",435:"T82Options",437:"JPEGTables",512:"JPEGProc",513:"ThumbnailOffset",514:"ThumbnailLength",515:"JPEGRestartInterval",517:"JPEGLosslessPredictors",518:"JPEGPointTransforms",519:"JPEGQTables",520:"JPEGDCTables",521:"JPEGACTables",529:"YCbCrCoefficients",530:"YCbCrSubSampling",531:"YCbCrPositioning",532:"ReferenceBlackWhite",559:"StripRowCounts",700:"ApplicationNotes",999:"USPTOMiscellaneous",4096:"RelatedImageFileFormat",4097:"RelatedImageWidth",4098:"RelatedImageHeight",18246:"Rating",18247:"XP_DIP_XML",18248:"StitchInfo",18249:"RatingPercent",32781:"ImageID",32931:"WangTag1",32932:"WangAnnotation",32933:"WangTag3",32934:"WangTag4",32995:"Matteing",32996:"DataType",32997:"ImageDepth",32998:"TileDepth",33405:"Model2",33421:"CFARepeatPatternDim",33422:"CFAPattern2",33423:"BatteryLevel",33424:"KodakIFD",33432:"Copyright",33434:"ExposureTime",33437:"FNumber",33445:"MDFileTag",33446:"MDScalePixel",33447:"MDColorTable",33448:"MDLabName",33449:"MDSampleInfo",33450:"MDPrepDate",33451:"MDPrepTime",33452:"MDFileUnits",33550:"PixelScale",33589:"AdventScale",33590:"AdventRevision",33628:"UIC1Tag",33629:"UIC2Tag",33630:"UIC3Tag",33631:"UIC4Tag",33723:"IPTC-NAA",33918:"IntergraphPacketData",33919:"IntergraphFlagRegisters",33920:"IntergraphMatrix",33921:"INGRReserved",33922:"ModelTiePoint",34016:"Site",34017:"ColorSequence",34018:"IT8Header",34019:"RasterPadding",34020:"BitsPerRunLength",34021:"BitsPerExtendedRunLength",34022:"ColorTable",34023:"ImageColorIndicator",34024:"BackgroundColorIndicator",34025:"ImageColorValue",34026:"BackgroundColorValue",34027:"PixelIntensityRange",34028:"TransparencyIndicator",34029:"ColorCharacterization",34030:"HCUsage",34031:"TrapIndicator",34032:"CMYKEquivalent",34118:"SEMInfo",34152:"AFCP_IPTC",34232:"PixelMagicJBIGOptions",34264:"ModelTransform",34306:"WB_GRGBLevels",34310:"LeafData",34377:"PhotoshopSettings",34665:"ExifOffset",34675:"ICC_Profile",34687:"TIFF_FXExtensions",34688:"MultiProfiles",34689:"SharedData",34690:"T88Options",34732:"ImageLayer",34735:"GeoTiffDirectory",34736:"GeoTiffDoubleParams",34737:"GeoTiffAsciiParams",34850:"ExposureProgram",34852:"SpectralSensitivity",34853:"GPSInfo",34855:"ISO",34856:"Opto-ElectricConvFactor",34857:"Interlace",34858:"TimeZoneOffset",34859:"SelfTimerMode",34864:"SensitivityType",34865:"StandardOutputSensitivity",34866:"RecommendedExposureIndex",34867:"ISOSpeed",34868:"ISOSpeedLatitudeyyy",34869:"ISOSpeedLatitudezzz",34908:"FaxRecvParams",34909:"FaxSubAddress",34910:"FaxRecvTime",34954:"LeafSubIFD",36864:"ExifVersion",36867:"DateTimeOriginal",36868:"CreateDate",37121:"ComponentsConfiguration",37122:"CompressedBitsPerPixel",37377:"ShutterSpeedValue",37378:"ApertureValue",37379:"BrightnessValue",37380:"ExposureCompensation",37381:"MaxApertureValue",37382:"SubjectDistance",37383:"MeteringMode",37384:"LightSource",37385:"Flash",37386:"FocalLength",37387:"FlashEnergy",37388:"SpatialFrequencyResponse",37389:"Noise",37390:"FocalPlaneXResolution",37391:"FocalPlaneYResolution",37392:"FocalPlaneResolutionUnit",37393:"ImageNumber",37394:"SecurityClassification",37395:"ImageHistory",37396:"SubjectArea",37397:"ExposureIndex",37398:"TIFF-EPStandardID",37399:"SensingMethod",37434:"CIP3DataFile",37435:"CIP3Sheet",37436:"CIP3Side",37439:"StoNits",37500:"MakerNote",37510:"UserComment",37520:"SubSecTime",37521:"SubSecTimeOriginal",37522:"SubSecTimeDigitized",37679:"MSDocumentText",37680:"MSPropertySetStorage",37681:"MSDocumentTextPosition",37724:"ImageSourceData",40091:"XPTitle",40092:"XPComment",40093:"XPAuthor",40094:"XPKeywords",40095:"XPSubject",40960:"FlashpixVersion",40961:"ColorSpace",40962:"ExifImageWidth",40963:"ExifImageHeight",40964:"RelatedSoundFile",40965:"InteropOffset",41483:"FlashEnergy",41484:"SpatialFrequencyResponse",41485:"Noise",41486:"FocalPlaneXResolution",41487:"FocalPlaneYResolution",41488:"FocalPlaneResolutionUnit",41489:"ImageNumber",41490:"SecurityClassification",41491:"ImageHistory",41492:"SubjectLocation",41493:"ExposureIndex",41494:"TIFF-EPStandardID",41495:"SensingMethod",41728:"FileSource",41729:"SceneType",41730:"CFAPattern",41985:"CustomRendered",41986:"ExposureMode",41987:"WhiteBalance",41988:"DigitalZoomRatio",41989:"FocalLengthIn35mmFormat",41990:"SceneCaptureType",41991:"GainControl",41992:"Contrast",41993:"Saturation",41994:"Sharpness",41995:"DeviceSettingDescription",41996:"SubjectDistanceRange",42016:"ImageUniqueID",42032:"OwnerName",42033:"SerialNumber",42034:"LensInfo",42035:"LensMake",42036:"LensModel",42037:"LensSerialNumber",42112:"GDALMetadata",42113:"GDALNoData",42240:"Gamma",44992:"ExpandSoftware",44993:"ExpandLens",44994:"ExpandFilm",44995:"ExpandFilterLens",44996:"ExpandScanner",44997:"ExpandFlashLamp",48129:"PixelFormat",48130:"Transformation",48131:"Uncompressed",48132:"ImageType",48256:"ImageWidth",48257:"ImageHeight",48258:"WidthResolution",48259:"HeightResolution",48320:"ImageOffset",48321:"ImageByteCount",48322:"AlphaOffset",48323:"AlphaByteCount",48324:"ImageDataDiscard",48325:"AlphaDataDiscard",50215:"OceScanjobDesc",50216:"OceApplicationSelector",50217:"OceIDNumber",50218:"OceImageLogic",50255:"Annotations",50341:"PrintIM",50560:"USPTOOriginalContentType",50706:"DNGVersion",50707:"DNGBackwardVersion",50708:"UniqueCameraModel",50709:"LocalizedCameraModel",50710:"CFAPlaneColor",50711:"CFALayout",50712:"LinearizationTable",50713:"BlackLevelRepeatDim",50714:"BlackLevel",50715:"BlackLevelDeltaH",50716:"BlackLevelDeltaV",50717:"WhiteLevel",50718:"DefaultScale",50719:"DefaultCropOrigin",50720:"DefaultCropSize",50721:"ColorMatrix1",50722:"ColorMatrix2",50723:"CameraCalibration1",50724:"CameraCalibration2",50725:"ReductionMatrix1",50726:"ReductionMatrix2",50727:"AnalogBalance",50728:"AsShotNeutral",50729:"AsShotWhiteXY",50730:"BaselineExposure",50731:"BaselineNoise",50732:"BaselineSharpness",50733:"BayerGreenSplit",50734:"LinearResponseLimit",50735:"CameraSerialNumber",50736:"DNGLensInfo",50737:"ChromaBlurRadius",50738:"AntiAliasStrength",50739:"ShadowScale",50740:"DNGPrivateData",50741:"MakerNoteSafety",50752:"RawImageSegmentation",50778:"CalibrationIlluminant1",50779:"CalibrationIlluminant2",50780:"BestQualityScale",50781:"RawDataUniqueID",50784:"AliasLayerMetadata",50827:"OriginalRawFileName",50828:"OriginalRawFileData",50829:"ActiveArea",50830:"MaskedAreas",50831:"AsShotICCProfile",50832:"AsShotPreProfileMatrix",50833:"CurrentICCProfile",50834:"CurrentPreProfileMatrix",50879:"ColorimetricReference",50898:"PanasonicTitle",50899:"PanasonicTitle2",50931:"CameraCalibrationSig",50932:"ProfileCalibrationSig",50933:"ProfileIFD",50934:"AsShotProfileName",50935:"NoiseReductionApplied",50936:"ProfileName",50937:"ProfileHueSatMapDims",50938:"ProfileHueSatMapData1",50939:"ProfileHueSatMapData2",50940:"ProfileToneCurve",50941:"ProfileEmbedPolicy",50942:"ProfileCopyright",50964:"ForwardMatrix1",50965:"ForwardMatrix2",50966:"PreviewApplicationName",50967:"PreviewApplicationVersion",50968:"PreviewSettingsName",50969:"PreviewSettingsDigest",50970:"PreviewColorSpace",50971:"PreviewDateTime",50972:"RawImageDigest",50973:"OriginalRawFileDigest",50974:"SubTileBlockSize",50975:"RowInterleaveFactor",50981:"ProfileLookTableDims",50982:"ProfileLookTableData",51008:"OpcodeList1",51009:"OpcodeList2",51022:"OpcodeList3",51041:"NoiseProfile",51043:"TimeCodes",51044:"FrameRate",51058:"TStop",51081:"ReelName",51089:"OriginalDefaultFinalSize",51090:"OriginalBestQualitySize",51091:"OriginalDefaultCropSize",51105:"CameraLabel",51107:"ProfileHueSatMapEncoding",51108:"ProfileLookTableEncoding",51109:"BaselineExposureOffset",51110:"DefaultBlackRender",51111:"NewRawImageDigest",51112:"RawToPreviewGain",51125:"DefaultUserCrop",59932:"Padding",59933:"OffsetSchema",65e3:"OwnerName",65001:"SerialNumber",65002:"Lens",65024:"KDC_IFD",65100:"RawFile",65101:"Converter",65102:"WhiteBalance",65105:"Exposure",65106:"Shadows",65107:"Brightness",65108:"Contrast",65109:"Saturation",65110:"Sharpness",65111:"Smoothness",65112:"MoireFilter"},gps:{0:"GPSVersionID",1:"GPSLatitudeRef",2:"GPSLatitude",3:"GPSLongitudeRef",4:"GPSLongitude",5:"GPSAltitudeRef",6:"GPSAltitude",7:"GPSTimeStamp",8:"GPSSatellites",9:"GPSStatus",10:"GPSMeasureMode",11:"GPSDOP",12:"GPSSpeedRef",13:"GPSSpeed",14:"GPSTrackRef",15:"GPSTrack",16:"GPSImgDirectionRef",17:"GPSImgDirection",18:"GPSMapDatum",19:"GPSDestLatitudeRef",20:"GPSDestLatitude",21:"GPSDestLongitudeRef",22:"GPSDestLongitude",23:"GPSDestBearingRef",24:"GPSDestBearing",25:"GPSDestDistanceRef",26:"GPSDestDistance",27:"GPSProcessingMethod",28:"GPSAreaInformation",29:"GPSDateStamp",30:"GPSDifferential",31:"GPSHPositioningError"}}),W}var k,se;function Qe(){if(se)return k;se=1;var e=je(),t=Ce(),a=Je();function r(i,o,n,s,d,h,E){this.startMarker=i,this.tags=o,this.imageSize=n,this.thumbnailOffset=s,this.thumbnailLength=d,this.thumbnailType=h,this.app1Offset=E}r.prototype={hasThumbnail:function(i){return!this.thumbnailOffset||!this.thumbnailLength?!1:typeof i!="string"?!0:i.toLowerCase().trim()==="image/jpeg"?this.thumbnailType===6:i.toLowerCase().trim()==="image/tiff"?this.thumbnailType===1:!1},getThumbnailOffset:function(){return this.app1Offset+6+this.thumbnailOffset},getThumbnailLength:function(){return this.thumbnailLength},getThumbnailBuffer:function(){return this._getThumbnailStream().nextBuffer(this.thumbnailLength)},_getThumbnailStream:function(){return this.startMarker.openWithOffset(this.getThumbnailOffset())},getImageSize:function(){return this.imageSize},getThumbnailSize:function(){var i=this._getThumbnailStream(),o;return e.parseSections(i,function(n,s){e.getSectionName(n).name==="SOF"&&(o=e.getSizeFromSOFSection(s))}),o}};function x(i){this.stream=i,this.flags={readBinaryTags:!1,resolveTagNames:!0,simplifyValues:!0,imageSize:!0,hidePointers:!0,returnTags:!0}}return x.prototype={enableBinaryFields:function(i){return this.flags.readBinaryTags=!!i,this},enablePointers:function(i){return this.flags.hidePointers=!i,this},enableTagNames:function(i){return this.flags.resolveTagNames=!!i,this},enableImageSize:function(i){return this.flags.imageSize=!!i,this},enableReturnTags:function(i){return this.flags.returnTags=!!i,this},enableSimpleValues:function(i){return this.flags.simplifyValues=!!i,this},parse:function(){var i=this.stream.mark(),o=i.openWithOffset(0),n=this.flags,s,d,h,E,f,u,g,m,p;return n.resolveTagNames&&(g=Ke()),n.resolveTagNames?(s={},m=function(c){return s[c.name]},p=function(c,l){s[c.name]=l}):(s=[],m=function(c){var l;for(l=0;l<s.length;++l)if(s[l].type===c.type&&s[l].section===c.section)return s.value},p=function(c,l){var C;for(C=0;C<s.length;++C)if(s[C].type===c.type&&s[C].section===c.section){s.value=l;return}}),e.parseSections(o,function(c,l){var C,S=l.offsetFrom(i);c===225?(C=t.parseTags(l,function(F,I,v,b){if(!(!n.readBinaryTags&&b===7)){if(I===513){if(h=v[0],n.hidePointers)return}else if(I===514){if(E=v[0],n.hidePointers)return}else if(I===259&&(f=v[0],n.hidePointers))return;if(n.returnTags)if(n.simplifyValues&&(v=a.simplifyValue(v,b)),n.resolveTagNames){var _=F===t.GPSIFD?g.gps:g.exif,R=_[I];R||(R=g.exif[I]),s.hasOwnProperty(R)||(s[R]=v)}else s.push({section:F,type:I,value:v})}}),C&&(u=S)):n.imageSize&&e.getSectionName(c).name==="SOF"&&(d=e.getSizeFromSOFSection(l))}),n.simplifyValues&&(a.castDegreeValues(m,p),a.castDateValues(m,p)),new r(i,s,d,h,E,f,u)}},k=x,k}var X,fe;function Ze(){if(fe)return X;fe=1;function e(t,a,r,x,i,o){this.global=i,a=a||0,r=r||t.byteLength-a,this.arrayBuffer=t.slice(a,a+r),this.view=new i.DataView(this.arrayBuffer,0,this.arrayBuffer.byteLength),this.setBigEndian(x),this.offset=0,this.parentOffset=(o||0)+a}return e.prototype={setBigEndian:function(t){this.littleEndian=!t},nextUInt8:function(){var t=this.view.getUint8(this.offset);return this.offset+=1,t},nextInt8:function(){var t=this.view.getInt8(this.offset);return this.offset+=1,t},nextUInt16:function(){var t=this.view.getUint16(this.offset,this.littleEndian);return this.offset+=2,t},nextUInt32:function(){var t=this.view.getUint32(this.offset,this.littleEndian);return this.offset+=4,t},nextInt16:function(){var t=this.view.getInt16(this.offset,this.littleEndian);return this.offset+=2,t},nextInt32:function(){var t=this.view.getInt32(this.offset,this.littleEndian);return this.offset+=4,t},nextFloat:function(){var t=this.view.getFloat32(this.offset,this.littleEndian);return this.offset+=4,t},nextDouble:function(){var t=this.view.getFloat64(this.offset,this.littleEndian);return this.offset+=8,t},nextBuffer:function(t){var a=this.arrayBuffer.slice(this.offset,this.offset+t);return this.offset+=t,a},remainingLength:function(){return this.arrayBuffer.byteLength-this.offset},nextString:function(t){var a=this.arrayBuffer.slice(this.offset,this.offset+t);return a=String.fromCharCode.apply(null,new this.global.Uint8Array(a)),this.offset+=t,a},mark:function(){var t=this;return{openWithOffset:function(a){return a=(a||0)+this.offset,new e(t.arrayBuffer,a,t.arrayBuffer.byteLength-a,!t.littleEndian,t.global,t.parentOffset)},offset:this.offset,getParentOffset:function(){return t.parentOffset}}},offsetFrom:function(t){return this.parentOffset+this.offset-(t.offset+t.getParentOffset())},skip:function(t){this.offset+=t},branch:function(t,a){return a=typeof a=="number"?a:this.arrayBuffer.byteLength-(this.offset+t),new e(this.arrayBuffer,this.offset+t,a,!this.littleEndian,this.global,this.parentOffset)}},X=e,X}var H,xe;function et(){if(xe)return H;xe=1;function e(t,a,r,x){this.buffer=t,this.offset=a||0,r=typeof r=="number"?r:t.length,this.endPosition=this.offset+r,this.setBigEndian(x)}return e.prototype={setBigEndian:function(t){this.bigEndian=!!t},nextUInt8:function(){var t=this.buffer.readUInt8(this.offset);return this.offset+=1,t},nextInt8:function(){var t=this.buffer.readInt8(this.offset);return this.offset+=1,t},nextUInt16:function(){var t=this.bigEndian?this.buffer.readUInt16BE(this.offset):this.buffer.readUInt16LE(this.offset);return this.offset+=2,t},nextUInt32:function(){var t=this.bigEndian?this.buffer.readUInt32BE(this.offset):this.buffer.readUInt32LE(this.offset);return this.offset+=4,t},nextInt16:function(){var t=this.bigEndian?this.buffer.readInt16BE(this.offset):this.buffer.readInt16LE(this.offset);return this.offset+=2,t},nextInt32:function(){var t=this.bigEndian?this.buffer.readInt32BE(this.offset):this.buffer.readInt32LE(this.offset);return this.offset+=4,t},nextFloat:function(){var t=this.bigEndian?this.buffer.readFloatBE(this.offset):this.buffer.readFloatLE(this.offset);return this.offset+=4,t},nextDouble:function(){var t=this.bigEndian?this.buffer.readDoubleBE(this.offset):this.buffer.readDoubleLE(this.offset);return this.offset+=8,t},nextBuffer:function(t){var a=this.buffer.slice(this.offset,this.offset+t);return this.offset+=t,a},remainingLength:function(){return this.endPosition-this.offset},nextString:function(t){var a=this.buffer.toString("utf8",this.offset,this.offset+t);return this.offset+=t,a},mark:function(){var t=this;return{openWithOffset:function(a){return a=(a||0)+this.offset,new e(t.buffer,a,t.endPosition-a,t.bigEndian)},offset:this.offset}},offsetFrom:function(t){return this.offset-t.offset},skip:function(t){this.offset+=t},branch:function(t,a){return a=typeof a=="number"?a:this.endPosition-(this.offset+t),new e(this.buffer,this.offset+t,a,this.bigEndian)}},H=e,H}var q,ue;function tt(){if(ue)return q;ue=1;var e=Qe();function t(){return(0,eval)("this")}return q={create:function(a,r){if(r=r||t(),a instanceof r.ArrayBuffer){var x=Ze();return new e(new x(a,0,a.byteLength,!0,r))}else{var i=et();return new e(new i(a,0,a.length,!0))}}},q}var rt=tt();async function at(e,t,a){const r=await it(t).catch(x=>(console.warn(x),a.type==="image/jpeg"&&Y.warn(`Impossible d'extraire les métadonnées EXIF de ${a.name}: ${(x==null?void 0:x.toString())??"Erreur inattendue"}`),{}));await pe(["Image","Observation"],{},async x=>{for(const[i,{value:o,confidence:n}]of Object.entries(r))await ge({tx:x,subjectId:e,metadataId:i,value:o,confidence:n})})}async function it(e){const t=rt.create(e).enableImageSize(!1).parse(),a={};return t?(t.tags.DateTimeOriginal&&(a[J.shoot_date]=new Date(t.tags.DateTimeOriginal*1e3)),t.tags.GPSLatitude&&t.tags.GPSLongitude&&(a[J.shoot_location]={latitude:t.tags.GPSLatitude,longitude:t.tags.GPSLongitude}),Object.fromEntries(Object.entries(a).map(([r,x])=>[r,{value:x,alternatives:{},confidence:1}]))):a}function le(e,t,a){const r=e.createShader(t);if(e.shaderSource(r,a),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS))throw console.error("compile shader error:",e.getShaderInfoLog(r)),e.deleteShader(r),new Error("compile shader error");return r}function ce(e,t,a){const r=le(e,e.VERTEX_SHADER,t),x=le(e,e.FRAGMENT_SHADER,a),i=e.createProgram();if(e.attachShader(i,r),e.attachShader(i,x),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS))throw console.error("link program error:",e.getProgramInfoLog(i)),new Error("link program error");return{program:i,vertexShader:r,fragmentShader:x}}function nt(e,t){const a=e.createTexture();return e.bindTexture(e.TEXTURE_2D,a),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,t),a}function ot(e,t,a){const r=e.createTexture();return e.bindTexture(e.TEXTURE_2D,r),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,t,a,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),r}function st(e,t){const a=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,a),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0),a}function ft(e){const t=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,t);const a=new Float32Array([-1,-1,0,0,1,-1,1,0,-1,1,0,1,1,1,1,1]);return e.bufferData(e.ARRAY_BUFFER,a,e.STATIC_DRAW),t}function de(e,t,a,r,x){const i=e.getAttribLocation(t,r),o=e.getAttribLocation(t,x);e.bindBuffer(e.ARRAY_BUFFER,a),e.enableVertexAttribArray(i),e.vertexAttribPointer(i,2,e.FLOAT,!1,4*4,0),e.enableVertexAttribArray(o),e.vertexAttribPointer(o,2,e.FLOAT,!1,4*4,2*4)}const he=`#version 300 es
 precision highp float;
 in vec2 a_position;
 in vec2 a_texCoord;
 out vec2 v_texCoord;
 void main(){
   v_texCoord = a_texCoord;
   gl_Position = vec4(a_position, 0.0, 1.0);
 }
 `,xt=`#version 300 es
 precision highp float;
 in vec2 v_texCoord;
 out vec4 outColor;

 uniform sampler2D u_image;
 uniform float u_textureWidth;
 uniform float u_scale;
 uniform float u_radius;

 const float PI = 3.141592653589793;

 /* FILTER_FUNCTION */

 void main(){
   float srcX = (v_texCoord.x * u_textureWidth);
   float left = srcX - u_radius;
   float right = srcX + u_radius;
   int start = int(floor(left));
   int end   = int(ceil(right));

   float sum = 0.0;
   vec4 color = vec4(0.0);
   for(int i = start; i <= end; i++){
     float weight = resizeFilter(((float(i) + 0.5) - srcX) * u_scale);
     float texX = (float(i) + 0.5) / u_textureWidth;
     vec4 sampleValue = texture(u_image, vec2(texX, v_texCoord.y));
     color += sampleValue * weight;
     sum += weight;
   }
   outColor = color / sum;
 }
 `,ut=`#version 300 es
 precision mediump float;
 in vec2 v_texCoord;
 out vec4 outColor;

 uniform sampler2D u_image;
 uniform float u_textureWidth;
 uniform float u_textureHeight;
 uniform float u_scale;
 uniform float u_radius;
 const float PI = 3.141592653589793;

 /* FILTER_FUNCTION */

 void main(){
   float srcY = (v_texCoord.y * u_textureHeight);
   float top = srcY - u_radius;
   float bottom = srcY + u_radius;
   int start = int(floor(top));
   int end   = int(ceil(bottom));

   float sum = 0.0;
   vec4 color = vec4(0.0);
   for(int j = start; j <= end; j++){
     float weight = resizeFilter(((float(j) + 0.5) - srcY) * u_scale);
     float texY = (float(j) + 0.5) / u_textureHeight;
     vec4 sampleValue = texture(u_image, vec2(v_texCoord.x, texY));
     color += sampleValue * weight;
     sum += weight;
   }
   outColor = color / sum;
 }
 `,lt=`float resizeFilter(float x) {
    x = abs(x);
    return (x < 0.5) ? 1.0 : 0.0;
 }`,ct=`float resizeFilter(float x) {
    x = abs(x);
    if(x >= 1.0) return 0.0;
    if(x < 1.19209290E-7) return 1.0;
    float xpi = x * PI;
    return ((sin(xpi) / xpi) * (0.54 + 0.46 * cos(xpi / 1.0)));
 }`,dt=`float resizeFilter(float x) {
   x = abs(x);
   if(x >= 2.0) return 0.0;
   if(x < 1.19209290E-7) return 1.0;
   float xpi = x * PI;
   return (sin(xpi) / xpi) * (sin(xpi / 2.0) / (xpi / 2.0));
 }`,ht=`float resizeFilter(float x) {
    x = abs(x);
    if(x >= 3.0) return 0.0;
    if(x < 1.19209290E-7) return 1.0;
    float xpi = x * PI;
    return (sin(xpi) / xpi) * sin(xpi / 3.0) / (xpi / 3.0);
  }`,mt=`float resizeFilter(float x) {
    x = abs(x);
    if (x >= 2.5) { return 0.0; }
    if (x >= 1.5) { return -0.125 * (x - 2.5) * (x - 2.5); }
    if (x >= 0.5) { return 0.25 * (4.0 * x * x - 11.0 * x + 7.0); }
    return 1.0625 - 1.75 * x * x;
  }`,Ee={box:lt,hamming:ct,lanczos2:dt,lanczos3:ht,mks2013:mt},pt={box:.5,hamming:1,lanczos2:2,lanczos3:3,mks2013:2.5};function gt(e){return xt.replace("/* FILTER_FUNCTION */",Ee[e])}function Ct(e){return ut.replace("/* FILTER_FUNCTION */",Ee[e])}function Et(e){return pt[e]}function St(e,t,a){if(e.width===0||e.height===0)throw new Error("source canvas width or height is 0");if(t.width===0||t.height===0)throw new Error("target canvas width or height is 0");const r=t.getContext("webgl2");if(!r)throw new Error("webgl2 context not found");const x=Math.round(a.targetWidth),i=Math.round(a.targetHeight),o=e.width,n=e.height,s=x/o,d=i/n,h=Et(a.filter),E=nt(r,e),f=ft(r),u=ot(r,x,n),g=st(r,u),m=ce(r,he,gt(a.filter)),p=m.program;r.useProgram(p),de(r,p,f,"a_position","a_texCoord"),r.uniform1i(r.getUniformLocation(p,"u_image"),0),r.uniform1f(r.getUniformLocation(p,"u_textureWidth"),o),r.uniform1f(r.getUniformLocation(p,"u_scale"),s),r.uniform1f(r.getUniformLocation(p,"u_radius"),h),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,E),r.viewport(0,0,x,n),r.bindFramebuffer(r.FRAMEBUFFER,g),r.drawArrays(r.TRIANGLE_STRIP,0,4);const c=ce(r,he,Ct(a.filter)),l=c.program;r.useProgram(l),de(r,l,f,"a_position","a_texCoord"),r.uniform1i(r.getUniformLocation(l,"u_image"),0),r.uniform1f(r.getUniformLocation(l,"u_textureWidth"),x),r.uniform1f(r.getUniformLocation(l,"u_textureHeight"),n),r.uniform1f(r.getUniformLocation(l,"u_scale"),d),r.uniform1f(r.getUniformLocation(l,"u_radius"),h),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,u),r.viewport(0,0,x,i),r.bindFramebuffer(r.FRAMEBUFFER,null),r.drawArrays(r.TRIANGLE_STRIP,0,4),r.deleteTexture(E),r.deleteTexture(u),r.deleteProgram(m.program),r.deleteProgram(c.program),r.deleteShader(m.vertexShader),r.deleteShader(m.fragmentShader),r.deleteShader(c.vertexShader),r.deleteShader(c.fragmentShader),r.deleteFramebuffer(g),r.deleteBuffer(f)}const me=e=>{var t=It();ye(t,"href",`https://git.inpt.fr/cigale/cigale.pages.inpt.fr/-/tree/main/models/${ee}`);var a=A(t);a.textContent=ee,B(t),w(e,t)};var It=L('<a target="_blank" class="svelte-qps1i2"><code class="svelte-qps1i2"></code></a>'),vt=L('<div class="empty-state svelte-qps1i2"><!> <p>Cliquer ou déposer des images ici</p></div>'),Ft=L("<section><!> <!></section>"),Dt=L('<section class="loading errored svelte-qps1i2"><!> <h2 class="svelte-qps1i2">Oops!</h2> <p class="svelte-qps1i2">Impossible de charger le modèle de recadrage</p> <p class="source svelte-qps1i2"><!></p> <p class="message svelte-qps1i2"> </p></section>'),Pt=L('<section class="loading svelte-qps1i2"><!> <p>Chargement du modèle de recadrage…</p> <p class="source svelte-qps1i2"><!></p></section>');function Ht(e,t){Ie(t,!0);const a=1024,r=({width:f,height:u})=>Math.round(a*u/f),x=M(()=>P.erroredImages),i=M(()=>Le(y.Image.state,[],{isLoaded:f=>K(f)&&P.previewURLs.has(f.id)&&Q(f)}));let o=De(void 0);async function n(){be(o,we(await Ye(!1))),Y.success("Modèle de recadrage chargé")}async function s(f,u){var C;await y.Image.set({id:u,filename:f.name,addedAt:te(new Date),metadata:{},bufferExists:!1,contentType:f.type});const g=await f.arrayBuffer(),m=await createImageBitmap(f),p=document.createElement("canvas");p.width=m.width,p.height=m.height,(C=p.getContext("2d"))==null||C.drawImage(m,0,0);const c=document.createElement("canvas");c.width=a,c.height=r(m),St(p,c,{targetWidth:a,targetHeight:r(m),filter:"mks2013"});const l=await new Promise(S=>{c.toBlob(F=>{if(!F)throw new Error("Failed to resize image");S(F.arrayBuffer())},f.type)});await ke({id:u,resizedBytes:l,originalBytes:g,contentType:f.type}),await at(u,g,f),await d(u,l,f)}async function d(f,u,{type:g,name:m}){if(!D(o)){Y.error("Modèle de recadrage non chargé, patentiez ou rechargez la page avant de rééssayer");return}const[[p],[c]]=await Xe([u],D(o));let[l,...C]=p,[S,...F]=c;l??(l=[0,0,He,qe]),S??(S=1);const I=([v,b,_,R])=>Oe(Me({x:v,y:b,width:_,height:R}));await pe(["Image","Observation"],{},async v=>{await ge({tx:v,subjectId:f,metadataId:"crop",type:"boundingbox",value:I(l),confidence:S});for(const[b,_]of C.entries())await v.objectStore("Image").put({id:Z(parseInt(f),b+1),filename:m,contentType:g,addedAt:te(new Date),bufferExists:!0,metadata:{crop:{value:JSON.stringify(I(_)),confidence:F[b],alternatives:{}}}})})}j(()=>{if(D(o))for(const f of y.Image.state)K(f)&&!Q(f)&&!P.loadingImages.has(f.id)&&(async()=>{try{const u=await Ne("ImagePreviewFile",ze(f.id));if(!u)return;P.loadingImages.add(f.id),await d(f.id,u.bytes,{type:f.contentType,name:f.filename})}catch(u){console.error(u),D(x).set(f.id,(u==null?void 0:u.toString())??"Erreur inattendue")}finally{P.loadingImages.delete(f.id)}})()}),j(()=>{P.processing.total=y.Image.state.length,P.processing.done=y.Image.state.filter(f=>f.metadata.crop).length});var h=Se(),E=ve(h);Ae(E,n,f=>{var u=Pt(),g=A(u);U(g,{loading:!0});var m=O(g,4),p=A(m);me(p),B(m),B(u),w(f,u)},(f,u)=>{const g=M(()=>D(i).length===0);Ue(f,{get clickable(){return D(g)},onfiles:async({files:m})=>{for(const p of m){const c=y.Image.state.length,l=Z(c);try{P.loadingImages.add(l),await s(p,l)}catch(C){console.error(C),D(x).set(l,(C==null?void 0:C.toString())??"Erreur inattendue")}finally{P.loadingImages.delete(l)}}},children:(m,p)=>{var c=Ft();let l;var C=A(c);_e(C,{get images(){return D(i)},get errors(){return D(x)},loadingText:"Analyse…",ondelete:async I=>{await Ve(I),await We(I)},get selection(){return P.selection},set selection(I){P.selection=I}});var S=O(C,2);{var F=I=>{var v=vt(),b=A(v);U(b,{variant:"empty"}),Pe(2),B(v),w(I,v)};Be(S,I=>{D(i).length||I(F)})}B(c),$(I=>l=Re(c,1,"observations svelte-qps1i2",null,l,I),[()=>({empty:!D(i).length})]),w(m,c)},$$slots:{default:!0}})},(f,u)=>{var g=Dt(),m=A(g);U(m,{variant:"error"});var p=O(m,6),c=A(p);me(c),B(p);var l=O(p,2),C=A(l,!0);B(l),B(g),$(S=>Te(C,S),[()=>{var S;return((S=D(u))==null?void 0:S.toString())??"Erreur inattendue"}]),w(f,g)}),w(e,h),Fe()}export{Ht as component};
