import{c as me,a as O,t as w}from"../chunks/DeTCf0G9.js";import{a9 as Ce,a8 as N,s as X,F as J,f as Se,aa as Ie,g as F,c as A,a as R,r as y,t as Y,b as K,aS as ve,ab as De}from"../chunks/DrE-zuyI.js";import{s as Pe}from"../chunks/06gPEhSx.js";import{a as Fe}from"../chunks/SR8wXvEI.js";import{i as be}from"../chunks/NOjOiTK7.js";import{c as Ee,a as Ae}from"../chunks/Cij6e3iu.js";import ye from"../chunks/DKngAoGz.js";import{t as Be}from"../chunks/D9SyTgM9.js";import{h as Te,f as Oe,j as Q,l as we}from"../chunks/DlOYpWUW.js";import Le from"../chunks/DskWtDB9.js";import{w as Re,o as de,a as Z,u as v,c as ee,L as te,t as B,h as Me,j as Ge,d as Ne,M as ae,N as Ue,O as _e}from"../chunks/zaTfszOt.js";import{b as E,s as ge}from"../chunks/Cqy2_1pG.js";import{t as M}from"../chunks/Bt1OUphS.js";import U from"../chunks/C9u8nEQh.js";import{d as ke}from"../chunks/BpXQowL0.js";function ie(i,e){const t=Re(i,e==null?void 0:e.in);if(isNaN(+t))throw new RangeError("Invalid time value");let f="",x="";const n="-",r=":";{const a=E(t.getDate(),2),s=E(t.getMonth()+1,2);f=`${E(t.getFullYear(),4)}${n}${s}${n}${a}`}{const a=t.getTimezoneOffset();if(a!==0){const l=Math.abs(a),d=E(Math.trunc(l/60),2),C=E(l%60,2);x=`${a<0?"+":"-"}${d}:${C}`}else x="Z";const s=E(t.getHours(),2),c=E(t.getMinutes(),2),h=E(t.getSeconds(),2),o=f===""?"":"T",u=[s,c,h].join(r);f=`${f}${o}${u}${x}`}return f}var _,ne;function ze(){return ne||(ne=1,_={parseSections:function(i,e){var t,f;for(i.setBigEndian(!0);i.remainingLength()>0&&f!==218;){if(i.nextUInt8()!==255)throw new Error("Invalid JPEG section offset");f=i.nextUInt8(),f>=208&&f<=217||f===218?t=0:t=i.nextUInt16()-2,e(f,i.branch(0,t)),i.skip(t)}},getSizeFromSOFSection:function(i){return i.skip(1),{height:i.nextUInt16(),width:i.nextUInt16()}},getSectionName:function(i){var e,t;switch(i){case 216:e="SOI";break;case 196:e="DHT";break;case 219:e="DQT";break;case 221:e="DRI";break;case 218:e="SOS";break;case 254:e="COM";break;case 217:e="EOI";break;default:i>=224&&i<=239?(e="APP",t=i-224):i>=192&&i<=207&&i!==196&&i!==200&&i!==204?(e="SOF",t=i-192):i>=208&&i<=215&&(e="RST",t=i-208);break}var f={name:e};return typeof t=="number"&&(f.index=t),f}}),_}var k,re;function pe(){if(re)return k;re=1;function i(n,r){switch(n){case 1:return r.nextUInt8();case 3:return r.nextUInt16();case 4:return r.nextUInt32();case 5:return[r.nextUInt32(),r.nextUInt32()];case 6:return r.nextInt8();case 8:return r.nextUInt16();case 9:return r.nextUInt32();case 10:return[r.nextInt32(),r.nextInt32()];case 11:return r.nextFloat();case 12:return r.nextDouble();default:throw new Error("Invalid format while decoding: "+n)}}function e(n){switch(n){case 1:case 2:case 6:case 7:return 1;case 3:case 8:return 2;case 4:case 9:case 11:return 4;case 5:case 10:case 12:return 8;default:return 0}}function t(n,r){var a=r.nextUInt16(),s=r.nextUInt16(),c=e(s),h=r.nextUInt32(),o=c*h,u,l;if(o>4&&(r=n.openWithOffset(r.nextUInt32())),s===2){u=r.nextString(h);var d=u.indexOf("\0");d!==-1&&(u=u.substr(0,d))}else if(s===7)u=r.nextBuffer(h);else if(s!==0)for(u=[],l=0;l<h;++l)u.push(i(s,r));return o<4&&r.skip(4-o),[a,u,s]}function f(n,r,a){var s=r.nextUInt16(),c,h;for(h=0;h<s;++h)c=t(n,r),a(c[0],c[1],c[2])}function x(n){var r=n.nextString(6);if(r!=="Exif\0\0")throw new Error("Invalid EXIF header");var a=n.mark(),s=n.nextUInt16();if(s===18761)n.setBigEndian(!1);else if(s===19789)n.setBigEndian(!0);else throw new Error("Invalid TIFF header");if(n.nextUInt16()!==42)throw new Error("Invalid TIFF data");return a}return k={IFD0:1,IFD1:2,GPSIFD:3,SubIFD:4,InteropIFD:5,parseTags:function(n,r){var a;try{a=x(n)}catch{return!1}var s,c,h,o=a.openWithOffset(n.nextUInt32()),u=this.IFD0;f(a,o,function(m,b,I){switch(m){case 34853:c=b[0];break;case 34665:s=b[0];break;default:r(u,m,b,I);break}});var l=o.nextUInt32();if(l!==0){var d=a.openWithOffset(l);f(a,d,r.bind(null,this.IFD1))}if(c){var C=a.openWithOffset(c);f(a,C,r.bind(null,this.GPSIFD))}if(s){var S=a.openWithOffset(s),g=this.InteropIFD;f(a,S,function(m,b,I){m===40965?h=b[0]:r(g,m,b,I)})}if(h){var p=a.openWithOffset(h);f(a,p,r.bind(null,this.InteropIFD))}return!0}},k}var z,se;function Ve(){if(se)return z;se=1;function i(a){return parseInt(a,10)}var e=3600,t=60;function f(a,s){a=a.map(i),s=s.map(i);var c=a[0],h=a[1]-1,o=a[2],u=s[0],l=s[1],d=s[2],C=Date.UTC(c,h,o,u,l,d,0),S=C/1e3;return S}function x(a){var s=a.substr(0,10).split("-"),c=a.substr(11,8).split(":"),h=a.substr(19,6),o=h.split(":").map(i),u=o[0]*e+o[1]*t,l=f(s,c);if(l-=u,typeof l=="number"&&!isNaN(l))return l}function n(a){var s=a.split(" "),c=s[0].split(":"),h=s[1].split(":"),o=f(c,h);if(typeof o=="number"&&!isNaN(o))return o}function r(a){var s=a.length===19&&a.charAt(4)===":",c=a.length===25&&a.charAt(10)==="T";if(c)return x(a);if(s)return n(a)}return z={parseDateWithSpecFormat:n,parseDateWithTimezoneFormat:x,parseExifDate:r},z}var V,oe;function qe(){if(oe)return V;oe=1;var i=pe(),e=Ve(),t=[{section:i.GPSIFD,type:2,name:"GPSLatitude",refType:1,refName:"GPSLatitudeRef",posVal:"N"},{section:i.GPSIFD,type:4,name:"GPSLongitude",refType:3,refName:"GPSLongitudeRef",posVal:"E"}],f=[{section:i.SubIFD,type:306,name:"ModifyDate"},{section:i.SubIFD,type:36867,name:"DateTimeOriginal"},{section:i.SubIFD,type:36868,name:"CreateDate"},{section:i.SubIFD,type:306,name:"ModifyDate"}];return V={castDegreeValues:function(x,n){t.forEach(function(r){var a=x(r);if(a){var s=x({section:r.section,type:r.refType,name:r.refName}),c=s===r.posVal?1:-1,h=(a[0]+a[1]/60+a[2]/3600)*c;n(r,h)}})},castDateValues:function(x,n){f.forEach(function(r){var a=x(r);if(a){var s=e.parseExifDate(a);typeof s<"u"&&n(r,s)}})},simplifyValue:function(x,n){return Array.isArray(x)&&(x=x.map(function(r){return n===10||n===5?r[0]/r[1]:r}),x.length===1&&(x=x[0])),x}},V}var q,fe;function We(){return fe||(fe=1,q={exif:{1:"InteropIndex",2:"InteropVersion",11:"ProcessingSoftware",254:"SubfileType",255:"OldSubfileType",256:"ImageWidth",257:"ImageHeight",258:"BitsPerSample",259:"Compression",262:"PhotometricInterpretation",263:"Thresholding",264:"CellWidth",265:"CellLength",266:"FillOrder",269:"DocumentName",270:"ImageDescription",271:"Make",272:"Model",273:"StripOffsets",274:"Orientation",277:"SamplesPerPixel",278:"RowsPerStrip",279:"StripByteCounts",280:"MinSampleValue",281:"MaxSampleValue",282:"XResolution",283:"YResolution",284:"PlanarConfiguration",285:"PageName",286:"XPosition",287:"YPosition",288:"FreeOffsets",289:"FreeByteCounts",290:"GrayResponseUnit",291:"GrayResponseCurve",292:"T4Options",293:"T6Options",296:"ResolutionUnit",297:"PageNumber",300:"ColorResponseUnit",301:"TransferFunction",305:"Software",306:"ModifyDate",315:"Artist",316:"HostComputer",317:"Predictor",318:"WhitePoint",319:"PrimaryChromaticities",320:"ColorMap",321:"HalftoneHints",322:"TileWidth",323:"TileLength",324:"TileOffsets",325:"TileByteCounts",326:"BadFaxLines",327:"CleanFaxData",328:"ConsecutiveBadFaxLines",330:"SubIFD",332:"InkSet",333:"InkNames",334:"NumberofInks",336:"DotRange",337:"TargetPrinter",338:"ExtraSamples",339:"SampleFormat",340:"SMinSampleValue",341:"SMaxSampleValue",342:"TransferRange",343:"ClipPath",344:"XClipPathUnits",345:"YClipPathUnits",346:"Indexed",347:"JPEGTables",351:"OPIProxy",400:"GlobalParametersIFD",401:"ProfileType",402:"FaxProfile",403:"CodingMethods",404:"VersionYear",405:"ModeNumber",433:"Decode",434:"DefaultImageColor",435:"T82Options",437:"JPEGTables",512:"JPEGProc",513:"ThumbnailOffset",514:"ThumbnailLength",515:"JPEGRestartInterval",517:"JPEGLosslessPredictors",518:"JPEGPointTransforms",519:"JPEGQTables",520:"JPEGDCTables",521:"JPEGACTables",529:"YCbCrCoefficients",530:"YCbCrSubSampling",531:"YCbCrPositioning",532:"ReferenceBlackWhite",559:"StripRowCounts",700:"ApplicationNotes",999:"USPTOMiscellaneous",4096:"RelatedImageFileFormat",4097:"RelatedImageWidth",4098:"RelatedImageHeight",18246:"Rating",18247:"XP_DIP_XML",18248:"StitchInfo",18249:"RatingPercent",32781:"ImageID",32931:"WangTag1",32932:"WangAnnotation",32933:"WangTag3",32934:"WangTag4",32995:"Matteing",32996:"DataType",32997:"ImageDepth",32998:"TileDepth",33405:"Model2",33421:"CFARepeatPatternDim",33422:"CFAPattern2",33423:"BatteryLevel",33424:"KodakIFD",33432:"Copyright",33434:"ExposureTime",33437:"FNumber",33445:"MDFileTag",33446:"MDScalePixel",33447:"MDColorTable",33448:"MDLabName",33449:"MDSampleInfo",33450:"MDPrepDate",33451:"MDPrepTime",33452:"MDFileUnits",33550:"PixelScale",33589:"AdventScale",33590:"AdventRevision",33628:"UIC1Tag",33629:"UIC2Tag",33630:"UIC3Tag",33631:"UIC4Tag",33723:"IPTC-NAA",33918:"IntergraphPacketData",33919:"IntergraphFlagRegisters",33920:"IntergraphMatrix",33921:"INGRReserved",33922:"ModelTiePoint",34016:"Site",34017:"ColorSequence",34018:"IT8Header",34019:"RasterPadding",34020:"BitsPerRunLength",34021:"BitsPerExtendedRunLength",34022:"ColorTable",34023:"ImageColorIndicator",34024:"BackgroundColorIndicator",34025:"ImageColorValue",34026:"BackgroundColorValue",34027:"PixelIntensityRange",34028:"TransparencyIndicator",34029:"ColorCharacterization",34030:"HCUsage",34031:"TrapIndicator",34032:"CMYKEquivalent",34118:"SEMInfo",34152:"AFCP_IPTC",34232:"PixelMagicJBIGOptions",34264:"ModelTransform",34306:"WB_GRGBLevels",34310:"LeafData",34377:"PhotoshopSettings",34665:"ExifOffset",34675:"ICC_Profile",34687:"TIFF_FXExtensions",34688:"MultiProfiles",34689:"SharedData",34690:"T88Options",34732:"ImageLayer",34735:"GeoTiffDirectory",34736:"GeoTiffDoubleParams",34737:"GeoTiffAsciiParams",34850:"ExposureProgram",34852:"SpectralSensitivity",34853:"GPSInfo",34855:"ISO",34856:"Opto-ElectricConvFactor",34857:"Interlace",34858:"TimeZoneOffset",34859:"SelfTimerMode",34864:"SensitivityType",34865:"StandardOutputSensitivity",34866:"RecommendedExposureIndex",34867:"ISOSpeed",34868:"ISOSpeedLatitudeyyy",34869:"ISOSpeedLatitudezzz",34908:"FaxRecvParams",34909:"FaxSubAddress",34910:"FaxRecvTime",34954:"LeafSubIFD",36864:"ExifVersion",36867:"DateTimeOriginal",36868:"CreateDate",37121:"ComponentsConfiguration",37122:"CompressedBitsPerPixel",37377:"ShutterSpeedValue",37378:"ApertureValue",37379:"BrightnessValue",37380:"ExposureCompensation",37381:"MaxApertureValue",37382:"SubjectDistance",37383:"MeteringMode",37384:"LightSource",37385:"Flash",37386:"FocalLength",37387:"FlashEnergy",37388:"SpatialFrequencyResponse",37389:"Noise",37390:"FocalPlaneXResolution",37391:"FocalPlaneYResolution",37392:"FocalPlaneResolutionUnit",37393:"ImageNumber",37394:"SecurityClassification",37395:"ImageHistory",37396:"SubjectArea",37397:"ExposureIndex",37398:"TIFF-EPStandardID",37399:"SensingMethod",37434:"CIP3DataFile",37435:"CIP3Sheet",37436:"CIP3Side",37439:"StoNits",37500:"MakerNote",37510:"UserComment",37520:"SubSecTime",37521:"SubSecTimeOriginal",37522:"SubSecTimeDigitized",37679:"MSDocumentText",37680:"MSPropertySetStorage",37681:"MSDocumentTextPosition",37724:"ImageSourceData",40091:"XPTitle",40092:"XPComment",40093:"XPAuthor",40094:"XPKeywords",40095:"XPSubject",40960:"FlashpixVersion",40961:"ColorSpace",40962:"ExifImageWidth",40963:"ExifImageHeight",40964:"RelatedSoundFile",40965:"InteropOffset",41483:"FlashEnergy",41484:"SpatialFrequencyResponse",41485:"Noise",41486:"FocalPlaneXResolution",41487:"FocalPlaneYResolution",41488:"FocalPlaneResolutionUnit",41489:"ImageNumber",41490:"SecurityClassification",41491:"ImageHistory",41492:"SubjectLocation",41493:"ExposureIndex",41494:"TIFF-EPStandardID",41495:"SensingMethod",41728:"FileSource",41729:"SceneType",41730:"CFAPattern",41985:"CustomRendered",41986:"ExposureMode",41987:"WhiteBalance",41988:"DigitalZoomRatio",41989:"FocalLengthIn35mmFormat",41990:"SceneCaptureType",41991:"GainControl",41992:"Contrast",41993:"Saturation",41994:"Sharpness",41995:"DeviceSettingDescription",41996:"SubjectDistanceRange",42016:"ImageUniqueID",42032:"OwnerName",42033:"SerialNumber",42034:"LensInfo",42035:"LensMake",42036:"LensModel",42037:"LensSerialNumber",42112:"GDALMetadata",42113:"GDALNoData",42240:"Gamma",44992:"ExpandSoftware",44993:"ExpandLens",44994:"ExpandFilm",44995:"ExpandFilterLens",44996:"ExpandScanner",44997:"ExpandFlashLamp",48129:"PixelFormat",48130:"Transformation",48131:"Uncompressed",48132:"ImageType",48256:"ImageWidth",48257:"ImageHeight",48258:"WidthResolution",48259:"HeightResolution",48320:"ImageOffset",48321:"ImageByteCount",48322:"AlphaOffset",48323:"AlphaByteCount",48324:"ImageDataDiscard",48325:"AlphaDataDiscard",50215:"OceScanjobDesc",50216:"OceApplicationSelector",50217:"OceIDNumber",50218:"OceImageLogic",50255:"Annotations",50341:"PrintIM",50560:"USPTOOriginalContentType",50706:"DNGVersion",50707:"DNGBackwardVersion",50708:"UniqueCameraModel",50709:"LocalizedCameraModel",50710:"CFAPlaneColor",50711:"CFALayout",50712:"LinearizationTable",50713:"BlackLevelRepeatDim",50714:"BlackLevel",50715:"BlackLevelDeltaH",50716:"BlackLevelDeltaV",50717:"WhiteLevel",50718:"DefaultScale",50719:"DefaultCropOrigin",50720:"DefaultCropSize",50721:"ColorMatrix1",50722:"ColorMatrix2",50723:"CameraCalibration1",50724:"CameraCalibration2",50725:"ReductionMatrix1",50726:"ReductionMatrix2",50727:"AnalogBalance",50728:"AsShotNeutral",50729:"AsShotWhiteXY",50730:"BaselineExposure",50731:"BaselineNoise",50732:"BaselineSharpness",50733:"BayerGreenSplit",50734:"LinearResponseLimit",50735:"CameraSerialNumber",50736:"DNGLensInfo",50737:"ChromaBlurRadius",50738:"AntiAliasStrength",50739:"ShadowScale",50740:"DNGPrivateData",50741:"MakerNoteSafety",50752:"RawImageSegmentation",50778:"CalibrationIlluminant1",50779:"CalibrationIlluminant2",50780:"BestQualityScale",50781:"RawDataUniqueID",50784:"AliasLayerMetadata",50827:"OriginalRawFileName",50828:"OriginalRawFileData",50829:"ActiveArea",50830:"MaskedAreas",50831:"AsShotICCProfile",50832:"AsShotPreProfileMatrix",50833:"CurrentICCProfile",50834:"CurrentPreProfileMatrix",50879:"ColorimetricReference",50898:"PanasonicTitle",50899:"PanasonicTitle2",50931:"CameraCalibrationSig",50932:"ProfileCalibrationSig",50933:"ProfileIFD",50934:"AsShotProfileName",50935:"NoiseReductionApplied",50936:"ProfileName",50937:"ProfileHueSatMapDims",50938:"ProfileHueSatMapData1",50939:"ProfileHueSatMapData2",50940:"ProfileToneCurve",50941:"ProfileEmbedPolicy",50942:"ProfileCopyright",50964:"ForwardMatrix1",50965:"ForwardMatrix2",50966:"PreviewApplicationName",50967:"PreviewApplicationVersion",50968:"PreviewSettingsName",50969:"PreviewSettingsDigest",50970:"PreviewColorSpace",50971:"PreviewDateTime",50972:"RawImageDigest",50973:"OriginalRawFileDigest",50974:"SubTileBlockSize",50975:"RowInterleaveFactor",50981:"ProfileLookTableDims",50982:"ProfileLookTableData",51008:"OpcodeList1",51009:"OpcodeList2",51022:"OpcodeList3",51041:"NoiseProfile",51043:"TimeCodes",51044:"FrameRate",51058:"TStop",51081:"ReelName",51089:"OriginalDefaultFinalSize",51090:"OriginalBestQualitySize",51091:"OriginalDefaultCropSize",51105:"CameraLabel",51107:"ProfileHueSatMapEncoding",51108:"ProfileLookTableEncoding",51109:"BaselineExposureOffset",51110:"DefaultBlackRender",51111:"NewRawImageDigest",51112:"RawToPreviewGain",51125:"DefaultUserCrop",59932:"Padding",59933:"OffsetSchema",65e3:"OwnerName",65001:"SerialNumber",65002:"Lens",65024:"KDC_IFD",65100:"RawFile",65101:"Converter",65102:"WhiteBalance",65105:"Exposure",65106:"Shadows",65107:"Brightness",65108:"Contrast",65109:"Saturation",65110:"Sharpness",65111:"Smoothness",65112:"MoireFilter"},gps:{0:"GPSVersionID",1:"GPSLatitudeRef",2:"GPSLatitude",3:"GPSLongitudeRef",4:"GPSLongitude",5:"GPSAltitudeRef",6:"GPSAltitude",7:"GPSTimeStamp",8:"GPSSatellites",9:"GPSStatus",10:"GPSMeasureMode",11:"GPSDOP",12:"GPSSpeedRef",13:"GPSSpeed",14:"GPSTrackRef",15:"GPSTrack",16:"GPSImgDirectionRef",17:"GPSImgDirection",18:"GPSMapDatum",19:"GPSDestLatitudeRef",20:"GPSDestLatitude",21:"GPSDestLongitudeRef",22:"GPSDestLongitude",23:"GPSDestBearingRef",24:"GPSDestBearing",25:"GPSDestDistanceRef",26:"GPSDestDistance",27:"GPSProcessingMethod",28:"GPSAreaInformation",29:"GPSDateStamp",30:"GPSDifferential",31:"GPSHPositioningError"}}),q}var W,xe;function He(){if(xe)return W;xe=1;var i=ze(),e=pe(),t=qe();function f(n,r,a,s,c,h,o){this.startMarker=n,this.tags=r,this.imageSize=a,this.thumbnailOffset=s,this.thumbnailLength=c,this.thumbnailType=h,this.app1Offset=o}f.prototype={hasThumbnail:function(n){return!this.thumbnailOffset||!this.thumbnailLength?!1:typeof n!="string"?!0:n.toLowerCase().trim()==="image/jpeg"?this.thumbnailType===6:n.toLowerCase().trim()==="image/tiff"?this.thumbnailType===1:!1},getThumbnailOffset:function(){return this.app1Offset+6+this.thumbnailOffset},getThumbnailLength:function(){return this.thumbnailLength},getThumbnailBuffer:function(){return this._getThumbnailStream().nextBuffer(this.thumbnailLength)},_getThumbnailStream:function(){return this.startMarker.openWithOffset(this.getThumbnailOffset())},getImageSize:function(){return this.imageSize},getThumbnailSize:function(){var n=this._getThumbnailStream(),r;return i.parseSections(n,function(a,s){i.getSectionName(a).name==="SOF"&&(r=i.getSizeFromSOFSection(s))}),r}};function x(n){this.stream=n,this.flags={readBinaryTags:!1,resolveTagNames:!0,simplifyValues:!0,imageSize:!0,hidePointers:!0,returnTags:!0}}return x.prototype={enableBinaryFields:function(n){return this.flags.readBinaryTags=!!n,this},enablePointers:function(n){return this.flags.hidePointers=!n,this},enableTagNames:function(n){return this.flags.resolveTagNames=!!n,this},enableImageSize:function(n){return this.flags.imageSize=!!n,this},enableReturnTags:function(n){return this.flags.returnTags=!!n,this},enableSimpleValues:function(n){return this.flags.simplifyValues=!!n,this},parse:function(){var n=this.stream.mark(),r=n.openWithOffset(0),a=this.flags,s,c,h,o,u,l,d,C,S;return a.resolveTagNames&&(d=We()),a.resolveTagNames?(s={},C=function(g){return s[g.name]},S=function(g,p){s[g.name]=p}):(s=[],C=function(g){var p;for(p=0;p<s.length;++p)if(s[p].type===g.type&&s[p].section===g.section)return s.value},S=function(g,p){var m;for(m=0;m<s.length;++m)if(s[m].type===g.type&&s[m].section===g.section){s.value=p;return}}),i.parseSections(r,function(g,p){var m,b=p.offsetFrom(n);g===225?(m=e.parseTags(p,function(I,D,P,T){if(!(!a.readBinaryTags&&T===7)){if(D===513){if(h=P[0],a.hidePointers)return}else if(D===514){if(o=P[0],a.hidePointers)return}else if(D===259&&(u=P[0],a.hidePointers))return;if(a.returnTags)if(a.simplifyValues&&(P=t.simplifyValue(P,T)),a.resolveTagNames){var G=I===e.GPSIFD?d.gps:d.exif,L=G[D];L||(L=d.exif[D]),s.hasOwnProperty(L)||(s[L]=P)}else s.push({section:I,type:D,value:P})}}),m&&(l=b)):a.imageSize&&i.getSectionName(g).name==="SOF"&&(c=i.getSizeFromSOFSection(p))}),a.simplifyValues&&(t.castDegreeValues(C,S),t.castDateValues(C,S)),new f(n,s,c,h,o,u,l)}},W=x,W}var H,ue;function $e(){if(ue)return H;ue=1;function i(e,t,f,x,n,r){this.global=n,t=t||0,f=f||e.byteLength-t,this.arrayBuffer=e.slice(t,t+f),this.view=new n.DataView(this.arrayBuffer,0,this.arrayBuffer.byteLength),this.setBigEndian(x),this.offset=0,this.parentOffset=(r||0)+t}return i.prototype={setBigEndian:function(e){this.littleEndian=!e},nextUInt8:function(){var e=this.view.getUint8(this.offset);return this.offset+=1,e},nextInt8:function(){var e=this.view.getInt8(this.offset);return this.offset+=1,e},nextUInt16:function(){var e=this.view.getUint16(this.offset,this.littleEndian);return this.offset+=2,e},nextUInt32:function(){var e=this.view.getUint32(this.offset,this.littleEndian);return this.offset+=4,e},nextInt16:function(){var e=this.view.getInt16(this.offset,this.littleEndian);return this.offset+=2,e},nextInt32:function(){var e=this.view.getInt32(this.offset,this.littleEndian);return this.offset+=4,e},nextFloat:function(){var e=this.view.getFloat32(this.offset,this.littleEndian);return this.offset+=4,e},nextDouble:function(){var e=this.view.getFloat64(this.offset,this.littleEndian);return this.offset+=8,e},nextBuffer:function(e){var t=this.arrayBuffer.slice(this.offset,this.offset+e);return this.offset+=e,t},remainingLength:function(){return this.arrayBuffer.byteLength-this.offset},nextString:function(e){var t=this.arrayBuffer.slice(this.offset,this.offset+e);return t=String.fromCharCode.apply(null,new this.global.Uint8Array(t)),this.offset+=e,t},mark:function(){var e=this;return{openWithOffset:function(t){return t=(t||0)+this.offset,new i(e.arrayBuffer,t,e.arrayBuffer.byteLength-t,!e.littleEndian,e.global,e.parentOffset)},offset:this.offset,getParentOffset:function(){return e.parentOffset}}},offsetFrom:function(e){return this.parentOffset+this.offset-(e.offset+e.getParentOffset())},skip:function(e){this.offset+=e},branch:function(e,t){return t=typeof t=="number"?t:this.arrayBuffer.byteLength-(this.offset+e),new i(this.arrayBuffer,this.offset+e,t,!this.littleEndian,this.global,this.parentOffset)}},H=i,H}var $,le;function je(){if(le)return $;le=1;function i(e,t,f,x){this.buffer=e,this.offset=t||0,f=typeof f=="number"?f:e.length,this.endPosition=this.offset+f,this.setBigEndian(x)}return i.prototype={setBigEndian:function(e){this.bigEndian=!!e},nextUInt8:function(){var e=this.buffer.readUInt8(this.offset);return this.offset+=1,e},nextInt8:function(){var e=this.buffer.readInt8(this.offset);return this.offset+=1,e},nextUInt16:function(){var e=this.bigEndian?this.buffer.readUInt16BE(this.offset):this.buffer.readUInt16LE(this.offset);return this.offset+=2,e},nextUInt32:function(){var e=this.bigEndian?this.buffer.readUInt32BE(this.offset):this.buffer.readUInt32LE(this.offset);return this.offset+=4,e},nextInt16:function(){var e=this.bigEndian?this.buffer.readInt16BE(this.offset):this.buffer.readInt16LE(this.offset);return this.offset+=2,e},nextInt32:function(){var e=this.bigEndian?this.buffer.readInt32BE(this.offset):this.buffer.readInt32LE(this.offset);return this.offset+=4,e},nextFloat:function(){var e=this.bigEndian?this.buffer.readFloatBE(this.offset):this.buffer.readFloatLE(this.offset);return this.offset+=4,e},nextDouble:function(){var e=this.bigEndian?this.buffer.readDoubleBE(this.offset):this.buffer.readDoubleLE(this.offset);return this.offset+=8,e},nextBuffer:function(e){var t=this.buffer.slice(this.offset,this.offset+e);return this.offset+=e,t},remainingLength:function(){return this.endPosition-this.offset},nextString:function(e){var t=this.buffer.toString("utf8",this.offset,this.offset+e);return this.offset+=e,t},mark:function(){var e=this;return{openWithOffset:function(t){return t=(t||0)+this.offset,new i(e.buffer,t,e.endPosition-t,e.bigEndian)},offset:this.offset}},offsetFrom:function(e){return this.offset-e.offset},skip:function(e){this.offset+=e},branch:function(e,t){return t=typeof t=="number"?t:this.endPosition-(this.offset+e),new i(this.buffer,this.offset+e,t,this.bigEndian)}},$=i,$}var j,ce;function Xe(){if(ce)return j;ce=1;var i=He();function e(){return(0,eval)("this")}return j={create:function(t,f){if(f=f||e(),t instanceof f.ArrayBuffer){var x=$e();return new i(new x(t,0,t.byteLength,!0,f))}else{var n=je();return new i(new n(t,0,t.length,!0))}}},j}var Je=Xe();async function Ye(i,e,t){const f=await Ke(e).catch(x=>(console.warn(x),t.type==="image/jpeg"&&M.warn(`Impossible d'extraire les métadonnées EXIF de ${t.name}: ${(x==null?void 0:x.toString())??"Erreur inattendue"}`),{}));await de(["Image","Observation"],{},async x=>{for(const[n,{value:r,confidence:a}]of Object.entries(f))await ge({tx:x,subjectId:i,metadataId:n,value:r,confidence:a})})}async function Ke(i){const e=Je.create(i).enableImageSize(!1).parse(),t={};return e?(e.tags.DateTimeOriginal&&(t[Z.shoot_date]=new Date(e.tags.DateTimeOriginal*1e3)),e.tags.GPSLatitude&&e.tags.GPSLongitude&&(t[Z.shoot_location]={latitude:e.tags.GPSLatitude,longitude:e.tags.GPSLongitude}),Object.fromEntries(Object.entries(t).map(([f,x])=>[f,{value:x,alternatives:{},confidence:1}]))):t}const he=i=>{var e=Qe();Ae(e,"href",`https://git.inpt.fr/cigale/cigale.pages.inpt.fr/-/tree/main/models/${Q}`);var t=A(e);t.textContent=Q,y(e),O(i,e)};var Qe=w('<a target="_blank" class="svelte-qps1i2"><code class="svelte-qps1i2"></code></a>'),Ze=w('<div class="empty-state svelte-qps1i2"><!> <p>Cliquer ou déposer des images ici</p></div>'),et=w("<section><!> <!></section>"),tt=w('<section class="loading errored svelte-qps1i2"><!> <h2 class="svelte-qps1i2">Oops!</h2> <p class="svelte-qps1i2">Impossible de charger le modèle de recadrage</p> <p class="source svelte-qps1i2"><!></p> <p class="message svelte-qps1i2"> </p></section>'),at=w('<section class="loading svelte-qps1i2"><!> <p>Chargement du modèle de recadrage…</p> <p class="source svelte-qps1i2"><!></p></section>');function Ct(i,e){Ce(e,!0);const t=N(()=>v.erroredImages),f=N(()=>Be(B.Image.state,[],{isLoaded:o=>ee(o)&&v.hasPreviewURL(o)&&te(o)}));let x=X(void 0);async function n(){v.currentProtocol&&(K(x,await we(v.currentProtocol,"detection"),!0),M.success("Modèle de recadrage chargé"))}async function r(o,u){await B.Image.set({id:u,filename:o.name,addedAt:ie(new Date),metadata:{},bufferExists:!1,contentType:o.type});const l=await o.arrayBuffer(),d=await Ue({source:o});await _e({id:u,resizedBytes:d,originalBytes:l,contentType:o.type}),await Ye(u,l,o),await a(u,d,o)}async function a(o,u,{type:l,name:d}){if(!v.currentProtocol){M.error("Aucun protocole sélectionné");return}if(!F(x)){M.error("Modèle de recadrage non chargé, patentiez ou rechargez la page avant de rééssayer");return}const[[C],[S]]=await Te(v.currentProtocol,[u],F(x));console.log("Bounding boxes:",C);let[g,...p]=C,[m,...b]=S;g??(g=[0,0,.5,.5]),m??(m=1);const I=([D,P,T,G])=>Oe(v.currentProtocol)({x:D,y:P,w:T,h:G});await de(["Image","Observation"],{},async D=>{await ge({tx:D,subjectId:o,metadataId:"crop",type:"boundingbox",value:I(g),confidence:m});for(const[P,T]of p.entries())await D.objectStore("Image").put({id:ae(parseInt(o),P+1),filename:d,contentType:l,addedAt:ie(new Date),bufferExists:!0,metadata:{crop:{value:JSON.stringify(I(T)),confidence:b[P],alternatives:{}}}})})}J(()=>{if(F(x))for(const o of B.Image.state)ee(o)&&!te(o)&&!v.loadingImages.has(o.id)&&(async()=>{try{const u=await Me("ImagePreviewFile",Ge(o.id));if(!u)return;v.loadingImages.add(o.id),await a(o.id,u.bytes,{type:o.contentType,name:o.filename})}catch(u){console.error(u),F(t).set(o.id,(u==null?void 0:u.toString())??"Erreur inattendue")}finally{v.loadingImages.delete(o.id)}})()});let s=X(0);J(()=>{v.processing.total=B.Image.state.length+F(s),v.processing.total=B.Image.state.length,v.processing.done=B.Image.state.filter(o=>o.metadata.crop).length});var c=me(),h=Se(c);Fe(h,n,o=>{var u=at(),l=A(u);U(l,{loading:!0});var d=R(l,4),C=A(d);he(C),y(d),y(u),O(o,u)},(o,u)=>{const l=N(()=>F(f).length===0);Le(o,{get clickable(){return F(l)},onfiles:async({files:d})=>{K(s,d.length,!0);for(const C of d){const S=B.Image.state.length,g=ae(S);try{v.loadingImages.add(g),await r(C,g),ve(s,-1)}catch(p){console.error(p),F(t).set(g,(p==null?void 0:p.toString())??"Erreur inattendue")}finally{v.loadingImages.delete(g)}}},children:(d,C)=>{var S=et();let g;var p=A(S);ye(p,{get images(){return F(f)},get errors(){return F(t)},loadingText:"Analyse…",ondelete:async I=>{await ke(I),await Ne(I)},get selection(){return v.selection},set selection(I){v.selection=I}});var m=R(p,2);{var b=I=>{var D=Ze(),P=A(D);U(P,{variant:"empty"}),De(2),y(D),O(I,D)};be(m,I=>{F(f).length||I(b)})}y(S),Y(I=>g=Ee(S,1,"observations svelte-qps1i2",null,g,I),[()=>({empty:!F(f).length})]),O(d,S)},$$slots:{default:!0}})},(o,u)=>{var l=tt(),d=A(l);U(d,{variant:"error"});var C=R(d,6),S=A(C);he(S),y(C);var g=R(C,2),p=A(g,!0);y(g),y(l),Y(m=>Pe(p,m),[()=>{var m;return((m=F(u))==null?void 0:m.toString())??"Erreur inattendue"}]),O(o,l)}),O(i,c),Ie()}export{Ct as component};
