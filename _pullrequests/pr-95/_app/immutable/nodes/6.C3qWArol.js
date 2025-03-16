import{c as Ce,a as O,t as w}from"../chunks/B4fTvO1f.js";import{ag as Se,G as J,f as Ie,ah as ve,g as P,s as Y,M as G,c as A,a as R,r as y,t as j,b as K,aU as De,ai as Pe}from"../chunks/C5da3JO5.js";import{s as Fe}from"../chunks/CGuacY5z.js";import{a as be}from"../chunks/DOC2QdkI.js";import{i as Ee}from"../chunks/CfqesXew.js";import{b as Ae,a as ye}from"../chunks/oOm2T-ds.js";import{p as Q}from"../chunks/CY4eTrAl.js";import Be from"../chunks/B_WvoseI.js";import{t as Te}from"../chunks/BUyOReWD.js";import{b as Oe}from"../chunks/HHTdpWX1.js";import we from"../chunks/kPp6tRh7.js";import{h as Le,o as ge,B as Z,a as T,g as Re}from"../chunks/CnQjtwGZ.js";import{s as pe}from"../chunks/FVd3uxdF.js";import{t as X}from"../chunks/ClrILxXL.js";import{i as ee,f as te,b as Me,d as Ge,c as Ne,g as ae,s as Ue}from"../chunks/DRTWd2Zo.js";import{e as ke,a as _e,T as Ve,h as ie,t as qe,l as ze}from"../chunks/DDvny3ml.js";import N from"../chunks/B7ZOg_ky.js";import{u as b}from"../chunks/zOCo5PdE.js";import{a as E}from"../chunks/6--iqVZy.js";function ne(i,e){const t=Le(i,e==null?void 0:e.in);if(isNaN(+t))throw new RangeError("Invalid time value");let f="",x="";const n="-",r=":";{const a=E(t.getDate(),2),s=E(t.getMonth()+1,2);f=`${E(t.getFullYear(),4)}${n}${s}${n}${a}`}{const a=t.getTimezoneOffset();if(a!==0){const l=Math.abs(a),p=E(Math.trunc(l/60),2),C=E(l%60,2);x=`${a<0?"+":"-"}${p}:${C}`}else x="Z";const s=E(t.getHours(),2),c=E(t.getMinutes(),2),h=E(t.getSeconds(),2),o=f===""?"":"T",u=[s,c,h].join(r);f=`${f}${o}${u}${x}`}return f}var U,re;function We(){return re||(re=1,U={parseSections:function(i,e){var t,f;for(i.setBigEndian(!0);i.remainingLength()>0&&f!==218;){if(i.nextUInt8()!==255)throw new Error("Invalid JPEG section offset");f=i.nextUInt8(),f>=208&&f<=217||f===218?t=0:t=i.nextUInt16()-2,e(f,i.branch(0,t)),i.skip(t)}},getSizeFromSOFSection:function(i){return i.skip(1),{height:i.nextUInt16(),width:i.nextUInt16()}},getSectionName:function(i){var e,t;switch(i){case 216:e="SOI";break;case 196:e="DHT";break;case 219:e="DQT";break;case 221:e="DRI";break;case 218:e="SOS";break;case 254:e="COM";break;case 217:e="EOI";break;default:i>=224&&i<=239?(e="APP",t=i-224):i>=192&&i<=207&&i!==196&&i!==200&&i!==204?(e="SOF",t=i-192):i>=208&&i<=215&&(e="RST",t=i-208);break}var f={name:e};return typeof t=="number"&&(f.index=t),f}}),U}var k,se;function me(){if(se)return k;se=1;function i(n,r){switch(n){case 1:return r.nextUInt8();case 3:return r.nextUInt16();case 4:return r.nextUInt32();case 5:return[r.nextUInt32(),r.nextUInt32()];case 6:return r.nextInt8();case 8:return r.nextUInt16();case 9:return r.nextUInt32();case 10:return[r.nextInt32(),r.nextInt32()];case 11:return r.nextFloat();case 12:return r.nextDouble();default:throw new Error("Invalid format while decoding: "+n)}}function e(n){switch(n){case 1:case 2:case 6:case 7:return 1;case 3:case 8:return 2;case 4:case 9:case 11:return 4;case 5:case 10:case 12:return 8;default:return 0}}function t(n,r){var a=r.nextUInt16(),s=r.nextUInt16(),c=e(s),h=r.nextUInt32(),o=c*h,u,l;if(o>4&&(r=n.openWithOffset(r.nextUInt32())),s===2){u=r.nextString(h);var p=u.indexOf("\0");p!==-1&&(u=u.substr(0,p))}else if(s===7)u=r.nextBuffer(h);else if(s!==0)for(u=[],l=0;l<h;++l)u.push(i(s,r));return o<4&&r.skip(4-o),[a,u,s]}function f(n,r,a){var s=r.nextUInt16(),c,h;for(h=0;h<s;++h)c=t(n,r),a(c[0],c[1],c[2])}function x(n){var r=n.nextString(6);if(r!=="Exif\0\0")throw new Error("Invalid EXIF header");var a=n.mark(),s=n.nextUInt16();if(s===18761)n.setBigEndian(!1);else if(s===19789)n.setBigEndian(!0);else throw new Error("Invalid TIFF header");if(n.nextUInt16()!==42)throw new Error("Invalid TIFF data");return a}return k={IFD0:1,IFD1:2,GPSIFD:3,SubIFD:4,InteropIFD:5,parseTags:function(n,r){var a;try{a=x(n)}catch{return!1}var s,c,h,o=a.openWithOffset(n.nextUInt32()),u=this.IFD0;f(a,o,function(m,F,I){switch(m){case 34853:c=F[0];break;case 34665:s=F[0];break;default:r(u,m,F,I);break}});var l=o.nextUInt32();if(l!==0){var p=a.openWithOffset(l);f(a,p,r.bind(null,this.IFD1))}if(c){var C=a.openWithOffset(c);f(a,C,r.bind(null,this.GPSIFD))}if(s){var S=a.openWithOffset(s),d=this.InteropIFD;f(a,S,function(m,F,I){m===40965?h=F[0]:r(d,m,F,I)})}if(h){var g=a.openWithOffset(h);f(a,g,r.bind(null,this.InteropIFD))}return!0}},k}var _,oe;function He(){if(oe)return _;oe=1;function i(a){return parseInt(a,10)}var e=3600,t=60;function f(a,s){a=a.map(i),s=s.map(i);var c=a[0],h=a[1]-1,o=a[2],u=s[0],l=s[1],p=s[2],C=Date.UTC(c,h,o,u,l,p,0),S=C/1e3;return S}function x(a){var s=a.substr(0,10).split("-"),c=a.substr(11,8).split(":"),h=a.substr(19,6),o=h.split(":").map(i),u=o[0]*e+o[1]*t,l=f(s,c);if(l-=u,typeof l=="number"&&!isNaN(l))return l}function n(a){var s=a.split(" "),c=s[0].split(":"),h=s[1].split(":"),o=f(c,h);if(typeof o=="number"&&!isNaN(o))return o}function r(a){var s=a.length===19&&a.charAt(4)===":",c=a.length===25&&a.charAt(10)==="T";if(c)return x(a);if(s)return n(a)}return _={parseDateWithSpecFormat:n,parseDateWithTimezoneFormat:x,parseExifDate:r},_}var V,fe;function $e(){if(fe)return V;fe=1;var i=me(),e=He(),t=[{section:i.GPSIFD,type:2,name:"GPSLatitude",refType:1,refName:"GPSLatitudeRef",posVal:"N"},{section:i.GPSIFD,type:4,name:"GPSLongitude",refType:3,refName:"GPSLongitudeRef",posVal:"E"}],f=[{section:i.SubIFD,type:306,name:"ModifyDate"},{section:i.SubIFD,type:36867,name:"DateTimeOriginal"},{section:i.SubIFD,type:36868,name:"CreateDate"},{section:i.SubIFD,type:306,name:"ModifyDate"}];return V={castDegreeValues:function(x,n){t.forEach(function(r){var a=x(r);if(a){var s=x({section:r.section,type:r.refType,name:r.refName}),c=s===r.posVal?1:-1,h=(a[0]+a[1]/60+a[2]/3600)*c;n(r,h)}})},castDateValues:function(x,n){f.forEach(function(r){var a=x(r);if(a){var s=e.parseExifDate(a);typeof s<"u"&&n(r,s)}})},simplifyValue:function(x,n){return Array.isArray(x)&&(x=x.map(function(r){return n===10||n===5?r[0]/r[1]:r}),x.length===1&&(x=x[0])),x}},V}var q,xe;function je(){return xe||(xe=1,q={exif:{1:"InteropIndex",2:"InteropVersion",11:"ProcessingSoftware",254:"SubfileType",255:"OldSubfileType",256:"ImageWidth",257:"ImageHeight",258:"BitsPerSample",259:"Compression",262:"PhotometricInterpretation",263:"Thresholding",264:"CellWidth",265:"CellLength",266:"FillOrder",269:"DocumentName",270:"ImageDescription",271:"Make",272:"Model",273:"StripOffsets",274:"Orientation",277:"SamplesPerPixel",278:"RowsPerStrip",279:"StripByteCounts",280:"MinSampleValue",281:"MaxSampleValue",282:"XResolution",283:"YResolution",284:"PlanarConfiguration",285:"PageName",286:"XPosition",287:"YPosition",288:"FreeOffsets",289:"FreeByteCounts",290:"GrayResponseUnit",291:"GrayResponseCurve",292:"T4Options",293:"T6Options",296:"ResolutionUnit",297:"PageNumber",300:"ColorResponseUnit",301:"TransferFunction",305:"Software",306:"ModifyDate",315:"Artist",316:"HostComputer",317:"Predictor",318:"WhitePoint",319:"PrimaryChromaticities",320:"ColorMap",321:"HalftoneHints",322:"TileWidth",323:"TileLength",324:"TileOffsets",325:"TileByteCounts",326:"BadFaxLines",327:"CleanFaxData",328:"ConsecutiveBadFaxLines",330:"SubIFD",332:"InkSet",333:"InkNames",334:"NumberofInks",336:"DotRange",337:"TargetPrinter",338:"ExtraSamples",339:"SampleFormat",340:"SMinSampleValue",341:"SMaxSampleValue",342:"TransferRange",343:"ClipPath",344:"XClipPathUnits",345:"YClipPathUnits",346:"Indexed",347:"JPEGTables",351:"OPIProxy",400:"GlobalParametersIFD",401:"ProfileType",402:"FaxProfile",403:"CodingMethods",404:"VersionYear",405:"ModeNumber",433:"Decode",434:"DefaultImageColor",435:"T82Options",437:"JPEGTables",512:"JPEGProc",513:"ThumbnailOffset",514:"ThumbnailLength",515:"JPEGRestartInterval",517:"JPEGLosslessPredictors",518:"JPEGPointTransforms",519:"JPEGQTables",520:"JPEGDCTables",521:"JPEGACTables",529:"YCbCrCoefficients",530:"YCbCrSubSampling",531:"YCbCrPositioning",532:"ReferenceBlackWhite",559:"StripRowCounts",700:"ApplicationNotes",999:"USPTOMiscellaneous",4096:"RelatedImageFileFormat",4097:"RelatedImageWidth",4098:"RelatedImageHeight",18246:"Rating",18247:"XP_DIP_XML",18248:"StitchInfo",18249:"RatingPercent",32781:"ImageID",32931:"WangTag1",32932:"WangAnnotation",32933:"WangTag3",32934:"WangTag4",32995:"Matteing",32996:"DataType",32997:"ImageDepth",32998:"TileDepth",33405:"Model2",33421:"CFARepeatPatternDim",33422:"CFAPattern2",33423:"BatteryLevel",33424:"KodakIFD",33432:"Copyright",33434:"ExposureTime",33437:"FNumber",33445:"MDFileTag",33446:"MDScalePixel",33447:"MDColorTable",33448:"MDLabName",33449:"MDSampleInfo",33450:"MDPrepDate",33451:"MDPrepTime",33452:"MDFileUnits",33550:"PixelScale",33589:"AdventScale",33590:"AdventRevision",33628:"UIC1Tag",33629:"UIC2Tag",33630:"UIC3Tag",33631:"UIC4Tag",33723:"IPTC-NAA",33918:"IntergraphPacketData",33919:"IntergraphFlagRegisters",33920:"IntergraphMatrix",33921:"INGRReserved",33922:"ModelTiePoint",34016:"Site",34017:"ColorSequence",34018:"IT8Header",34019:"RasterPadding",34020:"BitsPerRunLength",34021:"BitsPerExtendedRunLength",34022:"ColorTable",34023:"ImageColorIndicator",34024:"BackgroundColorIndicator",34025:"ImageColorValue",34026:"BackgroundColorValue",34027:"PixelIntensityRange",34028:"TransparencyIndicator",34029:"ColorCharacterization",34030:"HCUsage",34031:"TrapIndicator",34032:"CMYKEquivalent",34118:"SEMInfo",34152:"AFCP_IPTC",34232:"PixelMagicJBIGOptions",34264:"ModelTransform",34306:"WB_GRGBLevels",34310:"LeafData",34377:"PhotoshopSettings",34665:"ExifOffset",34675:"ICC_Profile",34687:"TIFF_FXExtensions",34688:"MultiProfiles",34689:"SharedData",34690:"T88Options",34732:"ImageLayer",34735:"GeoTiffDirectory",34736:"GeoTiffDoubleParams",34737:"GeoTiffAsciiParams",34850:"ExposureProgram",34852:"SpectralSensitivity",34853:"GPSInfo",34855:"ISO",34856:"Opto-ElectricConvFactor",34857:"Interlace",34858:"TimeZoneOffset",34859:"SelfTimerMode",34864:"SensitivityType",34865:"StandardOutputSensitivity",34866:"RecommendedExposureIndex",34867:"ISOSpeed",34868:"ISOSpeedLatitudeyyy",34869:"ISOSpeedLatitudezzz",34908:"FaxRecvParams",34909:"FaxSubAddress",34910:"FaxRecvTime",34954:"LeafSubIFD",36864:"ExifVersion",36867:"DateTimeOriginal",36868:"CreateDate",37121:"ComponentsConfiguration",37122:"CompressedBitsPerPixel",37377:"ShutterSpeedValue",37378:"ApertureValue",37379:"BrightnessValue",37380:"ExposureCompensation",37381:"MaxApertureValue",37382:"SubjectDistance",37383:"MeteringMode",37384:"LightSource",37385:"Flash",37386:"FocalLength",37387:"FlashEnergy",37388:"SpatialFrequencyResponse",37389:"Noise",37390:"FocalPlaneXResolution",37391:"FocalPlaneYResolution",37392:"FocalPlaneResolutionUnit",37393:"ImageNumber",37394:"SecurityClassification",37395:"ImageHistory",37396:"SubjectArea",37397:"ExposureIndex",37398:"TIFF-EPStandardID",37399:"SensingMethod",37434:"CIP3DataFile",37435:"CIP3Sheet",37436:"CIP3Side",37439:"StoNits",37500:"MakerNote",37510:"UserComment",37520:"SubSecTime",37521:"SubSecTimeOriginal",37522:"SubSecTimeDigitized",37679:"MSDocumentText",37680:"MSPropertySetStorage",37681:"MSDocumentTextPosition",37724:"ImageSourceData",40091:"XPTitle",40092:"XPComment",40093:"XPAuthor",40094:"XPKeywords",40095:"XPSubject",40960:"FlashpixVersion",40961:"ColorSpace",40962:"ExifImageWidth",40963:"ExifImageHeight",40964:"RelatedSoundFile",40965:"InteropOffset",41483:"FlashEnergy",41484:"SpatialFrequencyResponse",41485:"Noise",41486:"FocalPlaneXResolution",41487:"FocalPlaneYResolution",41488:"FocalPlaneResolutionUnit",41489:"ImageNumber",41490:"SecurityClassification",41491:"ImageHistory",41492:"SubjectLocation",41493:"ExposureIndex",41494:"TIFF-EPStandardID",41495:"SensingMethod",41728:"FileSource",41729:"SceneType",41730:"CFAPattern",41985:"CustomRendered",41986:"ExposureMode",41987:"WhiteBalance",41988:"DigitalZoomRatio",41989:"FocalLengthIn35mmFormat",41990:"SceneCaptureType",41991:"GainControl",41992:"Contrast",41993:"Saturation",41994:"Sharpness",41995:"DeviceSettingDescription",41996:"SubjectDistanceRange",42016:"ImageUniqueID",42032:"OwnerName",42033:"SerialNumber",42034:"LensInfo",42035:"LensMake",42036:"LensModel",42037:"LensSerialNumber",42112:"GDALMetadata",42113:"GDALNoData",42240:"Gamma",44992:"ExpandSoftware",44993:"ExpandLens",44994:"ExpandFilm",44995:"ExpandFilterLens",44996:"ExpandScanner",44997:"ExpandFlashLamp",48129:"PixelFormat",48130:"Transformation",48131:"Uncompressed",48132:"ImageType",48256:"ImageWidth",48257:"ImageHeight",48258:"WidthResolution",48259:"HeightResolution",48320:"ImageOffset",48321:"ImageByteCount",48322:"AlphaOffset",48323:"AlphaByteCount",48324:"ImageDataDiscard",48325:"AlphaDataDiscard",50215:"OceScanjobDesc",50216:"OceApplicationSelector",50217:"OceIDNumber",50218:"OceImageLogic",50255:"Annotations",50341:"PrintIM",50560:"USPTOOriginalContentType",50706:"DNGVersion",50707:"DNGBackwardVersion",50708:"UniqueCameraModel",50709:"LocalizedCameraModel",50710:"CFAPlaneColor",50711:"CFALayout",50712:"LinearizationTable",50713:"BlackLevelRepeatDim",50714:"BlackLevel",50715:"BlackLevelDeltaH",50716:"BlackLevelDeltaV",50717:"WhiteLevel",50718:"DefaultScale",50719:"DefaultCropOrigin",50720:"DefaultCropSize",50721:"ColorMatrix1",50722:"ColorMatrix2",50723:"CameraCalibration1",50724:"CameraCalibration2",50725:"ReductionMatrix1",50726:"ReductionMatrix2",50727:"AnalogBalance",50728:"AsShotNeutral",50729:"AsShotWhiteXY",50730:"BaselineExposure",50731:"BaselineNoise",50732:"BaselineSharpness",50733:"BayerGreenSplit",50734:"LinearResponseLimit",50735:"CameraSerialNumber",50736:"DNGLensInfo",50737:"ChromaBlurRadius",50738:"AntiAliasStrength",50739:"ShadowScale",50740:"DNGPrivateData",50741:"MakerNoteSafety",50752:"RawImageSegmentation",50778:"CalibrationIlluminant1",50779:"CalibrationIlluminant2",50780:"BestQualityScale",50781:"RawDataUniqueID",50784:"AliasLayerMetadata",50827:"OriginalRawFileName",50828:"OriginalRawFileData",50829:"ActiveArea",50830:"MaskedAreas",50831:"AsShotICCProfile",50832:"AsShotPreProfileMatrix",50833:"CurrentICCProfile",50834:"CurrentPreProfileMatrix",50879:"ColorimetricReference",50898:"PanasonicTitle",50899:"PanasonicTitle2",50931:"CameraCalibrationSig",50932:"ProfileCalibrationSig",50933:"ProfileIFD",50934:"AsShotProfileName",50935:"NoiseReductionApplied",50936:"ProfileName",50937:"ProfileHueSatMapDims",50938:"ProfileHueSatMapData1",50939:"ProfileHueSatMapData2",50940:"ProfileToneCurve",50941:"ProfileEmbedPolicy",50942:"ProfileCopyright",50964:"ForwardMatrix1",50965:"ForwardMatrix2",50966:"PreviewApplicationName",50967:"PreviewApplicationVersion",50968:"PreviewSettingsName",50969:"PreviewSettingsDigest",50970:"PreviewColorSpace",50971:"PreviewDateTime",50972:"RawImageDigest",50973:"OriginalRawFileDigest",50974:"SubTileBlockSize",50975:"RowInterleaveFactor",50981:"ProfileLookTableDims",50982:"ProfileLookTableData",51008:"OpcodeList1",51009:"OpcodeList2",51022:"OpcodeList3",51041:"NoiseProfile",51043:"TimeCodes",51044:"FrameRate",51058:"TStop",51081:"ReelName",51089:"OriginalDefaultFinalSize",51090:"OriginalBestQualitySize",51091:"OriginalDefaultCropSize",51105:"CameraLabel",51107:"ProfileHueSatMapEncoding",51108:"ProfileLookTableEncoding",51109:"BaselineExposureOffset",51110:"DefaultBlackRender",51111:"NewRawImageDigest",51112:"RawToPreviewGain",51125:"DefaultUserCrop",59932:"Padding",59933:"OffsetSchema",65e3:"OwnerName",65001:"SerialNumber",65002:"Lens",65024:"KDC_IFD",65100:"RawFile",65101:"Converter",65102:"WhiteBalance",65105:"Exposure",65106:"Shadows",65107:"Brightness",65108:"Contrast",65109:"Saturation",65110:"Sharpness",65111:"Smoothness",65112:"MoireFilter"},gps:{0:"GPSVersionID",1:"GPSLatitudeRef",2:"GPSLatitude",3:"GPSLongitudeRef",4:"GPSLongitude",5:"GPSAltitudeRef",6:"GPSAltitude",7:"GPSTimeStamp",8:"GPSSatellites",9:"GPSStatus",10:"GPSMeasureMode",11:"GPSDOP",12:"GPSSpeedRef",13:"GPSSpeed",14:"GPSTrackRef",15:"GPSTrack",16:"GPSImgDirectionRef",17:"GPSImgDirection",18:"GPSMapDatum",19:"GPSDestLatitudeRef",20:"GPSDestLatitude",21:"GPSDestLongitudeRef",22:"GPSDestLongitude",23:"GPSDestBearingRef",24:"GPSDestBearing",25:"GPSDestDistanceRef",26:"GPSDestDistance",27:"GPSProcessingMethod",28:"GPSAreaInformation",29:"GPSDateStamp",30:"GPSDifferential",31:"GPSHPositioningError"}}),q}var z,ue;function Xe(){if(ue)return z;ue=1;var i=We(),e=me(),t=$e();function f(n,r,a,s,c,h,o){this.startMarker=n,this.tags=r,this.imageSize=a,this.thumbnailOffset=s,this.thumbnailLength=c,this.thumbnailType=h,this.app1Offset=o}f.prototype={hasThumbnail:function(n){return!this.thumbnailOffset||!this.thumbnailLength?!1:typeof n!="string"?!0:n.toLowerCase().trim()==="image/jpeg"?this.thumbnailType===6:n.toLowerCase().trim()==="image/tiff"?this.thumbnailType===1:!1},getThumbnailOffset:function(){return this.app1Offset+6+this.thumbnailOffset},getThumbnailLength:function(){return this.thumbnailLength},getThumbnailBuffer:function(){return this._getThumbnailStream().nextBuffer(this.thumbnailLength)},_getThumbnailStream:function(){return this.startMarker.openWithOffset(this.getThumbnailOffset())},getImageSize:function(){return this.imageSize},getThumbnailSize:function(){var n=this._getThumbnailStream(),r;return i.parseSections(n,function(a,s){i.getSectionName(a).name==="SOF"&&(r=i.getSizeFromSOFSection(s))}),r}};function x(n){this.stream=n,this.flags={readBinaryTags:!1,resolveTagNames:!0,simplifyValues:!0,imageSize:!0,hidePointers:!0,returnTags:!0}}return x.prototype={enableBinaryFields:function(n){return this.flags.readBinaryTags=!!n,this},enablePointers:function(n){return this.flags.hidePointers=!n,this},enableTagNames:function(n){return this.flags.resolveTagNames=!!n,this},enableImageSize:function(n){return this.flags.imageSize=!!n,this},enableReturnTags:function(n){return this.flags.returnTags=!!n,this},enableSimpleValues:function(n){return this.flags.simplifyValues=!!n,this},parse:function(){var n=this.stream.mark(),r=n.openWithOffset(0),a=this.flags,s,c,h,o,u,l,p,C,S;return a.resolveTagNames&&(p=je()),a.resolveTagNames?(s={},C=function(d){return s[d.name]},S=function(d,g){s[d.name]=g}):(s=[],C=function(d){var g;for(g=0;g<s.length;++g)if(s[g].type===d.type&&s[g].section===d.section)return s.value},S=function(d,g){var m;for(m=0;m<s.length;++m)if(s[m].type===d.type&&s[m].section===d.section){s.value=g;return}}),i.parseSections(r,function(d,g){var m,F=g.offsetFrom(n);d===225?(m=e.parseTags(g,function(I,v,D,B){if(!(!a.readBinaryTags&&B===7)){if(v===513){if(h=D[0],a.hidePointers)return}else if(v===514){if(o=D[0],a.hidePointers)return}else if(v===259&&(u=D[0],a.hidePointers))return;if(a.returnTags)if(a.simplifyValues&&(D=t.simplifyValue(D,B)),a.resolveTagNames){var M=I===e.GPSIFD?p.gps:p.exif,L=M[v];L||(L=p.exif[v]),s.hasOwnProperty(L)||(s[L]=D)}else s.push({section:I,type:v,value:D})}}),m&&(l=F)):a.imageSize&&i.getSectionName(d).name==="SOF"&&(c=i.getSizeFromSOFSection(g))}),a.simplifyValues&&(t.castDegreeValues(C,S),t.castDateValues(C,S)),new f(n,s,c,h,o,u,l)}},z=x,z}var W,le;function Je(){if(le)return W;le=1;function i(e,t,f,x,n,r){this.global=n,t=t||0,f=f||e.byteLength-t,this.arrayBuffer=e.slice(t,t+f),this.view=new n.DataView(this.arrayBuffer,0,this.arrayBuffer.byteLength),this.setBigEndian(x),this.offset=0,this.parentOffset=(r||0)+t}return i.prototype={setBigEndian:function(e){this.littleEndian=!e},nextUInt8:function(){var e=this.view.getUint8(this.offset);return this.offset+=1,e},nextInt8:function(){var e=this.view.getInt8(this.offset);return this.offset+=1,e},nextUInt16:function(){var e=this.view.getUint16(this.offset,this.littleEndian);return this.offset+=2,e},nextUInt32:function(){var e=this.view.getUint32(this.offset,this.littleEndian);return this.offset+=4,e},nextInt16:function(){var e=this.view.getInt16(this.offset,this.littleEndian);return this.offset+=2,e},nextInt32:function(){var e=this.view.getInt32(this.offset,this.littleEndian);return this.offset+=4,e},nextFloat:function(){var e=this.view.getFloat32(this.offset,this.littleEndian);return this.offset+=4,e},nextDouble:function(){var e=this.view.getFloat64(this.offset,this.littleEndian);return this.offset+=8,e},nextBuffer:function(e){var t=this.arrayBuffer.slice(this.offset,this.offset+e);return this.offset+=e,t},remainingLength:function(){return this.arrayBuffer.byteLength-this.offset},nextString:function(e){var t=this.arrayBuffer.slice(this.offset,this.offset+e);return t=String.fromCharCode.apply(null,new this.global.Uint8Array(t)),this.offset+=e,t},mark:function(){var e=this;return{openWithOffset:function(t){return t=(t||0)+this.offset,new i(e.arrayBuffer,t,e.arrayBuffer.byteLength-t,!e.littleEndian,e.global,e.parentOffset)},offset:this.offset,getParentOffset:function(){return e.parentOffset}}},offsetFrom:function(e){return this.parentOffset+this.offset-(e.offset+e.getParentOffset())},skip:function(e){this.offset+=e},branch:function(e,t){return t=typeof t=="number"?t:this.arrayBuffer.byteLength-(this.offset+e),new i(this.arrayBuffer,this.offset+e,t,!this.littleEndian,this.global,this.parentOffset)}},W=i,W}var H,ce;function Ye(){if(ce)return H;ce=1;function i(e,t,f,x){this.buffer=e,this.offset=t||0,f=typeof f=="number"?f:e.length,this.endPosition=this.offset+f,this.setBigEndian(x)}return i.prototype={setBigEndian:function(e){this.bigEndian=!!e},nextUInt8:function(){var e=this.buffer.readUInt8(this.offset);return this.offset+=1,e},nextInt8:function(){var e=this.buffer.readInt8(this.offset);return this.offset+=1,e},nextUInt16:function(){var e=this.bigEndian?this.buffer.readUInt16BE(this.offset):this.buffer.readUInt16LE(this.offset);return this.offset+=2,e},nextUInt32:function(){var e=this.bigEndian?this.buffer.readUInt32BE(this.offset):this.buffer.readUInt32LE(this.offset);return this.offset+=4,e},nextInt16:function(){var e=this.bigEndian?this.buffer.readInt16BE(this.offset):this.buffer.readInt16LE(this.offset);return this.offset+=2,e},nextInt32:function(){var e=this.bigEndian?this.buffer.readInt32BE(this.offset):this.buffer.readInt32LE(this.offset);return this.offset+=4,e},nextFloat:function(){var e=this.bigEndian?this.buffer.readFloatBE(this.offset):this.buffer.readFloatLE(this.offset);return this.offset+=4,e},nextDouble:function(){var e=this.bigEndian?this.buffer.readDoubleBE(this.offset):this.buffer.readDoubleLE(this.offset);return this.offset+=8,e},nextBuffer:function(e){var t=this.buffer.slice(this.offset,this.offset+e);return this.offset+=e,t},remainingLength:function(){return this.endPosition-this.offset},nextString:function(e){var t=this.buffer.toString("utf8",this.offset,this.offset+e);return this.offset+=e,t},mark:function(){var e=this;return{openWithOffset:function(t){return t=(t||0)+this.offset,new i(e.buffer,t,e.endPosition-t,e.bigEndian)},offset:this.offset}},offsetFrom:function(e){return this.offset-e.offset},skip:function(e){this.offset+=e},branch:function(e,t){return t=typeof t=="number"?t:this.endPosition-(this.offset+e),new i(this.buffer,this.offset+e,t,this.bigEndian)}},H=i,H}var $,he;function Ke(){if(he)return $;he=1;var i=Xe();function e(){return(0,eval)("this")}return $={create:function(t,f){if(f=f||e(),t instanceof f.ArrayBuffer){var x=Je();return new i(new x(t,0,t.byteLength,!0,f))}else{var n=Ye();return new i(new n(t,0,t.length,!0))}}},$}var Qe=Ke();async function Ze(i,e,t){const f=await et(e).catch(x=>(console.warn(x),t.type==="image/jpeg"&&X.warn(`Impossible d'extraire les métadonnées EXIF de ${t.name}: ${(x==null?void 0:x.toString())??"Erreur inattendue"}`),{}));await ge(["Image","Observation"],{},async x=>{for(const[n,{value:r,confidence:a}]of Object.entries(f))await pe({tx:x,subjectId:i,metadataId:n,value:r,confidence:a})})}async function et(i){const e=Qe.create(i).enableImageSize(!1).parse(),t={};return e?(e.tags.DateTimeOriginal&&(t[Z.shoot_date]=new Date(e.tags.DateTimeOriginal*1e3)),e.tags.GPSLatitude&&e.tags.GPSLongitude&&(t[Z.shoot_location]={latitude:e.tags.GPSLatitude,longitude:e.tags.GPSLongitude}),Object.fromEntries(Object.entries(t).map(([f,x])=>[f,{value:x,alternatives:{},confidence:1}]))):t}const de=i=>{var e=tt(),t=A(e);t.textContent=ie,y(e),j(f=>ye(e,"href",f),[()=>qe(ie)]),O(i,e)};var tt=w('<a target="_blank" class="svelte-qps1i2"><code class="svelte-qps1i2"></code></a>'),at=w('<div class="empty-state svelte-qps1i2"><!> <p>Cliquer ou déposer des images ici</p></div>'),it=w("<section><!> <!></section>"),nt=w('<section class="loading errored svelte-qps1i2"><!> <h2 class="svelte-qps1i2">Oops!</h2> <p class="svelte-qps1i2">Impossible de charger le modèle de recadrage</p> <p class="source svelte-qps1i2"><!></p> <p class="message svelte-qps1i2"> </p></section>'),rt=w('<section class="loading svelte-qps1i2"><!> <p>Chargement du modèle de recadrage…</p> <p class="source svelte-qps1i2"><!></p></section>');function bt(i,e){Se(e,!0);const t=G(()=>b.erroredImages),f=G(()=>Te(T.Image.state,[],{isLoaded:o=>ee(o)&&b.previewURLs.has(o.id)&&te(o)}));let x=Y(void 0);async function n(){K(x,Q(await ze(!1))),X.success("Modèle de recadrage chargé")}async function r(o,u){await T.Image.set({id:u,filename:o.name,addedAt:ne(new Date),metadata:{},bufferExists:!1,contentType:o.type});const l=await o.arrayBuffer();await Ue(u,l,o.type),await Ze(u,l,o),await a(u,l,o)}async function a(o,u,{type:l,name:p}){if(!P(x)){X.error("Modèle de recadrage non chargé, patentiez ou rechargez la page avant de rééssayer");return}const[[C],[S]]=await ke([u],P(x));let[d,...g]=C,[m,...F]=S;d??(d=[0,0,_e,Ve]),m??(m=1);const I=([v,D,B,M])=>Oe({x:v,y:D,width:B,height:M});await ge(["Image","Observation"],{},async v=>{await pe({tx:v,subjectId:o,metadataId:"crop",type:"boundingbox",value:I(d),confidence:m});for(const[D,B]of g.entries())await v.objectStore("Image").put({id:ae(parseInt(o),D+1),filename:p,contentType:l,addedAt:ne(new Date),bufferExists:!0,metadata:{crop:{value:JSON.stringify(I(B)),confidence:F[D],alternatives:{}}}})})}J(()=>{if(P(x))for(const o of T.Image.state)ee(o)&&!te(o)&&!b.loadingImages.has(o.id)&&(async()=>{try{const u=await Re("ImageFile",Me(o.id));if(!u)return;b.loadingImages.add(o.id),await a(o.id,u.bytes,{type:o.contentType,name:o.filename})}catch(u){console.error(u),P(t).set(o.id,(u==null?void 0:u.toString())??"Erreur inattendue")}finally{b.loadingImages.delete(o.id)}})()});let s=Y(0);J(()=>{b.processing.total=T.Image.state.length+P(s),b.processing.done=T.Image.state.filter(o=>o.metadata.crop).length});var c=Ce(),h=Ie(c);be(h,n,o=>{var u=rt(),l=A(u);N(l,{loading:!0});var p=R(l,4),C=A(p);de(C),y(p),y(u),O(o,u)},(o,u)=>{const l=G(()=>P(f).length===0);we(o,{get clickable(){return P(l)},onfiles:async({files:p})=>{K(s,Q(p.length));for(const C of p){const S=T.Image.state.length,d=ae(S);try{b.loadingImages.add(d),await r(C,d),De(s,-1)}catch(g){console.error(g),P(t).set(d,(g==null?void 0:g.toString())??"Erreur inattendue")}finally{b.loadingImages.delete(d)}}},children:(p,C)=>{var S=it();let d;var g=A(S);Be(g,{get images(){return P(f)},get errors(){return P(t)},loadingText:"Analyse…",ondelete:async I=>{await Ge(I),await Ne(I)},get selection(){return b.selection},set selection(I){b.selection=I}});var m=R(g,2);{var F=I=>{var v=at(),D=A(v);N(D,{variant:"empty"}),Pe(2),y(v),O(I,v)};Ee(m,I=>{P(f).length||I(F)})}y(S),j(I=>d=Ae(S,1,"observations svelte-qps1i2",null,d,I),[()=>({empty:!P(f).length})]),O(p,S)},$$slots:{default:!0}})},(o,u)=>{var l=nt(),p=A(l);N(p,{variant:"error"});var C=R(p,6),S=A(C);de(S),y(C);var d=R(C,2),g=A(d,!0);y(d),y(l),j(m=>Fe(g,m),[()=>{var m;return((m=P(u))==null?void 0:m.toString())??"Erreur inattendue"}]),O(o,l)}),O(i,c),ve()}export{bt as component};
