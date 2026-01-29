import{g as Mt}from"./BfjK8oC1.js";import"./BmYW83mJ.js";/*!
 * ONNX Runtime Web v1.23.0
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */var za=Object.defineProperty,Jh=Object.getOwnPropertyDescriptor,em=Object.getOwnPropertyNames,tm=Object.prototype.hasOwnProperty,im=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),q=(e,t)=>()=>(e&&(t=e(e=0)),t),qt=(e,t)=>{for(var r in t)za(e,r,{get:t[r],enumerable:!0})},rm=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of em(t))!tm.call(e,a)&&a!==r&&za(e,a,{get:()=>t[a],enumerable:!(i=Jh(t,a))||i.enumerable});return e},di=e=>rm(za({},"__esModule",{value:!0}),e),Kt,pt,Nt,gs,Zl,Yl=q(()=>{Kt=new Map,pt=[],Nt=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=Kt.get(e);if(i===void 0)Kt.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let a=pt.indexOf(e);a!==-1&&pt.splice(a,1);for(let s=0;s<pt.length;s++)if(Kt.get(pt[s]).priority<=r){pt.splice(s,0,e);return}pt.push(e)}return}throw new TypeError("not a valid backend")},gs=async e=>{let t=Kt.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},Zl=async e=>{let t=e.executionProviders||[],r=t.map(d=>typeof d=="string"?d:d.name),i=r.length===0?pt:r,a,s=[],o=new Set;for(let d of i){let p=await gs(d);typeof p=="string"?s.push({name:d,err:p}):(a||(a=p),a===p&&o.add(d))}if(!a)throw new Error(`no available backend found. ERR: ${s.map(d=>`[${d.name}] ${d.err}`).join(", ")}`);for(let{name:d,err:p}of s)r.includes(d)&&console.warn(`removing requested execution provider "${d}" from session options because it is not available: ${p}`);let u=t.filter(d=>o.has(typeof d=="string"?d:d.name));return[a,new Proxy(e,{get:(d,p)=>p==="executionProviders"?u:Reflect.get(d,p)})]}}),am=q(()=>{Yl()}),Xl,nm=q(()=>{Xl="1.23.0"}),_r,Ie,Ql=q(()=>{nm(),_r="warning",Ie={wasm:{},webgl:{},webgpu:{},versions:{common:Xl},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);_r=e}},get logLevel(){return _r}},Object.defineProperty(Ie,"logLevel",{enumerable:!0})}),_e,sm=q(()=>{Ql(),_e=Ie}),Jl,ed,om=q(()=>{Jl=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let a,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],s=e.dims[3]):(a=e.dims[3],s=e.dims[2]);let o=t?.format!==void 0?t.format:"RGB",u=t?.norm,d,p;u===void 0||u.mean===void 0?d=[255,255,255,255]:typeof u.mean=="number"?d=[u.mean,u.mean,u.mean,u.mean]:(d=[u.mean[0],u.mean[1],u.mean[2],0],u.mean[3]!==void 0&&(d[3]=u.mean[3])),u===void 0||u.bias===void 0?p=[0,0,0,0]:typeof u.bias=="number"?p=[u.bias,u.bias,u.bias,u.bias]:(p=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(p[3]=u.bias[3]));let f=s*a,m=0,g=f,_=f*2,b=-1;o==="RGBA"?(m=0,g=f,_=f*2,b=f*3):o==="RGB"?(m=0,g=f,_=f*2):o==="RBG"&&(m=0,_=f,g=f*2);for(let $=0;$<s;$++)for(let T=0;T<a;T++){let v=(e.data[m++]-p[0])*d[0],w=(e.data[g++]-p[1])*d[1],k=(e.data[_++]-p[2])*d[2],C=b===-1?255:(e.data[b++]-p[3])*d[3];i.fillStyle="rgba("+v+","+w+","+k+","+C+")",i.fillRect(T,$,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},ed=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let a,s,o;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],s=e.dims[1],o=e.dims[3]):(a=e.dims[3],s=e.dims[2],o=e.dims[1]);let u=t!==void 0&&t.format!==void 0?t.format:"RGB",d=t?.norm,p,f;d===void 0||d.mean===void 0?p=[255,255,255,255]:typeof d.mean=="number"?p=[d.mean,d.mean,d.mean,d.mean]:(p=[d.mean[0],d.mean[1],d.mean[2],255],d.mean[3]!==void 0&&(p[3]=d.mean[3])),d===void 0||d.bias===void 0?f=[0,0,0,0]:typeof d.bias=="number"?f=[d.bias,d.bias,d.bias,d.bias]:(f=[d.bias[0],d.bias[1],d.bias[2],0],d.bias[3]!==void 0&&(f[3]=d.bias[3]));let m=s*a;if(t!==void 0&&(t.format!==void 0&&o===4&&t.format!=="RGBA"||o===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let g=4,_=0,b=1,$=2,T=3,v=0,w=m,k=m*2,C=-1;u==="RGBA"?(v=0,w=m,k=m*2,C=m*3):u==="RGB"?(v=0,w=m,k=m*2):u==="RBG"&&(v=0,k=m,w=m*2),i=r.createImageData(a,s);for(let S=0;S<s*a;_+=g,b+=g,$+=g,T+=g,S++)i.data[_]=(e.data[v++]-f[0])*p[0],i.data[b]=(e.data[w++]-f[1])*p[1],i.data[$]=(e.data[k++]-f[2])*p[2],i.data[T]=C===-1?255:(e.data[C++]-f[3])*p[3]}else throw new Error("Can not access image data");return i}}),xi,td,id,rd,ad,nd,um=q(()=>{Aa(),xi=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,a=t.norm??{mean:255,bias:0},s,o;typeof a.mean=="number"?s=[a.mean,a.mean,a.mean,a.mean]:s=[a.mean[0],a.mean[1],a.mean[2],a.mean[3]??255],typeof a.bias=="number"?o=[a.bias,a.bias,a.bias,a.bias]:o=[a.bias[0],a.bias[1],a.bias[2],a.bias[3]??0];let u=t.format!==void 0?t.format:"RGBA",d=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",p=r*i,f=d==="RGBA"?new Float32Array(p*4):new Float32Array(p*3),m=4,g=0,_=1,b=2,$=3,T=0,v=p,w=p*2,k=-1;u==="RGB"&&(m=3,g=0,_=1,b=2,$=-1),d==="RGBA"?k=p*3:d==="RBG"?(T=0,w=p,v=p*2):d==="BGR"&&(w=0,v=p,T=p*2);for(let C=0;C<p;C++,g+=m,b+=m,_+=m,$+=m)f[T++]=(e[g]+o[0])/s[0],f[v++]=(e[_]+o[1])/s[1],f[w++]=(e[b]+o[2])/s[2],k!==-1&&$!==-1&&(f[k++]=(e[$]+o[3])/s[3]);return d==="RGBA"?new Ne("float32",f,[1,4,r,i]):new Ne("float32",f,[1,3,r,i])},td=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,a=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,s=typeof e=="string",o,u=t??{},d=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},p=f=>typeof HTMLCanvasElement<"u"&&f instanceof HTMLCanvasElement||f instanceof OffscreenCanvas?f.getContext("2d"):null;if(r){let f=d();f.width=e.width,f.height=e.height;let m=p(f);if(m!=null){let g=e.height,_=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(g=t.resizedHeight,_=t.resizedWidth),t!==void 0){if(u=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");u.tensorFormat="RGBA",u.height=g,u.width=_}else u.tensorFormat="RGBA",u.height=g,u.width=_;m.drawImage(e,0,0),o=m.getImageData(0,0,_,g).data}else throw new Error("Can not access image data")}else if(i){let f,m;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(f=t.resizedHeight,m=t.resizedWidth):(f=e.height,m=e.width),t!==void 0&&(u=t),u.format="RGBA",u.height=f,u.width=m,t!==void 0){let g=d();g.width=m,g.height=f;let _=p(g);if(_!=null)_.putImageData(e,0,0),o=_.getImageData(0,0,m,f).data;else throw new Error("Can not access image data")}else o=e.data}else if(a){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let f=d();f.width=e.width,f.height=e.height;let m=p(f);if(m!=null){let g=e.height,_=e.width;return m.drawImage(e,0,0,_,g),o=m.getImageData(0,0,_,g).data,u.height=g,u.width=_,xi(o,u)}else throw new Error("Can not access image data")}else{if(s)return new Promise((f,m)=>{let g=d(),_=p(g);if(!e||!_)return m();let b=new Image;b.crossOrigin="Anonymous",b.src=e,b.onload=()=>{g.width=b.width,g.height=b.height,_.drawImage(b,0,0,g.width,g.height);let $=_.getImageData(0,0,g.width,g.height);u.height=g.height,u.width=g.width,f(xi($.data,u))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(o!==void 0)return xi(o,u);throw new Error("Input data provided is not supported - aborted tensor creation")},id=(e,t)=>{let{width:r,height:i,download:a,dispose:s}=t,o=[1,i,r,4];return new Ne({location:"texture",type:"float32",texture:e,dims:o,download:a,dispose:s})},rd=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:s}=t;return new Ne({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:a,dispose:s})},ad=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:s}=t;return new Ne({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:a,dispose:s})},nd=(e,t,r)=>new Ne({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),xt,ni,yr,sd,lm=q(()=>{xt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),ni=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),yr=!1,sd=()=>{if(!yr){yr=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(xt.set("int64",BigInt64Array),ni.set(BigInt64Array,"int64")),t&&(xt.set("uint64",BigUint64Array),ni.set(BigUint64Array,"uint64")),i?(xt.set("float16",r),ni.set(r,"float16")):xt.set("float16",Uint16Array)}}}),od,ud,dm=q(()=>{Aa(),od=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},ud=(e,t)=>{switch(e.location){case"cpu":return new Ne(e.type,e.data,t);case"cpu-pinned":return new Ne({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new Ne({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new Ne({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new Ne({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),Ne,Aa=q(()=>{om(),um(),lm(),dm(),Ne=class{constructor(e,t,r){sd();let i,a;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,a=e.dims,e.location){case"cpu-pinned":{let o=xt.get(i);if(!o)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof o))throw new TypeError(`buffer should be of type ${o.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let o,u;if(typeof e=="string")if(i=e,u=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");o=t}else{let d=xt.get(e);if(d===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&d===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${d.name} as data.`);e==="uint64"||e==="int64"?o=d.from(t,BigInt):o=d.from(t)}else if(t instanceof d)o=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")o=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&d!==Uint16Array)o=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${d}`)}else if(u=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let d=typeof e[0];if(d==="string")i="string",o=e;else if(d==="boolean")i="bool",o=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${d}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",o=Uint8Array.from(e);else{let d=ni.get(e.constructor);if(d===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=d,o=e}if(u===void 0)u=[o.length];else if(!Array.isArray(u))throw new TypeError("A tensor's dims must be a number array");a=u,this.cpuData=o,this.dataLocation="cpu"}let s=od(a);if(this.cpuData&&s!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(s/2)===this.cpuData.length))throw new Error(`Tensor's size(${s}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=a,this.size=s}static async fromImage(e,t){return td(e,t)}static fromTexture(e,t){return id(e,t)}static fromGpuBuffer(e,t){return rd(e,t)}static fromMLTensor(e,t){return ad(e,t)}static fromPinnedBuffer(e,t,r){return nd(e,t,r)}toDataURL(e){return Jl(this,e)}toImageData(e){return ed(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return ud(this,e)}}}),Xe,ld=q(()=>{Aa(),Xe=Ne}),Pi,br,Qe,He,kt,St,dd=q(()=>{Ql(),Pi=(e,t)=>{(typeof Ie.trace>"u"?!Ie.wasm.trace:!Ie.trace)||console.timeStamp(`${e}::ORT::${t}`)},br=(e,t)=>{let r=new Error().stack?.split(/\r\n|\r|\n/g)||[],i=!1;for(let a=0;a<r.length;a++){if(i&&!r[a].includes("TRACE_FUNC")){let s=`FUNC_${e}::${r[a].trim().split(" ")[1]}`;t&&(s+=`::${t}`),Pi("CPU",s);return}r[a].includes("TRACE_FUNC")&&(i=!0)}},Qe=e=>{(typeof Ie.trace>"u"?!Ie.wasm.trace:!Ie.trace)||br("BEGIN",e)},He=e=>{(typeof Ie.trace>"u"?!Ie.wasm.trace:!Ie.trace)||br("END",e)},kt=e=>{(typeof Ie.trace>"u"?!Ie.wasm.trace:!Ie.trace)||console.time(`ORT::${e}`)},St=e=>{(typeof Ie.trace>"u"?!Ie.wasm.trace:!Ie.trace)||console.timeEnd(`ORT::${e}`)}}),pd,pm=q(()=>{Yl(),ld(),dd(),pd=class cd{constructor(t){this.handler=t}async run(t,r,i){Qe(),kt("InferenceSession.run");let a={},s={};if(typeof t!="object"||t===null||t instanceof Xe||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let o=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof Xe)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");o=!1;for(let p of r){if(typeof p!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(p)===-1)throw new RangeError(`'fetches' contains invalid output name: ${p}.`);a[p]=null}if(typeof i=="object"&&i!==null)s=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let p=!1,f=Object.getOwnPropertyNames(r);for(let m of this.outputNames)if(f.indexOf(m)!==-1){let g=r[m];(g===null||g instanceof Xe)&&(p=!0,o=!1,a[m]=g)}if(p){if(typeof i=="object"&&i!==null)s=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else s=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let p of this.inputNames)if(typeof t[p]>"u")throw new Error(`input '${p}' is missing in 'feeds'.`);if(o)for(let p of this.outputNames)a[p]=null;let u=await this.handler.run(t,a,s),d={};for(let p in u)if(Object.hasOwnProperty.call(u,p)){let f=u[p];f instanceof Xe?d[p]=f:d[p]=new Xe(f.type,f.data,f.dims)}return St("InferenceSession.run"),He(),d}async release(){return this.handler.dispose()}static async create(t,r,i,a){Qe(),kt("InferenceSession.create");let s,o={};if(typeof t=="string"){if(s=t,typeof r=="object"&&r!==null)o=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(s=t,typeof r=="object"&&r!==null)o=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let f=t,m=0,g=t.byteLength;if(typeof r=="object"&&r!==null)o=r;else if(typeof r=="number"){if(m=r,!Number.isSafeInteger(m))throw new RangeError("'byteOffset' must be an integer.");if(m<0||m>=f.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${f.byteLength}).`);if(g=t.byteLength-m,typeof i=="number"){if(g=i,!Number.isSafeInteger(g))throw new RangeError("'byteLength' must be an integer.");if(g<=0||m+g>f.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${f.byteLength-m}].`);if(typeof a=="object"&&a!==null)o=a;else if(typeof a<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");s=new Uint8Array(f,m,g)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[u,d]=await Zl(o),p=await u.createInferenceSessionHandler(s,d);return St("InferenceSession.create"),He(),new cd(p)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),fd,cm=q(()=>{pm(),fd=pd}),fm=q(()=>{}),hm=q(()=>{}),mm=q(()=>{}),gm=q(()=>{}),_m={};qt(_m,{InferenceSession:()=>fd,TRACE:()=>Pi,TRACE_EVENT_BEGIN:()=>kt,TRACE_EVENT_END:()=>St,TRACE_FUNC_BEGIN:()=>Qe,TRACE_FUNC_END:()=>He,Tensor:()=>Xe,env:()=>_e,registerBackend:()=>Nt});var Ue=q(()=>{am(),sm(),cm(),ld(),fm(),hm(),dd(),mm(),gm()}),Oa=q(()=>{}),hd={};qt(hd,{default:()=>md});var wr,$r,md,ym=q(()=>{$f(),At(),Ra(),wr="ort-wasm-proxy-worker",$r=globalThis.self?.name===wr,$r&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":Ba(r.wasm).then(()=>{Xa(r).then(()=>{postMessage({type:t})},i=>{postMessage({type:t,err:i})})},i=>{postMessage({type:t,err:i})});break;case"init-ep":{let{epName:i,env:a}=r;Qa(a,i).then(()=>{postMessage({type:t})},s=>{postMessage({type:t,err:s})});break}case"copy-from":{let{buffer:i}=r,a=Gi(i);postMessage({type:t,out:a});break}case"create":{let{model:i,options:a}=r;Ja(i,a).then(s=>{postMessage({type:t,out:s})},s=>{postMessage({type:t,err:s})});break}case"release":en(r),postMessage({type:t});break;case"run":{let{sessionId:i,inputIndices:a,inputs:s,outputIndices:o,options:u}=r;tn(i,a,s,o,new Array(o.length).fill(null),u).then(d=>{d.some(p=>p[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:d},an([...s,...d]))},d=>{postMessage({type:t,err:d})});break}case"end-profiling":rn(r),postMessage({type:t});break;default:}}catch(i){postMessage({type:t,err:i})}}),md=$r?null:e=>new Worker(e??Be,{type:"module",name:wr})}),gd={};qt(gd,{default:()=>_d});var vr,_d,_s,bm=q(()=>{vr=async function(e={}){var t,r,i=e,a=new Promise((n,l)=>{t=n,r=l}),s=typeof window=="object",o=typeof WorkerGlobalScope<"u",u=o&&self.name?.startsWith("em-pthread");i.mountExternalData=(n,l)=>{n.startsWith("./")&&(n=n.substring(2)),(i.Fb||(i.Fb=new Map)).set(n,l)},i.unmountExternalData=()=>{delete i.Fb};var d=globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,qc:!0}).buffer.constructor;let p=n=>async(...l)=>{try{if(i.Gb)throw Error("Session already started");let c=i.Gb={ec:l[0],errors:[]},h=await n(...l);if(i.Gb!==c)throw Error("Session mismatch");i.Kb?.flush();let y=c.errors;if(0<y.length){let x=await Promise.all(y);if(x=x.filter(I=>I),0<x.length)throw Error(x.join(`
`))}return h}finally{i.Gb=null}};i.jsepInit=(n,l)=>{if(n==="webgpu"){[i.Kb,i.Vb,i.Zb,i.Lb,i.Yb,i.Ab,i.$b,i.bc,i.Wb,i.Xb,i.ac]=l;let c=i.Kb;i.jsepRegisterBuffer=(h,y,x,I)=>c.registerBuffer(h,y,x,I),i.jsepGetBuffer=h=>c.getBuffer(h),i.jsepCreateDownloader=(h,y,x)=>c.createDownloader(h,y,x),i.jsepOnCreateSession=h=>{c.onCreateSession(h)},i.jsepOnReleaseSession=h=>{c.onReleaseSession(h)},i.jsepOnRunStart=h=>c.onRunStart(h),i.cc=(h,y)=>{c.upload(h,y)}}else if(n==="webnn"){let c=l[0];[i.oc,i.Ob,i.webnnEnsureTensor,i.Pb,i.webnnDownloadTensor,i.nc,i.webnnEnableTraceEvent]=l.slice(1),i.webnnReleaseTensorId=i.Ob,i.webnnUploadTensor=i.Pb,i.webnnRegisterMLContext=i.nc,i.webnnOnRunStart=h=>c.onRunStart(h),i.webnnOnRunEnd=c.onRunEnd.bind(c),i.webnnOnReleaseSession=h=>{c.onReleaseSession(h)},i.webnnCreateMLTensorDownloader=(h,y)=>c.createMLTensorDownloader(h,y),i.webnnRegisterMLTensor=(h,y,x,I)=>c.registerMLTensor(h,y,x,I),i.webnnCreateMLContext=h=>c.createMLContext(h),i.webnnRegisterMLConstant=(h,y,x,I,O,M)=>c.registerMLConstant(h,y,x,I,O,i.Fb,M),i.webnnRegisterGraphInput=c.registerGraphInput.bind(c),i.webnnIsGraphInput=c.isGraphInput.bind(c),i.webnnRegisterGraphOutput=c.registerGraphOutput.bind(c),i.webnnIsGraphOutput=c.isGraphOutput.bind(c),i.webnnCreateTemporaryTensor=c.createTemporaryTensor.bind(c),i.webnnIsGraphInputOutputTypeSupported=c.isGraphInputOutputTypeSupported.bind(c)}};let f=()=>{let n=(l,c,h)=>(...y)=>{let x=Ze,I=c?.();y=l(...y);let O=c?.();return I!==O&&(l=O,h(I),c=h=null),Ze!=x?new Promise((M,W)=>{sr={resolve:M,reject:W}}):y};(()=>{for(let l of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])i[l]=n(i[l],()=>i[l],c=>i[l]=c)})(),p!==void 0&&(i._OrtRun=p(i._OrtRun),i._OrtRunWithBinding=p(i._OrtRunWithBinding)),f=void 0};i.asyncInit=()=>{f?.()};var m,g,_=(n,l)=>{throw l},b=import.meta.url,$="";if(s||o){try{$=new URL(".",b).href}catch{}o&&(g=n=>{var l=new XMLHttpRequest;return l.open("GET",n,!1),l.responseType="arraybuffer",l.send(null),new Uint8Array(l.response)}),m=async n=>{if(ge(n))return new Promise((c,h)=>{var y=new XMLHttpRequest;y.open("GET",n,!0),y.responseType="arraybuffer",y.onload=()=>{y.status==200||y.status==0&&y.response?c(y.response):h(y.status)},y.onerror=h,y.send(null)});var l=await fetch(n,{credentials:"same-origin"});if(l.ok)return l.arrayBuffer();throw Error(l.status+" : "+l.url)}}var T,v,w,k,C,S,z,E,R,U,V,Z,X,re,j,se=console.log.bind(console),J=console.error.bind(console),H=se,ae=J,G=!1,ge=n=>n.startsWith("file://");function P(){return v.buffer!=C.buffer&&Ce(),C}function L(){return v.buffer!=C.buffer&&Ce(),S}function ie(){return v.buffer!=C.buffer&&Ce(),z}function pe(){return v.buffer!=C.buffer&&Ce(),E}function D(){return v.buffer!=C.buffer&&Ce(),R}function le(){return v.buffer!=C.buffer&&Ce(),U}function Fe(){return v.buffer!=C.buffer&&Ce(),V}function be(){return v.buffer!=C.buffer&&Ce(),re}if(u){let n=function(l){try{var c=l.data,h=c.Db;if(h==="load"){let y=[];self.onmessage=x=>y.push(x),self.startWorker=()=>{postMessage({Db:"loaded"});for(let x of y)n(x);self.onmessage=n};for(let x of c.Sb)i[x]&&!i[x].proxy||(i[x]=(...I)=>{postMessage({Db:"callHandler",Rb:x,args:I})},x=="print"&&(H=i[x]),x=="printErr"&&(ae=i[x]));v=c.kc,Ce(),j(c.lc)}else if(h==="run"){Rf(c.Bb),cr(c.Bb,0,0,1,0,0),cn(),ar(c.Bb),we||(as(),we=!0);try{Bf(c.hc,c.Jb)}catch(y){if(y!="unwind")throw y}}else c.target!=="setimmediate"&&(h==="checkMailbox"?we&&fi():h&&(ae(`worker: received unknown command ${h}`),ae(c)))}catch(y){throw ns(),y}};var we=!1;self.onunhandledrejection=l=>{throw l.reason||l},self.onmessage=n}function Ce(){var n=v.buffer;i.HEAP8=C=new Int8Array(n),z=new Int16Array(n),i.HEAPU8=S=new Uint8Array(n),E=new Uint16Array(n),i.HEAP32=R=new Int32Array(n),i.HEAPU32=U=new Uint32Array(n),V=new Float32Array(n),re=new Float64Array(n),Z=new BigInt64Array(n),X=new BigUint64Array(n)}function ci(){u?startWorker(i):B.Da()}var Wt,Lt=0,Vt=null;function nn(){if(--Lt==0&&Vt){var n=Vt;Vt=null,n()}}function st(n){throw ae(n="Aborted("+n+")"),G=!0,n=new WebAssembly.RuntimeError(n+". Build with -sASSERTIONS for more info."),r(n),n}function sn(){return{a:{L:Xh,Aa:Yh,b:Df,$:gn,A:bn,pa:wn,X:$n,Z:vn,qa:xn,na:Cn,ga:Tn,ma:kn,J:Sn,Y:In,V:En,oa:zn,W:An,va:Mf,E:Pf,Q:Uf,O:Wf,D:Vf,v:jf,s:Gf,P:Hf,z:Jf,R:eh,ja:th,T:ih,aa:rh,M:ah,F:nh,ia:ar,sa:sh,r:oh,Ca:uh,w:ph,o:ch,m:hh,c:er,Ba:mh,n:gh,j:bh,u:wh,p:$h,f:vh,t:xh,l:Ch,e:Th,k:kh,h:Sh,g:Ih,d:Eh,da:zh,ea:Ah,fa:Oh,ba:jn,ca:Gn,N:Hn,xa:Bh,ua:Dh,i:Mh,C:Ph,G:Uh,ta:Nh,x:qh,ra:Wh,U:Lh,q:Rh,y:Vh,K:jh,S:Gh,za:Hh,ya:Fh,ka:Yn,la:Xn,_:Yi,B:Qn,I:Jn,ha:es,H:ts,a:v,wa:Zi}}}class Fi{name="ExitStatus";constructor(l){this.message=`Program terminated with exit(${l})`,this.status=l}}var on=n=>{n.terminate(),n.onmessage=()=>{}},Ki=[],un=n=>{ut.length==0&&(hn(),fn(ut[0]));var l=ut.pop();if(!l)return 6;jt.push(l),gt[n.Bb]=l,l.Bb=n.Bb;var c={Db:"run",hc:n.fc,Jb:n.Jb,Bb:n.Bb};return l.postMessage(c,n.Nb),0},ot=0,$e=(n,l,...c)=>{for(var h=2*c.length,y=mr(),x=hr(8*h),I=x>>>3,O=0;O<c.length;O++){var M=c[O];typeof M=="bigint"?(Z[I+2*O]=1n,Z[I+2*O+1]=M):(Z[I+2*O]=0n,be()[I+2*O+1>>>0]=M)}return n=ss(n,0,h,x,l),vi(y),n};function Zi(n){if(u)return $e(0,1,n);if(k=n,!(0<ot)){for(var l of jt)on(l);for(l of ut)on(l);ut=[],jt=[],gt={},G=!0}_(0,new Fi(n))}function ln(n){if(u)return $e(1,0,n);Yi(n)}var Yi=n=>{if(k=n,u)throw ln(n),"unwind";Zi(n)},ut=[],jt=[],dn=[],gt={},pn=n=>{var l=n.Bb;delete gt[l],ut.push(n),jt.splice(jt.indexOf(n),1),n.Bb=0,os(l)};function cn(){dn.forEach(n=>n())}var fn=n=>new Promise(l=>{n.onmessage=y=>{var x=(y=y.data).Db;if(y.Hb&&y.Hb!=pr()){var I=gt[y.Hb];I?I.postMessage(y,y.Nb):ae(`Internal error! Worker sent a message "${x}" to target pthread ${y.Hb}, but that thread no longer exists!`)}else x==="checkMailbox"?fi():x==="spawnThread"?un(y):x==="cleanupThread"?pn(gt[y.ic]):x==="loaded"?(n.loaded=!0,l(n)):y.target==="setimmediate"?n.postMessage(y):x==="callHandler"?i[y.Rb](...y.args):x&&ae(`worker sent an unknown command ${x}`)},n.onerror=y=>{throw ae(`worker sent an error! ${y.filename}:${y.lineno}: ${y.message}`),y};var c,h=[];for(c of[])i.propertyIsEnumerable(c)&&h.push(c);n.postMessage({Db:"load",Sb:h,kc:v,lc:w})});function hn(){var n=new Worker((()=>{let l=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new l("ort.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});ut.push(n)}var Rf=n=>{Ce();var l=le()[n+52>>>2>>>0];n=le()[n+56>>>2>>>0],ds(l,l-n),vi(l)},Bf=(n,l)=>{ot=0,n=ps(n,l),0<ot?k=n:fr(n)};class Nf{constructor(l){this.Ib=l-24}}function Df(n,l,c){var h=new Nf(n>>>=0);throw l>>>=0,c>>>=0,le()[h.Ib+16>>>2>>>0]=0,le()[h.Ib+4>>>2>>>0]=l,le()[h.Ib+8>>>2>>>0]=c,n}function mn(n,l,c,h){return u?$e(2,1,n,l,c,h):gn(n,l,c,h)}function gn(n,l,c,h){if(n>>>=0,c>>>=0,h>>>=0,d===void 0)return 6;var y=[];return u&&y.length===0?mn(n,l>>>=0,c,h):(n={fc:c,Bb:n,Jb:h,Nb:y},u?(n.Db="spawnThread",postMessage(n,y),0):un(n))}var _n=typeof TextDecoder<"u"?new TextDecoder:void 0,yn=(n,l=0,c=NaN)=>{var h=(l>>>=0)+c;for(c=l;n[c]&&!(c>=h);)++c;if(16<c-l&&n.buffer&&_n)return _n.decode(n.buffer instanceof ArrayBuffer?n.subarray(l,c):n.slice(l,c));for(h="";l<c;){var y=n[l++];if(128&y){var x=63&n[l++];if((224&y)==192)h+=String.fromCharCode((31&y)<<6|x);else{var I=63&n[l++];65536>(y=(240&y)==224?(15&y)<<12|x<<6|I:(7&y)<<18|x<<12|I<<6|63&n[l++])?h+=String.fromCharCode(y):(y-=65536,h+=String.fromCharCode(55296|y>>10,56320|1023&y))}}else h+=String.fromCharCode(y)}return h},Te=(n,l)=>(n>>>=0)?yn(L(),n,l):"";function bn(n,l,c){return u?$e(3,1,n,l,c):0}function wn(n,l){if(u)return $e(4,1,n,l)}function $n(n,l){if(u)return $e(5,1,n,l)}function vn(n,l,c){if(u)return $e(6,1,n,l,c)}function xn(n,l,c){return u?$e(7,1,n,l,c):0}function Cn(n,l){if(u)return $e(8,1,n,l)}function Tn(n,l,c){if(u)return $e(9,1,n,l,c)}function kn(n,l,c,h){if(u)return $e(10,1,n,l,c,h)}function Sn(n,l,c,h){if(u)return $e(11,1,n,l,c,h)}function In(n,l,c,h){if(u)return $e(12,1,n,l,c,h)}function En(n){if(u)return $e(13,1,n)}function zn(n,l){if(u)return $e(14,1,n,l)}function An(n,l,c){if(u)return $e(15,1,n,l,c)}var On,Mf=()=>st(""),Ke=n=>{for(var l="";L()[n>>>0];)l+=On[L()[n++>>>0]];return l},Xi={},Qi={},Rt=i.BindingError=class extends Error{constructor(n){super(n),this.name="BindingError"}};function Je(n,l,c={}){return(function(h,y,x={}){var I=y.name;if(!h)throw new Rt(`type "${I}" must have a positive integer typeid pointer`);if(Qi.hasOwnProperty(h)){if(x.Tb)return;throw new Rt(`Cannot register type '${I}' twice`)}Qi[h]=y,Xi.hasOwnProperty(h)&&(y=Xi[h],delete Xi[h],y.forEach(O=>O()))})(n,l,c)}var Rn=(n,l,c)=>{switch(l){case 1:return c?h=>P()[h>>>0]:h=>L()[h>>>0];case 2:return c?h=>ie()[h>>>1>>>0]:h=>pe()[h>>>1>>>0];case 4:return c?h=>D()[h>>>2>>>0]:h=>le()[h>>>2>>>0];case 8:return c?h=>Z[h>>>3]:h=>X[h>>>3];default:throw new TypeError(`invalid integer width (${l}): ${n}`)}};function Pf(n,l,c){c>>>=0,Je(n>>>=0,{name:l=Ke(l>>>0),fromWireType:h=>h,toWireType:function(h,y){if(typeof y!="bigint"&&typeof y!="number")throw y=y===null?"null":(h=typeof y)=="object"||h==="array"||h==="function"?y.toString():""+y,new TypeError(`Cannot convert "${y}" to ${this.name}`);return typeof y=="number"&&(y=BigInt(y)),y},Cb:lt,readValueFromPointer:Rn(l,c,l.indexOf("u")==-1),Eb:null})}var lt=8;function Uf(n,l,c,h){Je(n>>>=0,{name:l=Ke(l>>>0),fromWireType:function(y){return!!y},toWireType:function(y,x){return x?c:h},Cb:lt,readValueFromPointer:function(y){return this.fromWireType(L()[y>>>0])},Eb:null})}var Ji=[],et=[];function er(n){9<(n>>>=0)&&--et[n+1]==0&&(et[n]=void 0,Ji.push(n))}var Ae=n=>{if(!n)throw new Rt(`Cannot use deleted val. handle = ${n}`);return et[n]},Me=n=>{switch(n){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let l=Ji.pop()||et.length;return et[l]=n,et[l+1]=1,l}};function tr(n){return this.fromWireType(le()[n>>>2>>>0])}var qf={name:"emscripten::val",fromWireType:n=>{var l=Ae(n);return er(n),l},toWireType:(n,l)=>Me(l),Cb:lt,readValueFromPointer:tr,Eb:null};function Wf(n){return Je(n>>>0,qf)}var Lf=(n,l)=>{switch(l){case 4:return function(c){return this.fromWireType(Fe()[c>>>2>>>0])};case 8:return function(c){return this.fromWireType(be()[c>>>3>>>0])};default:throw new TypeError(`invalid float width (${l}): ${n}`)}};function Vf(n,l,c){c>>>=0,Je(n>>>=0,{name:l=Ke(l>>>0),fromWireType:h=>h,toWireType:(h,y)=>y,Cb:lt,readValueFromPointer:Lf(l,c),Eb:null})}function jf(n,l,c,h,y){if(n>>>=0,c>>>=0,l=Ke(l>>>0),y===-1&&(y=4294967295),y=O=>O,h===0){var x=32-8*c;y=O=>O<<x>>>x}var I=l.includes("unsigned")?function(O,M){return M>>>0}:function(O,M){return M};Je(n,{name:l,fromWireType:y,toWireType:I,Cb:lt,readValueFromPointer:Rn(l,c,h!==0),Eb:null})}function Gf(n,l,c){function h(x){var I=le()[x>>>2>>>0];return x=le()[x+4>>>2>>>0],new y(P().buffer,x,I)}var y=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][l];Je(n>>>=0,{name:c=Ke(c>>>0),fromWireType:h,Cb:lt,readValueFromPointer:h},{Tb:!0})}var _t=(n,l,c)=>{var h=L();if(l>>>=0,0<c){var y=l;c=l+c-1;for(var x=0;x<n.length;++x){var I=n.charCodeAt(x);if(55296<=I&&57343>=I&&(I=65536+((1023&I)<<10)|1023&n.charCodeAt(++x)),127>=I){if(l>=c)break;h[l++>>>0]=I}else{if(2047>=I){if(l+1>=c)break;h[l++>>>0]=192|I>>6}else{if(65535>=I){if(l+2>=c)break;h[l++>>>0]=224|I>>12}else{if(l+3>=c)break;h[l++>>>0]=240|I>>18,h[l++>>>0]=128|I>>12&63}h[l++>>>0]=128|I>>6&63}h[l++>>>0]=128|63&I}}h[l>>>0]=0,n=l-y}else n=0;return n},ir=n=>{for(var l=0,c=0;c<n.length;++c){var h=n.charCodeAt(c);127>=h?l++:2047>=h?l+=2:55296<=h&&57343>=h?(l+=4,++c):l+=3}return l};function Hf(n,l){Je(n>>>=0,{name:l=Ke(l>>>0),fromWireType:function(c){for(var h,y=le()[c>>>2>>>0],x=c+4,I=x,O=0;O<=y;++O){var M=x+O;O!=y&&L()[M>>>0]!=0||(I=Te(I,M-I),h===void 0?h=I:(h+="\0",h+=I),I=M+1)}return tt(c),h},toWireType:function(c,h){h instanceof ArrayBuffer&&(h=new Uint8Array(h));var y=typeof h=="string";if(!(y||ArrayBuffer.isView(h)&&h.BYTES_PER_ELEMENT==1))throw new Rt("Cannot pass non-string to std::string");var x=y?ir(h):h.length,I=$i(4+x+1),O=I+4;return le()[I>>>2>>>0]=x,y?_t(h,O,x+1):L().set(h,O>>>0),c!==null&&c.push(tt,I),I},Cb:lt,readValueFromPointer:tr,Eb(c){tt(c)}})}var Bn=typeof TextDecoder<"u"?new TextDecoder("utf-16le"):void 0,Ff=(n,l)=>{for(var c=n>>1,h=c+l/2;!(c>=h)&&pe()[c>>>0];)++c;if(32<(c<<=1)-n&&Bn)return Bn.decode(L().slice(n,c));for(c="",h=0;!(h>=l/2);++h){var y=ie()[n+2*h>>>1>>>0];if(y==0)break;c+=String.fromCharCode(y)}return c},Kf=(n,l,c)=>{if(c??=2147483647,2>c)return 0;var h=l;c=(c-=2)<2*n.length?c/2:n.length;for(var y=0;y<c;++y){var x=n.charCodeAt(y);ie()[l>>>1>>>0]=x,l+=2}return ie()[l>>>1>>>0]=0,l-h},Zf=n=>2*n.length,Yf=(n,l)=>{for(var c=0,h="";!(c>=l/4);){var y=D()[n+4*c>>>2>>>0];if(y==0)break;++c,65536<=y?(y-=65536,h+=String.fromCharCode(55296|y>>10,56320|1023&y)):h+=String.fromCharCode(y)}return h},Xf=(n,l,c)=>{if(l>>>=0,c??=2147483647,4>c)return 0;var h=l;c=h+c-4;for(var y=0;y<n.length;++y){var x=n.charCodeAt(y);if(55296<=x&&57343>=x&&(x=65536+((1023&x)<<10)|1023&n.charCodeAt(++y)),D()[l>>>2>>>0]=x,(l+=4)+4>c)break}return D()[l>>>2>>>0]=0,l-h},Qf=n=>{for(var l=0,c=0;c<n.length;++c){var h=n.charCodeAt(c);55296<=h&&57343>=h&&++c,l+=4}return l};function Jf(n,l,c){if(n>>>=0,l>>>=0,c=Ke(c>>>=0),l===2)var h=Ff,y=Kf,x=Zf,I=O=>pe()[O>>>1>>>0];else l===4&&(h=Yf,y=Xf,x=Qf,I=O=>le()[O>>>2>>>0]);Je(n,{name:c,fromWireType:O=>{for(var M,W=le()[O>>>2>>>0],F=O+4,ee=0;ee<=W;++ee){var ue=O+4+ee*l;ee!=W&&I(ue)!=0||(F=h(F,ue-F),M===void 0?M=F:(M+="\0",M+=F),F=ue+l)}return tt(O),M},toWireType:(O,M)=>{if(typeof M!="string")throw new Rt(`Cannot pass non-string to C++ string type ${c}`);var W=x(M),F=$i(4+W+l);return le()[F>>>2>>>0]=W/l,y(M,F+4,W+l),O!==null&&O.push(tt,F),F},Cb:lt,readValueFromPointer:tr,Eb(O){tt(O)}})}function eh(n,l){Je(n>>>=0,{Ub:!0,name:l=Ke(l>>>0),Cb:0,fromWireType:()=>{},toWireType:()=>{}})}function th(n){cr(n>>>0,!o,1,!s,131072,!1),cn()}var rr=n=>{if(!G)try{if(n(),!(0<ot))try{u?fr(k):Yi(k)}catch(l){l instanceof Fi||l=="unwind"||_(0,l)}}catch(l){l instanceof Fi||l=="unwind"||_(0,l)}};function ar(n){n>>>=0,typeof Atomics.jc=="function"&&(Atomics.jc(D(),n>>>2,n).value.then(fi),n+=128,Atomics.store(D(),n>>>2,1))}var fi=()=>{var n=pr();n&&(ar(n),rr(ls))};function ih(n,l){(n>>>=0)==l>>>0?setTimeout(fi):u?postMessage({Hb:n,Db:"checkMailbox"}):(n=gt[n])&&n.postMessage({Db:"checkMailbox"})}var nr=[];function rh(n,l,c,h,y){for(l>>>=0,h/=2,nr.length=h,c=y>>>0>>>3,y=0;y<h;y++)nr[y]=Z[c+2*y]?Z[c+2*y+1]:be()[c+2*y+1>>>0];return(l?dr[l]:Zh[n])(...nr)}var ah=()=>{ot=0};function nh(n){n>>>=0,u?postMessage({Db:"cleanupThread",ic:n}):pn(gt[n])}function sh(n){}var hi=(n,l)=>{var c=Qi[n];if(c===void 0)throw n=rs(n),c=Ke(n),tt(n),new Rt(`${l} has unknown type ${c}`);return c},Nn=(n,l,c)=>{var h=[];return n=n.toWireType(h,c),h.length&&(le()[l>>>2>>>0]=Me(h)),n};function oh(n,l,c){return l>>>=0,c>>>=0,n=Ae(n>>>0),l=hi(l,"emval::as"),Nn(l,c,n)}function uh(n,l){return l>>>=0,n=Ae(n>>>0),(l=hi(l,"emval::as")).toWireType(null,n)}var mi=n=>{try{n()}catch(l){st(l)}},dt=0,Ze=null,Dn=0,gi=[],Mn={},Pn={},lh=0,sr=null,dh=[];function Un(n){return(function(l){if(!G){if(dt===0){var c=!1,h=!1;l((y=0)=>{if(!G&&(Dn=y,c=!0,h)){dt=2,mi(()=>hs(Ze)),typeof MainLoop<"u"&&MainLoop.Qb&&MainLoop.resume(),y=!1;try{var x=(function(){var M=D()[Ze+8>>>2>>>0];return M=B[Pn[M]],--ot,M()})()}catch(M){x=M,y=!0}var I=!1;if(!Ze){var O=sr;O&&(sr=null,(y?O.reject:O.resolve)(x),I=!0)}if(y&&!I)throw x}}),h=!0,c||(dt=1,Ze=(function(){var y=$i(65548),x=y+12;le()[y>>>2>>>0]=x,le()[y+4>>>2>>>0]=x+65536,x=gi[0];var I=Mn[x];return I===void 0&&(I=lh++,Mn[x]=I,Pn[I]=x),x=I,D()[y+8>>>2>>>0]=x,y})(),typeof MainLoop<"u"&&MainLoop.Qb&&MainLoop.pause(),mi(()=>cs(Ze)))}else dt===2?(dt=0,mi(ms),tt(Ze),Ze=null,dh.forEach(rr)):st(`invalid state: ${dt}`);return Dn}})(l=>{n().then(l)})}function ph(n){return n>>>=0,Un(async()=>{var l=await Ae(n);return Me(l)})}var _i=[];function ch(n,l,c,h){return c>>>=0,h>>>=0,(n=_i[n>>>0])(null,l=Ae(l>>>0),c,h)}var fh={},yi=n=>{var l=fh[n];return l===void 0?Ke(n):l};function hh(n,l,c,h,y){return c>>>=0,h>>>=0,y>>>=0,(n=_i[n>>>0])(l=Ae(l>>>0),l[c=yi(c)],h,y)}function mh(n,l){return l>>>=0,(n=Ae(n>>>0))==Ae(l)}var qn=()=>typeof globalThis=="object"?globalThis:Function("return this")();function gh(n){return(n>>>=0)==0?Me(qn()):(n=yi(n),Me(qn()[n]))}var _h=n=>{var l=_i.length;return _i.push(n),l},yh=(n,l)=>{for(var c=Array(n),h=0;h<n;++h)c[h]=hi(le()[l+4*h>>>2>>>0],`parameter ${h}`);return c};function bh(n,l,c){var h=(l=yh(n,l>>>0)).shift();n--;var y=`return function (obj, func, destructorsRef, args) {
`,x=0,I=[];c===0&&I.push("obj");for(var O=["retType"],M=[h],W=0;W<n;++W)I.push(`arg${W}`),O.push(`argType${W}`),M.push(l[W]),y+=`  var arg${W} = argType${W}.readValueFromPointer(args${x?"+"+x:""});
`,x+=l[W].Cb;return y+=`  var rv = ${c===1?"new func":"func.call"}(${I.join(", ")});
`,h.Ub||(O.push("emval_returnValue"),M.push(Nn),y+=`  return emval_returnValue(retType, destructorsRef, rv);
`),n=new Function(...O,y+`};
`)(...M),c=`methodCaller<(${l.map(F=>F.name).join(", ")}) => ${h.name}>`,_h(Object.defineProperty(n,"name",{value:c}))}function wh(n){return n=yi(n>>>0),Me(i[n])}function $h(n,l){return l>>>=0,n=Ae(n>>>0),l=Ae(l),Me(n[l])}function vh(n){9<(n>>>=0)&&(et[n+1]+=1)}function xh(){return Me([])}function Ch(n){n=Ae(n>>>0);for(var l=Array(n.length),c=0;c<n.length;c++)l[c]=n[c];return Me(l)}function Th(n){return Me(yi(n>>>0))}function kh(){return Me({})}function Sh(n){for(var l=Ae(n>>>=0);l.length;){var c=l.pop();l.pop()(c)}er(n)}function Ih(n,l,c){l>>>=0,c>>>=0,n=Ae(n>>>0),l=Ae(l),c=Ae(c),n[l]=c}function Eh(n,l){return l>>>=0,n=(n=hi(n>>>0,"_emval_take_value")).readValueFromPointer(l),Me(n)}function zh(n,l){n=-9007199254740992>n||9007199254740992<n?NaN:Number(n),l>>>=0,n=new Date(1e3*n),D()[l>>>2>>>0]=n.getUTCSeconds(),D()[l+4>>>2>>>0]=n.getUTCMinutes(),D()[l+8>>>2>>>0]=n.getUTCHours(),D()[l+12>>>2>>>0]=n.getUTCDate(),D()[l+16>>>2>>>0]=n.getUTCMonth(),D()[l+20>>>2>>>0]=n.getUTCFullYear()-1900,D()[l+24>>>2>>>0]=n.getUTCDay(),n=(n.getTime()-Date.UTC(n.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,D()[l+28>>>2>>>0]=n}var Wn=n=>n%4==0&&(n%100!=0||n%400==0),Ln=[0,31,60,91,121,152,182,213,244,274,305,335],Vn=[0,31,59,90,120,151,181,212,243,273,304,334];function Ah(n,l){n=-9007199254740992>n||9007199254740992<n?NaN:Number(n),l>>>=0,n=new Date(1e3*n),D()[l>>>2>>>0]=n.getSeconds(),D()[l+4>>>2>>>0]=n.getMinutes(),D()[l+8>>>2>>>0]=n.getHours(),D()[l+12>>>2>>>0]=n.getDate(),D()[l+16>>>2>>>0]=n.getMonth(),D()[l+20>>>2>>>0]=n.getFullYear()-1900,D()[l+24>>>2>>>0]=n.getDay();var c=(Wn(n.getFullYear())?Ln:Vn)[n.getMonth()]+n.getDate()-1|0;D()[l+28>>>2>>>0]=c,D()[l+36>>>2>>>0]=-60*n.getTimezoneOffset(),c=new Date(n.getFullYear(),6,1).getTimezoneOffset();var h=new Date(n.getFullYear(),0,1).getTimezoneOffset();n=0|(c!=h&&n.getTimezoneOffset()==Math.min(h,c)),D()[l+32>>>2>>>0]=n}function Oh(n){n>>>=0;var l=new Date(D()[n+20>>>2>>>0]+1900,D()[n+16>>>2>>>0],D()[n+12>>>2>>>0],D()[n+8>>>2>>>0],D()[n+4>>>2>>>0],D()[n>>>2>>>0],0),c=D()[n+32>>>2>>>0],h=l.getTimezoneOffset(),y=new Date(l.getFullYear(),6,1).getTimezoneOffset(),x=new Date(l.getFullYear(),0,1).getTimezoneOffset(),I=Math.min(x,y);return 0>c?D()[n+32>>>2>>>0]=+(y!=x&&I==h):0<c!=(I==h)&&(y=Math.max(x,y),l.setTime(l.getTime()+6e4*((0<c?I:y)-h))),D()[n+24>>>2>>>0]=l.getDay(),c=(Wn(l.getFullYear())?Ln:Vn)[l.getMonth()]+l.getDate()-1|0,D()[n+28>>>2>>>0]=c,D()[n>>>2>>>0]=l.getSeconds(),D()[n+4>>>2>>>0]=l.getMinutes(),D()[n+8>>>2>>>0]=l.getHours(),D()[n+12>>>2>>>0]=l.getDate(),D()[n+16>>>2>>>0]=l.getMonth(),D()[n+20>>>2>>>0]=l.getYear(),n=l.getTime(),BigInt(isNaN(n)?-1:n/1e3)}function jn(n,l,c,h,y,x,I){return u?$e(16,1,n,l,c,h,y,x,I):-52}function Gn(n,l,c,h,y,x){if(u)return $e(17,1,n,l,c,h,y,x)}var Gt={},Rh=()=>performance.timeOrigin+performance.now();function Hn(n,l){if(u)return $e(18,1,n,l);if(Gt[n]&&(clearTimeout(Gt[n].id),delete Gt[n]),!l)return 0;var c=setTimeout(()=>{delete Gt[n],rr(()=>us(n,performance.timeOrigin+performance.now()))},l);return Gt[n]={id:c,rc:l},0}function Bh(n,l,c,h){n>>>=0,l>>>=0,c>>>=0,h>>>=0;var y=new Date().getFullYear(),x=new Date(y,0,1).getTimezoneOffset();y=new Date(y,6,1).getTimezoneOffset();var I=Math.max(x,y);le()[n>>>2>>>0]=60*I,D()[l>>>2>>>0]=+(x!=y),n=(l=O=>{var M=Math.abs(O);return`UTC${0<=O?"-":"+"}${String(Math.floor(M/60)).padStart(2,"0")}${String(M%60).padStart(2,"0")}`})(x),l=l(y),y<x?(_t(n,c,17),_t(l,h,17)):(_t(n,h,17),_t(l,c,17))}var Nh=()=>Date.now();function Dh(n,l,c){return 0<=n&&3>=n?(n===0?n=Date.now():n=performance.timeOrigin+performance.now(),Z[c>>>0>>>3]=BigInt(Math.round(1e6*n)),0):28}var or=[],Fn=(n,l)=>{or.length=0;for(var c;c=L()[n++>>>0];){var h=c!=105;l+=(h&=c!=112)&&l%8?4:0,or.push(c==112?le()[l>>>2>>>0]:c==106?Z[l>>>3]:c==105?D()[l>>>2>>>0]:be()[l>>>3>>>0]),l+=h?8:4}return or};function Mh(n,l,c){return n>>>=0,l=Fn(l>>>0,c>>>0),dr[n](...l)}function Ph(n,l,c){return n>>>=0,l=Fn(l>>>0,c>>>0),dr[n](...l)}var Uh=()=>{};function qh(n,l){return ae(Te(n>>>0,l>>>0))}var Wh=()=>{throw ot+=1,"unwind"};function Lh(){return 4294901760}var Vh=()=>navigator.hardwareConcurrency;function jh(){return st("Cannot use emscripten_pc_get_function without -sUSE_OFFSET_CONVERTER"),0}function Gh(n){n>>>=0;var l=L().length;if(n<=l||4294901760<n)return!1;for(var c=1;4>=c;c*=2){var h=l*(1+.2/c);h=Math.min(h,n+100663296);e:{h=(Math.min(4294901760,65536*Math.ceil(Math.max(n,h)/65536))-v.buffer.byteLength+65535)/65536|0;try{v.grow(h),Ce();var y=1;break e}catch{}y=void 0}if(y)return!0}return!1}var bi=()=>(st("Cannot use convertFrameToPC (needed by __builtin_return_address) without -sUSE_OFFSET_CONVERTER"),0),Ht={},Kn=n=>{n.forEach(l=>{bi()})};function Hh(){var n=Error().stack.toString().split(`
`);return n[0]=="Error"&&n.shift(),Kn(n),Ht.Mb=bi(),Ht.dc=n,Ht.Mb}function Fh(n,l,c){if(n>>>=0,l>>>=0,Ht.Mb==n)var h=Ht.dc;else(h=Error().stack.toString().split(`
`))[0]=="Error"&&h.shift(),Kn(h);for(var y=3;h[y]&&bi()!=n;)++y;for(n=0;n<c&&h[n+y];++n)D()[l+4*n>>>2>>>0]=bi();return n}var ur,lr={},Zn=()=>{if(!ur){var n,l={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(typeof navigator=="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:"./this.program"};for(n in lr)lr[n]===void 0?delete l[n]:l[n]=lr[n];var c=[];for(n in l)c.push(`${n}=${l[n]}`);ur=c}return ur};function Yn(n,l){if(u)return $e(19,1,n,l);n>>>=0,l>>>=0;var c,h=0,y=0;for(c of Zn()){var x=l+h;le()[n+y>>>2>>>0]=x,h+=_t(c,x,1/0)+1,y+=4}return 0}function Xn(n,l){if(u)return $e(20,1,n,l);n>>>=0,l>>>=0;var c=Zn();for(var h of(le()[n>>>2>>>0]=c.length,n=0,c))n+=ir(h)+1;return le()[l>>>2>>>0]=n,0}function Qn(n){return u?$e(21,1,n):52}function Jn(n,l,c,h){return u?$e(22,1,n,l,c,h):52}function es(n,l,c,h){return u?$e(23,1,n,l,c,h):70}var Kh=[null,[],[]];function ts(n,l,c,h){if(u)return $e(24,1,n,l,c,h);l>>>=0,c>>>=0,h>>>=0;for(var y=0,x=0;x<c;x++){var I=le()[l>>>2>>>0],O=le()[l+4>>>2>>>0];l+=8;for(var M=0;M<O;M++){var W=n,F=L()[I+M>>>0],ee=Kh[W];F===0||F===10?((W===1?H:ae)(yn(ee)),ee.length=0):ee.push(F)}y+=O}return le()[h>>>2>>>0]=y,0}u||(function(){for(var n=i.numThreads-1;n--;)hn();Ki.push(()=>{Lt++,(function(l){u?l():Promise.all(ut.map(fn)).then(l)})(()=>nn())})})();for(var is=Array(256),wi=0;256>wi;++wi)is[wi]=String.fromCharCode(wi);On=is,et.push(0,1,void 0,1,null,1,!0,1,!1,1),i.count_emval_handles=()=>et.length/2-5-Ji.length,u||(v=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),Ce()),i.wasmBinary&&(T=i.wasmBinary),i.stackSave=()=>mr(),i.stackRestore=n=>vi(n),i.stackAlloc=n=>hr(n),i.setValue=function(n,l,c="i8"){switch(c.endsWith("*")&&(c="*"),c){case"i1":case"i8":P()[n>>>0]=l;break;case"i16":ie()[n>>>1>>>0]=l;break;case"i32":D()[n>>>2>>>0]=l;break;case"i64":Z[n>>>3]=BigInt(l);break;case"float":Fe()[n>>>2>>>0]=l;break;case"double":be()[n>>>3>>>0]=l;break;case"*":le()[n>>>2>>>0]=l;break;default:st(`invalid type for setValue: ${c}`)}},i.getValue=function(n,l="i8"){switch(l.endsWith("*")&&(l="*"),l){case"i1":case"i8":return P()[n>>>0];case"i16":return ie()[n>>>1>>>0];case"i32":return D()[n>>>2>>>0];case"i64":return Z[n>>>3];case"float":return Fe()[n>>>2>>>0];case"double":return be()[n>>>3>>>0];case"*":return le()[n>>>2>>>0];default:st(`invalid type for getValue: ${l}`)}},i.UTF8ToString=Te,i.stringToUTF8=_t,i.lengthBytesUTF8=ir;var Zh=[Zi,ln,mn,bn,wn,$n,vn,xn,Cn,Tn,kn,Sn,In,En,zn,An,jn,Gn,Hn,Yn,Xn,Qn,Jn,es,ts],dr={892060:(n,l,c,h,y)=>{if(i===void 0||!i.Fb)return 1;if((n=Te(Number(n>>>0))).startsWith("./")&&(n=n.substring(2)),!(n=i.Fb.get(n)))return 2;if(l=Number(l>>>0),c=Number(c>>>0),h=Number(h>>>0),l+c>n.byteLength)return 3;try{let x=n.subarray(l,l+c);switch(y){case 0:L().set(x,h>>>0);break;case 1:i.mc?i.mc(h,x):i.cc(h,x);break;default:return 4}return 0}catch{return 4}},892884:(n,l,c)=>{i.Pb(n,L().subarray(l>>>0,l+c>>>0))},892948:()=>i.oc(),892990:n=>{i.Ob(n)},893027:()=>{i.Wb()},893058:()=>{i.Xb()},893087:()=>{i.ac()},893112:n=>i.Vb(n),893145:n=>i.Zb(n),893177:(n,l,c)=>{i.Lb(Number(n),Number(l),Number(c),!0)},893240:(n,l,c)=>{i.Lb(Number(n),Number(l),Number(c))},893297:()=>typeof wasmOffsetConverter<"u",893354:n=>{i.Ab("Abs",n,void 0)},893405:n=>{i.Ab("Neg",n,void 0)},893456:n=>{i.Ab("Floor",n,void 0)},893509:n=>{i.Ab("Ceil",n,void 0)},893561:n=>{i.Ab("Reciprocal",n,void 0)},893619:n=>{i.Ab("Sqrt",n,void 0)},893671:n=>{i.Ab("Exp",n,void 0)},893722:n=>{i.Ab("Erf",n,void 0)},893773:n=>{i.Ab("Sigmoid",n,void 0)},893828:(n,l,c)=>{i.Ab("HardSigmoid",n,{alpha:l,beta:c})},893907:n=>{i.Ab("Log",n,void 0)},893958:n=>{i.Ab("Sin",n,void 0)},894009:n=>{i.Ab("Cos",n,void 0)},894060:n=>{i.Ab("Tan",n,void 0)},894111:n=>{i.Ab("Asin",n,void 0)},894163:n=>{i.Ab("Acos",n,void 0)},894215:n=>{i.Ab("Atan",n,void 0)},894267:n=>{i.Ab("Sinh",n,void 0)},894319:n=>{i.Ab("Cosh",n,void 0)},894371:n=>{i.Ab("Asinh",n,void 0)},894424:n=>{i.Ab("Acosh",n,void 0)},894477:n=>{i.Ab("Atanh",n,void 0)},894530:n=>{i.Ab("Tanh",n,void 0)},894582:n=>{i.Ab("Not",n,void 0)},894633:(n,l,c)=>{i.Ab("Clip",n,{min:l,max:c})},894702:n=>{i.Ab("Clip",n,void 0)},894754:(n,l)=>{i.Ab("Elu",n,{alpha:l})},894812:n=>{i.Ab("Gelu",n,void 0)},894864:n=>{i.Ab("Relu",n,void 0)},894916:(n,l)=>{i.Ab("LeakyRelu",n,{alpha:l})},894980:(n,l)=>{i.Ab("ThresholdedRelu",n,{alpha:l})},895050:(n,l)=>{i.Ab("Cast",n,{to:l})},895108:n=>{i.Ab("Add",n,void 0)},895159:n=>{i.Ab("Sub",n,void 0)},895210:n=>{i.Ab("Mul",n,void 0)},895261:n=>{i.Ab("Div",n,void 0)},895312:n=>{i.Ab("Pow",n,void 0)},895363:n=>{i.Ab("Equal",n,void 0)},895416:n=>{i.Ab("Greater",n,void 0)},895471:n=>{i.Ab("GreaterOrEqual",n,void 0)},895533:n=>{i.Ab("Less",n,void 0)},895585:n=>{i.Ab("LessOrEqual",n,void 0)},895644:(n,l,c,h,y)=>{i.Ab("ReduceMean",n,{keepDims:!!l,noopWithEmptyAxes:!!c,axes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},895819:(n,l,c,h,y)=>{i.Ab("ReduceMax",n,{keepDims:!!l,noopWithEmptyAxes:!!c,axes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},895993:(n,l,c,h,y)=>{i.Ab("ReduceMin",n,{keepDims:!!l,noopWithEmptyAxes:!!c,axes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},896167:(n,l,c,h,y)=>{i.Ab("ReduceProd",n,{keepDims:!!l,noopWithEmptyAxes:!!c,axes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},896342:(n,l,c,h,y)=>{i.Ab("ReduceSum",n,{keepDims:!!l,noopWithEmptyAxes:!!c,axes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},896516:(n,l,c,h,y)=>{i.Ab("ReduceL1",n,{keepDims:!!l,noopWithEmptyAxes:!!c,axes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},896689:(n,l,c,h,y)=>{i.Ab("ReduceL2",n,{keepDims:!!l,noopWithEmptyAxes:!!c,axes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},896862:(n,l,c,h,y)=>{i.Ab("ReduceLogSum",n,{keepDims:!!l,noopWithEmptyAxes:!!c,axes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},897039:(n,l,c,h,y)=>{i.Ab("ReduceSumSquare",n,{keepDims:!!l,noopWithEmptyAxes:!!c,axes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},897219:(n,l,c,h,y)=>{i.Ab("ReduceLogSumExp",n,{keepDims:!!l,noopWithEmptyAxes:!!c,axes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},897399:n=>{i.Ab("Where",n,void 0)},897452:(n,l,c)=>{i.Ab("Transpose",n,{perm:l?Array.from(D().subarray(Number(l)>>>0,Number(c)>>>0)):[]})},897576:(n,l,c,h)=>{i.Ab("DepthToSpace",n,{blocksize:l,mode:Te(c),format:h?"NHWC":"NCHW"})},897709:(n,l,c,h)=>{i.Ab("DepthToSpace",n,{blocksize:l,mode:Te(c),format:h?"NHWC":"NCHW"})},897842:(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke)=>{i.Ab("ConvTranspose",n,{format:M?"NHWC":"NCHW",autoPad:l,dilations:[c],group:h,kernelShape:[y],pads:[x,I],strides:[O],wIsConst:()=>!!P()[W>>>0],outputPadding:F?Array.from(D().subarray(Number(F)>>>0,Number(ee)>>>0)):[],outputShape:ue?Array.from(D().subarray(Number(ue)>>>0,Number(fe)>>>0)):[],activation:Te(ke)})},898275:(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe)=>{i.Ab("ConvTranspose",n,{format:O?"NHWC":"NCHW",autoPad:l,dilations:Array.from(D().subarray(Number(c)>>>0,2+(Number(c)>>>0)>>>0)),group:h,kernelShape:Array.from(D().subarray(Number(y)>>>0,2+(Number(y)>>>0)>>>0)),pads:Array.from(D().subarray(Number(x)>>>0,4+(Number(x)>>>0)>>>0)),strides:Array.from(D().subarray(Number(I)>>>0,2+(Number(I)>>>0)>>>0)),wIsConst:()=>!!P()[M>>>0],outputPadding:W?Array.from(D().subarray(Number(W)>>>0,Number(F)>>>0)):[],outputShape:ee?Array.from(D().subarray(Number(ee)>>>0,Number(ue)>>>0)):[],activation:Te(fe)})},898936:(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke)=>{i.Ab("ConvTranspose",n,{format:M?"NHWC":"NCHW",autoPad:l,dilations:[c],group:h,kernelShape:[y],pads:[x,I],strides:[O],wIsConst:()=>!!P()[W>>>0],outputPadding:F?Array.from(D().subarray(Number(F)>>>0,Number(ee)>>>0)):[],outputShape:ue?Array.from(D().subarray(Number(ue)>>>0,Number(fe)>>>0)):[],activation:Te(ke)})},899369:(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe)=>{i.Ab("ConvTranspose",n,{format:O?"NHWC":"NCHW",autoPad:l,dilations:Array.from(D().subarray(Number(c)>>>0,2+(Number(c)>>>0)>>>0)),group:h,kernelShape:Array.from(D().subarray(Number(y)>>>0,2+(Number(y)>>>0)>>>0)),pads:Array.from(D().subarray(Number(x)>>>0,4+(Number(x)>>>0)>>>0)),strides:Array.from(D().subarray(Number(I)>>>0,2+(Number(I)>>>0)>>>0)),wIsConst:()=>!!P()[M>>>0],outputPadding:W?Array.from(D().subarray(Number(W)>>>0,Number(F)>>>0)):[],outputShape:ee?Array.from(D().subarray(Number(ee)>>>0,Number(ue)>>>0)):[],activation:Te(fe)})},900030:(n,l)=>{i.Ab("GlobalAveragePool",n,{format:l?"NHWC":"NCHW"})},900121:(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe)=>{i.Ab("AveragePool",n,{format:fe?"NHWC":"NCHW",auto_pad:l,ceil_mode:c,count_include_pad:h,storage_order:y,dilations:x?Array.from(D().subarray(Number(x)>>>0,Number(I)>>>0)):[],kernel_shape:O?Array.from(D().subarray(Number(O)>>>0,Number(M)>>>0)):[],pads:W?Array.from(D().subarray(Number(W)>>>0,Number(F)>>>0)):[],strides:ee?Array.from(D().subarray(Number(ee)>>>0,Number(ue)>>>0)):[]})},900600:(n,l)=>{i.Ab("GlobalAveragePool",n,{format:l?"NHWC":"NCHW"})},900691:(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe)=>{i.Ab("AveragePool",n,{format:fe?"NHWC":"NCHW",auto_pad:l,ceil_mode:c,count_include_pad:h,storage_order:y,dilations:x?Array.from(D().subarray(Number(x)>>>0,Number(I)>>>0)):[],kernel_shape:O?Array.from(D().subarray(Number(O)>>>0,Number(M)>>>0)):[],pads:W?Array.from(D().subarray(Number(W)>>>0,Number(F)>>>0)):[],strides:ee?Array.from(D().subarray(Number(ee)>>>0,Number(ue)>>>0)):[]})},901170:(n,l)=>{i.Ab("GlobalMaxPool",n,{format:l?"NHWC":"NCHW"})},901257:(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe)=>{i.Ab("MaxPool",n,{format:fe?"NHWC":"NCHW",auto_pad:l,ceil_mode:c,count_include_pad:h,storage_order:y,dilations:x?Array.from(D().subarray(Number(x)>>>0,Number(I)>>>0)):[],kernel_shape:O?Array.from(D().subarray(Number(O)>>>0,Number(M)>>>0)):[],pads:W?Array.from(D().subarray(Number(W)>>>0,Number(F)>>>0)):[],strides:ee?Array.from(D().subarray(Number(ee)>>>0,Number(ue)>>>0)):[]})},901732:(n,l)=>{i.Ab("GlobalMaxPool",n,{format:l?"NHWC":"NCHW"})},901819:(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe)=>{i.Ab("MaxPool",n,{format:fe?"NHWC":"NCHW",auto_pad:l,ceil_mode:c,count_include_pad:h,storage_order:y,dilations:x?Array.from(D().subarray(Number(x)>>>0,Number(I)>>>0)):[],kernel_shape:O?Array.from(D().subarray(Number(O)>>>0,Number(M)>>>0)):[],pads:W?Array.from(D().subarray(Number(W)>>>0,Number(F)>>>0)):[],strides:ee?Array.from(D().subarray(Number(ee)>>>0,Number(ue)>>>0)):[]})},902294:(n,l,c,h,y)=>{i.Ab("Gemm",n,{alpha:l,beta:c,transA:h,transB:y})},902398:n=>{i.Ab("MatMul",n,void 0)},902452:(n,l,c,h)=>{i.Ab("ArgMax",n,{keepDims:!!l,selectLastIndex:!!c,axis:h})},902560:(n,l,c,h)=>{i.Ab("ArgMin",n,{keepDims:!!l,selectLastIndex:!!c,axis:h})},902668:(n,l)=>{i.Ab("Softmax",n,{axis:l})},902731:(n,l)=>{i.Ab("Concat",n,{axis:l})},902791:(n,l,c,h,y)=>{i.Ab("Split",n,{axis:l,numOutputs:c,splitSizes:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},902947:n=>{i.Ab("Expand",n,void 0)},903001:(n,l)=>{i.Ab("Gather",n,{axis:Number(l)})},903072:(n,l)=>{i.Ab("GatherElements",n,{axis:Number(l)})},903151:(n,l)=>{i.Ab("GatherND",n,{batch_dims:Number(l)})},903230:(n,l,c,h,y,x,I,O,M,W,F)=>{i.Ab("Resize",n,{antialias:l,axes:c?Array.from(D().subarray(Number(c)>>>0,Number(h)>>>0)):[],coordinateTransformMode:Te(y),cubicCoeffA:x,excludeOutside:I,extrapolationValue:O,keepAspectRatioPolicy:Te(M),mode:Te(W),nearestMode:Te(F)})},903592:(n,l,c,h,y,x,I)=>{i.Ab("Slice",n,{starts:l?Array.from(D().subarray(Number(l)>>>0,Number(c)>>>0)):[],ends:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[],axes:x?Array.from(D().subarray(Number(x)>>>0,Number(I)>>>0)):[]})},903856:n=>{i.Ab("Tile",n,void 0)},903908:(n,l,c)=>{i.Ab("InstanceNormalization",n,{epsilon:l,format:c?"NHWC":"NCHW"})},904022:(n,l,c)=>{i.Ab("InstanceNormalization",n,{epsilon:l,format:c?"NHWC":"NCHW"})},904136:n=>{i.Ab("Range",n,void 0)},904189:(n,l)=>{i.Ab("Einsum",n,{equation:Te(l)})},904270:(n,l,c,h,y)=>{i.Ab("Pad",n,{mode:l,value:c,pads:h?Array.from(D().subarray(Number(h)>>>0,Number(y)>>>0)):[]})},904413:(n,l,c,h,y,x)=>{i.Ab("BatchNormalization",n,{epsilon:l,momentum:c,spatial:!!y,trainingMode:!!h,format:x?"NHWC":"NCHW"})},904582:(n,l,c,h,y,x)=>{i.Ab("BatchNormalization",n,{epsilon:l,momentum:c,spatial:!!y,trainingMode:!!h,format:x?"NHWC":"NCHW"})},904751:(n,l,c)=>{i.Ab("CumSum",n,{exclusive:Number(l),reverse:Number(c)})},904848:(n,l,c)=>{i.Ab("DequantizeLinear",n,{axis:l,blockSize:c})},904938:(n,l,c,h,y)=>{i.Ab("GridSample",n,{align_corners:l,mode:Te(c),padding_mode:Te(h),format:y?"NHWC":"NCHW"})},905108:(n,l,c,h,y)=>{i.Ab("GridSample",n,{align_corners:l,mode:Te(c),padding_mode:Te(h),format:y?"NHWC":"NCHW"})},905278:(n,l)=>{i.Ab("ScatterND",n,{reduction:Te(l)})},905363:(n,l,c,h,y,x,I,O,M)=>{i.Ab("Attention",n,{numHeads:l,isUnidirectional:c,maskFilterValue:h,scale:y,doRotary:x,qkvHiddenSizes:I?Array.from(D().subarray(Number(O)>>>0,Number(O)+I>>>0)):[],pastPresentShareBuffer:!!M})},905635:n=>{i.Ab("BiasAdd",n,void 0)},905690:n=>{i.Ab("BiasSplitGelu",n,void 0)},905751:n=>{i.Ab("FastGelu",n,void 0)},905807:(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re)=>{i.Ab("Conv",n,{format:ee?"NHWC":"NCHW",auto_pad:l,dilations:c?Array.from(D().subarray(Number(c)>>>0,Number(h)>>>0)):[],group:y,kernel_shape:x?Array.from(D().subarray(Number(x)>>>0,Number(I)>>>0)):[],pads:O?Array.from(D().subarray(Number(O)>>>0,Number(M)>>>0)):[],strides:W?Array.from(D().subarray(Number(W)>>>0,Number(F)>>>0)):[],w_is_const:()=>!!P()[Number(ue)>>>0],activation:Te(fe),activation_params:ke?Array.from(Fe().subarray(Number(ke)>>>0,Number(Re)>>>0)):[]})},906391:n=>{i.Ab("Gelu",n,void 0)},906443:(n,l,c,h,y,x,I,O,M)=>{i.Ab("GroupQueryAttention",n,{numHeads:l,kvNumHeads:c,scale:h,softcap:y,doRotary:x,rotaryInterleaved:I,smoothSoftmax:O,localWindowSize:M})},906660:(n,l,c,h)=>{i.Ab("LayerNormalization",n,{axis:l,epsilon:c,simplified:!!h})},906771:(n,l,c,h)=>{i.Ab("LayerNormalization",n,{axis:l,epsilon:c,simplified:!!h})},906882:(n,l,c,h,y,x)=>{i.Ab("MatMulNBits",n,{k:l,n:c,accuracyLevel:h,bits:y,blockSize:x})},907009:(n,l,c,h,y,x)=>{i.Ab("MultiHeadAttention",n,{numHeads:l,isUnidirectional:c,maskFilterValue:h,scale:y,doRotary:x})},907168:(n,l)=>{i.Ab("QuickGelu",n,{alpha:l})},907232:(n,l,c,h,y)=>{i.Ab("RotaryEmbedding",n,{interleaved:!!l,numHeads:c,rotaryEmbeddingDim:h,scale:y})},907371:(n,l,c)=>{i.Ab("SkipLayerNormalization",n,{epsilon:l,simplified:!!c})},907473:(n,l,c)=>{i.Ab("SkipLayerNormalization",n,{epsilon:l,simplified:!!c})},907575:(n,l,c,h)=>{i.Ab("GatherBlockQuantized",n,{gatherAxis:l,quantizeAxis:c,blockSize:h})},907696:n=>{i.$b(n)},907730:(n,l)=>i.bc(Number(n),Number(l),i.Gb.ec,i.Gb.errors)};function Yh(n,l,c){return Un(async()=>{await i.Yb(Number(n),Number(l),Number(c))})}function Xh(){return typeof wasmOffsetConverter<"u"}var B=await(async function(){function n(h,y){return B=h.exports,B=(function(){var x=B,I={};for(let[O,M]of Object.entries(x))I[O]=typeof M=="function"?(...W)=>{gi.push(O);try{return M(...W)}finally{G||(gi.pop(),Ze&&dt===1&&gi.length===0&&(dt=0,ot+=1,mi(fs),typeof Fibers<"u"&&Fibers.sc()))}}:M;return I})(),B=(function(){var x=B,I=M=>W=>M(W)>>>0,O=M=>()=>M()>>>0;return(x=Object.assign({},x)).Ea=I(x.Ea),x.gb=O(x.gb),x.ib=I(x.ib),x.tb=I(x.tb),x.ub=O(x.ub),x.__cxa_get_exception_ptr=I(x.__cxa_get_exception_ptr),x})(),dn.push(B.jb),w=y,nn(),B}Lt++;var l=sn();if(i.instantiateWasm)return new Promise(h=>{i.instantiateWasm(l,(y,x)=>{h(n(y,x))})});if(u)return new Promise(h=>{j=y=>{var x=new WebAssembly.Instance(y,sn());h(n(x,y))}});Wt??=i.locateFile?i.locateFile?i.locateFile("ort-wasm-simd-threaded.jsep.wasm",$):$+"ort-wasm-simd-threaded.jsep.wasm":new URL(""+new URL("../assets/ort-wasm-simd-threaded.jsep.CLmJQkb_.wasm",import.meta.url).href,import.meta.url).href;try{var c=await(async function(h){var y=Wt;if(!T&&typeof WebAssembly.instantiateStreaming=="function"&&!ge(y))try{var x=fetch(y,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(x,h)}catch(I){ae(`wasm streaming compile failed: ${I}`),ae("falling back to ArrayBuffer instantiation")}return(async function(I,O){try{var M=await(async function(W){if(!T)try{var F=await m(W);return new Uint8Array(F)}catch{}if(W==Wt&&T)W=new Uint8Array(T);else{if(!g)throw"both async and sync fetching of the wasm failed";W=g(W)}return W})(I);return await WebAssembly.instantiate(M,O)}catch(W){ae(`failed to asynchronously prepare wasm: ${W}`),st(W)}})(y,h)})(l);return n(c.instance,c.module)}catch(h){return r(h),Promise.reject(h)}})(),rs=n=>(rs=B.Ea)(n),as=()=>(as=B.Fa)();i._OrtInit=(n,l)=>(i._OrtInit=B.Ga)(n,l),i._OrtGetLastError=(n,l)=>(i._OrtGetLastError=B.Ha)(n,l),i._OrtCreateSessionOptions=(n,l,c,h,y,x,I,O,M,W)=>(i._OrtCreateSessionOptions=B.Ia)(n,l,c,h,y,x,I,O,M,W),i._OrtAppendExecutionProvider=(n,l,c,h,y)=>(i._OrtAppendExecutionProvider=B.Ja)(n,l,c,h,y),i._OrtAddFreeDimensionOverride=(n,l,c)=>(i._OrtAddFreeDimensionOverride=B.Ka)(n,l,c),i._OrtAddSessionConfigEntry=(n,l,c)=>(i._OrtAddSessionConfigEntry=B.La)(n,l,c),i._OrtReleaseSessionOptions=n=>(i._OrtReleaseSessionOptions=B.Ma)(n),i._OrtCreateSession=(n,l,c)=>(i._OrtCreateSession=B.Na)(n,l,c),i._OrtReleaseSession=n=>(i._OrtReleaseSession=B.Oa)(n),i._OrtGetInputOutputCount=(n,l,c)=>(i._OrtGetInputOutputCount=B.Pa)(n,l,c),i._OrtGetInputOutputMetadata=(n,l,c,h)=>(i._OrtGetInputOutputMetadata=B.Qa)(n,l,c,h),i._OrtFree=n=>(i._OrtFree=B.Ra)(n),i._OrtCreateTensor=(n,l,c,h,y,x)=>(i._OrtCreateTensor=B.Sa)(n,l,c,h,y,x),i._OrtGetTensorData=(n,l,c,h,y)=>(i._OrtGetTensorData=B.Ta)(n,l,c,h,y),i._OrtReleaseTensor=n=>(i._OrtReleaseTensor=B.Ua)(n),i._OrtCreateRunOptions=(n,l,c,h)=>(i._OrtCreateRunOptions=B.Va)(n,l,c,h),i._OrtAddRunConfigEntry=(n,l,c)=>(i._OrtAddRunConfigEntry=B.Wa)(n,l,c),i._OrtReleaseRunOptions=n=>(i._OrtReleaseRunOptions=B.Xa)(n),i._OrtCreateBinding=n=>(i._OrtCreateBinding=B.Ya)(n),i._OrtBindInput=(n,l,c)=>(i._OrtBindInput=B.Za)(n,l,c),i._OrtBindOutput=(n,l,c,h)=>(i._OrtBindOutput=B._a)(n,l,c,h),i._OrtClearBoundOutputs=n=>(i._OrtClearBoundOutputs=B.$a)(n),i._OrtReleaseBinding=n=>(i._OrtReleaseBinding=B.ab)(n),i._OrtRunWithBinding=(n,l,c,h,y)=>(i._OrtRunWithBinding=B.bb)(n,l,c,h,y),i._OrtRun=(n,l,c,h,y,x,I,O)=>(i._OrtRun=B.cb)(n,l,c,h,y,x,I,O),i._OrtEndProfiling=n=>(i._OrtEndProfiling=B.db)(n),i._JsepOutput=(n,l,c)=>(i._JsepOutput=B.eb)(n,l,c),i._JsepGetNodeName=n=>(i._JsepGetNodeName=B.fb)(n);var pr=()=>(pr=B.gb)(),tt=i._free=n=>(tt=i._free=B.hb)(n),$i=i._malloc=n=>($i=i._malloc=B.ib)(n),cr=(n,l,c,h,y,x)=>(cr=B.kb)(n,l,c,h,y,x),ns=()=>(ns=B.lb)(),ss=(n,l,c,h,y)=>(ss=B.mb)(n,l,c,h,y),os=n=>(os=B.nb)(n),fr=n=>(fr=B.ob)(n),us=(n,l)=>(us=B.pb)(n,l),ls=()=>(ls=B.qb)(),ds=(n,l)=>(ds=B.rb)(n,l),vi=n=>(vi=B.sb)(n),hr=n=>(hr=B.tb)(n),mr=()=>(mr=B.ub)(),ps=i.dynCall_ii=(n,l)=>(ps=i.dynCall_ii=B.vb)(n,l);i.dynCall_vii=(n,l,c)=>(i.dynCall_vii=B.dynCall_vii)(n,l,c),i.dynCall_iiiii=(n,l,c,h,y)=>(i.dynCall_iiiii=B.dynCall_iiiii)(n,l,c,h,y),i.dynCall_iii=(n,l,c)=>(i.dynCall_iii=B.dynCall_iii)(n,l,c),i.dynCall_iiiiii=(n,l,c,h,y,x)=>(i.dynCall_iiiiii=B.dynCall_iiiiii)(n,l,c,h,y,x),i.dynCall_iiiiiiii=(n,l,c,h,y,x,I,O)=>(i.dynCall_iiiiiiii=B.dynCall_iiiiiiii)(n,l,c,h,y,x,I,O),i.dynCall_iiiiiii=(n,l,c,h,y,x,I)=>(i.dynCall_iiiiiii=B.dynCall_iiiiiii)(n,l,c,h,y,x,I),i.dynCall_vi=(n,l)=>(i.dynCall_vi=B.dynCall_vi)(n,l),i.dynCall_iiii=(n,l,c,h)=>(i.dynCall_iiii=B.dynCall_iiii)(n,l,c,h),i.dynCall_i=n=>(i.dynCall_i=B.dynCall_i)(n),i.dynCall_viiiiiiii=(n,l,c,h,y,x,I,O,M)=>(i.dynCall_viiiiiiii=B.dynCall_viiiiiiii)(n,l,c,h,y,x,I,O,M),i.dynCall_viii=(n,l,c,h)=>(i.dynCall_viii=B.dynCall_viii)(n,l,c,h),i.dynCall_viijj=(n,l,c,h,y)=>(i.dynCall_viijj=B.dynCall_viijj)(n,l,c,h,y),i.dynCall_viiiiii=(n,l,c,h,y,x,I)=>(i.dynCall_viiiiii=B.dynCall_viiiiii)(n,l,c,h,y,x,I),i.dynCall_viiii=(n,l,c,h,y)=>(i.dynCall_viiii=B.dynCall_viiii)(n,l,c,h,y),i.dynCall_viiiii=(n,l,c,h,y,x)=>(i.dynCall_viiiii=B.dynCall_viiiii)(n,l,c,h,y,x),i.dynCall_vfiii=(n,l,c,h,y)=>(i.dynCall_vfiii=B.dynCall_vfiii)(n,l,c,h,y),i.dynCall_viiiiff=(n,l,c,h,y,x,I)=>(i.dynCall_viiiiff=B.dynCall_viiiiff)(n,l,c,h,y,x,I),i.dynCall_viiiiiff=(n,l,c,h,y,x,I,O)=>(i.dynCall_viiiiiff=B.dynCall_viiiiiff)(n,l,c,h,y,x,I,O),i.dynCall_ffff=(n,l,c,h)=>(i.dynCall_ffff=B.dynCall_ffff)(n,l,c,h),i.dynCall_viiff=(n,l,c,h,y)=>(i.dynCall_viiff=B.dynCall_viiff)(n,l,c,h,y),i.dynCall_fffffff=(n,l,c,h,y,x,I)=>(i.dynCall_fffffff=B.dynCall_fffffff)(n,l,c,h,y,x,I),i.dynCall_jjjjjjj=(n,l,c,h,y,x,I)=>(i.dynCall_jjjjjjj=B.dynCall_jjjjjjj)(n,l,c,h,y,x,I),i.dynCall_jjjjjj=(n,l,c,h,y,x)=>(i.dynCall_jjjjjj=B.dynCall_jjjjjj)(n,l,c,h,y,x),i.dynCall_iijjii=(n,l,c,h,y,x)=>(i.dynCall_iijjii=B.dynCall_iijjii)(n,l,c,h,y,x),i.dynCall_viiiiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe)=>(i.dynCall_viiiiiiiiiiiii=B.dynCall_viiiiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe),i.dynCall_viiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F)=>(i.dynCall_viiiiiiiiii=B.dynCall_viiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F),i.dynCall_viiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee)=>(i.dynCall_viiiiiiiiiii=B.dynCall_viiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee),i.dynCall_viiiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee,ue)=>(i.dynCall_viiiiiiiiiiii=B.dynCall_viiiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee,ue),i.dynCall_viiiiiiiiiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re,it,yt,Ft)=>(i.dynCall_viiiiiiiiiiiiiiiiii=B.dynCall_viiiiiiiiiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re,it,yt,Ft),i.dynCall_viiiiiiiii=(n,l,c,h,y,x,I,O,M,W)=>(i.dynCall_viiiiiiiii=B.dynCall_viiiiiiiii)(n,l,c,h,y,x,I,O,M,W),i.dynCall_viiiiiiiiiiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re,it,yt,Ft,gr)=>(i.dynCall_viiiiiiiiiiiiiiiiiii=B.dynCall_viiiiiiiiiiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re,it,yt,Ft,gr),i.dynCall_viiiiiii=(n,l,c,h,y,x,I,O)=>(i.dynCall_viiiiiii=B.dynCall_viiiiiii)(n,l,c,h,y,x,I,O),i.dynCall_viiiiiiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re)=>(i.dynCall_viiiiiiiiiiiiiii=B.dynCall_viiiiiiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re),i.dynCall_jiji=(n,l,c,h)=>(i.dynCall_jiji=B.dynCall_jiji)(n,l,c,h),i.dynCall_v=n=>(i.dynCall_v=B.dynCall_v)(n),i.dynCall_iidiiii=(n,l,c,h,y,x,I)=>(i.dynCall_iidiiii=B.dynCall_iidiiii)(n,l,c,h,y,x,I),i.dynCall_iiiiiiiii=(n,l,c,h,y,x,I,O,M)=>(i.dynCall_iiiiiiiii=B.dynCall_iiiiiiiii)(n,l,c,h,y,x,I,O,M),i.dynCall_iiij=(n,l,c,h)=>(i.dynCall_iiij=B.dynCall_iiij)(n,l,c,h),i.dynCall_iiiiiiiiii=(n,l,c,h,y,x,I,O,M,W)=>(i.dynCall_iiiiiiiiii=B.dynCall_iiiiiiiiii)(n,l,c,h,y,x,I,O,M,W),i.dynCall_iiiiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee,ue)=>(i.dynCall_iiiiiiiiiiiii=B.dynCall_iiiiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee,ue),i.dynCall_iiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F)=>(i.dynCall_iiiiiiiiiii=B.dynCall_iiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F),i.dynCall_ji=(n,l)=>(i.dynCall_ji=B.dynCall_ji)(n,l),i.dynCall_iijii=(n,l,c,h,y)=>(i.dynCall_iijii=B.dynCall_iijii)(n,l,c,h,y),i.dynCall_vij=(n,l,c)=>(i.dynCall_vij=B.dynCall_vij)(n,l,c),i.dynCall_viiijii=(n,l,c,h,y,x,I)=>(i.dynCall_viiijii=B.dynCall_viiijii)(n,l,c,h,y,x,I),i.dynCall_viijiiiiiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re,it,yt)=>(i.dynCall_viijiiiiiiiiiiiiii=B.dynCall_viijiiiiiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re,it,yt),i.dynCall_viiiji=(n,l,c,h,y,x)=>(i.dynCall_viiiji=B.dynCall_viiiji)(n,l,c,h,y,x),i.dynCall_fiii=(n,l,c,h)=>(i.dynCall_fiii=B.dynCall_fiii)(n,l,c,h),i.dynCall_viijii=(n,l,c,h,y,x)=>(i.dynCall_viijii=B.dynCall_viijii)(n,l,c,h,y,x),i.dynCall_viij=(n,l,c,h)=>(i.dynCall_viij=B.dynCall_viij)(n,l,c,h),i.dynCall_jiij=(n,l,c,h)=>(i.dynCall_jiij=B.dynCall_jiij)(n,l,c,h),i.dynCall_fi=(n,l)=>(i.dynCall_fi=B.dynCall_fi)(n,l),i.dynCall_fii=(n,l,c)=>(i.dynCall_fii=B.dynCall_fii)(n,l,c),i.dynCall_jii=(n,l,c)=>(i.dynCall_jii=B.dynCall_jii)(n,l,c),i.dynCall_dii=(n,l,c)=>(i.dynCall_dii=B.dynCall_dii)(n,l,c),i.dynCall_fiiii=(n,l,c,h,y)=>(i.dynCall_fiiii=B.dynCall_fiiii)(n,l,c,h,y),i.dynCall_fif=(n,l,c)=>(i.dynCall_fif=B.dynCall_fif)(n,l,c),i.dynCall_jfi=(n,l,c)=>(i.dynCall_jfi=B.dynCall_jfi)(n,l,c),i.dynCall_viiiiiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke)=>(i.dynCall_viiiiiiiiiiiiii=B.dynCall_viiiiiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke),i.dynCall_viiiiiiiiiiiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re,it,yt,Ft,gr,Qh)=>(i.dynCall_viiiiiiiiiiiiiiiiiiii=B.dynCall_viiiiiiiiiiiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re,it,yt,Ft,gr,Qh),i.dynCall_viiiiiiiiiiiiiiii=(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re,it)=>(i.dynCall_viiiiiiiiiiiiiiii=B.dynCall_viiiiiiiiiiiiiiii)(n,l,c,h,y,x,I,O,M,W,F,ee,ue,fe,ke,Re,it),i.dynCall_iif=(n,l,c)=>(i.dynCall_iif=B.dynCall_iif)(n,l,c),i.dynCall_jiiii=(n,l,c,h,y)=>(i.dynCall_jiiii=B.dynCall_jiiii)(n,l,c,h,y),i.dynCall_jiii=(n,l,c,h)=>(i.dynCall_jiii=B.dynCall_jiii)(n,l,c,h),i.dynCall_viif=(n,l,c,h)=>(i.dynCall_viif=B.dynCall_viif)(n,l,c,h),i.dynCall_viiij=(n,l,c,h,y)=>(i.dynCall_viiij=B.dynCall_viiij)(n,l,c,h,y),i.dynCall_viiiijii=(n,l,c,h,y,x,I,O)=>(i.dynCall_viiiijii=B.dynCall_viiiijii)(n,l,c,h,y,x,I,O),i.dynCall_iiiiij=(n,l,c,h,y,x)=>(i.dynCall_iiiiij=B.dynCall_iiiiij)(n,l,c,h,y,x),i.dynCall_iiiiid=(n,l,c,h,y,x)=>(i.dynCall_iiiiid=B.dynCall_iiiiid)(n,l,c,h,y,x),i.dynCall_iiiiijj=(n,l,c,h,y,x,I)=>(i.dynCall_iiiiijj=B.dynCall_iiiiijj)(n,l,c,h,y,x,I),i.dynCall_iiiiiijj=(n,l,c,h,y,x,I,O)=>(i.dynCall_iiiiiijj=B.dynCall_iiiiiijj)(n,l,c,h,y,x,I,O);var cs=n=>(cs=B.wb)(n),fs=()=>(fs=B.xb)(),hs=n=>(hs=B.yb)(n),ms=()=>(ms=B.zb)();return(function n(){if(0<Lt)Vt=n;else if(u)t(i),ci();else{for(;0<Ki.length;)Ki.shift()(i);0<Lt?Vt=n:(i.calledRun=!0,G||(ci(),t(i)))}})(),i.PTR_SIZE=4,a},_d=vr,_s=globalThis.self?.name?.startsWith("em-pthread"),_s&&vr()}),xr,ha,ys,Be,yd,Ci,bs,ws,Cr,$s,Tr,bd,kr,wd,Ra=q(()=>{Oa(),xr=typeof location>"u"?void 0:location.origin,ha=import.meta.url>"file:"&&import.meta.url<"file;",ys=()=>{{if(ha){let e=URL;return new URL(new e("ort.bundle.min.mjs",import.meta.url).href,xr).href}return import.meta.url}},Be=ys(),yd=()=>{if(Be&&!Be.startsWith("blob:"))return Be.substring(0,Be.lastIndexOf("/")+1)},Ci=(e,t)=>{try{let r=t??Be;return(r?new URL(e,r):new URL(e)).origin===xr}catch{return!1}},bs=(e,t)=>{let r=t??Be;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},ws=(e,t)=>`${t??"./"}${e}`,Cr=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},$s=async e=>(await import(e)).default,Tr=(ym(),di(hd)).default,bd=async()=>{if(!Be)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Ci(Be))return[void 0,Tr()];let e=await Cr(Be);return[e,Tr(e)]},kr=(bm(),di(gd)).default,wd=async(e,t,r,i)=>{let a=kr&&!(e||t);if(a)if(Be)a=Ci(Be);else if(i&&!r)a=!0;else throw new Error("cannot determine the script source URL.");if(a)return[void 0,kr];{let s="ort-wasm-simd-threaded.jsep.mjs",o=e??bs(s,t),u=r&&o&&!Ci(o,t),d=u?await Cr(o):o??ws(s,t);return[u?d:void 0,await $s(d)]}}}),Sr,Ti,Zt,Ir,vs,xs,Cs,Ba,ye,At=q(()=>{Ra(),Ti=!1,Zt=!1,Ir=!1,vs=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},xs=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},Cs=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Ba=async e=>{if(Ti)return Promise.resolve();if(Zt)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(Ir)throw new Error("previous call to 'initializeWebAssembly()' failed.");Zt=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!Cs())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!xs())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=vs();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let a=e.wasmPaths,s=typeof a=="string"?a:void 0,o=a?.mjs,u=o?.href??o,d=a?.wasm,p=d?.href??d,f=e.wasmBinary,[m,g]=await wd(u,s,r>1,!!f||!!p),_=!1,b=[];if(t>0&&b.push(new Promise($=>{setTimeout(()=>{_=!0,$()},t)})),b.push(new Promise(($,T)=>{let v={numThreads:r};if(f)v.wasmBinary=f;else if(p||s)v.locateFile=w=>p??s+w;else if(u&&u.indexOf("blob:")!==0)v.locateFile=w=>new URL(w,u).href;else if(m){let w=yd();w&&(v.locateFile=k=>w+k)}g(v).then(w=>{Zt=!1,Ti=!0,Sr=w,$(),m&&URL.revokeObjectURL(m)},w=>{Zt=!1,Ir=!0,T(w)})})),await Promise.race(b),_)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},ye=()=>{if(Ti&&Sr)return Sr;throw new Error("WebAssembly is not initialized yet.")}}),Ge,Ui,me,Na=q(()=>{At(),Ge=(e,t)=>{let r=ye(),i=r.lengthBytesUTF8(e)+1,a=r._malloc(i);return r.stringToUTF8(e,a,i),t.push(a),a},Ui=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([a,s])=>{let o=t?t+a:a;if(typeof s=="object")Ui(s,o+".",r,i);else if(typeof s=="string"||typeof s=="number")i(o,s.toString());else if(typeof s=="boolean")i(o,s?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof s}`)})},me=e=>{let t=ye(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetLastError(a,a+i);let s=Number(t.getValue(a,i===4?"i32":"i64")),o=t.getValue(a+i,"*"),u=o?t.UTF8ToString(o):"";throw new Error(`${e} ERROR_CODE: ${s}, ERROR_MESSAGE: ${u}`)}finally{t.stackRestore(r)}}}),$d,wm=q(()=>{At(),Na(),$d=e=>{let t=ye(),r=0,i=[],a=e||{};try{if(e?.logSeverityLevel===void 0)a.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)a.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(a.terminate=!1);let s=0;return e?.tag!==void 0&&(s=Ge(e.tag,i)),r=t._OrtCreateRunOptions(a.logSeverityLevel,a.logVerbosityLevel,!!a.terminate,s),r===0&&me("Can't create run options."),e?.extra!==void 0&&Ui(e.extra,"",new WeakSet,(o,u)=>{let d=Ge(o,i),p=Ge(u,i);t._OrtAddRunConfigEntry(r,d,p)!==0&&me(`Can't set a run config entry: ${o} - ${u}.`)}),[r,i]}catch(s){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(o=>t._free(o)),s}}}),Ts,ks,Ss,Yt,Is,vd,$m=q(()=>{At(),Na(),Ts=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},ks=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},Ss=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},Yt=(e,t,r,i)=>{let a=Ge(t,i),s=Ge(r,i);ye()._OrtAddSessionConfigEntry(e,a,s)!==0&&me(`Can't set a session config entry: ${t} - ${r}.`)},Is=async(e,t,r)=>{for(let i of t){let a=typeof i=="string"?i:i.name,s=[];switch(a){case"webnn":if(a="WEBNN",typeof i!="string"){let f=i?.deviceType;f&&Yt(e,"deviceType",f,r)}break;case"webgpu":if(a="JS",typeof i!="string"){let f=i;if(f?.preferredLayout){if(f.preferredLayout!=="NCHW"&&f.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${f.preferredLayout}`);Yt(e,"preferredLayout",f.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let o=Ge(a,r),u=s.length,d=0,p=0;if(u>0){d=ye()._malloc(u*ye().PTR_SIZE),r.push(d),p=ye()._malloc(u*ye().PTR_SIZE),r.push(p);for(let f=0;f<u;f++)ye().setValue(d+f*ye().PTR_SIZE,s[f][0],"*"),ye().setValue(p+f*ye().PTR_SIZE,s[f][1],"*")}await ye()._OrtAppendExecutionProvider(e,o,d,p,u)!==0&&me(`Can't append execution provider: ${a}.`)}},vd=async e=>{let t=ye(),r=0,i=[],a=e||{};Ss(a);try{let s=Ts(a.graphOptimizationLevel??"all"),o=ks(a.executionMode??"sequential"),u=typeof a.logId=="string"?Ge(a.logId,i):0,d=a.logSeverityLevel??2;if(!Number.isInteger(d)||d<0||d>4)throw new Error(`log severity level is not valid: ${d}`);let p=a.logVerbosityLevel??0;if(!Number.isInteger(p)||p<0||p>4)throw new Error(`log verbosity level is not valid: ${p}`);let f=typeof a.optimizedModelFilePath=="string"?Ge(a.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(s,!!a.enableCpuMemArena,!!a.enableMemPattern,o,!!a.enableProfiling,0,u,d,p,f),r===0&&me("Can't create session options."),a.executionProviders&&await Is(r,a.executionProviders,i),a.enableGraphCapture!==void 0){if(typeof a.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${a.enableGraphCapture}`);Yt(r,"enableGraphCapture",a.enableGraphCapture.toString(),i)}if(a.freeDimensionOverrides)for(let[m,g]of Object.entries(a.freeDimensionOverrides)){if(typeof m!="string")throw new Error(`free dimension override name must be a string: ${m}`);if(typeof g!="number"||!Number.isInteger(g)||g<0)throw new Error(`free dimension override value must be a non-negative integer: ${g}`);let _=Ge(m,i);t._OrtAddFreeDimensionOverride(r,_,g)!==0&&me(`Can't set a free dimension override: ${m} - ${g}.`)}return a.extra!==void 0&&Ui(a.extra,"",new WeakSet,(m,g)=>{Yt(r,m,g,i)}),[r,i]}catch(s){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&me("Can't release session options."),i.forEach(o=>t._free(o)),s}}}),Ct,at,Tt,Hi,qi,Da,Ma,ma,te=q(()=>{Ct=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},at=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Tt=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((a,s)=>a*s,1);return r>0?Math.ceil(i*r):void 0},Hi=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},qi=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Da=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Ma=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",ma=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Pa,xd=q(()=>{Oa(),Pa=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let a=t.body.getReader(),s;try{s=new ArrayBuffer(i)}catch(u){if(u instanceof RangeError){let d=Math.ceil(i/65536);s=new WebAssembly.Memory({initial:d,maximum:d}).buffer}else throw u}let o=0;for(;;){let{done:u,value:d}=await a.read();if(u)break;let p=d.byteLength;new Uint8Array(s,o,p).set(d),o+=p}return new Uint8Array(s,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),Es,zs,As,Os,Ua,Rs,de,nt=q(()=>{te(),Es=["V","I","W","E","F"],zs=(e,t)=>{console.log(`[${Es[e]},${new Date().toISOString()}]${t}`)},Ua=(e,t)=>{As=e,Os=t},Rs=(e,t)=>{let r=qi(e),i=qi(As);r>=i&&zs(r,typeof t=="function"?t():t)},de=(...e)=>{Os&&Rs(...e)}}),Bs,Pt,A,Wi,Cd,Td,kd,ne=q(()=>{Bs=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},Pt=class{static calcShape(e,t,r=!1){let i=e.length,a=t.length;if(i===0)return t;if(a===0)return e;let s=Math.max(e.length,t.length),o=new Array(s);if(r){if(i<2||a<2)return;let u=Bs.calcMatMulShape([e[i-2],e[i-1]],[t[a-2],t[a-1]]);if(u===void 0)return;[o[s-2],o[s-1]]=u}for(let u=r?3:1;u<=s;u++){let d=i-u<0?1:e[i-u],p=a-u<0?1:t[a-u];if(d!==p&&d>1&&p>1)return;let f=Math.max(d,p);if(d&&p)o[s-u]=Math.max(d,p);else{if(f>1)return;o[s-u]=0}}return o}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let a=1;a<=r;a++)if(e[r-a]!==1&&e[r-a]!==t[i-a])return!1;return!0}},A=class Di{static size(t){return Di.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let a=new Array(i),s=i-1;for(;s>=0;){if(t[s]%r===0){a[s]=t[s]/r;break}if(r%t[s]!==0)throw new Error("cannot convert shape");a[s]=1,r/=t[s],s--}for(s--;s>=0;s--)a[s]=t[s];return a}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Di.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Di.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let a=1;for(let s=r;s<i;s++){if(t[s]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");a*=Number(t[s])}return a}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let a=r-3;a>=0;--a)i[a]=i[a+1]*t[a+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((a,s)=>a+r[s]+r[s+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,a)=>i===r[a])}},Wi=class si{static adjustPoolAttributes(t,r,i,a,s,o){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let u=0;u<r.length-2;u++)u>=i.length?i.push(r[u+2]):i[u]=r[u+2];for(let u=0;u<i.length;u++)if(u<a.length){if(a[u]<0)throw new Error("strides should be greater than or equal to 1")}else a.push(1);for(let u=0;u<i.length;u++)if(u<s.length){if(s[u]<0)throw new Error("dilations should be greater than or equal to 1")}else s.push(1);for(let u=0;u<i.length*2;u++)if(u<o.length){if(o[u]<0)throw new Error("pad should be greater than or equal to 1")}else o.push(0);for(let u=0;u<i.length;u++){if(i[u]<=0)throw new Error("kernel shapes need to be greater than 0");if(o[u]>=i[u]||o[u+i.length]>=i[u])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,a,s,o,u){if(u){if(s.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(a.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let d=0;d<t.length-2;d++)si.adjustPadAndReturnShape(t[d+(o?1:2)],r[d],i[d],a[d],s,d,d+t.length-2,u)}}static computePoolOutputShape(t,r,i,a,s,o,u){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let d=[r[0],r[1]];return si.computeShapeHelper(t,r,d,i,a,s,o,u),d}static computeConvOutputShape(t,r,i,a,s,o,u){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let d=[t[0],r[0]];return si.computeShapeHelper(!1,t,d,i,a,s,o,u),d}static computeShapeHelper(t,r,i,a,s,o,u,d){if(t)for(let p=0;p<r.length-2;p++)i.push(1);else for(let p=0;p<r.length-2;p++)i.push(si.adjustPadAndReturnShape(r[p+2],a[p],s[p],o[p],u,p,p+r.length-2,d))}static adjustPadAndReturnShape(t,r,i,a,s,o,u,d){let p=i*(a-1)+1;if(d&&d!=="NOTSET")switch(d){case"VALID":return s[o]=0,s[u]=0,Math.floor((t-p)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let f=((t+r-1)/r-1)*r+a-t;return s[o]=Math.floor(d==="SAME_LOWER"?(f+1)/2:f/2),s[u]=f-s[o],Math.floor((t+f-a)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+s[o]+s[u]-p)/r+1)}},Cd=class{static getShapeOfGemmResult(e,t,r,i,a){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let s,o,u;t?(s=e[1],o=e[0]):(s=e[0],o=e[1]);let d=-1;if(i?(u=r[0],d=1):(u=r[1],d=0),r[d]!==o)throw new Error("dimension mismatch");if(s<=0||u<=0||o<=0)throw new Error("invalid shape specified");if(a&&!Pt.isValidBroadcast(a,[s,u]))throw new Error("gemm: invalid bias shape for broadcast");return[s,u,o]}},Td=-34028234663852886e22,kd=34028234663852886e22}),qa,Sd=q(()=>{te(),qa=(e,t)=>new(Hi(t))(e)}),Er,ga,zr,Ns,Ar,Ds,Or,Rr,Br,Ms,Id,vm=q(()=>{te(),nt(),Er=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),ga=(e,t)=>{if(t==="int32")return e;let r=Er.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let a=e.byteLength/i,s=new(Hi(t))(e.buffer,e.byteOffset,a);switch(t){case"int64":case"uint64":{let o=new Int32Array(a);for(let u=0;u<a;u++){let d=s[u];if(d>2147483647n||d<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");o[u]=Number(d)}return new Uint8Array(o.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&s.some(u=>u>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let o=Int32Array.from(s,Number);return new Uint8Array(o.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},zr=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let a=BigInt64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"uint64":{if(i.some(s=>s<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let a=BigUint64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"int8":{if(i.some(s=>s<-128||s>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let a=Int8Array.from(i,Number);return new Uint8Array(a.buffer)}case"uint8":{if(i.some(a=>a<0||a>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(s=>s<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let a=Uint32Array.from(i,Number);return new Uint8Array(a.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},Ns=1,Ar=()=>Ns++,Ds=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),Or=(e,t)=>{let r=Er.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,a)=>i*a)*r/8):0},Rr=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:a,shape:s,fallbackDataType:o}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=a,this.tensorShape=s,this.fallbackDataType=o}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return Or(this.dataType,this.tensorShape)}destroy(){de("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=zr(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return r.buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,a)=>i===r[a])}setIsDataConverted(e){this.isDataConverted=e}},Br=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let a=this.tensorManager.getMLContext(e),s;if(!a.opSupportLimits().input.dataTypes.includes(t)){if(s=Ds.get(t),!s||!a.opSupportLimits().input.dataTypes.includes(s))throw new Error(`WebNN backend does not support data type: ${t}`);de("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(a,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==Or(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let o=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,o,!0,!0,s),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=ga(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else de("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?zr(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},Ms=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}reserveTensorId(){let e=Ar();return this.tensorTrackersById.set(e,new Br(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,a){de("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${a}}`);let s=this.tensorTrackersById.get(t);if(!s)throw new Error("Tensor not found.");return s.ensureTensor(e,r,i,a)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){de("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let a=this.getMLContext(e),s=Ar(),o=new Rr({sessionId:e,context:a,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(s,new Br(this,o)),this.externalTensors.add(o),s}async getCachedTensor(e,t,r,i,a,s,o){let u=this.getMLContext(e);for(let[p,f]of this.freeTensors.entries())if(f.canReuseTensor(u,t,r)){de("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${o?`fallbackDataType: ${o},`:""} shape: ${r}`);let m=this.freeTensors.splice(p,1)[0];return m.sessionId=e,m}de("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${o?`fallbackDataType: ${o},`:""} shape: ${r}}`);let d=await u.createTensor({dataType:o??t,shape:r,dimensions:r,usage:i,writable:a,readable:s});return new Rr({sessionId:e,context:u,tensor:d,dataType:t,shape:r,fallbackDataType:o})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Id=(...e)=>new Ms(...e)}),Xt,Ps,Ed,xm=q(()=>{te(),At(),Sd(),vm(),nt(),Xt=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),Ps=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((a,s)=>a===i[s]&&e[a]===t[a])},Ed=class{constructor(e){this.tensorManager=Id(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,Ua(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){de("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){de("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)de("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>Ps(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(a=>a.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){de("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,a){let s=Xt.get(r);if(!s)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,s,i,a)}async createTemporaryTensor(e,t,r){de("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=Xt.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let a=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,a,i,r,!1);let s=this.temporarySessionTensorIds.get(e);return s?s.push(a):this.temporarySessionTensorIds.set(e,[a]),a}uploadTensor(e,t){if(!ye().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");de("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return qa(r,t)}}registerMLTensor(e,t,r,i){let a=Xt.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);let s=this.tensorManager.registerTensor(e,t,a,i);return de("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${a}, dimensions: ${i}} -> {tensorId: ${s}}`),s}registerMLConstant(e,t,r,i,a,s,o=!1){if(!s)throw new Error("External mounted files are not available.");let u=e;e.startsWith("./")&&(u=e.substring(2));let d=s.get(u);if(!d)throw new Error(`File with name ${u} not found in preloaded files.`);if(t+r>d.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let p=d.slice(t,t+r).buffer,f;switch(a.dataType){case"float32":f=new Float32Array(p);break;case"float16":f=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(p):new Uint16Array(p);break;case"int32":f=new Int32Array(p);break;case"uint32":f=new Uint32Array(p);break;case"int64":if(o){let m=ga(new Uint8Array(p),"int64");f=new Int32Array(m.buffer),a.dataType="int32"}else f=new BigInt64Array(p);break;case"uint64":f=new BigUint64Array(p);break;case"int8":f=new Int8Array(p);break;case"int4":case"uint4":case"uint8":f=new Uint8Array(p);break;default:throw new Error(`Unsupported data type: ${a.dataType} in creating WebNN Constant from external data.`)}return de("verbose",()=>`[WebNN] registerMLConstant {dataType: ${a.dataType}, shape: ${a.shape}}} ${o?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(a,f)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=this.mlContextBySessionId.get(e),a=Xt.get(Ct(t));return typeof a>"u"?!1:r?!!i?.opSupportLimits().input.dataTypes.includes(a):!!i?.opSupportLimits().output.dataTypes.includes(a)}flush(){}}}),Wa=q(()=>{}),Nr,ki,Si,Us,qs,Dr,_a,Ws,zd,Cm=q(()=>{nt(),Wa(),Nr=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),ki=[],Si=e=>Math.ceil(Number(e)/16)*16,Us=e=>{for(let t=0;t<ki.length;t++){let r=ki[t];if(e<=r)return r}return Math.ceil(e/16)*16},qs=1,Dr=()=>qs++,_a=async(e,t,r,i)=>{let a=Si(r),s=e.device.createBuffer({size:a,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let o=e.getCommandEncoder();e.endComputePass(),o.copyBufferToBuffer(t,0,s,0,a),e.flush(),await s.mapAsync(GPUMapMode.READ);let u=s.getMappedRange();if(i){let d=i();return d.set(new Uint8Array(u,0,r)),d}else return new Uint8Array(u.slice(0,r))}finally{s.destroy()}},Ws=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of Nr)ki.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,a=t.byteLength,s=Si(a),o=this.storageCache.get(e);if(!o)throw new Error("gpu data for uploading does not exist");if(Number(o.originalSize)!==a)throw new Error(`inconsistent data size. gpu data size=${o.originalSize}, data size=${a}`);let u=this.backend.device.createBuffer({mappedAtCreation:!0,size:s,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),d=u.getMappedRange();new Uint8Array(d).set(new Uint8Array(r,i,a)),u.unmap();let p=this.backend.device.createCommandEncoder();p.copyBufferToBuffer(u,0,o.gpuData.buffer,0,s),this.backend.device.queue.submit([p.finish()]),u.destroy(),de("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let a=Si(r.originalSize),s=this.backend.getCommandEncoder();this.backend.endComputePass(),s.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,a)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return de("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=Dr();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),de("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),de("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=Us(e),i,a=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,s=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(a||s){let u=(a?this.freeBuffers:this.freeUniformBuffers).get(r);u?u.length>0?i=u.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let o={id:Dr(),type:0,buffer:i};return this.storageCache.set(o.id,{gpuData:o,originalSize:Number(e)}),de("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${o.id}`),o}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return de("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await _a(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=Nr.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(de("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},zd=(...e)=>new Ws(...e)}),Ls,he,xe=q(()=>{Ls=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},he=e=>new Ls(e)}),Ut,Ii,Se,ze,Q,ve,ya,Dt,ht,Y,Qt,N,K,Ad,La,Vs,Od,oe=q(()=>{te(),ne(),Ut=64,Ii=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Se=(e,t=1)=>{let r=Ii(e,t);return typeof r=="string"?r:r[0]},ze=(e,t=1)=>{let r=Ii(e,t);return typeof r=="string"?r:r[1]},Q=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:A.computeStrides(r)})}),t},ve=e=>e%4===0?4:e%2===0?2:1,ya=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,Dt=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,ht=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,Y=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,Qt=(e,t,r,i,a)=>{let s=typeof r=="number",o=s?r:r.length,u=[...new Array(o).keys()],d=o<2?"u32":o<=4?`vec${o}<u32>`:`array<u32, ${o}>`,p=Ii(t,a),f=typeof p=="string"?p:p[1],m=typeof p=="string"?p:p[0],g={indices:d,value:f,storage:m,tensor:t},_=P=>typeof P=="string"?P:`${P}u`,b={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},$=s?"uniforms.":"",T=`${$}${e}_shape`,v=`${$}${e}_strides`,w="";for(let P=0;P<o-1;P++)w+=`
    let dim${P} = current / ${Y(v,P,o)};
    let rest${P} = current % ${Y(v,P,o)};
    indices[${P}] = dim${P};
    current = rest${P};
    `;w+=`indices[${o-1}] = current;`;let k=o<2?"":`
  fn o2i_${e}(offset: u32) -> ${g.indices} {
    var indices: ${g.indices};
    var current = offset;
    ${w}
    return indices;
  }`,C=P=>(b.offsetToIndices=!0,o<2?P:`o2i_${e}(${P})`),S=[];if(o>=2)for(let P=o-1;P>=0;P--)S.push(`${Y(v,P,o)} * (indices[${P}])`);let z=o<2?"":`
  fn i2o_${e}(indices: ${g.indices}) -> u32 {
    return ${S.join("+")};
  }`,E=P=>(b.indicesToOffset=!0,o<2?P:`i2o_${e}(${P})`),R=(...P)=>o===0?"0u":`${g.indices}(${P.map(_).join(",")})`,U=(P,L)=>o<2?`${P}`:`${Y(P,L,o)}`,V=(P,L,ie)=>o<2?`${P}=${ie};`:`${Y(P,L,o)}=${ie};`,Z={},X=(P,L)=>{b.broadcastedIndicesToOffset=!0;let ie=`${L.name}broadcastedIndicesTo${e}Offset`;if(ie in Z)return`${ie}(${P})`;let pe=[];for(let D=o-1;D>=0;D--){let le=L.indicesGet("outputIndices",D+L.rank-o);pe.push(`${U(v,D)} * (${le} % ${U(T,D)})`)}return Z[ie]=`fn ${ie}(outputIndices: ${L.type.indices}) -> u32 {
             return ${pe.length>0?pe.join("+"):"0u"};
           }`,`${ie}(${P})`},re=(P,L)=>(()=>{if(g.storage===g.value)return`${e}[${P}]=${L};`;if(g.storage==="vec2<u32>"&&g.value==="i32")return`${e}[${P}]=vec2<u32>(u32(${L}), select(0u, 0xFFFFFFFFu, ${L} < 0));`;if(g.storage==="vec2<u32>"&&g.value==="u32")return`${e}[${P}]=vec2<u32>(u32(${L}), 0u);`;if(g.storage==="u32"&&g.value==="vec4<bool>")return`${e}[${P}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${L}));`;throw new Error(`not supported combination of storage type ${g.storage} and value type ${g.value} yet`)})(),j=P=>(()=>{if(g.storage===g.value)return`${e}[${P}]`;if(g.storage==="vec2<u32>"&&g.value==="i32")return`i32(${e}[${P}].x)`;if(g.storage==="vec2<u32>"&&g.value==="u32")return`u32(${e}[${P}].x)`;if(g.storage==="u32"&&g.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${P}] & 0xFFu), bool(${e}[${P}] & 0xFF00u), bool(${e}[${P}] & 0xFF0000u), bool(${e}[${P}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${g.storage} and value type ${g.value} yet`)})(),se=o<2?"":`
  fn get_${e}ByIndices(indices: ${g.indices}) -> ${f} {
    return ${j(`i2o_${e}(indices)`)};
  }`,J=o<2?"":(()=>{let P=u.map(ie=>`d${ie}: u32`).join(", "),L=u.map(ie=>`d${ie}`).join(", ");return`
  fn get_${e}(${P}) -> ${f} {
    return get_${e}ByIndices(${R(L)});
  }`})(),H=(...P)=>{if(P.length!==o)throw new Error(`indices length must be ${o}`);let L=P.map(_).join(",");return o===0?j("0u"):o===1?j(L[0]):(b.get=!0,b.getByIndices=!0,b.indicesToOffset=!0,`get_${e}(${L})`)},ae=P=>o<2?j(P):(b.getByIndices=!0,b.indicesToOffset=!0,`get_${e}ByIndices(${P})`),G=o<2?"":`
  fn set_${e}ByIndices(indices: ${g.indices}, value: ${f}) {
    ${re(`i2o_${e}(indices)`,"value")}
  }`,ge=o<2?"":(()=>{let P=u.map(ie=>`d${ie}: u32`).join(", "),L=u.map(ie=>`d${ie}`).join(", ");return`
  fn set_${e}(${P}, value: ${f}) {
    set_${e}ByIndices(${R(L)}, value);
  }`})();return{impl:()=>{let P=[],L=!1;return b.offsetToIndices&&(P.push(k),L=!0),b.indicesToOffset&&(P.push(z),L=!0),b.broadcastedIndicesToOffset&&(Object.values(Z).forEach(ie=>P.push(ie)),L=!0),b.set&&(P.push(ge),L=!0),b.setByIndices&&(P.push(G),L=!0),b.get&&(P.push(J),L=!0),b.getByIndices&&(P.push(se),L=!0),!s&&L&&P.unshift(`const ${T} = ${g.indices}(${r.join(",")});`,`const ${v} = ${g.indices}(${A.computeStrides(r).join(",")});`),P.join(`
`)},type:g,offsetToIndices:C,indicesToOffset:E,broadcastedIndicesToOffset:X,indices:R,indicesGet:U,indicesSet:V,set:(...P)=>{if(P.length!==o+1)throw new Error(`indices length must be ${o}`);let L=P[o];if(typeof L!="string")throw new Error("value must be string");let ie=P.slice(0,o).map(_).join(",");return o===0?re("0u",L):o===1?re(ie[0],L):(b.set=!0,b.setByIndices=!0,b.indicesToOffset=!0,`set_${e}(${ie}, ${L})`)},setByOffset:re,setByIndices:(P,L)=>o<2?re(P,L):(b.setByIndices=!0,b.indicesToOffset=!0,`set_${e}ByIndices(${P}, ${L});`),get:H,getByOffset:j,getByIndices:ae,usage:i,name:e,strides:v,shape:T,rank:o}},N=(e,t,r,i=1)=>Qt(e,t,r,"input",i),K=(e,t,r,i=1)=>Qt(e,t,r,"output",i),Ad=(e,t,r)=>Qt(e,t,r,"atomicOutput",1),La=(e,t,r,i=1)=>Qt(e,t,r,"internal",i),Vs=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=Ut){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let a=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,s=a?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,o=a?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*i}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${i})
  fn main(${s}) {
    ${o}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r=e.usage==="input"?"read":"read_write",i=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${i}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:r,length:i}of this.uniforms)if(i&&i>4)r==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(i/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(i/4)}>`);else{let a=i==null||i===1?r:`vec${i}<${r}>`;e.push(`${t}:${a}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Od=(e,t)=>new Vs(e,t)}),js,Mr,Gs,Hs,Fs,Ks,De,Rd,Bd,mt=q(()=>{te(),ne(),xe(),oe(),js=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Mr=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Gs=(e,t)=>A.sortBasedOnPerm(e,Mr(e.length,t)),Hs=(e,t,r,i)=>{let a=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let s=0;s<t;++s)a+=`a[${e[s]}]=i[${s}];`;return a+="return a;}"},Fs=(e,t)=>{let r=[],i=[];for(let a=0;a<e.length;++a)e[a]!==1&&r.push(e[a]),e[t[a]]!==1&&i.push(t[a]);return{newShape:r,newPerm:i}},Ks=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},De=(e,t)=>{let r=e.dataType,i=e.dims.length,a=Mr(i,t),s=Gs(e.dims,a),o=e.dims,u=s,d=i<2||Ks(a,e.dims),p;if(d)return p=b=>{let $=N("input",r,o,4),T=K("output",r,u,4);return`
  ${b.registerUniform("output_size","u32").declareVariables($,T)}
  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let b=A.size(s);return{outputs:[{dims:s,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(b/64/4)},programUniforms:[{type:12,data:Math.ceil(b/4)}]}},getShaderSource:p};let{newShape:f,newPerm:m}=Fs(e.dims,a),g=A.areEqual(m,[2,3,1]),_=A.areEqual(m,[3,1,2]);if(f.length===2||g||_){o=g?[f[0],f[1]*f[2]]:_?[f[0]*f[1],f[2]]:f,u=[o[1],o[0]];let b=16;return p=$=>{let T=N("a",r,o.length),v=K("output",r,u.length);return`
  ${$.registerUniform("output_size","u32").declareVariables(T,v)}
  var<workgroup> tile : array<array<${v.type.value}, ${b+1}>, ${b}>;
  ${$.mainStart([b,b,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${b} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${b}u + local_id.x;
    let input_row = workgroup_id_x * ${b}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${T.getByIndices(`${T.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${b}u + local_id.x;
    let output_row = workgroup_id_y * ${b}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${v.setByIndices(`${v.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let $=A.size(s);return{outputs:[{dims:s,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(u[1]/b),y:Math.ceil(u[0]/b)},programUniforms:[{type:12,data:$},...Q(o,u)]}},getShaderSource:p}}return p=b=>{let $=N("a",r,o.length),T=K("output",r,u.length);return`
  ${b.registerUniform("output_size","u32").declareVariables($,T)}

  ${Hs(a,i,$,T)}

  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${T.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${T.setByOffset("global_idx",$.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let b=A.size(s);return{outputs:[{dims:s,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(b/64)},programUniforms:[{type:12,data:b},...Q(o,u)]}},getShaderSource:p}},Rd=(e,t)=>{js(e.inputs,t.perm),e.compute(De(e.inputs[0],t.perm))},Bd=e=>he({perm:e.perm})}),Zs,Ys,Xs,Qs,Js,eo,to,io,ro,ao,qe,Nd,Dd,Md,Pd,Ud,qd,Wd,Ld,Vd,jd,Tm=q(()=>{te(),ne(),oe(),Va(),mt(),Zs={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Ys={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Xs={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},Qs={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Js=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},eo=(e,t)=>{let r=[],i=e.length;for(let s=0;s<i;s++)t.indexOf(s)===-1&&r.push(e[s]);let a=t.map(s=>e[s]);return[r,a]},to=(e,t)=>{let r=e.length+t.length,i=[],a=0;for(let s=0;s<r;s++)t.indexOf(s)===-1?i.push(e[a++]):i.push(1);return i},io=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},ro=(e,t)=>{let r=[];if(!io(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},ao=(e,t,r,i,a,s,o)=>{let u=r[0].dims,d=A.size(s),p=A.size(o),f=N("_A",r[0].dataType,u),m=K("output",a,s),g=64;d===1&&(g=256);let _=`
          var<workgroup> aBestValues : array<f32, ${g}>;
       `,b=$=>`
        ${$.registerUniform("reduceSize","u32").declareVariables(f,m)}
        ${_}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${$.mainStart(g)}

          let outputIndex = global_idx / ${g};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${Xs[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${g}) {
           let candidate = f32(${f.getByOffset("offset + k")});
           bestValue = ${Zs[i]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${g}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Ys[i]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${m.setByOffset("outputIndex",`${i==="mean"?`${m.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${m.type.storage}(${Qs[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${g}`,inputDependencies:["type"]},getShaderSource:b,getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:d},programUniforms:[{type:12,data:p}]})}},qe=(e,t,r,i)=>{let a=e.inputs.length===1?r:ba(e.inputs,r),s=a.axes;s.length===0&&!a.noopWithEmptyAxes&&(s=e.inputs[0].dims.map((_,b)=>b));let o=A.normalizeAxes(s,e.inputs[0].dims.length),u=o,d=e.inputs[0],p=ro(u,e.inputs[0].dims.length);p.length>0&&(d=e.compute(De(e.inputs[0],p),{inputs:[0],outputs:[-1]})[0],u=Js(u.length,d.dims.length));let[f,m]=eo(d.dims,u),g=f;a.keepDims&&(g=to(f,o)),e.compute(ao(t,a.cacheKey,[d],i,e.inputs[0].dataType,g,m),{inputs:[d]})},Nd=(e,t)=>{qe(e,"ReduceMeanShared",t,"mean")},Dd=(e,t)=>{qe(e,"ReduceL1Shared",t,"l1")},Md=(e,t)=>{qe(e,"ReduceL2Shared",t,"l2")},Pd=(e,t)=>{qe(e,"ReduceLogSumExpShared",t,"logSumExp")},Ud=(e,t)=>{qe(e,"ReduceMaxShared",t,"max")},qd=(e,t)=>{qe(e,"ReduceMinShared",t,"min")},Wd=(e,t)=>{qe(e,"ReduceProdShared",t,"prod")},Ld=(e,t)=>{qe(e,"ReduceSumShared",t,"sum")},Vd=(e,t)=>{qe(e,"ReduceSumSquareShared",t,"sumSquare")},jd=(e,t)=>{qe(e,"ReduceLogSumShared",t,"logSum")}}),We,no,Li,ba,Le,so,oo,uo,lo,po,co,fo,ho,mo,go,Ve,Gd,Hd,Fd,Kd,Zd,Yd,Xd,Qd,Jd,ep,Va=q(()=>{te(),ne(),xe(),oe(),Tm(),We=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},no=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Li=(e,t,r,i,a,s,o=!1,u=!1)=>{let d=[],p=r[0].dims,f=p.length,m=A.normalizeAxes(a,f),g=!u&&m.length===0;p.forEach(($,T)=>{g||m.indexOf(T)>=0?o&&d.push(1):d.push($)});let _=d.length,b=A.size(d);return{name:e,shaderCache:t,getShaderSource:$=>{let T=[],v=N("_A",r[0].dataType,f),w=K("output",s,_),k=i(v,w,m),C=k[2];for(let S=0,z=0;S<f;S++)g||m.indexOf(S)>=0?(o&&z++,C=`for(var j${S}: u32 = 0; j${S} < ${p[S]}; j${S}++) {
                  ${k[2].includes("last_index")?`let last_index = j${S};`:""}
                  ${v.indicesSet("input_indices",S,`j${S}`)}
                  ${C}
                }`):(T.push(`${v.indicesSet("input_indices",S,w.indicesGet("output_indices",z))};`),z++);return`

        ${$.registerUniform("output_size","u32").declareVariables(v,w)}

        ${$.mainStart()}
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${v.type.indices};
          let output_indices = ${w.offsetToIndices("global_idx")};

          ${T.join(`
`)}
          ${k[0]}       // init ops for reduce max/min
          ${k[1]}
          ${C}
          ${k[3]}
          ${k.length===4?w.setByOffset("global_idx","value"):k.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:d,dataType:s}],dispatchGroup:{x:Math.ceil(b/64)},programUniforms:[{type:12,data:b},...Q(p,d)]})}},ba=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),he({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Le=(e,t,r,i)=>{let a=e.inputs,s=a.length===1?r:ba(a,r);e.compute(Li(t,{hint:s.cacheKey,inputDependencies:["rank"]},[a[0]],s.noopWithEmptyAxes&&s.axes.length===0?no:i,s.axes,a[0].dataType,s.keepDims,s.noopWithEmptyAxes),{inputs:[0]})},so=(e,t)=>{We(e.inputs),Le(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},oo=(e,t)=>{We(e.inputs),Le(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},uo=(e,t)=>{We(e.inputs),Le(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},lo=(e,t)=>{We(e.inputs),Le(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},po=(e,t)=>{We(e.inputs),Le(e,"ReduceMax",t,(r,i,a)=>{let s=[];for(let o=0;o<r.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(r.indicesSet("input_indices",o,0));return[`${s.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},co=(e,t)=>{We(e.inputs),Le(e,"ReduceMean",t,(r,i,a)=>{let s=1;for(let o=0;o<r.rank;o++)(a.indexOf(o)>=0||a.length===0)&&(s*=e.inputs[0].dims[o]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${s});`]})},fo=(e,t)=>{We(e.inputs),Le(e,"ReduceMin",t,(r,i,a)=>{let s=[];for(let o=0;o<r.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},ho=(e,t)=>{We(e.inputs),Le(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},mo=(e,t)=>{We(e.inputs),Le(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},go=(e,t)=>{We(e.inputs),Le(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Ve=(e,t,r)=>{if(t.length===0)return r;let i=1,a=1;for(let s=0;s<t.length;s++)t.indexOf(s)===-1?i*=e[s]:a*=e[s];return a<32&&i>1024},Gd=(e,t)=>{Ve(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?co(e,t):Nd(e,t)},Hd=(e,t)=>{Ve(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?oo(e,t):Dd(e,t)},Fd=(e,t)=>{Ve(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?uo(e,t):Md(e,t)},Kd=(e,t)=>{Ve(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?lo(e,t):Pd(e,t)},Zd=(e,t)=>{Ve(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?po(e,t):Ud(e,t)},Yd=(e,t)=>{Ve(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?fo(e,t):qd(e,t)},Xd=(e,t)=>{Ve(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ho(e,t):Wd(e,t)},Qd=(e,t)=>{Ve(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?mo(e,t):Ld(e,t)},Jd=(e,t)=>{Ve(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?go(e,t):Vd(e,t)},ep=(e,t)=>{Ve(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?so(e,t):jd(e,t)}}),Pr,tp,ip,wa,km=q(()=>{te(),xe(),Va(),Pr=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},tp=(e,t)=>{Pr(e.inputs);let r=(i,a,s)=>{let o=[];for(let u=0;u<i.rank;u++)(s.indexOf(u)>=0||s.length===0)&&o.push(`input_indices[${u}] = 0;`);return[`${o.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Li("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},ip=(e,t)=>{Pr(e.inputs);let r=(i,a,s)=>{let o=[];for(let u=0;u<i.rank;u++)(s.indexOf(u)>=0||s.length===0)&&o.push(`input_indices[${u}] = 0;`);return[`${o.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Li("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},wa=e=>he(e)}),_o,Ei,yo,bo,wo,pi,$o,rp,ja=q(()=>{te(),ne(),Wa(),oe(),_o=(e,t)=>{let r=e[0],i=e[1],a=e[2],s=e[3],o=e[4],u=e[5];if(o&&u)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let d=r.dims[0],p=r.dims[1],f=r.dims[2];if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==f)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(a.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let m=a.dims[0]/3,g=m,_=g;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let k of t.qkvHiddenSizes)if(k%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");m=t.qkvHiddenSizes[0],g=t.qkvHiddenSizes[1],_=t.qkvHiddenSizes[2]}let b=p;if(m!==g)throw new Error("qkv_hidden_sizes first element should be same as the second");if(a.dims[0]!==m+g+_)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let $=0;if(o){if(g!==_)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(o.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(o.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(o.dims[1]!==d)throw new Error('Input "past" second dimension must be batch_size');if(o.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(o.dims[4]!==g/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||($=o.dims[3])}let T=b+$,v=-1,w=0;if(s)throw new Error("Mask not supported");if(o)throw new Error("past is not supported");if(u){if(u.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(u.dims[0]!==d||u.dims[1]!==t.numHeads||u.dims[2]!==p||u.dims[3]!==T)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:d,sequenceLength:p,pastSequenceLength:$,kvSequenceLength:b,totalSequenceLength:T,maxSequenceLength:v,inputHiddenSize:f,hiddenSize:m,vHiddenSize:_,headSize:Math.floor(m/t.numHeads),vHeadSize:Math.floor(_/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Ei=(e,t,r)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e?.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${r?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,yo=(e,t,r,i,a,s,o,u)=>{let d=ve(o?1:s),p=64,f=s/d;f<p&&(p=32);let m=Math.ceil(s/d/p),g=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:a},{type:12,data:f},{type:12,data:m}],_=Se(e.dataType,d),b=ze(1,d),$=["type"];o&&$.push("type"),u&&$.push("type");let T=v=>{let w=K("x",e.dataType,e.dims,d),k=[w],C=o?N("seq_lens",o.dataType,o.dims):void 0;C&&k.push(C);let S=u?N("total_sequence_length_input",u.dataType,u.dims):void 0;S&&k.push(S);let z=ze(e.dataType),E=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${p}>;
  var<workgroup> thread_sum: array<f32, ${p}>;
  ${v.registerUniforms(E).declareVariables(...k)}
  ${v.mainStart([p,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${Ei(C,S,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${p}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${o?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${b}(-3.402823e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${b}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(d){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${d}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.402823e+38f);
    for (var i = 0u; i < ${p}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${b}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${b}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(d){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${d}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${p}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${w.type.value}(${z}(1.0) / ${z}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${b}(x[offset + i]);
        x[offset + i] = ${w.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${o?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${w.type.value}(${z}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${p};${_};${d}`,inputDependencies:$},getShaderSource:T,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:a,z:t*r},programUniforms:g})}},bo=(e,t,r,i,a,s,o,u,d)=>{let p=o+s.kvSequenceLength,f=[s.batchSize,s.numHeads,s.sequenceLength,p],m=e>1&&i,g=s.kvNumHeads?s.kvNumHeads:s.numHeads,_=m?[s.batchSize,g,p,s.headSize]:void 0,b=s.nReps?s.nReps:1,$=s.scale===0?1/Math.sqrt(s.headSize):s.scale,T=ve(s.headSize),v=s.headSize/T,w=12,k={x:Math.ceil(p/w),y:Math.ceil(s.sequenceLength/w),z:s.batchSize*s.numHeads},C=[{type:12,data:s.sequenceLength},{type:12,data:v},{type:12,data:p},{type:12,data:s.numHeads},{type:12,data:s.headSize},{type:1,data:$},{type:12,data:o},{type:12,data:s.kvSequenceLength},{type:12,data:b}],S=m&&i&&A.size(i.dims)>0,z=["type","type"];S&&z.push("type"),a&&z.push("type"),u&&z.push("type"),d&&z.push("type");let E=[{dims:f,dataType:t.dataType,gpuDataType:0}];m&&E.push({dims:_,dataType:t.dataType,gpuDataType:0});let R=U=>{let V=N("q",t.dataType,t.dims,T),Z=N("key",r.dataType,r.dims,T),X=[V,Z];if(S){let G=N("past_key",i.dataType,i.dims,T);X.push(G)}a&&X.push(N("attention_bias",a.dataType,a.dims));let re=u?N("seq_lens",u.dataType,u.dims):void 0;re&&X.push(re);let j=d?N("total_sequence_length_input",d.dataType,d.dims):void 0;j&&X.push(j);let se=K("output",t.dataType,f),J=[se];m&&J.push(K("present_key",t.dataType,_,T));let H=ze(1,T),ae=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;

  var<workgroup> tileQ: array<${V.type.storage}, ${w*w}>;
  var<workgroup> tileK: array<${V.type.storage}, ${w*w}>;
  ${U.registerUniforms(ae).declareVariables(...X,...J)}
  ${U.mainStart([w,w,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${b===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${b===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${Ei(re,j,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${S&&m?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${m?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${H}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${S&&m?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${m?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${H}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(T){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${T}`)}})()};
        output[outputIdx] = ${se.type.value} (sum * uniforms.alpha) + ${a?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${T};${a!==void 0};${i!==void 0};${e}`,inputDependencies:z},getRunData:()=>({outputs:E,dispatchGroup:k,programUniforms:C}),getShaderSource:R}},wo=(e,t,r,i,a,s,o=void 0,u=void 0)=>{let d=s+a.kvSequenceLength,p=a.nReps?a.nReps:1,f=a.vHiddenSize*p,m=e>1&&i,g=a.kvNumHeads?a.kvNumHeads:a.numHeads,_=m?[a.batchSize,g,d,a.headSize]:void 0,b=[a.batchSize,a.sequenceLength,f],$=12,T={x:Math.ceil(a.vHeadSize/$),y:Math.ceil(a.sequenceLength/$),z:a.batchSize*a.numHeads},v=[{type:12,data:a.sequenceLength},{type:12,data:d},{type:12,data:a.vHeadSize},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:12,data:f},{type:12,data:s},{type:12,data:a.kvSequenceLength},{type:12,data:p}],w=m&&i&&A.size(i.dims)>0,k=["type","type"];w&&k.push("type"),o&&k.push("type"),u&&k.push("type");let C=[{dims:b,dataType:t.dataType,gpuDataType:0}];m&&C.push({dims:_,dataType:t.dataType,gpuDataType:0});let S=z=>{let E=N("probs",t.dataType,t.dims),R=N("v",r.dataType,r.dims),U=[E,R];w&&U.push(N("past_value",i.dataType,i.dims));let V=o?N("seq_lens",o.dataType,o.dims):void 0;o&&U.push(V);let Z=u?N("total_sequence_length_input",u.dataType,u.dims):void 0;u&&U.push(Z);let X=[K("output",t.dataType,b)];m&&X.push(K("present_value",t.dataType,_));let re=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${$}u;
  var<workgroup> tileQ: array<${E.type.value}, ${$*$}>;
  var<workgroup> tileV: array<${E.type.value}, ${$*$}>;
  ${z.registerUniforms(re).declareVariables(...U,...X)}
  ${z.mainStart([$,$,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${p===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${p===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${Ei(V,Z,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${w&&m?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${m?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${E.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${w&&m?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${m?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:k},getRunData:()=>({outputs:C,dispatchGroup:T,programUniforms:v}),getShaderSource:S}},pi=(e,t,r,i,a,s,o,u,d,p,f=void 0,m=void 0)=>{let g=Math.min(e.outputCount,1+(o?1:0)+(u?1:0)),_=g>1?p.pastSequenceLength:0,b=_+p.kvSequenceLength,$=d&&A.size(d.dims)>0?d:void 0,T=[t,r];g>1&&o&&A.size(o.dims)>0&&T.push(o),$&&T.push($),f&&T.push(f),m&&T.push(m);let v=e.compute(bo(g,t,r,o,$,p,_,f,m),{inputs:T,outputs:g>1?[-1,1]:[-1]})[0];e.compute(yo(v,p.batchSize,p.numHeads,_,p.sequenceLength,b,f,m),{inputs:f&&m?[v,f,m]:[v],outputs:[]});let w=[v,i];g>1&&u&&A.size(u.dims)>0&&w.push(u),f&&w.push(f),m&&w.push(m),e.compute(wo(g,v,i,u,p,_,f,m),{inputs:w,outputs:g>1?[0,2]:[0]})},$o=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,a=t.inputHiddenSize,s=t.headSize,o=12,u={x:Math.ceil(t.headSize/o),y:Math.ceil(t.sequenceLength/o),z:t.batchSize*t.numHeads},d=[e.inputs[0],e.inputs[1],e.inputs[2]],p=[{type:12,data:i},{type:12,data:a},{type:12,data:s},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],f=m=>{let g=K("output_q",d[0].dataType,r),_=K("output_k",d[0].dataType,r),b=K("output_v",d[0].dataType,r),$=N("input",d[0].dataType,d[0].dims),T=N("weight",d[1].dataType,d[1].dims),v=N("bias",d[2].dataType,d[2].dims),w=$.type.storage,k=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${o}u;
  var<workgroup> tileInput: array<${w}, ${o*o}>;
  var<workgroup> tileWeightQ: array<${w}, ${o*o}>;
  var<workgroup> tileWeightK: array<${w}, ${o*o}>;
  var<workgroup> tileWeightV: array<${w}, ${o*o}>;
  ${m.registerUniforms(k).declareVariables($,T,v,g,_,b)}
  ${m.mainStart([o,o,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${w}(0);
    var valueK = ${w}(0);
    var valueV = ${w}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:u,programUniforms:p}),getShaderSource:f},{inputs:d,outputs:[-1,-1,-1]})},rp=(e,t)=>{let r=_o(e.inputs,t),[i,a,s]=$o(e,r);return pi(e,i,a,s,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),vo,xo,Co,ap,Sm=q(()=>{Ue(),te(),ne(),xe(),oe(),vo=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,a,s)=>{let o=a.length;if(o!==i.length)throw new Error(`${s}: num dimensions != ${o}`);a.forEach((u,d)=>{if(u!==i[d])throw new Error(`${s}: dim[${d}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},xo=(e,t)=>{let{epsilon:r,spatial:i,format:a}=t,s=e[0].dims,o=i?ve(s[s.length-1]):1,u=a==="NHWC"&&s.length>1?o:1,d=A.size(s)/o,p=i,f=p?s.length:s,m=N("x",e[0].dataType,e[0].dims,o),g=N("scale",e[1].dataType,e[1].dims,u),_=N("bias",e[2].dataType,e[2].dims,u),b=N("inputMean",e[3].dataType,e[3].dims,u),$=N("inputVar",e[4].dataType,e[4].dims,u),T=K("y",e[0].dataType,f,o),v=()=>{let k="";if(i)k=`let cOffset = ${s.length===1?"0u":a==="NHWC"?`outputIndices[${s.length-1}] / ${o}`:"outputIndices[1]"};`;else if(a==="NCHW")k=`
            ${T.indicesSet("outputIndices","0","0")}
            let cOffset = ${T.indicesToOffset("outputIndices")};`;else{k=`var cIndices = ${g.type.indices}(0);
                       cIndices[0] = outputIndices[${s.length-1}];`;for(let C=1;C<g.rank;C++)k+=`cIndices[${C}] = outputIndices[${C}];`;k+=`let cOffset = ${g.indicesToOffset("cIndices")};`}return k},w=k=>`
  const epsilon = ${r};
  ${k.registerUniform("outputSize","u32").declareVariables(m,g,_,b,$,T)}
  ${k.mainStart()}
  ${k.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${T.offsetToIndices(`global_idx * ${o}`)};
    ${v()}
    let scale = ${g.getByOffset("cOffset")};
    let bias = ${_.getByOffset("cOffset")};
    let inputMean = ${b.getByOffset("cOffset")};
    let inputVar = ${$.getByOffset("cOffset")};
    let x = ${m.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${T.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${o}`,inputDependencies:p?["rank","type","type","type","type"]:void 0},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p?[{type:12,data:d},...Q(s)]:[{type:12,data:d}]})}},Co=e=>he(e),ap=(e,t)=>{let{inputs:r,outputCount:i}=e,a=Co({...t,outputCount:i});if(_e.webgpu.validateInputContent&&vo(r,a),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(xo(r,a))}}),To,ko,np,Im=q(()=>{ne(),oe(),To=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},ko=e=>{let t=e[0].dims,r=e[0].dims[2],i=A.size(t)/4,a=e[0].dataType,s=N("input",a,t,4),o=N("bias",a,[r],4),u=N("residual",a,t,4),d=K("output",a,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:p=>`
  const channels = ${r}u / 4;
  ${p.declareVariables(s,o,u,d)}

  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${s.getByOffset("global_idx")}
      + ${o.getByOffset("global_idx % channels")} + ${u.getByOffset("global_idx")};
    ${d.setByOffset("global_idx","value")}
  }`}},np=e=>{To(e.inputs),e.compute(ko(e.inputs))}}),So,ce,sp,op,up,lp,dp,pp,cp,fp,hp,Io,mp,gp,_p,yp,oi,bp,Mi,wp,$p,vp,xp,Cp,Tp,kp,Sp,Ip,Ep,zp,Ap,Op,Rp,Bp,Np,Ur,Dp,$a,va,Mp,Pp,Up,Eo,zo,qp,Ga=q(()=>{te(),ne(),xe(),oe(),So=(e,t,r,i,a,s,o)=>{let u=Math.ceil(t/4),d="";typeof a=="string"?d=`${a}(a)`:d=a("a");let p=N("inputData",r,[u],4),f=K("outputData",i,[u],4),m=[{name:"vec_size",type:"u32"}];return o&&m.push(...o),`
      ${e.registerUniforms(m).declareVariables(p,f)}

  ${s??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${p.getByOffset("global_idx")};
    ${f.setByOffset("global_idx",d)}
  }`},ce=(e,t,r,i,a,s=e.dataType,o,u)=>{let d=[{type:12,data:Math.ceil(A.size(e.dims)/4)}];return o&&d.push(...o),{name:t,shaderCache:{hint:a,inputDependencies:["type"]},getShaderSource:p=>So(p,A.size(e.dims),e.dataType,s,r,i,u),getRunData:p=>({outputs:[{dims:e.dims,dataType:s}],dispatchGroup:{x:Math.ceil(A.size(p[0].dims)/64/4)},programUniforms:d})}},sp=e=>{e.compute(ce(e.inputs[0],"Abs","abs"))},op=e=>{e.compute(ce(e.inputs[0],"Acos","acos"))},up=e=>{e.compute(ce(e.inputs[0],"Acosh","acosh"))},lp=e=>{e.compute(ce(e.inputs[0],"Asin","asin"))},dp=e=>{e.compute(ce(e.inputs[0],"Asinh","asinh"))},pp=e=>{e.compute(ce(e.inputs[0],"Atan","atan"))},cp=e=>{e.compute(ce(e.inputs[0],"Atanh","atanh"))},fp=e=>he(e),hp=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(ce(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},Io=e=>{let t,r,i=e.length>=2&&e[1].data!==0,a=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=a?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=a?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return he({min:t,max:r})},mp=(e,t)=>{let r=t||Io(e.inputs),i=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Clip",a=>`clamp(${a}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},gp=e=>{e.compute(ce(e.inputs[0],"Ceil","ceil"))},_p=e=>{e.compute(ce(e.inputs[0],"Cos","cos"))},yp=e=>{e.compute(ce(e.inputs[0],"Cosh","cosh"))},oi=e=>he(e),bp=(e,t)=>{let r=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},Mi=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,wp=e=>{let t=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,Mi(t)))},$p=e=>{e.compute(ce(e.inputs[0],"Exp","exp"))},vp=e=>{e.compute(ce(e.inputs[0],"Floor","floor"))},xp=e=>{let t=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,Mi(t)))},Cp=(e,t)=>{let r=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},Tp=e=>{e.compute(ce(e.inputs[0],"Not",t=>`!${t}`))},kp=e=>{e.compute(ce(e.inputs[0],"Neg",t=>`-${t}`))},Sp=e=>{e.compute(ce(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Ip=e=>{let t=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},Ep=e=>{e.compute(ce(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},zp=e=>he(e),Ap=(e,t)=>{let r=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},Op=e=>{e.compute(ce(e.inputs[0],"Sin","sin"))},Rp=e=>{e.compute(ce(e.inputs[0],"Sinh","sinh"))},Bp=e=>{e.compute(ce(e.inputs[0],"Sqrt","sqrt"))},Np=e=>{e.compute(ce(e.inputs[0],"Tan","tan"))},Ur=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Dp=e=>{e.compute(ce(e.inputs[0],"Tanh",Ur))},$a=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${Ur("v")};
}
`,va=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Mp=e=>{let t=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"FastGelu",va,$a(t),void 0,e.inputs[0].dataType))},Pp=(e,t)=>{let r=ze(e.inputs[0].dataType);return e.compute(ce(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},Up=e=>{e.compute(ce(e.inputs[0],"Log","log"))},Eo=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,zo=e=>`quick_gelu_impl(${e})`,qp=(e,t)=>{let r=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"QuickGelu",zo,Eo(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Ao,Oo,Wp,Em=q(()=>{ne(),oe(),Ga(),Ao=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Oo=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=N("input",e[0].dataType,e[0].dims,4),i=N("bias",e[0].dataType,[e[0].dims[2]],4),a=K("output",e[0].dataType,t,4),s=A.size(t)/4,o=Se(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)}}),getShaderSource:u=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${u.declareVariables(r,i,a)}

  ${Mi(o)}

  ${u.mainStart()}
    ${u.guardAgainstOutOfBoundsWorkgroupSizes(s)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${a.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Wp=e=>{Ao(e.inputs),e.compute(Oo(e.inputs))}}),Ro,Bo,je,Lp,Vp,jp,Gp,Hp,Fp,Kp,Zp,Yp,Xp,zm=q(()=>{te(),ne(),oe(),Ro=(e,t,r,i,a,s,o,u,d,p,f,m)=>{let g,_;typeof u=="string"?g=_=(w,k)=>`${u}((${w}),(${k}))`:typeof u=="function"?g=_=u:(g=u.scalar,_=u.vector);let b=K("outputData",f,i.length,4),$=N("aData",d,t.length,4),T=N("bData",p,r.length,4),v;if(a)if(s){let w=A.size(t)===1,k=A.size(r)===1,C=t.length>0&&t[t.length-1]%4===0,S=r.length>0&&r[r.length-1]%4===0;w||k?v=b.setByOffset("global_idx",_(w?`${$.type.value}(${$.getByOffset("0")}.x)`:$.getByOffset("global_idx"),k?`${T.type.value}(${T.getByOffset("0")}.x)`:T.getByOffset("global_idx"))):v=`
            let outputIndices = ${b.offsetToIndices("global_idx * 4u")};
            let offsetA = ${$.broadcastedIndicesToOffset("outputIndices",b)};
            let offsetB = ${T.broadcastedIndicesToOffset("outputIndices",b)};
            ${b.setByOffset("global_idx",_(o||C?$.getByOffset("offsetA / 4u"):`${$.type.value}(${$.getByOffset("offsetA / 4u")}[offsetA % 4u])`,o||S?T.getByOffset("offsetB / 4u"):`${T.type.value}(${T.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else v=b.setByOffset("global_idx",_($.getByOffset("global_idx"),T.getByOffset("global_idx")));else{if(!s)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let w=(k,C,S="")=>{let z=`aData[indexA${C}][componentA${C}]`,E=`bData[indexB${C}][componentB${C}]`;return`
            let outputIndices${C} = ${b.offsetToIndices(`global_idx * 4u + ${C}u`)};
            let offsetA${C} = ${$.broadcastedIndicesToOffset(`outputIndices${C}`,b)};
            let offsetB${C} = ${T.broadcastedIndicesToOffset(`outputIndices${C}`,b)};
            let indexA${C} = offsetA${C} / 4u;
            let indexB${C} = offsetB${C} / 4u;
            let componentA${C} = offsetA${C} % 4u;
            let componentB${C} = offsetB${C} % 4u;
            ${k}[${C}] = ${S}(${g(z,E)});
          `};f===9?v=`
            var data = vec4<u32>(0);
            ${w("data",0,"u32")}
            ${w("data",1,"u32")}
            ${w("data",2,"u32")}
            ${w("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:v=`
            ${w("outputData[global_idx]",0)}
            ${w("outputData[global_idx]",1)}
            ${w("outputData[global_idx]",2)}
            ${w("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables($,T,b)}

        ${m??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${v}
      }`},Bo=(e,t,r,i,a,s,o=r.dataType)=>{let u=r.dims.map($=>Number($)??1),d=i.dims.map($=>Number($)??1),p=!A.areEqual(u,d),f=u,m=A.size(u),g=!1,_=!1,b=[p];if(p){let $=Pt.calcShape(u,d,!1);if(!$)throw new Error("Can't perform binary op on the given tensors");f=$.slice(),m=A.size(f);let T=A.size(u)===1,v=A.size(d)===1,w=u.length>0&&u[u.length-1]%4===0,k=d.length>0&&d[d.length-1]%4===0;b.push(T),b.push(v),b.push(w),b.push(k);let C=1;for(let S=1;S<f.length;S++){let z=u[u.length-S],E=d[d.length-S];if(z===E)C*=z;else break}C%4===0?(_=!0,g=!0):(T||v||w||k)&&(g=!0)}else g=!0;return b.push(g),{name:e,shaderCache:{hint:t+b.map($=>$.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:$=>Ro($,u,d,f,g,p,_,a,r.dataType,i.dataType,o,s),getRunData:()=>({outputs:[{dims:f,dataType:o}],dispatchGroup:{x:Math.ceil(m/64/4)},programUniforms:[{type:12,data:Math.ceil(A.size(f)/4)},...Q(u,d,f)]})}},je=(e,t,r,i,a,s)=>{e.compute(Bo(t,a??"",e.inputs[0],e.inputs[1],r,i,s))},Lp=e=>{je(e,"Add",(t,r)=>`${t}+${r}`)},Vp=e=>{je(e,"Div",(t,r)=>`${t}/${r}`)},jp=e=>{je(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},Gp=e=>{je(e,"Mul",(t,r)=>`${t}*${r}`)},Hp=e=>{let t=N("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;je(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},Fp=e=>{je(e,"Sub",(t,r)=>`${t}-${r}`)},Kp=e=>{je(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},Zp=e=>{je(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},Yp=e=>{je(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},Xp=e=>{je(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),No,Do,Mo,Po,Qp,Jp,Am=q(()=>{te(),ne(),xe(),oe(),No=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],a=i.dataType,s=i.dims.length;e.forEach((o,u)=>{if(u!==r){if(o.dataType!==a)throw new Error("input tensors should be one type");if(o.dims.length!==s)throw new Error("input tensors should have the same shape");o.dims.forEach((d,p)=>{if(p!==t&&d!==i.dims[p])throw new Error("non concat dimensions must match")})}})},Do=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,Mo=(e,t)=>{let r=e.length,i=[];for(let a=0;a<r;++a){let s=t.setByOffset("global_idx",e[a].getByIndices("indices"));r===1?i.push(s):a===0?i.push(`if (inputIndex == ${a}u) { ${s} }`):a===r-1?i.push(`else { ${s} }`):i.push(`else if (inputIndex == ${a}) { ${s} }`)}return i.join(`
`)},Po=(e,t,r,i)=>{let a=A.size(r),s=new Array(e.length),o=new Array(e.length),u=0,d=[],p=[],f=[{type:12,data:a}];for(let $=0;$<e.length;++$)u+=e[$].dims[t],s[$]=u,p.push(e[$].dims.length),o[$]=N(`input${$}`,i,p[$]),d.push("rank"),f.push({type:12,data:s[$]});for(let $=0;$<e.length;++$)f.push(...Q(e[$].dims));f.push(...Q(r));let m=K("output",i,r.length),g=m.indicesGet("indices",t),_=Array.from(Array(s.length).keys()).map($=>`uniforms.sizeInConcatAxis${$}`).join(","),b=$=>`

  ${(()=>{$.registerUniform("outputSize","u32");for(let T=0;T<e.length;T++)$.registerUniform(`sizeInConcatAxis${T}`,"u32");return $.declareVariables(...o,m)})()}

  ${Do(s.length,_)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${m.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${g});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${s.length}u>(${_});
      ${g} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${Mo(o,m)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:d},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:f}),getShaderSource:b}},Qp=(e,t)=>{let r=e.inputs,i=r[0].dims,a=A.normalizeAxis(t.axis,i.length);No(r,a);let s=i.slice();s[a]=r.reduce((u,d)=>u+(d.dims.length>a?d.dims[a]:0),0);let o=r.filter(u=>A.size(u.dims)>0);e.compute(Po(o,a,s,r[0].dataType),{inputs:o})},Jp=e=>he({axis:e.axis})}),It,Et,zt,Ha,Ot=q(()=>{te(),ne(),It=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Et=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},zt=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Ha=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[r,i]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=e?.activation_params||[Td,kd];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),Ee,ec,Fa=q(()=>{Ee=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},ec=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),tc,Om=q(()=>{tc=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),li,Ka,Za=q(()=>{te(),ne(),oe(),Ot(),li=(e,t,r,i,a)=>{let s=i-r;return`
      ${Array.from({length:r}).map((o,u)=>`
      if (${Y(t.shape,u,t.rank)} != 1) {
        ${t.indicesSet(e,u,Y(a,u+s,i))}
      } else {
        ${t.indicesSet(e,u,0)}
      }`).join("")}
`},Ka=(e,t,r,i,a=!1,s)=>{let o=e[0].dims,u=e[1].dims,d=o[o.length-2],p=u[u.length-1],f=o[o.length-1],m=ve(p),g=ve(f),_=ve(d),b=A.size(r)/m/_,$=e.length>2,T=i?i.slice(0,-2):r.slice(0,-2),v=[A.size(T),d,p],w=[{type:12,data:b},{type:12,data:d},{type:12,data:p},{type:12,data:f}];Et(t,w),w.push(...Q(T,o,u)),$&&w.push(...Q(e[2].dims)),w.push(...Q(v));let k=C=>{let S=La("batch_dims",e[0].dataType,T.length),z=N("a",e[0].dataType,o.length,g),E=N("b",e[1].dataType,u.length,m),R=K("output",e[0].dataType,v.length,m),U=Se(R.type.tensor),V=It(t,R.type.value,U),Z=[z,E],X="";if($){let se=a?m:1;Z.push(N("bias",e[2].dataType,e[2].dims.length,se)),X=`${a?`value += bias[col / ${se}];`:`value += ${R.type.value}(bias[row + i]);`}`}let re=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];zt(t,re);let j=()=>{let se=`var a_data: ${z.type.value};`;for(let J=0;J<g;J++)se+=`
              let b_data${J} = b[(b_offset + (k + ${J}) * uniforms.N + col) / ${m}];`;for(let J=0;J<_;J++){se+=`a_data = a[(a_offset + (row + ${J}) * uniforms.K + k) / ${g}];`;for(let H=0;H<g;H++)se+=`
            values[${J}] = fma(${E.type.value}(a_data${g===1?"":`[${H}]`}), b_data${H}, values[${J}]);
`}return se};return`
  ${C.registerUniforms(re).registerInternalVariables(S).declareVariables(...Z,R)}
  ${C.mainStart()}
    ${C.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${m})) * ${m};
    var index1 = global_idx / (uniforms.N / ${m});
    let stride1 = uniforms.M / ${_};
    let row = (index1 % stride1) * ${_};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${S.offsetToIndices("batch")};`}

    var a_indices: ${z.type.indices};
    ${li("a_indices",z,z.rank-2,S.rank,"batch_indices")}
    ${z.indicesSet("a_indices",z.rank-2,0)}
    ${z.indicesSet("a_indices",z.rank-1,0)}
    let a_offset = ${z.indicesToOffset("a_indices")};

    var b_indices: ${E.type.indices};
    ${li("b_indices",E,E.rank-2,S.rank,"batch_indices")}
    ${E.indicesSet("b_indices",E.rank-2,0)}
    ${E.indicesSet("b_indices",E.rank-1,0)}
    let b_offset = ${E.indicesToOffset("b_indices")};
    var values: array<${R.type.value}, ${_}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${g}) {
      ${j()}
    }
    for (var i = 0u; i < ${_}u; i++) {
      var value = values[i];
      ${X}
      ${V}
      let cur_indices = ${R.type.indices}(batch, row + i, col);
      let offset = ${R.indicesToOffset("cur_indices")};
      ${R.setByOffset(`offset / ${m}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${m};${g};${_};${a}`,inputDependencies:$?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:s?s(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(b/64)},programUniforms:w}),getShaderSource:k}}}),Uo,qo,xa,qr,Wo,Ca,Lo,Vi,Ya=q(()=>{te(),ne(),oe(),Ot(),Za(),Fa(),Uo=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,qo=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,xa=(e,t,r="f32",i,a=!1,s=32,o=!1,u=32)=>{let d=t[1]*e[1],p=t[0]*e[0],f=a?d:s,m=a?s:d,g=f/t[0],_=s/t[1];if(!((a&&g===4&&e[1]===4||!a&&(g===3||g===4))&&f%t[0]===0&&s%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${a} is true, innerElementSize ${g} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${g} must be 3 or 4.
  tileAWidth ${f} must be divisible by workgroupSize[0]${t[0]}. tileInner ${s} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${g}<${r}>, ${f/g}>, ${m}>;
var<workgroup> mm_Bsub: array<array<vec4<${r}>, ${p/e[0]}>, ${s}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${g};
const tileInner = ${s};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${o?"0":"i32(globalId.z)"};
  ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${d};

  let num_tiles = ${o?`${Math.ceil(u/s)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${o?`i32(globalId.z) * ${u}`:"0"};

  var acc: array<vec4<${r}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${_};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${Uo(a,i)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${_}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${i?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${g===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${qo(a,g)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},qr=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,Wo=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",Ca=(e,t,r="f32",i,a=!1,s=32,o=!1,u=32,d=!1)=>{let p=e[1]*t[1],f=e[0]*t[0],m=a?p:s,g=a?s:p;if(!(g%t[1]===0&&m%t[0]===0&&s%t[1]===0))throw new Error(`tileAHight ${g} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${m} must be divisible by workgroupSize[0]${t[0]}, tileInner ${s} must be divisible by workgroupSize[1]${t[1]}`);let _=g/t[1],b=m/t[0],$=s/t[1],T=d?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${p};
    let globalColStart = i32(workgroupId.x) * ${f};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${g}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${m}; inputCol = inputCol + ${t[0]}) {
          ${qr(a,i)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${s}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${f}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${i?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${r}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${a?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${p};

let tileRowA = i32(localId.y) * ${_};
let tileColA = i32(localId.x) * ${b};
let tileRowB = i32(localId.y) * ${$};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${_}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${b}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${qr(a,i)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${$}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${i?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${r}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${Wo(a)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${r}, ${m}>, ${g}>;
  var<workgroup> mm_Bsub : array<array<${r}, ${f}>, ${s}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${s};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${o?"0":"i32(globalId.z)"};
    ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${o?`${Math.ceil(u/s)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${o?`i32(globalId.z) * ${u}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${T}
  }
`},Lo=(e,t,r,i,a=!1)=>{let[s,o,u,d]=i,p=Se(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${s.type.indices}) -> ${Ee(e,p)} {
      var value = ${Ee(e,p)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${o.type.indices};
        ${li("aIndices",o,o.rank-2,s.rank,"batchIndices")}
        ${o.indicesSet("aIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("aIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${s.type.indices}) -> ${Ee(e,p)} {
      var value = ${Ee(e,p)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${u.type.indices};
        ${li("bIndices",u,u.rank-2,s.rank,"batchIndices")}
        ${u.indicesSet("bIndices",u.rank-2,"u32(row)")}
        ${u.indicesSet("bIndices",u.rank-1,"u32(colIn)")}
        value = ${u.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${Ee(e,p)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${a?"bias[colIn]":`${Ee(e,p)}(bias[row])`};`:""}
        ${r}
        ${d.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},Vi=(e,t,r,i,a=!1,s)=>{let o=e[0].dims,u=e[1].dims,d=o.slice(0,-2),p=u.slice(0,-2),f=i?i.slice(0,-2):r.slice(0,-2),m=A.size(f),g=o[o.length-2],_=o[o.length-1],b=u[u.length-1],$=_%4===0&&b%4===0,T=g<=8?[4,1,1]:[4,4,1],v=[8,8,1],w=[Math.ceil(b/v[0]/T[0]),Math.ceil(g/v[1]/T[1]),Math.ceil(m/v[2]/T[2])],k=$?4:1,C=[...d,g,_/k],S=C.length,z=[...p,_,b/k],E=z.length,R=[m,g,b/k],U=[{type:6,data:g},{type:6,data:b},{type:6,data:_}];Et(t,U),U.push(...Q(f,C,z));let V=["rank","rank"],Z=e.length>2;Z&&(U.push(...Q(e[2].dims)),V.push("rank")),U.push(...Q(R));let X=re=>{let j=f.length,se=La("batchDims",e[0].dataType,j,1),J=Se(e[0].dataType),H=N("a",e[0].dataType,S,k),ae=N("b",e[1].dataType,E,k),G=K("result",e[0].dataType,R.length,k),ge=[H,ae];if(Z){let D=a?k:1;ge.push(N("bias",e[2].dataType,e[2].dims.length,D))}let P=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];zt(t,P);let L=Se(G.type.tensor),ie=It(t,G.type.value,L),pe=Lo(k,Z,ie,[se,H,ae,G],a);return`
  ${re.registerUniforms(P).registerInternalVariables(se).declareVariables(...ge,G)}
  ${pe}
  ${$?xa(T,v,J,se):Ca(T,v,J,se)}
                   `};return{name:"MatMul",shaderCache:{hint:`${T};${t.activation};${$};${a}`,inputDependencies:V},getRunData:()=>({outputs:[{dims:s?s(r):r,dataType:e[0].dataType}],dispatchGroup:{x:w[0],y:w[1],z:w[2]},programUniforms:U}),getShaderSource:X}}}),Vo,ic,Rm=q(()=>{te(),nt(),oe(),Ot(),Fa(),Om(),Ya(),Vo=(e,t,r,i,a=!1,s,o=4,u=4,d=4,p="f32")=>{let f=U=>{switch(U){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${p}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${U} is not supported.`)}},m=U=>{switch(U){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${U} is not supported.`)}},g=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,_=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,b=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",$=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",T=e?"row":"col",v=e?"col":"row",w=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${T} / outWidth;
    let outCol = ${T} % outWidth;

    let WRow = ${v} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${v} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${v} % inChannels;
    var resData = ${Ee(o,p)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${b} && xCol >= 0 && xCol < ${$}) {
      ${g}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${f(o)}
    }
    return resData;`,k=e?t&&i?`
    let col = colIn * ${o};
    ${w}`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${w}
    }
    return ${Ee(o,p)}(0.0);`:i&&r?`
    let col = colIn * ${o};
    ${w}`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${w}
    }
    return ${Ee(o,p)}(0.0);`,C=e?i&&r?m(u):`
    let col = colIn * ${u};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${m(u)}
    }
    return ${Ee(u,p)}(0.0);`:`
    let col = colIn * ${u};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${m(u)}
    }
    return ${Ee(u,p)}(0.0);`,S=Ee(d,p),z=Ee(e?o:u,p),E=Ee(e?u:o,p),R=It(s,S,p);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${z} {
      ${e?k:C}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${E} {
      ${e?C:k}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${S}) {
      let col = colIn * ${d};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${_}
      ${ec(a)}
      ${R}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},ic=(e,t,r,i,a,s,o,u,d)=>{let p=t.format==="NHWC",f=p?e[0].dims[3]:e[0].dims[1],m=r[0],g=p?r[2]:r[3],_=p?r[1]:r[2],b=p?r[3]:r[1],$=p&&(f%4===0||f%3===0)&&b%4===0,T=p?b:g*_,v=p?g*_:b,w=[8,8,1],k=i<=8?[4,1,1]:[4,4,1],C=[Math.ceil(T/w[0]/k[0]),Math.ceil(v/w[1]/k[1]),Math.ceil(m/w[2]/k[2])];de("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${C}`);let S=$?p&&f%4!==0?3:4:1,z=w[1]*k[1],E=w[0]*k[0],R=Math.max(w[0]*S,w[1]),U=i%z===0,V=a%E===0,Z=s%R===0,X=$?[S,4,4]:[1,1,1],re=[{type:6,data:i},{type:6,data:a},{type:6,data:s},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Et(t,re),re.push(...Q(e[0].dims,e[1].dims));let j=["rank","rank"];o&&(re.push(...Q(e[2].dims)),j.push("rank")),re.push(...Q(r));let se=J=>{let H=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];zt(t,H);let ae=$?4:1,G=Se(e[0].dataType),ge=`
      fn setOutputAtIndex(flatIndex : i32, value : ${$?`vec4<${G}>`:G}) {
        result[flatIndex] = ${$?`vec4<${G}>`:G}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${$?`vec4<${G}>`:G}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${$?"/ 4":""}, value);
      }`,P=N("x",e[0].dataType,e[0].dims.length,S===3?1:S),L=N("w",e[1].dataType,e[1].dims.length,ae),ie=[P,L],pe=K("result",e[0].dataType,r.length,ae);if(o){let D=N("bias",e[2].dataType,e[2].dims.length,ae);ie.push(D),ge+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${$?`vec4<${G}>`:G} {
          return bias[coords.${p?"w":"y"}${$?"/ 4":""}];
        }`}return`
        ${tc("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${J.registerUniforms(H).declareVariables(...ie,pe)}
        ${ge}
        ${Vo(p,U,V,Z,o,t,X[0],X[1],X[2],G)}
        ${$?xa(k,w,G,void 0,!p,R):Ca(k,w,G,void 0,!p,R,!1,void 0,u)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${S};${$};${U};${V};${Z};${z};${E};${R}`,inputDependencies:j},getRunData:()=>({outputs:[{dims:d?d(r):r,dataType:e[0].dataType}],dispatchGroup:{x:C[0],y:C[1],z:C[2]},programUniforms:re}),getShaderSource:se}}}),jo,Wr,Jt,Go,Lr,Ho,rc,ac,Bm=q(()=>{te(),nt(),ne(),oe(),Ot(),Fa(),jo=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},Wr=e=>typeof e=="number"?[e,e,e]:e,Jt=(e,t)=>t<=1?e:e+(e-1)*(t-1),Go=(e,t,r,i=1)=>{let a=Jt(t,i);return Math.floor((e[0]*(r-1)-r+a)/2)},Lr=(e,t,r,i,a)=>{a==null&&(a=Go(e,t[0],i[0]));let s=[0,0,0,r];for(let o=0;o<3;o++)e[o]+2*a>=t[o]&&(s[o]=Math.trunc((e[o]-t[o]+2*a)/i[o]+1));return s},Ho=(e,t,r,i,a,s,o,u,d,p)=>{let f,m,g,_;if(e==="VALID"&&(e=0),typeof e=="number"){f={top:e,bottom:e,left:e,right:e,front:e,back:e};let b=Lr([t,r,i,1],[u,d,p],1,[a,s,o],e);m=b[0],g=b[1],_=b[2]}else if(Array.isArray(e)){if(!e.every(($,T,v)=>$===v[0]))throw Error(`Unsupported padding parameter: ${e}`);f={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let b=Lr([t,r,i,1],[u,d,p],1,[a,s,o],e[0]);m=b[0],g=b[1],_=b[2]}else if(e==="SAME_UPPER"){m=Math.ceil(t/a),g=Math.ceil(r/s),_=Math.ceil(i/o);let b=(m-1)*a+u-t,$=(g-1)*s+d-r,T=(_-1)*o+p-i,v=Math.floor(b/2),w=b-v,k=Math.floor($/2),C=$-k,S=Math.floor(T/2),z=T-S;f={top:k,bottom:C,left:S,right:z,front:v,back:w}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:f,outDepth:m,outHeight:g,outWidth:_}},rc=(e,t,r,i,a,s=!1,o="channelsLast")=>{let u,d,p,f,m;if(o==="channelsLast")[u,d,p,f,m]=e;else if(o==="channelsFirst")[u,m,d,p,f]=e;else throw new Error(`Unknown dataFormat ${o}`);let[g,,_,b,$]=t,[T,v,w]=Wr(r),[k,C,S]=Wr(i),z=Jt(_,k),E=Jt(b,C),R=Jt($,S),{padInfo:U,outDepth:V,outHeight:Z,outWidth:X}=Ho(a,d,p,f,T,v,w,z,E,R),re=s?g*m:g,j=[0,0,0,0,0];return o==="channelsFirst"?j=[u,re,V,Z,X]:o==="channelsLast"&&(j=[u,V,Z,X,re]),{batchSize:u,dataFormat:o,inDepth:d,inHeight:p,inWidth:f,inChannels:m,outDepth:V,outHeight:Z,outWidth:X,outChannels:re,padInfo:U,strideDepth:T,strideHeight:v,strideWidth:w,filterDepth:_,filterHeight:b,filterWidth:$,effectiveFilterDepth:z,effectiveFilterHeight:E,effectiveFilterWidth:R,dilationDepth:k,dilationHeight:C,dilationWidth:S,inShape:e,outShape:j,filterShape:t}},ac=(e,t,r,i,a,s)=>{let o=s==="channelsLast";o?e[0].dims[3]:e[0].dims[1];let u=[64,1,1],d={x:r.map((T,v)=>v)},p=[Math.ceil(jo(d.x.map(T=>r[T]))/u[0]),1,1];de("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${p}`);let f=1,m=A.size(r),g=[{type:12,data:m},{type:12,data:i},{type:12,data:a},{type:12,data:t.strides},{type:12,data:t.dilations}];Et(t,g),g.push(...Q(e[0].dims,e[1].dims));let _=["rank","rank"],b=e.length===3;b&&(g.push(...Q(e[2].dims)),_.push("rank")),g.push(...Q(r));let $=T=>{let v=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:a.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];zt(t,v);let w=1,k=Se(e[0].dataType),C=N("x",e[0].dataType,e[0].dims.length,f),S=N("W",e[1].dataType,e[1].dims.length,w),z=[C,S],E=K("result",e[0].dataType,r.length,w),R="";if(b){let Z=N("bias",e[2].dataType,e[2].dims.length,w);z.push(Z),R+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${k} {
          return bias[${o?Y("coords",4,5):Y("coords",1,5)}];
        }`}let U=Ee(f,k),V=It(t,U,k);return`
            ${R}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${C.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${S.getByIndices("aIndices")};
            }
          ${T.registerUniforms(v).declareVariables(...z,E)}
          ${T.mainStart()}
          ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${E.offsetToIndices("global_idx")};
              let batch = ${Y("coords",0,C.rank)};
              let d2 = ${o?Y("coords",C.rank-1,C.rank):Y("coords",1,C.rank)};
              let xFRCCorner = vec3<u32>(${o?Y("coords",1,C.rank):Y("coords",2,C.rank)},
              ${o?Y("coords",2,C.rank):Y("coords",3,C.rank)},
              ${o?Y("coords",3,C.rank):Y("coords",4,C.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${o?Y("uniforms.x_shape",1,C.rank):Y("uniforms.x_shape",2,C.rank)};
              let xShapeZ = ${o?Y("uniforms.x_shape",2,C.rank):Y("uniforms.x_shape",3,C.rank)};
              let xShapeW = ${o?Y("uniforms.x_shape",3,C.rank):Y("uniforms.x_shape",4,C.rank)};
              let xShapeU = ${o?Y("uniforms.x_shape",4,C.rank):Y("uniforms.x_shape",1,C.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${o?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${o?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${o?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${o?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${b?"value = value + getBiasByOutputCoords(coords)":""};
              ${V}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${o};${f};${b}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:p[0],y:p[1],z:p[2]},programUniforms:g}),getShaderSource:$}}}),nc,sc,Nm=q(()=>{te(),ne(),oe(),Ot(),nc=(e,t,r,i)=>{let a=e.length>2,s=a?"value += b[output_channel];":"",o=e[0].dims,u=e[1].dims,d=t.format==="NHWC",p=d?r[3]:r[1],f=p/t.group,m=d&&f>=4?ve(p):1,g=A.size(r)/m,_=[{type:12,data:g},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:f}];Et(t,_),_.push(...Q(o,[u[0],u[1],u[2],u[3]/m]));let b=a?["rank","rank","rank"]:["rank","rank"];_.push(...Q([r[0],r[1],r[2],r[3]/m]));let $=T=>{let v=K("output",e[0].dataType,r.length,m),w=Se(v.type.tensor),k=It(t,v.type.value,w),C=N("x",e[0].dataType,o.length),S=N("w",e[1].dataType,u.length,m),z=[C,S];a&&z.push(N("b",e[2].dataType,e[2].dims,m));let E=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];zt(t,E);let R=d?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${C.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${S.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${C.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${S.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${T.registerUniforms(E).declareVariables(...z,v)}

  ${T.mainStart()}
    ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${v.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${d?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${d?1:2}], outputIndices[${d?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${m} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${d?2:1}];

    var value: ${v.type.value} = ${v.type.value}(0);
    ${R}
    ${s}
    ${k}
    ${v.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${m}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:_}),getShaderSource:$}},sc=(e,t,r,i)=>{let a=e.length>2,s=ve(r[3]),o=ve(r[2]),u=A.size(r)/s/o,d=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/s],p=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/s],f=[r[0],r[1],r[2],r[3]/s],m=[{type:12,data:u},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Et(t,m),m.push(...Q(d,p,f));let g=(o-1)*t.strides[1]+p[1],_=b=>{let $=K("output",e[0].dataType,f.length,s),T=Se($.type.tensor),v=It(t,$.type.value,T),w=N("x",e[0].dataType,d.length,s),k=N("w",e[1].dataType,p.length,s),C=[w,k];a&&C.push(N("b",e[2].dataType,e[2].dims,s));let S=a?"value += b[output_channel];":"",z=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return zt(t,z),`
  ${b.registerUniforms(z).declareVariables(...C,$)}
  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${o}u;
    let col = (index1 % width1) * ${o}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${w.type.value}, ${g}>;
    var values: array<${$.type.value}, ${o}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${p[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${g}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${w.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${w.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${p[1]}; w_width++) {
          let w_val = ${k.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${o}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${o}u; i++) {
      var value = values[i];
      ${S}
      ${v}
      ${$.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${s};${o};${g};${p[0]};${p[1]}`,inputDependencies:a?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:m}),getShaderSource:_}}}),Fo,zi,Ko,Ai,Ta,Vr,Zo,Yo,ka,Dm=q(()=>{ne(),Rm(),Bm(),Ya(),Nm(),Ot(),Za(),mt(),Fo=(e,t,r,i,a,s)=>{let o=e[0],u=e.slice(s?1:2,s?3:4),d=u.length,p=t[0],f=t.slice(2).map((g,_)=>g+(g-1)*(r[_]-1)),m=u.map((g,_)=>g+i[_]+i[_+d]).map((g,_)=>Math.floor((g-f[_]+a[_])/a[_]));return m.splice(0,0,o),m.splice(s?3:1,0,p),m},zi=[2,3,1,0],Ko=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Ai=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let s=2;s<t[1].dims.length;++s)r[s-2]===0&&(r[s-2]=t[1].dims[s]);let i=e.pads.slice();Wi.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let a=Object.assign({},e);return Object.assign(a,{kernelShape:r,pads:i}),a},Ta=e=>{let t=Ha(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],a=e.dilations,s=e.group,o=e.kernel_shape,u=e.pads,d=e.strides,p=e.w_is_const();return{autoPad:i,format:r,dilations:a,group:s,kernelShape:o,pads:u,strides:d,wIsConst:p,...t,cacheKey:`${e.format};${t.activation};`}},Vr=(e,t,r,i)=>{let a=r.format==="NHWC",s=Fo(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,a);if(r.group!==1){let z=[t[0]];if(a){let E=e.kernelCustomData.wT??e.compute(De(t[1],zi),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=E),z.push(E)}else z.push(t[1]);t.length===3&&z.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&a&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(sc(z,r,s,i),{inputs:z}):e.compute(nc(z,r,s,i),{inputs:z});return}let o=t.length===3,u=t[0].dims[a?1:2],d=t[0].dims[a?2:3],p=t[0].dims[a?3:1],f=t[1].dims[2],m=t[1].dims[3],g=s[a?1:2],_=s[a?2:3],b=s[a?3:1],$=a&&f===u&&m===d&&r.pads[0]===0&&r.pads[1]===0;if($||f===1&&m===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let z=s[0],E,R,U,V=[];if(a){let re=e.kernelCustomData.wT??e.compute(De(t[1],zi),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=re),$){let j=u*d*p;E=t[0].reshape([1,z,j]),R=re.reshape([1,j,b]),U=[1,z,b]}else E=t[0].reshape([z,u*d,p]),R=re.reshape([1,p,b]),U=[z,g*_,b];V.push(E),V.push(R)}else E=t[0].reshape([z,p,u*d]),R=t[1].reshape([1,b,p]),U=[z,b,g*_],V.push(R),V.push(E);o&&V.push(t[2]);let Z=U[2],X=V[0].dims[V[0].dims.length-1];Z<8&&X<8?e.compute(Ka(V,r,s,U,a,i),{inputs:V}):e.compute(Vi(V,r,s,U,a,i),{inputs:V});return}let T=!0,v=e.kernelCustomData.wT??e.compute(De(t[1],zi),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=v);let w=[t[0],v];o&&w.push(t[2]);let k=a?g*_:b,C=a?b:g*_,S=f*m*p;e.compute(ic(w,r,s,k,C,S,o,T,i),{inputs:w})},Zo=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=[0,t.pads[0],0,t.pads[1]],s=[1].concat(t.strides),o=[1].concat(t.dilations),u=[1].concat(t.kernelShape),d=Ai({...t,pads:a,strides:s,dilations:o,kernelShape:u},i);Vr(e,i,d,p=>r?[p[0],p[2],p[3]]:[p[0],p[1],p[3]])},Yo=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",a=Ai(r,t),s=r.autoPad==="NOTSET"?r.pads:r.autoPad,o=rc(t[0].dims,t[1].dims,r.strides,r.dilations,s,!1,i);e.compute(ac(t,a,o.outShape,[o.filterDepth,o.filterHeight,o.filterWidth],[o.padInfo.front,o.padInfo.top,o.padInfo.left],i))},ka=(e,t)=>{if(Ko(e.inputs,t),e.inputs[0].dims.length===3)Zo(e,t);else if(e.inputs[0].dims.length===5)Yo(e,e.inputs,t);else{let r=Ai(t,e.inputs);Vr(e,e.inputs,r)}}}),oc,Mm=q(()=>{te(),nt(),ne(),oe(),oc=(e,t,r)=>{let i=e.length>2,a=t.outputShape,s=t.format==="NHWC",o=t.group,u=e[1].dims,d=u[2]/o,p=u[3],f=s?ve(d):1,m=s&&p===1&&d>=4,g=m?Math.floor(d/4)*4:Math.floor(d/f)*f,_=d-g,b=s?ve(p):1,$=s?p===1?f:b:1,T=A.size(a)/b,v=[Math.ceil(T/64),1,1];de("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${v}`);let w=["rank","rank"],k=[t.strides[0],t.strides[1]],C=[t.kernelShape[s?1:2],t.kernelShape[s?2:3]],S=[t.dilations[0],t.dilations[1]],z=[C[0]+(t.dilations[0]<=1?0:(t.kernelShape[s?1:2]-1)*(t.dilations[0]-1)),C[1]+(t.dilations[1]<=1?0:(t.kernelShape[s?2:3]-1)*(t.dilations[1]-1))],E=[z[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),z[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],R=[{type:12,data:T},{type:12,data:k},{type:12,data:C},{type:12,data:S},{type:12,data:z},{type:6,data:E},{type:12,data:g},{type:12,data:d},{type:12,data:p},...Q(e[0].dims,e[1].dims)];i&&(R.push(...Q(e[2].dims)),w.push("rank")),R.push(...Q(a));let U=V=>{let Z=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:k.length},{name:"filter_dims",type:"u32",length:C.length},{name:"dilations",type:"u32",length:C.length},{name:"effective_filter_dims",type:"u32",length:z.length},{name:"pads",type:"i32",length:E.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],X=Se(e[0].dataType),re=s?1:2,j=s?2:3,se=s?3:1,J=N("W",e[1].dataType,e[1].dims.length,$),H=N("Dy",e[0].dataType,e[0].dims.length,f),ae=[H,J];i&&ae.push(N("bias",e[2].dataType,[a[se]].length,b));let G=K("result",e[0].dataType,a.length,b),ge=()=>{let ie="";if(m)f===4?ie+=`
        let xValue = ${H.getByOffset("x_offset")};
        let wValue = ${J.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:f===2?ie+=`
          dotProd = dotProd + dot(vec4<${X}>(${H.getByOffset("x_offset")}, ${H.getByOffset("x_offset + 1u")}), vec4<${X}>(${J.getByOffset("w_offset")}, ${J.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:f===1&&(ie+=`
          dotProd = dotProd + dot(vec4<${X}>(${H.getByOffset("x_offset")}, ${H.getByOffset("x_offset + 1u")}, ${H.getByOffset("x_offset + 2u")}, ${H.getByOffset("x_offset + 3u")}), vec4<${X}>(${J.getByOffset("w_offset")}, ${J.getByOffset("w_offset + 1u")}, ${J.getByOffset("w_offset + 2u")}, ${J.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(ie+=`
                  let xValue = ${s?H.getByOffset(`${H.indicesToOffset(`${H.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${f}`):H.get("batch","inputChannel","idyR","idyC")};
        `,f===1)ie+=`
          let w_offset = ${J.indicesToOffset(`${J.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${J.getByOffset(`w_offset / ${$}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let pe=0;pe<f;pe++)ie+=`
            let wValue${pe} = ${J.getByOffset(`${J.indicesToOffset(`${J.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${pe}, wOutChannel)`)} / ${$}`)};
            dotProd = dotProd + xValue[${pe}] * wValue${pe};`;return ie},P=()=>{if(_===0)return"";if(!m)throw new Error(`packInputAs4 ${m} is not true.`);let ie="";if(f===1){ie+="dotProd = dotProd";for(let pe=0;pe<_;pe++)ie+=`
            + ${H.getByOffset(`x_offset + ${pe}`)} * ${J.getByOffset(`w_offset + ${pe}`)}`;ie+=";"}else if(f===2){if(_!==2)throw new Error(`Invalid inputChannelsRemainder ${_}.`);ie+=`
          let xValue = ${H.getByOffset("x_offset")};
          let wValue = ${J.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return ie},L=`
            let outputIndices = ${G.offsetToIndices(`global_idx * ${b}`)};
            let batch = ${G.indicesGet("outputIndices",0)};
            let d1 = ${G.indicesGet("outputIndices",se)};
            let r = ${G.indicesGet("outputIndices",re)};
            let c = ${G.indicesGet("outputIndices",j)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${G.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${X}(dyRCorner) + ${X}(wR)) / ${X}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${X}(uniforms.Dy_shape[${re}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${X}(dyCCorner) + ${X}(wC)) / ${X}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${X}(uniforms.Dy_shape[${j}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${m?`
                var x_offset = ${H.indicesToOffset(`${H.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${f};
                var w_offset = ${J.indicesToOffset(`${J.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${$};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${m?4:f}) {
                  ${ge()}
                  inputChannel = inputChannel + ${m?4:f};
                }
                ${P()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${b}]`:""};
            ${G.setByOffset("global_idx","value")};
          `;return`
    ${V.registerUniforms(Z).declareVariables(...ae,G)}
      ${V.mainStart()}
      ${V.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${L}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${f}${$}${b}${m}${_}`,inputDependencies:w},getRunData:()=>({dispatchGroup:{x:v[0],y:v[1],z:v[2]},outputs:[{dims:r?r(a):a,dataType:e[0].dataType}],programUniforms:R}),getShaderSource:U}}}),Xo,Qo,Jo,jr,uc,eu,Gr,tu,lc,Pm=q(()=>{Mm(),Ot(),mt(),Xo=(e,t,r,i,a,s)=>(e-1)*t+r+(i-1)*a+1-s,Qo=(e,t,r,i,a)=>{let s=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=s,r[a]=e-s):t==="SAME_LOWER"&&(r[i]=e-s,r[a]=s)},Jo=(e,t,r,i,a,s,o,u,d,p)=>{let f=e.length-2,m=p.length===0;d.length<f&&d.push(...Array(f-d.length).fill(0));let g=e[0],_=t[u?3:1]*a;for(let b=0,$=e.length-f-(u?1:0);b<f;++b,++$){let T=e[$],v=m?T*o[b]:p[b],w=Xo(T,o[b],s[b],t[$],r[b],v);Qo(w,i,s,b,b+f),m&&p.push(o[b]*(T-1)+d[b]+(t[$]-1)*r[b]+1-s[b]-s[b+f])}p.splice(0,0,g),p.splice(u?3:1,0,_)},jr=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((m,g)=>m*g,1)===0){r.length=0;for(let m=2;m<t[1].dims.length;++m)r.push(t[1].dims[m])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let a=e.pads.slice(),s=e.outputShape.slice(),o=e.outputPadding.slice(),u=t[0].dims,d=e.dilations.slice();if(d.reduce((m,g)=>m+g,0)===0){let m=t[0].dims.length-2;d=new Array(m).fill(1)}let p=e.strides.slice();if(p.reduce((m,g)=>m+g,0)===0){let m=t[0].dims.length-2;p=new Array(m).fill(1)}Jo(u,r,d,e.autoPad,e.group,a,p,i,o,s);let f=Object.assign({},e);return Object.assign(f,{kernelShape:r,pads:a,outputPadding:o,outputShape:s,dilations:d,strides:p}),f},uc=e=>{let t=Ha(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],a=e.dilations,s=e.group,o=e.kernelShape,u=e.pads,d=e.strides,p=e.wIsConst(),f=e.outputPadding,m=e.outputShape;return{autoPad:i,format:r,dilations:a,group:s,kernelShape:o,outputPadding:f,outputShape:m,pads:u,strides:d,wIsConst:p,...t,cacheKey:`${e.format};${t.activation};`}},eu=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let a=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==a))throw new Error("invalid bias");let s=e[0].dims.length-2;if(t.dilations.reduce((o,u)=>o+u,0)>0&&t.dilations.length!==s)throw new Error(`dilations should be ${s}D`);if(t.strides.reduce((o,u)=>o+u,0)>0&&t.strides.length!==s)throw new Error(`strides should be ${s}D`);if(t.pads.reduce((o,u)=>o+u,0)>0&&t.pads.length!==s*2)throw new Error(`pads should be ${s*2}D`);if(t.outputPadding.length!==s&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${s}D`);if(t.kernelShape.reduce((o,u)=>o+u,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},Gr=(e,t,r,i)=>{let a=e.kernelCustomData.wT??e.compute(De(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=a);let s=[t[0],a];t.length===3&&s.push(t[2]),e.compute(oc(s,r,i),{inputs:s})},tu=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=t.kernelShape;(a.length===0||a[0]===0)&&(a=[e.inputs[1].dims[2]]);let s=t.dilations;(s.length===0||s[0]===0)&&(s=[1]);let o=t.strides;(o.length===0||o[0]===0)&&(o=[1]);let u=t.pads;u.length===0&&(u=[0,0]),u=[0,u[0],0,u[1]],o=[1].concat(o),s=[1].concat(s),a=[1].concat(a);let d=t.outputPadding;d=[0].concat(d);let p=jr({...t,pads:u,strides:o,dilations:s,kernelShape:a,outputPadding:d},i);Gr(e,i,p,f=>r?[f[0],f[2],f[3]]:[f[0],f[1],f[3]])},lc=(e,t)=>{if(eu(e.inputs,t),e.inputs[0].dims.length===3)tu(e,t);else{let r=jr(t,e.inputs);Gr(e,e.inputs,r)}}}),iu,dc,pc,Um=q(()=>{te(),ne(),xe(),oe(),iu=(e,t,r,i)=>{let a=A.size(t),s=t.length,o=N("input",e,s),u=K("output",e,s),d=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),p=A.normalizeAxis(d,s),f=m=>{let g=` i32(${o.indicesGet("inputIndices","uniforms.axis")}) `,_=Y("uniforms.input_shape","uniforms.axis",s),b=i.reverse?g+(i.exclusive?" + 1":""):"0",$=i.reverse?_:g+(i.exclusive?"":" + 1");return`
                ${m.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(o,u)}
                ${m.mainStart()}
                  ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${u.offsetToIndices("global_idx")};
                  var sum = ${u.type.value}(0);
                  let first : i32 = ${b};
                  let last : i32 = ${$};
                  for (var i : i32 = first; i < last; i++) {
                    ${o.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${o.getByIndices("inputIndices")};
                  }
                  ${u.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},{type:12,data:p},...Q(t,t)]}),getShaderSource:f}},dc=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,a=e.inputs[1];e.compute(iu(i,r,a,t),{inputs:[0]})},pc=e=>{let t=e.exclusive===1,r=e.reverse===1;return he({exclusive:t,reverse:r})}}),ru,au,nu,cc,fc,qm=q(()=>{te(),ne(),xe(),oe(),ru=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},au=(e,t,r,i)=>{let a=[];a.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let s=0;s<t;++s)a.push(r.indicesSet("a",e[s],`i[${s}]`));return a.push("return a;}"),a.join(`
`)},nu=(e,t)=>{let r,i,a,s,o,u,d=t.format==="NHWC",p=t.blocksize,f=t.mode==="DCR";d?([r,i,a,s]=e.dims,o=f?[r,i,a,p,p,s/p**2]:[r,i,a,s/p**2,p,p],u=f?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,a,s]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],o=f?[r,p,p,s/p**2,i,a]:[r,s/p**2,p,p,i,a],u=f?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let m=e.reshape(o),g=m.dims.length,_=e.dataType,b=N("a",_,g),$=K("output",_,g),T=v=>`
  ${v.registerUniform("output_size","u32").declareVariables(b,$)}

  ${au(u,g,b,$)}

  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${$.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${$.setByOffset("global_idx",b.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:v=>{let w=d?[r,i*p,a*p,s/p**2]:[r,s/p**2,i*p,a*p],k=A.size(w),C=m.dims,S=A.sortBasedOnPerm(C,u);return{outputs:[{dims:w,dataType:v[0].dataType}],dispatchGroup:{x:Math.ceil(k/64)},programUniforms:[{type:12,data:k},...Q(C,S)]}},getShaderSource:T}},cc=(e,t)=>{ru(e.inputs),e.compute(nu(e.inputs[0],t))},fc=e=>he({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Oi,ei,Hr,su,ou,uu,lu,Fr,du,hc,mc,Wm=q(()=>{te(),ne(),xe(),oe(),Oi="[a-zA-Z]|\\.\\.\\.",ei="("+Oi+")+",Hr="^"+ei+"$",su="("+ei+",)*"+ei,ou="^"+su+"$",uu=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},lu=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(ou)))throw new Error("Invalid LHS term");if(r.split(",").forEach((a,s)=>{let o=e[s].dims.slice();if(!a.match(RegExp(Hr)))throw new Error("Invalid LHS term");let u=this.processTerm(a,!0,o,s);this.lhs.push(u)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([a,s])=>s.count===1||a==="...").map(([a])=>a).join("");else if(!i.match(RegExp(ei)))throw new Error("Invalid RHS");i.match(RegExp(Oi,"g"))?.forEach(a=>{if(a==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let s=this.symbolToInfo.get(a);if(s===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(s.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let a=r.length,s=!1,o=[],u=0;if(!e.match(RegExp(Hr))&&!t&&e!=="")throw new Error("Invalid LHS term");let d=e.match(RegExp(Oi,"g")),p=new uu(i);return d?.forEach((f,m)=>{if(f==="..."){if(s)throw new Error("Only one ellipsis is allowed per input term");s=!0;let g=a-d.length+1;if(g<0)throw new Error("Ellipsis out of bounds");if(o=r.slice(u,u+g),this.hasEllipsis){if(this.ellipsisDims.length!==o.length||this.ellipsisDims.toString()!==o.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=o;else throw new Error("Ellipsis must be specified in the LHS");for(let _=0;_<o.length;_++){let b=String.fromCharCode(48+_);p.addSymbol(b,m+_),this.addSymbol(b,r[u++],i)}}else p.addSymbol(f,m+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(f,r[u++],i)}),p}},Fr=e=>e+"_max",du=(e,t,r,i)=>{let a=e.map(p=>p.length).map((p,f)=>N(`input${f}`,t,p)),s=A.size(i),o=K("output",t,i.length),u=[...r.symbolToInfo.keys()].filter(p=>!r.rhs.symbolToIndices.has(p)),d=p=>{let f=[],m="var prod = 1.0;",g="var sum = 0.0;",_="sum += prod;",b=[],$=[],T=[],v=[],w=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((C,S)=>{if(r.rhs.symbolToIndices.has(S)){let z=r.rhs.symbolToIndices.get(S)?.[0];z!==void 0&&r.lhs.forEach((E,R)=>{if(C.inputIndices.includes(R)){let U=E.symbolToIndices.get(S);if(U===void 0)throw new Error("Invalid symbol error");U.forEach(V=>{f.push(`${a[R].indicesSet(`input${R}Indices`,V,o.indicesGet("outputIndices",z))}`)})}})}else r.lhs.forEach((z,E)=>{if(C.inputIndices.includes(E)){let R=z.symbolToIndices.get(S);if(R===void 0)throw new Error("Invalid symbol error");R.forEach(U=>{b.push(`${a[E].indicesSet(`input${E}Indices`,U,`${S}`)}`)}),v.push(`prod *= ${a[E].getByIndices(`input${E}Indices`)};`)}}),$.push(`for(var ${S}: u32 = 0; ${S} < uniforms.${Fr(S)}; ${S}++) {`),T.push("}")});let k=w?[...f,`let sum = ${a.map((C,S)=>C.getByIndices(`input${S}Indices`)).join(" * ")};`]:[...f,g,...$,...b,m,...v,_,...T];return`
            ${p.registerUniforms(u.map(C=>({name:`${Fr(C)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...a,o)}

            ${p.mainStart()}
            ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${o.offsetToIndices("global_idx")};
            ${a.map((C,S)=>`var input${S}Indices: ${a[S].type.indices};`).join(`
`)}
            ${k.join(`
`)};
            ${o.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let p=u.filter(m=>r.symbolToInfo.has(m)).map(m=>({type:12,data:r.symbolToInfo.get(m)?.dimValue||0}));p.push({type:12,data:s});let f=e.map((m,g)=>[...Q(m)]).reduce((m,g)=>m.concat(g),p);return f.push(...Q(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:f}},getShaderSource:d}},hc=(e,t)=>{let r=new lu(e.inputs,t.equation),i=r.outputDims,a=e.inputs.map((s,o)=>s.dims);e.compute(du(a,e.inputs[0].dataType,r,i))},mc=e=>{let t=e.equation.replace(/\s+/g,"");return he({equation:t})}}),pu,Kr,cu,fu,gc,Lm=q(()=>{te(),ne(),oe(),pu=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,a=t.length<r.length?0:t.length-r.length;for(;i<r.length&&a<t.length;++i,++a)if(r[i]!==t[a]&&r[i]!==1&&t[a]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Kr=(e,t)=>{let r=e.length-t.length,i=[];for(let a=0;a<r;++a)i.push(e[a]);for(let a=0;a<t.length;++a)i.push(t[a]===1?e[a+r]:t[a]);return i},cu=(e,t)=>e.length>t.length?Kr(e,t):Kr(t,e),fu=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=cu(t,r),a=e[0].dataType,s=a===9||A.size(t)===1,o=a===9||t.length>0&&t[t.length-1]%4===0?4:1,u=s||i.length>0&&i[i.length-1]%4===0?4:1,d=Math.ceil(A.size(i)/u),p=m=>{let g=N("input",a,t.length,o),_=K("output",a,i.length,u),b;if(a===9){let $=(T,v,w="")=>`
          let outputIndices${v} = ${_.offsetToIndices(`outputOffset + ${v}u`)};
          let offset${v} = ${g.broadcastedIndicesToOffset(`outputIndices${v}`,_)};
          let index${v} = offset${v} / 4u;
          let component${v} = offset${v} % 4u;
          ${T}[${v}] = ${w}(${g.getByOffset(`index${v}`)}[component${v}]);
        `;b=`
        let outputOffset = global_idx * ${u};
        var data = vec4<u32>(0);
        ${$("data",0,"u32")}
        ${$("data",1,"u32")}
        ${$("data",2,"u32")}
        ${$("data",3,"u32")}
        ${_.setByOffset("global_idx","data")}
      }`}else b=`
        let outputIndices = ${_.offsetToIndices(`global_idx * ${u}`)};
        let inputOffset = ${g.broadcastedIndicesToOffset("outputIndices",_)};
        let data = ${_.type.value}(${g.getByOffset(`inputOffset / ${o}`)});
        ${_.setByOffset("global_idx","data")}
      }`;return`
    ${m.registerUniform("vec_size","u32").declareVariables(g,_)}
    ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${b}`},f=[{type:12,data:d},...Q(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${o}${u}`,inputDependencies:["rank"]},getShaderSource:p,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:f})}},gc=e=>{pu(e.inputs),e.compute(fu(e.inputs),{inputs:[0]})}}),hu,_c,Vm=q(()=>{te(),ne(),oe(),Ga(),hu=e=>{let t=e[0].dataType,r=A.size(e[0].dims),i=A.size(e[1].dims),a=i%4===0,s=o=>{let u=N("x",t,[1],4),d=N("bias",t,[1],4),p=K("y",t,[1],4),f=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],m=_=>`
      let bias${_}_offset: u32 = (global_idx * 4 + ${_}) % uniforms.bias_size;
      let bias${_} = ${d.getByOffset(`bias${_}_offset / 4`)}[bias${_}_offset % 4];`,g=a?`
      let bias = ${d.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${m(0)}${m(1)}${m(2)}${m(3)}
      let bias = ${u.type.value}(bias0, bias1, bias2, bias3);`;return`${o.registerUniforms(f).declareVariables(u,d,p)}

    ${$a(ze(t))}

    ${o.mainStart(Ut)}
      ${o.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${u.getByOffset("global_idx")};
      ${g}
      let x_in = x + bias;
      ${p.setByOffset("global_idx",va("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${a}`,inputDependencies:["type","type"]},getShaderSource:s,getRunData:o=>({outputs:[{dims:o[0].dims,dataType:o[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/Ut/4)}})}},_c=e=>{e.inputs.length<2||A.size(e.inputs[1].dims)===0?Mp(e):e.compute(hu(e.inputs))}}),mu,gu,yc,bc,jm=q(()=>{te(),ne(),xe(),oe(),mu=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},gu=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,s=A.normalizeAxis(t.axis,a),o=r.slice(0);o.splice(s,1,...i);let u=r[s],d=e[0].dataType===9?4:1,p=Math.ceil(A.size(o)/d),f=[{type:12,data:p},{type:6,data:u},{type:12,data:s},...Q(e[0].dims,e[1].dims,o)],m=g=>{let _=N("data",e[0].dataType,e[0].dims.length,d),b=N("inputIndices",e[1].dataType,e[1].dims.length),$=K("output",e[0].dataType,o.length,d),T=w=>{let k=i.length,C=`var indicesIndices${w}  = ${b.type.indices}(0);`;for(let S=0;S<k;S++)C+=`${k>1?`indicesIndices${w}[${S}]`:`indicesIndices${w}`} = ${o.length>1?`outputIndices${w}[uniforms.axis + ${S}]`:`outputIndices${w}`};`;C+=`
          var idx${w} = ${b.getByIndices(`indicesIndices${w}`)};
          if (idx${w} < 0) {
            idx${w} = idx${w} + uniforms.axisDimLimit;
          }
          var dataIndices${w} : ${_.type.indices};
        `;for(let S=0,z=0;S<a;S++)S===s?(C+=`${a>1?`dataIndices${w}[${S}]`:`dataIndices${w}`} = u32(idx${w});`,z+=k):(C+=`${a>1?`dataIndices${w}[${S}]`:`dataIndices${w}`} = ${o.length>1?`outputIndices${w}[${z}]`:`outputIndices${w}`};`,z++);return C},v;if(e[0].dataType===9){let w=(k,C,S="")=>`
          let outputIndices${C} = ${$.offsetToIndices(`outputOffset + ${C}u`)};
          ${T(C)};
          let offset${C} = ${_.indicesToOffset(`dataIndices${C}`)};
          let index${C} = offset${C} / 4u;
          let component${C} = offset${C} % 4u;
          ${k}[${C}] = ${S}(${_.getByOffset(`index${C}`)}[component${C}]);
        `;v=`
        let outputOffset = global_idx * ${d};
        var value = vec4<u32>(0);
        ${w("value",0,"u32")}
        ${w("value",1,"u32")}
        ${w("value",2,"u32")}
        ${w("value",3,"u32")}
        ${$.setByOffset("global_idx","value")}
      `}else v=`
      let outputIndices = ${$.offsetToIndices("global_idx")};
      ${T("")};
      let value = ${_.getByIndices("dataIndices")};
      ${$.setByOffset("global_idx","value")};
      `;return`
      ${g.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(_,b,$)}
      ${g.mainStart()}
        ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${v}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:f}),getShaderSource:m}},yc=e=>he({axis:e.axis}),bc=(e,t)=>{let r=e.inputs;mu(r),e.compute(gu(e.inputs,t))}}),_u,wc,$c,Gm=q(()=>{te(),ne(),oe(),_u=(e,t,r,i,a,s,o,u,d)=>{let p=[{type:12,data:s},{type:12,data:i},{type:12,data:a},{type:12,data:r},{type:12,data:o},{type:12,data:u},{type:12,data:d}],f=[s];p.push(...Q(t.dims,f));let m=g=>{let _=N("indices_data",t.dataType,t.dims.length),b=K("input_slice_offsets_data",12,1,1),$=[_,b],T=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:a.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${g.registerUniforms(T).declareVariables(...$)}
  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${a.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${a.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:f,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:p}),getShaderSource:m},{inputs:[t],outputs:[-1]})[0]},wc=(e,t)=>{let r=e.inputs,i=r[0].dims,a=r[0].dataType,s=r[1].dims,o=s[s.length-1],u=A.sizeToDimension(s,s.length-1),d=A.sizeFromDimension(i,t.batchDims+o),p=A.sizeToDimension(i,t.batchDims),f=A.sizeFromDimension(i,t.batchDims),m=u/p,g=new Array(o),_=d;for(let C=0;C<o;++C)g[o-1-C]=_,_*=i[t.batchDims+o-1-C];let b=_u(e,r[1],g,t.batchDims,i,u,m,f,o),$=t.batchDims+o;if($>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let T=s.slice(0,-1).concat(i.slice($)),v=A.size(T),w=[{type:12,data:v},{type:12,data:d},...Q(r[0].dims,b.dims,T)],k=C=>{let S=N("data",r[0].dataType,r[0].dims.length),z=N("slice_offsets",12,b.dims.length),E=K("output",r[0].dataType,T.length);return`
          ${C.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(S,z,E)}
            ${C.mainStart()}
            ${C.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:T,dataType:a}],dispatchGroup:{x:Math.ceil(v/64)},programUniforms:w}),getShaderSource:k},{inputs:[r[0],b]})},$c=e=>({batchDims:e.batch_dims,cacheKey:""})}),yu,bu,vc,xc,Hm=q(()=>{te(),ne(),xe(),oe(),yu=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=A.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,a=e[0],s=e[2],o=e.length===4?e[3]:void 0;if(s.dims.length!==a.dims.length||!a.dims.map((u,d)=>d===r?Math.ceil(u/i)===s.dims[d]:u===s.dims[d]).reduce((u,d)=>u&&d,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(o){if(o.dataType!==a.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(o.dims.length!==s.dims.length||!o.dims.map((u,d)=>u===s.dims[d]).reduce((u,d)=>u&&d,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},bu=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,s=A.normalizeAxis(t.gatherAxis,a),o=A.normalizeAxis(t.quantizeAxis,a),u=r.slice(0);u.splice(s,1,...i);let d=A.size(u),p=e[2].dataType,f=e[0].dataType===22,m=[{type:12,data:d},{type:12,data:o},{type:12,data:s},{type:12,data:t.blockSize},...Q(...e.map((_,b)=>_.dims),u)],g=_=>{let b=N("data",e[0].dataType,e[0].dims.length),$=N("inputIndices",e[1].dataType,e[1].dims.length),T=N("scales",e[2].dataType,e[2].dims.length),v=e.length>3?N("zeroPoint",e[3].dataType,e[3].dims.length):void 0,w=K("output",p,u.length),k=[b,$,T];v&&k.push(v);let C=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${_.registerUniforms(C).declareVariables(...k,w)}
        ${_.mainStart()}
        let output_indices = ${w.offsetToIndices("global_idx")};
        var indices_indices = ${$.type.indices}(0);
        ${i.length>1?`
          for (var i: u32 = 0; i < ${i.length}; i++) {
            let index = ${w.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${$.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${w.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${b.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${w.indicesGet("output_indices","i")};
          ${b.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${$.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[s]};
        }
        ${b.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${u.length}; i++) {
          let index = ${w.indicesGet("output_indices",`i + ${i.length} - 1`)};
          ${b.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${b.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${b.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${f?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${T.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${T.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${T.getByIndices("scale_indices")};
        ${v?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${v.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${v.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${f?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${ze(p)}(quantized_data - zero_point) * scale;
        ${w.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((_,b)=>b!==1).map(_=>_.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(_,b)=>"rank")},getRunData:()=>({outputs:[{dims:u,dataType:p}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:m}),getShaderSource:g}},vc=(e,t)=>{let r=e.inputs;yu(r,t),e.compute(bu(e.inputs,t))},xc=e=>he({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),wu,$u,Cc,Tc,Fm=q(()=>{te(),ne(),xe(),oe(),wu=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},$u=(e,t)=>{let r=e[0].dims,i=e[0].dataType,a=r.length,s=e[1].dims,o=e[1].dataType,u=A.normalizeAxis(t.axis,a),d=r[u],p=s.slice(0),f=A.size(p),m=N("input",i,a),g=N("indicesInput",o,s.length),_=K("output",i,p.length),b=[{type:12,data:f},{type:6,data:d},{type:12,data:u}];return b.push(...Q(r,s,p)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:p,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:b}),getShaderSource:$=>`
      ${$.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(m,g,_)}
      ${$.mainStart()}
      ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${_.offsetToIndices("global_idx")};

      var idx = ${g.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${m.type.indices}(outputIndices);
      ${m.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${m.getByIndices("inputIndices")};

      ${_.setByOffset("global_idx","value")};
  }`}},Cc=e=>he({axis:e.axis}),Tc=(e,t)=>{let r=e.inputs;wu(r),e.compute($u(e.inputs,t))}}),vu,xu,kc,Sc,Km=q(()=>{te(),ne(),oe(),vu=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},xu=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[a,s,o]=Cd.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),u=[a,s];if(!u)throw new Error("Can't use gemm on the given tensors");let d=16,p=Math.ceil(s/d),f=Math.ceil(a/d),m=!0,g=A.size(u),_=[{type:12,data:m?p:g},{type:12,data:a},{type:12,data:s},{type:12,data:o},{type:1,data:t.alpha},{type:1,data:t.beta}],b=["type","type"];e.length===3&&(_.push(...Q(e[2].dims)),b.push("rank")),_.push(...Q(u));let $=v=>{let w="";t.transA&&t.transB?w="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?w="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?w="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(w="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let k=t.alpha===1?"":"value *= uniforms.alpha;",C=N("a",e[0].dataType,e[0].dims),S=N("b",e[1].dataType,e[1].dims),z=C.type.value,E=null,R=[C,S];e.length===3&&(E=N("c",e[2].dataType,e[2].dims.length),R.push(E));let U=K("output",e[0].dataType,u.length);R.push(U);let V=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${v.registerUniforms(V).declareVariables(...R)}

  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${z}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${w}
    }

    ${k}
    ${E!=null?`let cOffset = ${E.broadcastedIndicesToOffset("vec2(m, n)",U)}; value += ${z}(uniforms.beta) * ${E.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},T=v=>{let w=N("a",e[0].dataType,e[0].dims),k=N("b",e[1].dataType,e[1].dims),C=null,S=[w,k];e.length===3&&(C=N("c",e[2].dataType,e[2].dims.length),S.push(C));let z=K("output",e[0].dataType,u.length);S.push(z);let E=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],R="",U="";t.transA&&t.transB?(U=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(U=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(U=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(U=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let V=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${v.registerUniforms(E).declareVariables(...S)}
  var<workgroup> tile_a: array<array<${w.type.storage}, ${d}>, ${d}>;
  var<workgroup> tile_b: array<array<${k.type.storage}, ${d}>, ${d}>;
  ${v.mainStart([d,d,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${d};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${d};
    let num_tiles = (uniforms.K - 1) / ${d} + 1;
    var k_start = 0u;
    var value = ${z.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${U}
      k_start = k_start + ${d};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${d}; k++) {
        ${R}
      }
      workgroupBarrier();
    }

    ${V}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${C!=null?`let cOffset = ${C.broadcastedIndicesToOffset("vec2(m, n)",z)}; value += ${z.type.value}(uniforms.beta) * ${C.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return m?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:p*f},programUniforms:_}),getShaderSource:T}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:_}),getShaderSource:$}},kc=e=>{let t=e.transA,r=e.transB,i=e.alpha,a=e.beta;return{transA:t,transB:r,alpha:i,beta:a,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},Sc=(e,t)=>{vu(e.inputs),e.compute(xu(e.inputs,t))}}),Ye,rt,bt,wt,Cu,Tu,ku,Su,Iu,Eu,zu,Au,Ic,Ec,Zm=q(()=>{te(),ne(),xe(),oe(),[Ye,rt,bt,wt]=[0,1,2,3],Cu=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},Tu=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,ku=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,Su=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,Iu=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,Eu=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${Ye}] = batch;
     indices[${rt}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${bt}] = u32(r);
            indices[${wt}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${bt}] = u32(clamp(r, 0, H - 1));
          indices[${wt}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${bt}] = gs_reflect(r, border[1], border[3]);
          indices[${wt}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,zu=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Ye}], indices[${rt}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Ye}], indices[${rt}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Ye}], indices[${rt}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Ye}], indices[${rt}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Ye}], indices[${rt}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Ye}], indices[${rt}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,Au=(e,t)=>{let r=N("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],a=N("grid",e[1].dataType,i.length,2),s=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(s=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Ye,rt,bt,wt]=[0,3,1,2]);let o=K("output",e[0].dataType,s.length),u=r.type.value,d=A.size(s),p=[{type:12,data:d},...Q(e[0].dims,i,s)],f=m=>`
  ${m.registerUniform("output_size","u32").declareVariables(r,a,o)}
  ${Tu}
  ${ku(u)}
  ${Su(t)}
  ${Iu(t)}
  ${Eu(r,u,t)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${bt}]);
      let W_in = i32(uniforms.x_shape[${wt}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${o.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${Ye}], indices[${bt}], indices[${wt}]);
      let nxy = ${a.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${zu(o,u,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:m=>{let g=A.size(s);return{outputs:[{dims:s,dataType:m[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:p}},getShaderSource:f}},Ic=(e,t)=>{Cu(e.inputs),e.compute(Au(e.inputs,t))},Ec=e=>he({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Oe,Ou,zc,Zr,Ru,ui,Ac,Oc=q(()=>{te(),ne(),xe(),Wa(),ja(),oe(),mt(),Oe=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Ou=(e,t)=>{let r=e[0],i=Oe(e,1),a=Oe(e,2),s=Oe(e,3),o=Oe(e,4),u=Oe(e,5),d=Oe(e,6),p=Oe(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let f=r.dims[0],m=r.dims[1],g=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],_=m,b=0,$=0,T=Math.floor(g/t.numHeads);if(d&&p&&A.size(d.dims)&&A.size(p.dims)){if(d.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(d.dims[0]!==f||d.dims[1]!==t.numHeads||d.dims[3]!==T)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(p.dims[0]!==f||p.dims[1]!==t.numHeads||p.dims[3]!==T)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(d.dims[2]!==p.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(p.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');b=d.dims[2],$=d.dims[2]}else if(d&&A.size(d.dims)||p&&A.size(p.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let v;if(i&&A.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');v=2,_=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==T)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');v=5,_=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==T)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');v=0,_=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');v=3}if(s&&A.size(s.dims)>0){if(s.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let w=b+_,k=0;if(o&&A.size(o.dims)>0){k=8;let E=o.dims;throw E.length===1?E[0]===f?k=1:E[0]===3*f+2&&(k=3):E.length===2&&E[0]===f&&E[1]===w&&(k=5),k===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let C=!1,S=g;if(a&&A.size(a.dims)>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(_!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');S=a.dims[2]}else{if(_!==a.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');S=a.dims[1]*a.dims[3],C=!0}}let z=!1;if(o&&A.size(o.dims)>0)throw new Error("Key padding mask is not supported");if(u&&A.size(u.dims)>0){if(u.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(u.dims[0]!==f||u.dims[1]!==t.numHeads||u.dims[2]!==m||u.dims[3]!==w)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:f,sequenceLength:m,pastSequenceLength:b,kvSequenceLength:_,totalSequenceLength:w,maxSequenceLength:$,inputHiddenSize:0,hiddenSize:g,vHiddenSize:S,headSize:T,vHeadSize:Math.floor(S/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:k,scale:t.scale,broadcastResPosBias:z,passPastInKv:C,qkvFormat:v}},zc=e=>he({...e}),Zr=he({perm:[0,2,1,3]}),Ru=(e,t,r,i,a,s,o)=>{let u=[i,a,s],d=A.size(u),p=[{type:12,data:d},{type:12,data:o},{type:12,data:s}],f=m=>{let g=K("qkv_with_bias",t.dataType,u),_=N("qkv",t.dataType,u),b=N("bias",r.dataType,u),$=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${m.registerUniforms($).declareVariables(_,b,g)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:u,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p}),getShaderSource:f},{inputs:[t,r],outputs:[-1]})[0]},ui=(e,t,r,i,a,s,o,u)=>{let d=s;if(o&&A.size(o.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return d=Ru(e,s,o,t,i,r*a,u),d=d.reshape([t,i,r,a]),r===1||i===1?d:e.compute(De(d,Zr.perm),{inputs:[d],outputs:[-1]})[0]}else return s.dims.length===3&&(d=s.reshape([t,i,r,a])),r===1||i===1?d:e.compute(De(d,Zr.perm),{inputs:[d],outputs:[-1]})[0]},Ac=(e,t)=>{let r=Ou(e.inputs,t),i=e.inputs[0],a=Oe(e.inputs,1),s=Oe(e.inputs,2),o=Oe(e.inputs,3),u=Oe(e.inputs,4),d=Oe(e.inputs,5),p=Oe(e.inputs,6),f=Oe(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if(a?.dims.length===5)throw new Error("Packed KV is not implemented");let m=a&&s&&a.dims.length===4&&s.dims.length===4,g=ui(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,o,0);if(m)return pi(e,g,a,s,u,void 0,p,f,d,r);if(!a||!s)throw new Error("key and value must be provided");let _=ui(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,a,o,r.hiddenSize),b=ui(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,s,o,2*r.hiddenSize);pi(e,g,_,b,u,void 0,p,f,d,r)}}),Bu,Nu,Du,Mu,Sa,Rc,Bc,Nc=q(()=>{te(),ne(),xe(),oe(),Bu=e=>{if(!e||e.length<1)throw new Error("too few inputs")},Nu=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(a=>r.push(Number(a))),i=r.length),he({numOutputs:i,axis:t.axis,splitSizes:r})},Du=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${Y("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Mu=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let a=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(a):i===0?r.push(`if (output_number == ${i}u) { ${a} }`):i===t-1?r.push(`else { ${a} }`):r.push(`else if (output_number == ${i}) { ${a} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},Sa=(e,t)=>{let r=e[0].dims,i=A.size(r),a=e[0].dataType,s=A.normalizeAxis(t.axis,r.length),o=new Array(t.numOutputs),u=N("input",a,r.length),d=new Array(t.numOutputs),p=[],f=[],m=0,g=[{type:12,data:i}];for(let b=0;b<t.numOutputs;b++){m+=t.splitSizes[b],d[b]=m;let $=r.slice();$[s]=t.splitSizes[b],f.push($),o[b]=K(`output${b}`,a,$.length),p.push({dims:f[b],dataType:e[0].dataType})}g.push({type:12,data:d},...Q(r,...f));let _=b=>`
  ${b.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",d.length).declareVariables(u,...o)}
  ${Du(d.length)}
  ${Mu(o)}

  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${u.offsetToIndices("global_idx")};
    var index = ${u.indicesGet("indices",s)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${Y("uniforms.size_in_split_axis","output_number - 1u",d.length)};
      ${u.indicesSet("indices",s,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:_,getRunData:()=>({outputs:p,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:g})}},Rc=(e,t)=>{Bu(e.inputs);let r=e.inputs.length===1?t:Nu(e.inputs,t);e.compute(Sa(e.inputs,r),{inputs:[0]})},Bc=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return he({axis:t,numOutputs:i,splitSizes:r})}}),Pu,ji,Dc,Mc=q(()=>{te(),ne(),xe(),oe(),Pu=(e,t)=>{let[r,i,a,s]=e,{numHeads:o,rotaryEmbeddingDim:u}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!A.areEqual(i.dims,[])&&!A.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(s.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${s.dims.length}`);if(!A.areEqual(a.dims,s.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(u>0&&o===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let d=r.dims[0],p=r.dims[r.dims.length-2],f=a.dims[0],m=A.sizeFromDimension(r.dims,1)/p,g=u===0?a.dims[1]*2:m/o;if(u>g)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(d!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(p!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(g/2!==a.dims[1]&&u/2!==a.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${a.dims[1]}`);if(p>f)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},ji=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:a,scale:s}=t,o=e[0].dims[0],u=A.sizeFromDimension(e[0].dims,1),d=e[0].dims[e[0].dims.length-2],p=u/d,f=e[2].dims[1],m=a===0?f*2:p/i,g=new Array(o,d,p/m,m-f),_=A.computeStrides(g),b=[{type:1,data:s},{type:12,data:g},{type:12,data:_},...e[0].dims.length===3?new Array({type:12,data:[u,p,m,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[u,m,d*m,1]}):[],...Q(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],$=T=>{let v=N("input",e[0].dataType,e[0].dims.length),w=N("position_ids",e[1].dataType,e[1].dims.length),k=N("cos_cache",e[2].dataType,e[2].dims.length),C=N("sin_cache",e[3].dataType,e[3].dims.length),S=K("output",e[0].dataType,e[0].dims.length);return T.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:g.length},{name:"global_strides",type:"u32",length:_.length},{name:"input_output_strides",type:"u32",length:_.length}]),`
        ${T.declareVariables(v,w,k,C,S)}

        ${T.mainStart(Ut)}
          let half_rotary_emb_dim = uniforms.${k.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${T.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${w.broadcastedIndicesToOffset("bsnh.xy",K("",w.type.tensor,2))};
            let position_id =
                u32(${w.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${v.getByOffset("i")} * ${k.get("position_id","bsnh[3]")} -
                ${v.getByOffset("j")} * ${C.get("position_id","bsnh[3]")};
            ${S.setByOffset("i","re")}
            let im = ${v.getByOffset("i")} * ${C.get("position_id","bsnh[3]")} +
                ${v.getByOffset("j")} * ${k.get("position_id","bsnh[3]")};
            ${S.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${S.setByOffset("k",v.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:he({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:$,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(A.size(g)/Ut)},programUniforms:b})}},Dc=(e,t)=>{Pu(e.inputs,t),e.compute(ji(e.inputs,t))}}),Uu,qu,Yr,Wu,Pc,Ym=q(()=>{xe(),te(),ja(),Oc(),Nc(),mt(),Mc(),oe(),Uu=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],a=e[2],s=e[3],o=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let u=!1,d=r.dims[0],p=r.dims[1],f=r.dims.length===3?u?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],m=p,g=0,_=!i||i.dims.length===0,b=Math.floor(_?f/(t.numHeads+2*t.kvNumHeads):f/t.numHeads);_&&(f=b*t.numHeads);let $=s&&s.dims.length!==0,T=o&&o.dims.length!==0;if($&&s.dims.length===4&&s.dims[0]===d&&s.dims[1]!==t.kvNumHeads&&s.dims[2]===t.kvNumHeads&&s.dims[3]===b)throw new Error("BSNH pastKey/pastValue is not supported");if($&&T){if(s.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(o.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');g=s.dims[2]}else if($||T)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let v=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');m=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==b)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');m=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==b)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');m=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');v=3}let w=0,k=!1,C=t.kvNumHeads?b*t.kvNumHeads:f;if(a&&a.dims.length>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(m!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');C=a.dims[2]}else{if(m!==a.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');C=a.dims[1]*a.dims[3],k=!0}}let S=e.length>4?e[5]:void 0;if(S&&S.dims.length!==1&&S.dims[0]!==d)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:d,sequenceLength:p,pastSequenceLength:g,kvSequenceLength:m,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:f,vHiddenSize:C,headSize:b,vHeadSize:Math.floor(C/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:k,qkvFormat:v}},qu=he({perm:[0,2,1,3]}),Yr=(e,t,r)=>{let i=t,a=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,a,r.headSize]),i=e.compute(De(i,qu.perm),{inputs:[i],outputs:[-1]})[0]),i},Wu=(e,t,r,i)=>{let a=7,s=["type","type"],o=[e*t],u=e*t,d=[{type:12,data:u},{type:12,data:t},{type:12,data:e}],p=f=>{let m=N("seq_lens",r.dataType,r.dims),g=N("total_seq_lens",i.dataType,i.dims),_=K("pos_ids",a,o),b=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${f.registerUniforms(b).declareVariables(m,g,_)}
  ${f.mainStart()}
    ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${g.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${m.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${_.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${_.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${_.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:s},getRunData:()=>({outputs:[{dims:o,dataType:a}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d}),getShaderSource:p}},Pc=(e,t)=>{let r=Uu(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],a=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,s=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,o=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,u=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,d=e.inputs.length>4?e.inputs[5]:void 0,p=e.inputs.length>5?e.inputs[6]:void 0,f=r.kvNumHeads?r.kvNumHeads:r.numHeads,m=he({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,f*r.headSize,f*r.headSize]}),[g,_,b]=!a&&!s?e.compute(Sa([i],m),{inputs:[i],outputs:[-1,-1,-1]}):[i,a,s],$,T;if(t.doRotary){let C=e.compute(Wu(r.batchSize,r.sequenceLength,d,p),{inputs:[d,p],outputs:[-1]})[0],S=e.inputs[7],z=e.inputs[8],E=he({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),R=[g,C,S,z],U=[-1];$=e.compute(ji(R,E),{inputs:R,outputs:U})[0],R.splice(0,1,_);let V=he({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});T=e.compute(ji(R,V),{inputs:R,outputs:U})[0]}let v=ui(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?$:g,void 0,0),w=Yr(e,t.doRotary?T:_,r),k=Yr(e,b,r);pi(e,v,w,k,void 0,void 0,o,u,void 0,r,d,p)}}),Xr,Lu,Vu,Uc,Xm=q(()=>{te(),ne(),mt(),oe(),Xr=(e,t,r,i,a,s,o,u)=>{let d=ve(s),p=d===1?"f32":`vec${d}f`,f=d===1?"vec2f":`mat2x${d}f`,m=a*o,g=64;m===1&&(g=256);let _=[a,o,s/d],b=[a,o,2],$=["rank","type","type"],T=[];T.push(...Q(_,b));let v=w=>{let k=N("x",t.dataType,3,d),C=N("scale",r.dataType,r.dims),S=N("bias",i.dataType,i.dims),z=K("output",1,3,2),E=[k,C,S,z];return`
  var<workgroup> workgroup_shared : array<${f}, ${g}>;
  const workgroup_size = ${g}u;
  ${w.declareVariables(...E)}
  ${w.mainStart(g)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${p}(0);
    var squared_sum = ${p}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${p}(${k.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${f}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${ht("workgroup_shared[0][0]",d)} / f32(hight * ${d});
      let squared_sum_final = ${ht("workgroup_shared[0][1]",d)} / f32(hight * ${d});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${u}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${d};${u};${g}`,inputDependencies:$},getRunData:()=>({outputs:[{dims:b,dataType:1}],dispatchGroup:{x:m},programUniforms:T}),getShaderSource:v},{inputs:[t,r,i],outputs:[-1]})[0]},Lu=(e,t,r)=>{let i=t[0].dims,a=i,s=2,o=i[0],u=i[1],d=A.sizeFromDimension(i,s),p=ve(d),f=A.size(a)/p,m=Xr(e,t[0],t[1],t[2],o,d,u,r.epsilon),g=[o,u,d/p],_=[o,u],b=["type","none"],$=T=>{let v=N("x",t[0].dataType,g.length,p),w=N("scale_shift",1,_.length,2),k=K("output",t[0].dataType,g.length,p),C=[v,w,k];return`
  ${T.registerUniform("output_size","u32").declareVariables(...C)}
  ${T.mainStart()}
  ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${k.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${w.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${v.getByOffset("global_idx")} * ${k.type.value}(scale_shift.x) + ${k.type.value}(scale_shift.y);
      ${k.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${p}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},...Q(g,_,g)]}),getShaderSource:$},{inputs:[t[0],m]})},Vu=(e,t,r)=>{let i=t[0].dims,a=i,s=i[0],o=i[i.length-1],u=A.sizeFromDimension(i,1)/o,d=ve(o),p=A.size(a)/d,f=[{type:12,data:u},{type:12,data:Math.floor(o/d)}],m=["type","type"],g=!1,_=[0,i.length-1];for(let v=0;v<i.length-2;v++)g=g||i[v+1]!==1,_.push(v+1);g=g&&i[i.length-1]!==1;let b=g?e.compute(De(e.inputs[0],_),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},(v,w)=>i[_[w]])),$=Xr(e,b,t[1],t[2],s,u,o,r.epsilon),T=v=>{let w=Se(t[0].dataType),k=d===1?"vec2f":`mat${d}x2f`,C=E=>{let R=E===0?"x":"y",U=d===1?"f32":`vec${d}f`;switch(d){case 1:return`${w}(${U}(scale.${R}))`;case 2:return`vec2<${w}>(${U}(scale[0].${R}, scale[1].${R}))`;case 4:return`vec4<${w}>(${U}(scale[0].${R}, scale[1].${R}, scale[2].${R}, scale[3].${R}))`;default:throw new Error(`Not supported compoents ${d}`)}},S=N("input",t[0].dataType,t[0].dims,d),z=K("output",t[0].dataType,a,d);return`
  @group(0) @binding(0) var<storage, read> input : array<${S.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${k}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${z.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${v.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${C(0)}, ${C(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${d}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:f}),getShaderSource:T},{inputs:[t[0],$]})},Uc=(e,t)=>{t.format==="NHWC"?Vu(e,e.inputs,t):Lu(e,e.inputs,t)}}),ju,Gu,qc,Qm=q(()=>{te(),ne(),oe(),ju=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},Gu=(e,t,r)=>{let i=t.simplified,a=e[0].dims,s=e[1],o=!i&&e[2],u=a,d=A.normalizeAxis(t.axis,a.length),p=A.sizeToDimension(a,d),f=A.sizeFromDimension(a,d),m=A.size(s.dims),g=o?A.size(o.dims):0;if(m!==f||o&&g!==f)throw new Error(`Size of X.shape()[axis:] == ${f}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${m} and bias size of ${g}`);let _=[];for(let S=0;S<a.length;++S)S<d?_.push(a[S]):_.push(1);let b=ve(f),$=["type","type"],T=[{type:12,data:p},{type:1,data:f},{type:12,data:Math.floor(f/b)},{type:1,data:t.epsilon}];o&&$.push("type");let v=r>1,w=r>2,k=S=>{let z=Se(e[0].dataType),E=[N("x",e[0].dataType,e[0].dims,b),N("scale",s.dataType,s.dims,b)];o&&E.push(N("bias",o.dataType,o.dims,b)),E.push(K("output",e[0].dataType,u,b)),v&&E.push(K("mean_data_output",1,_)),w&&E.push(K("inv_std_output",1,_));let R=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${S.registerUniforms(R).declareVariables(...E)}
  ${S.mainStart()}
    ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${ya("f32",b)};
    var mean_square_vector = ${ya("f32",b)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${Dt(z,b,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${ht("mean_vector",b)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${ht("mean_square_vector",b)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${Dt(z,b,"x[j + offset]")};
      let f32scale = ${Dt(z,b,"scale[j]")};
      output[j + offset] = ${E[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${o?`+ ${Dt(z,b,"bias[j]")}`:""}
      );
    }

    ${v?"mean_data_output[global_idx] = mean":""};
    ${w?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},C=[{dims:u,dataType:e[0].dataType}];return v&&C.push({dims:_,dataType:1}),w&&C.push({dims:_,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${b};${r};${i}`,inputDependencies:$},getRunData:()=>({outputs:C,dispatchGroup:{x:Math.ceil(p/64)},programUniforms:T}),getShaderSource:k}},qc=(e,t)=>{ju(e.inputs),e.compute(Gu(e.inputs,t,e.outputCount))}}),Hu,Wc,Jm=q(()=>{ne(),Za(),Ya(),Hu=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},Wc=e=>{Hu(e.inputs);let t=Pt.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(Ka(e.inputs,{activation:""},t));else{let a=t[t.length-2],s=A.size(e.inputs[0].dims.slice(0,-2)),o=A.size(e.inputs[1].dims.slice(0,-2));if(s!==1&&a===1&&o===1){let u=e.inputs[0].reshape([1,s,i]),d=e.inputs[1].reshape([1,i,r]),p=[1,s,r],f=[u,d];e.compute(Vi(f,{activation:""},t,p),{inputs:f})}else e.compute(Vi(e.inputs,{activation:""},t))}}}),Fu,Ku,Zu,Lc,Vc,eg=q(()=>{te(),ne(),xe(),oe(),Fu=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let a=Math.floor((t.k+t.blockSize-1)/t.blockSize),s=t.blockSize/8*t.bits,o=e[1];if(!A.areEqual(o.dims,[t.n,a,s]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let u=e[2].dims;if(A.size(u)!==t.n*a)throw new Error("scales input size error.");if(e.length===4){let d=e[3].dims,p=t.n*(t.bits===8?a:Math.floor((a*t.bits+7)/8));if(A.size(d)!==p)throw new Error("zeroPoints input size error.")}},Ku=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],s=t.k,o=t.n,u=r.slice(0,i-2),d=A.size(u),p=e[1].dims[2]/4,f=e[0].dataType,m=ve(t.k),g=ve(p),_=ve(o),b=u.concat([a,o]),$=a>1&&o/_%2===0?2:1,T=A.size(b)/_/$,v=64,w=[],k=[d,a,s/m],C=A.convertShape(e[1].dims).slice();C.splice(-1,1,p/g),w.push(...Q(k)),w.push(...Q(C)),w.push(...Q(e[2].dims)),e.length===4&&w.push(...Q(A.convertShape(e[3].dims)));let S=[d,a,o/_];w.push(...Q(S));let z=E=>{let R=k.length,U=N("a",e[0].dataType,R,m),V=N("b",12,C.length,g),Z=N("scales",e[2].dataType,e[2].dims.length),X=[U,V,Z],re=e.length===4?N("zero_points",12,e[3].dims.length):void 0;re&&X.push(re);let j=S.length,se=K("output",e[0].dataType,j,_),J=Se(e[0].dataType),H=(()=>{switch(m){case 1:return`array<${J}, 8>`;case 2:return`mat4x2<${J}>`;case 4:return`mat2x4<${J}>`;default:throw new Error(`${m}-component is not supported.`)}})(),ae=()=>{let P=`
          // reuse a data
            var input_offset = ${U.indicesToOffset(`${U.type.indices}(batch, row, word_offset)`)};
            var a_data: ${H};
            for (var j: u32 = 0; j < ${8/m}; j++) {
              a_data[j] = ${U.getByOffset("input_offset")};
              input_offset++;
            }
          `;for(let L=0;L<_*$;L++)P+=`
            b_value = ${g===1?`b${L}_data`:`b${L}_data[i]`};
            b_value_lower = unpack4xU8(b_value & b_mask);
            b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
            b_quantized_values = ${H}(${Array.from({length:4},(ie,pe)=>`${J}(b_value_lower[${pe}]), ${J}(b_value_upper[${pe}])`).join(", ")});
            b_dequantized_values = ${m===1?`${H}(${Array.from({length:8},(ie,pe)=>`(b_quantized_values[${pe}] - ${re?`zero_point${L}`:"zero_point"}) * scale${L}`).join(", ")});`:`(b_quantized_values - ${H}(${Array(8).fill(`${re?`zero_point${L}`:"zero_point"}`).join(",")})) * scale${L};`};
            workgroup_shared[local_id.x * ${$} + ${Math.floor(L/_)}]${_>1?`[${L%_}]`:""} += ${Array.from({length:8/m},(ie,pe)=>`${m===1?`a_data[${pe}] * b_dequantized_values[${pe}]`:`dot(a_data[${pe}], b_dequantized_values[${pe}])`}`).join(" + ")};
          `;return P},G=()=>{let P=`
            var col_index = col * ${_};
            ${re?`
            let zero_point_bytes_per_col = (nBlocksPerCol + 1) / 2;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${J}(8);`}
            `;for(let L=0;L<_*$;L++)P+=`
            let scale${L} = ${Z.getByOffset("col_index * nBlocksPerCol + block")};
            ${re?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            zero_point_word = ${re.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${L} = ${J}((zero_point_word) & 0xFu);`:""}
            col_index += 1;`;return P},ge=()=>{let P=`col_index = col * ${_};`;for(let L=0;L<_*$;L++)P+=`
            let b${L}_data = ${V.getByIndices(`${V.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return P+=`
            var b_value: u32;
            let b_mask: u32 = 0x0F0F0F0Fu;
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${H};
            var b_dequantized_values: ${H};`,P};return`
        var<workgroup> workgroup_shared: array<${se.type.value}, ${$*v}>;
        ${E.declareVariables(...X,se)}
        ${E.mainStart([v,1,1])}
          let output_indices = ${se.offsetToIndices(`(global_idx / ${v}) * ${$}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${v}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/m};
            ${G()}
            for (var word: u32 = 0; word < ${p}; word += ${g}) {
              ${ge()}
              for (var i: u32 = 0; i < ${g}; i++) {
                ${ae()}
                word_offset += ${8/m};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${$}) {
            var output_value: ${se.type.value} = ${se.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${v}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${$};
            }
            ${se.setByIndices(`${se.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${m};${g};${_};${$};${v}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:b,dataType:f}],dispatchGroup:{x:T},programUniforms:w}),getShaderSource:z}},Zu=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],s=t.k,o=t.n,u=r.slice(0,i-2),d=A.size(u),p=e[1].dims[2]/4,f=e[0].dataType,m=ve(t.k),g=ve(p),_=u.concat([a,o]),b=128,$=o%8===0?8:o%4===0?4:1,T=b/$,v=T*g*8,w=v/m,k=v/t.blockSize,C=A.size(_)/$,S=[],z=[d,a,s/m],E=A.convertShape(e[1].dims).slice();E.splice(-1,1,p/g),S.push(...Q(z)),S.push(...Q(E)),S.push(...Q(e[2].dims)),e.length===4&&S.push(...Q(A.convertShape(e[3].dims)));let R=[d,a,o];S.push(...Q(R));let U=V=>{let Z=z.length,X=N("a",e[0].dataType,Z,m),re=N("b",12,E.length,g),j=N("scales",e[2].dataType,e[2].dims.length),se=[X,re,j],J=e.length===4?N("zero_points",12,e[3].dims.length):void 0;J&&se.push(J);let H=R.length,ae=K("output",e[0].dataType,H),G=Se(e[0].dataType),ge=()=>{switch(m){case 1:return`
          let a_data0 = vec4<${G}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${G}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${G}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${G}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${m}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${X.type.value}, ${w}>;
        var<workgroup> inter_results: array<array<${ae.type.value}, ${T}>, ${$}>;
        ${V.declareVariables(...se,ae)}
        ${V.mainStart([T,$,1])}
          let output_indices = ${ae.offsetToIndices(`workgroup_index * ${$}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${k} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${w};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${w}; a_offset += ${b})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${X.getByIndices(`${X.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${X.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${k} + local_id.x;
            ${J?`
            let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            let zero_point_word = ${J.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${G}((zero_point_word) & 0xFu);`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${G}(8);`}
            let scale = ${j.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${re.getByIndices(`${re.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/m};
            for (var i: u32 = 0; i < ${g}; i++) {
              ${ge()}
              let b_value = ${g===1?"b_data":"b_data[i]"};
              let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
              let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
              let b_quantized_values = mat2x4<${G}>(${Array.from({length:4},(P,L)=>`${G}(b_value_lower[${L}]), ${G}(b_value_upper[${L}])`).join(", ")});
              let b_dequantized_values = (b_quantized_values - mat2x4<${G}>(${Array(8).fill("zero_point").join(",")})) * scale;
              inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(P,L)=>`${`dot(a_data${L}, b_dequantized_values[${L}])`}`).join(" + ")};
              word_offset += ${8/m};
            }
            workgroupBarrier();
          }

          if (local_idx < ${$}) {
            var output_value: ${ae.type.value} = ${ae.type.value}(0);
            for (var b = 0u; b < ${T}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${ae.setByIndices(`${ae.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${m};${g};${T};${$}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:_,dataType:f}],dispatchGroup:{x:C},programUniforms:S}),getShaderSource:U}},Lc=(e,t)=>{Fu(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(Zu(e.inputs,t)):e.compute(Ku(e.inputs,t))},Vc=e=>he(e)}),Yu,Xu,Qu,Ju,el,tl,il,rl,jc,tg=q(()=>{te(),ne(),oe(),Yu=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Xu=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
            k = i32(${e.indicesGet("indices",a)}) - ${Y("uniforms.pads",a,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${Y("uniforms.x_shape",a,t)})) {
              break;
            }
            offset += k * i32(${Y("uniforms.x_strides",a,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${i}
            value = x[offset];
          }
      `},Qu=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${Y("uniforms.pads",a,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${Y("uniforms.x_shape",a,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${Y("uniforms.x_shape",a,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${Y("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Ju=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${Y("uniforms.pads",a,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${Y("uniforms.x_shape",a,t)})) {
                  k = i32(${Y("uniforms.x_shape",a,t)}) - 1;
                }
                offset += k * i32(${Y("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},el=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${Y("uniforms.pads",a,r)};
                if (k < 0)  {
                  k += i32(${Y("uniforms.x_shape",a,t)}]);
                }
                if (k >= i32(${Y("uniforms.x_shape",a,t)})) {
                  k -= i32(${Y("uniforms.x_shape",a,t)});
                }
                offset += k * i32(${Y("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},tl=(e,t,r)=>{switch(r.mode){case 0:return Xu(e,t,r.pads.length);case 1:return Qu(e,t,r.pads.length);case 2:return Ju(e,t,r.pads.length);case 3:return el(e,t,r.pads.length);default:throw new Error("Invalid mode")}},il=(e,t)=>{let r=A.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,a=A.size(r),s=[{type:12,data:a},{type:6,data:t.pads}],o=e.length>=3&&e[2].data;t.mode===0&&s.push({type:o?e[2].dataType:1,data:t.value}),s.push(...Q(e[0].dims,r));let u=["rank"],d=p=>{let f=K("output",e[0].dataType,r.length),m=N("x",e[0].dataType,i.length),g=m.type.value,_=tl(f,i.length,t),b=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&b.push({name:"constant_value",type:o?g:"f32"}),`
            ${p.registerUniforms(b).declareVariables(m,f)}
            ${p.mainStart()}
            ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${f.offsetToIndices("global_idx")};

            var value = ${g}(0);
            ${_}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${o}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(A.size(r)/64)},programUniforms:s}),getShaderSource:d}},rl=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,a=e[0].dims.length,s=new Int32Array(2*a).fill(0);if(e.length>=4){let u=e[3].getBigInt64Array();for(let d=0;d<u.length;d++)s[Number(u[d])]=Number(r[d]),s[Number(u[d])+a]=Number(r[d+u.length])}else r.forEach((u,d)=>s[Number(d)]=Number(u));let o=[];return s.forEach(u=>o.push(u)),{mode:t.mode,value:i,pads:o}}else return t},jc=(e,t)=>{Yu(e.inputs);let r=rl(e.inputs,t);e.compute(il(e.inputs,r),{inputs:[0]})}}),ti,Qr,Jr,ea,ta,al,nl,ia,ra,Gc,Hc,aa,Fc,Kc,na,Zc,Yc,Xc,Qc,ig=q(()=>{Ue(),te(),ne(),oe(),ti=e=>{if(_e.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},Qr=(e,t,r)=>{let i=t.format==="NHWC",a=e.dims.slice();i&&a.splice(1,0,a.pop());let s=Object.hasOwnProperty.call(t,"dilations"),o=t.kernelShape.slice(),u=t.strides.slice(),d=s?t.dilations.slice():[],p=t.pads.slice();Wi.adjustPoolAttributes(r,a,o,u,d,p);let f=Wi.computePoolOutputShape(r,a,u,d,o,p,t.autoPad),m=Object.assign({},t);s?Object.assign(m,{kernelShape:o,strides:u,pads:p,dilations:d,cacheKey:t.cacheKey}):Object.assign(m,{kernelShape:o,strides:u,pads:p,cacheKey:t.cacheKey});let g=f.slice();return g.push(g.splice(1,1)[0]),[m,i?g:f]},Jr=(e,t)=>{let r=t.format==="NHWC",i=A.size(e),a=A.size(t.kernelShape),s=[{type:12,data:i},{type:12,data:a}],o=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let u=t.kernelShape[t.kernelShape.length-1],d=t.strides[t.strides.length-1],p=t.pads[t.pads.length/2-1],f=t.pads[t.pads.length-1],m=!!(p+f);s.push({type:12,data:u},{type:12,data:d},{type:12,data:p},{type:12,data:f}),o.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let g=!1;if(t.kernelShape.length===2){let _=t.kernelShape[t.kernelShape.length-2],b=t.strides[t.strides.length-2],$=t.pads[t.pads.length/2-2],T=t.pads[t.pads.length-2];g=!!($+T),s.push({type:12,data:_},{type:12,data:b},{type:12,data:$},{type:12,data:T}),o.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[s,o,!0,m,g]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let u=A.computeStrides(t.kernelShape);s.push({type:12,data:u},{type:12,data:t.pads},{type:12,data:t.strides}),o.push({name:"kernelStrides",type:"u32",length:u.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let d=t.pads.reduce((p,f)=>p+f);return[s,o,!!d,!1,!1]}},ea=(e,t,r,i,a,s,o,u,d,p,f,m)=>{let g=a.format==="NHWC",_=t.type.value,b=K("output",t.type.tensor,i);if(a.kernelShape.length<=2){let $="",T="",v="",w=r-(g?2:1);if(f?$=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${w}] < 0 || xIndices[${w}]
                      >= uniforms.x_shape[${w}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${s}
                }`:$=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${s}
                }`,a.kernelShape.length===2){let k=r-(g?3:2);m?T=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${k}] = indices[${k}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${k}] < 0 || xIndices[${k}] >= uniforms.x_shape[${k}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:T=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${k}] = indices[${k}] * uniforms.sh - uniforms.phStart + j;
                `,v=`
              }
            `}return`
            ${e.registerUniforms(d).declareVariables(t,b)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${b.offsetToIndices("global_idx")};
              var xIndices = ${b.offsetToIndices("global_idx")};

              var value = ${_}(${u});
              var pad = 0;
              ${T}
              ${$}
              ${v}
              ${o}

              output[global_idx] = value;
            }`}else{if(g)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let $=a.kernelShape.length,T=a.pads.length,v="";return p?v=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${s}
              }`:v=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${s}
            `,`
            ${e.registerUniforms(d).declareVariables(t,b)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${b.offsetToIndices("global_idx")};
              var xIndices = ${b.offsetToIndices("global_idx")};

              var offsets: array<u32, ${$}>;

              var value = ${_}(${u});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${$-1}u; j++) {
                  offsets[j] = offset / ${Y("uniforms.kernelStrides","j",$)};
                  offset -= offsets[j] * ${Y("uniforms.kernelStrides","j",$)};
                }
                offsets[${$-1}] = offset;

                isPad = false;
                for (var j = ${r-$}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${Y("uniforms.strides",`j - ${r-$}u`,$)}
                    + offsets[j - ${r-$}u] - ${Y("uniforms.pads","j - 2u",T)};
                  ${v}
              }
              ${o}

              output[global_idx] = value;
            }`}},ta=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,al=e=>`${ta(e)};${e.countIncludePad}`,nl=e=>`${ta(e)};${e.storageOrder};${e.dilations}`,ia=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),ra=(e,t,r,i)=>{let[a,s]=Qr(t,i,r),o=N("x",t.dataType,t.dims.length),u=o.type.value,d="value += x_val;",p="";a.countIncludePad?p+=`value /= ${u}(uniforms.kernelSize);`:p+=`value /= ${u}(i32(uniforms.kernelSize) - pad);`;let[f,m,g,_,b]=Jr(s,a);f.push(...Q(t.dims,s));let $=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${g};${_};${b}`,inputDependencies:$},getRunData:()=>({outputs:[{dims:s,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(A.size(s)/64)},programUniforms:f}),getShaderSource:T=>ea(T,o,t.dims.length,s.length,a,d,p,0,m,g,_,b)}},Gc=e=>{let t=e.count_include_pad!==0,r=ia(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:al(i)}},Hc=(e,t)=>{ti(e.inputs),e.compute(ra("AveragePool",e.inputs[0],!1,t))},aa={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},Fc=e=>{let t=e.format;return{format:t,...aa,cacheKey:t}},Kc=(e,t)=>{ti(e.inputs),e.compute(ra("GlobalAveragePool",e.inputs[0],!0,t))},na=(e,t,r,i)=>{let[a,s]=Qr(t,i,r),o=`
      value = max(x_val, value);
    `,u="",d=N("x",t.dataType,t.dims.length),p=["rank"],[f,m,g,_,b]=Jr(s,a);return f.push(...Q(t.dims,s)),{name:e,shaderCache:{hint:`${i.cacheKey};${g};${_};${b}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:s,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(A.size(s)/64)},programUniforms:f}),getShaderSource:$=>ea($,d,t.dims.length,s.length,a,o,u,t.dataType===10?-65504:-1e5,m,g,_,b)}},Zc=(e,t)=>{ti(e.inputs),e.compute(na("MaxPool",e.inputs[0],!1,t))},Yc=e=>{let t=e.storage_order,r=e.dilations,i=ia(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let a={storageOrder:t,dilations:r,...i,cacheKey:""};return{...a,cacheKey:nl(a)}},Xc=e=>{let t=e.format;return{format:t,...aa,cacheKey:t}},Qc=(e,t)=>{ti(e.inputs),e.compute(na("GlobalMaxPool",e.inputs[0],!0,t))}}),sl,ol,Jc,ef,rg=q(()=>{te(),ne(),xe(),oe(),sl=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((a,s)=>s===t.axis||a===e[0].dims[s]).reduce((a,s)=>a&&s,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},ol=(e,t)=>{let r=A.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,a=i===3,s=e[0].dims,o=e[1].dataType,u=A.size(s),d=i===3||i===2,p=d?[Math.ceil(A.size(e[0].dims)/4)]:e[0].dims,f=e[1].dims,m=e.length>2?e[2]:void 0,g=m?d?[Math.ceil(A.size(m.dims)/4)]:m.dims:void 0,_=f.length===0||f.length===1&&f[0]===1,b=_===!1&&f.length===1,$=ve(u),T=_&&(!d||$===4),v=T?$:1,w=T&&!d?$:1,k=N("input",d?12:i,p.length,w),C=N("scale",o,f.length),S=m?N("zero_point",d?12:i,g.length):void 0,z=K("output",o,s.length,v),E=[k,C];S&&E.push(S);let R=[p,f];m&&R.push(g);let U=[{type:12,data:u/v},{type:12,data:r},{type:12,data:t.blockSize},...Q(...R,s)],V=Z=>{let X=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${Z.registerUniforms(X).declareVariables(...E,z)}
      ${Z.mainStart()}
          ${Z.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${z.offsetToIndices("global_idx")};

          // Set input x
          ${d?`
            let input = ${k.getByOffset("global_idx / 4")};
            let x_vec = ${a?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${v===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${k.getByOffset("global_idx")};`};

          // Set scale input
          ${_?`let scale_value= ${C.getByOffset("0")}`:b?`
            let scale_index = ${z.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${C.getByOffset("scale_index")};`:`
            var scale_indices: ${C.type.indices} = output_indices;
            let index = ${C.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${C.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${C.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${S?_?d?`
                let zero_point_input = ${S.getByOffset("0")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${S.getByOffset("0")}`:b?d?`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${S.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${S.getByOffset("zero_point_index")};`:d?`
                let zero_point_offset = ${C.indicesToOffset("scale_indices")};
                let zero_point_input = ${S.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${S.getByIndices("scale_indices")};`:`let zero_point_value = ${d?a?"i32":"u32":k.type.value}(0);`};
      // Compute and write output
      ${z.setByOffset("global_idx",`${z.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:S?["rank","rank","rank"]:["rank","rank"]},getShaderSource:V,getRunData:()=>({outputs:[{dims:s,dataType:o}],dispatchGroup:{x:Math.ceil(u/v/64),y:1,z:1},programUniforms:U})}},Jc=(e,t)=>{sl(e.inputs,t),e.compute(ol(e.inputs,t))},ef=e=>he({axis:e.axis,blockSize:e.blockSize})}),ul,ll,tf,ag=q(()=>{Ue(),te(),oe(),ul=(e,t,r)=>{let i=e===t,a=e<t&&r<0,s=e>t&&r>0;if(i||a||s)throw new Error("Range these inputs' contents are invalid.")},ll=(e,t,r,i)=>{let a=Math.abs(Math.ceil((t-e)/r)),s=[a],o=a,u=[{type:12,data:o},{type:i,data:e},{type:i,data:r},...Q(s)],d=p=>{let f=K("output",i,s.length),m=f.type.value,g=[{name:"outputSize",type:"u32"},{name:"start",type:m},{name:"delta",type:m}];return`
        ${p.registerUniforms(g).declareVariables(f)}
        ${p.mainStart()}
        ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${m}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:d,getRunData:()=>({outputs:[{dims:s,dataType:i}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:u})}},tf=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),_e.webgpu.validateInputContent&&ul(t,r,i),e.compute(ll(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),dl,pl,rf,af,ng=q(()=>{te(),ne(),xe(),oe(),dl=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let a=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,s=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return i==="i32"||i==="u32"?`atomicAdd(&${t}, bitcast<${i}>(${r}));`:`
              ${a}bitcast<${i}>(oldValue) + (${r})${s}`;case"max":return i==="i32"||i==="u32"?`atomicMax(&${t}, bitcast<${i}>(${r}));`:`
                ${a}max(bitcast<f32>(oldValue), (${r}))${s}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${a}min(bitcast<${i}>(oldValue), (${r}))${s}`;case"mul":return`${a}(bitcast<${i}>(oldValue) * (${r}))${s}`;default:throw new Error(`Reduction ${e} is not supported.`)}},pl=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r,s=1,o=Math.ceil(A.sizeToDimension(i,i.length-1)/s),u=i[i.length-1],d=A.sizeFromDimension(r,u),p=[{type:12,data:o},{type:12,data:u},{type:12,data:d},...Q(e[1].dims,e[2].dims,a)],f=m=>{let g=N("indices",e[1].dataType,e[1].dims.length),_=N("updates",e[2].dataType,e[2].dims.length,s),b=t.reduction!=="none"&&t.reduction!==""?Ad("output",e[0].dataType,a.length):K("output",e[0].dataType,a.length,s);return`
      ${m.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(g,_,b)}
      ${m.mainStart()}
        ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${e[0].dims.length===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${dl(t.reduction,"output[data_offset + i]","value",b.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:p}),getShaderSource:f}},rf=e=>he({reduction:e.reduction}),af=(e,t)=>{e.compute(pl(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),cl,fl,hl,sa,ml,gl,_l,yl,bl,wl,$l,vl,oa,xl,Cl,Tl,kl,Sl,nf,sf,sg=q(()=>{te(),ne(),xe(),oe(),cl=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},fl=(e,t,r)=>{t.every(a=>a>=0&&a<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((a,s)=>i[a]=e[s]),i},hl=(e,t,r,i,a,s)=>{let[o,u,d]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],p=e[0].dims.length;if(o>0&&e.length>o&&e[o].dims.length>0)e[o].getFloat32Array().forEach(f=>s.push(f));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0){if(e[u].getFloat32Array().forEach(f=>i.push(f)),i.length!==0&&i.length!==p&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");cl(i,t),t.axes.length>0&&fl(i,t.axes,p).forEach((f,m)=>i[m]=f)}if(d>0&&e.length>d&&e[d].dims.length===1&&e[d].dims[0]>0&&(e[d].getBigInt64Array().forEach(f=>a.push(Number(f))),a.length!==0&&a.length!==p&&r>=18&&a.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(a.length!==0&&a.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof a<"u"&&i.length>0&&a.length>p)throw new Error("Resize requires only of scales or sizes to be specified")},sa=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,ml=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${sa("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${sa("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",gl=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",_l=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),a=e.length===0?i:e.slice();return t.length>0?(t.forEach((s,o)=>{i[s]=a[o],i[o+r]=a[t.length+o]}),i):a},yl=(e,t,r,i)=>{let a=[];if(r.length>0)if(i.length>0){if(e.forEach(s=>a.push(s)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((s,o)=>a[s]=r[o])}else r.forEach(s=>a.push(s));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");a=e.map((s,o)=>Math.round(s*t[o]))}return a},bl=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(s=>t[s]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(s=>t[s]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let a=e.slice();return r.axes.length>0?(r.axes.forEach(s=>t[s]=i),r.axes.forEach(s=>a[s]=Math.round(e[s]*t[s]))):(t.fill(i,0,t.length),a.forEach((s,o)=>a[o]=Math.round(s*t[o]))),a},wl=(e,t,r,i,a)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${Y("uniforms.scales","i",i)};
        var roi_low = ${Y("uniforms.roi","i",a)};
        var roi_hi = ${Y("uniforms.roi",`i + ${t.length}`,a)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${Y("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${Y("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,$l=(e,t,r,i,a,s,o)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${i.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${Y("uniforms.scales","i",a)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${Y("uniforms.roi","i",s)};
          var roi_hi = ${Y("uniforms.roi",`i + ${r.length}`,s)};
          var input_shape_i = ${Y("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${Y("uniforms.output_shape","i",i.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${o} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,vl=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${Y("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,oa=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",xl=(e,t,r,i,a)=>{let[s,o,u,d]=r.length===2?[-1,0,1,-1]:[0,2,3,1],p=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${p} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",o,`max(0, min(row, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(col, ${r[u]} - 1))`)};
      ${oa(e,d,s,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${p} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${p} = originalIndices[${o}];
      var col:${p} = originalIndices[${u}];
      ${i?`if (row < 0 || row > (${r[o]} - 1) || col < 0 || col > (${r[u]} - 1)) {
        return ${a};
      }`:""};
      row = max(0, min(row, ${r[o]} - 1));
      col = max(0, min(col, ${r[u]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${r.length>2?`u32(originalIndices[${d}])`:"0"};
      var batch: u32 =  ${r.length>2?`u32(originalIndices[${s}])`:"0"};
      var x11: ${p} = getInputValue(batch, channel, row1, col1);
      var x12: ${p} = getInputValue(batch, channel, row1, col2);
      var x21: ${p} = getInputValue(batch, channel, row2, col1);
      var x22: ${p} = getInputValue(batch, channel, row2, col2);
      var dx1: ${p} = abs(row - ${p}(row1));
      var dx2: ${p} = abs(${p}(row2) - row);
      var dy1: ${p} = abs(col - ${p}(col1));
      var dy2: ${p} = abs(${p}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},Cl=(e,t,r,i,a,s,o,u,d,p)=>{let f=r.length===2,[m,g]=f?[0,1]:[2,3],_=e.type.value,b=$=>{let T=$===m?"row":"col";return`
      fn ${T}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${_} {
        var output_index = ${t.indicesGet("output_indices",$)};
        var originalIdx: ${_} = getOriginalCoordinateFromResizedCoordinate(output_index, ${a[$]},
        ${i[$]}, ${r[$]}, ${s[$]}, ${s[$]} + ${r.length});
        var fractOriginalIdx: ${_} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${u} && (originalIdx < 0 || originalIdx > (${r[$]} - 1))) {
          return ${d};
        }
        var data: array<${_}, 4> = array<${_}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${T}: ${_} = originalIdx + ${_}(i);
          if (${T} < 0 || ${T} >= ${r[$]}) {
            ${p?`coefs[i + 1] = 0.0;
                        continue;`:u?`return ${d};`:`${T} = max(0, min(${T}, ${r[$]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",$,`u32(${T})`)};
          data[i + 1] = ${$===m?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${b(m)};
    ${b(g)};
  fn getCubicInterpolationCoefs(s: ${_}) -> array<${_}, 4> {
    var absS = abs(s);
    var coeffs: array<${_}, 4> = array<${_}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${_} = 1.0 - absS;
    var twoMinusAbsS: ${_} = 2.0 - absS;
    var onePlusAbsS: ${_} = 1.0 + absS;
    coeffs[0] = ((${o} * onePlusAbsS - 5 * ${o}) * onePlusAbsS + 8 * ${o}) * onePlusAbsS - 4 * ${o};
    coeffs[1] = ((${o} + 2) * absS - (${o} + 3)) * absS * absS + 1;
    coeffs[2] = ((${o} + 2) * oneMinusAbsS - (${o} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${o} * twoMinusAbsS - 5 * ${o}) * twoMinusAbsS + 8 * ${o}) * twoMinusAbsS - 4 * ${o};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${_}, 4>, coefs: array<${_}, 4>) -> ${_} {
    var coefsSum: ${_} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${_} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},Tl=(e,t,r,i,a)=>{let[s,o,u,d,p]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],f=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${f} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",o,`max(0, min(depth, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(height, ${r[u]} - 1))`)};
      ${e.indicesSet("input_indices",d,`max(0, min(width, ${r[d]} - 1))`)};
      ${oa(e,p,s,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${f} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${f} = originalIndices[${o}];
      var height:${f} = originalIndices[${u}];
      var width:${f} = originalIndices[${d}];
      ${i?`if (depth < 0 || depth > (${r[o]} - 1) || height < 0 || height > (${r[u]} - 1) || width < 0 || (width > ${r[d]} - 1)) {
      return ${a};
        }`:""};

    depth = max(0, min(depth, ${r[o]} - 1));
      height = max(0, min(height, ${r[u]} - 1));
      width = max(0, min(width, ${r[d]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${r.length>3?`u32(originalIndices[${p}])`:"0"};
      var batch: u32 =  ${r.length>3?`u32(originalIndices[${s}])`:"0"};

      var x111: ${f} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${f} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${f} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${f} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${f} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${f} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${f} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${f} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${f} = abs(depth - ${f}(depth1));
      var dx2: ${f} = abs(${f}(depth2) - depth);
      var dy1: ${f} = abs(height - ${f}(height1));
      var dy2: ${f} = abs(${f}(height2) - height);
      var dz1: ${f} = abs(width - ${f}(width1));
      var dz2: ${f} = abs(${f}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},kl=(e,t,r,i,a,s)=>{let o=e.dims,u=_l(s,t.axes,o.length),d=yl(o,i,a,t.axes),p=i.slice();i.length===0&&(p=o.map((w,k)=>w===0?1:d[k]/w),t.keepAspectRatioPolicy!=="stretch"&&(d=bl(o,p,t)));let f=K("output",e.dataType,d.length),m=N("input",e.dataType,o.length),g=A.size(d),_=o.length===d.length&&o.every((w,k)=>w===d[k]),b=t.coordinateTransformMode==="tf_crop_and_resize",$=t.extrapolationValue,T=m.type.value,v=w=>`
      ${_?"":`
      ${ml(t.coordinateTransformMode,T)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${vl(m,o)};
              ${gl(t.nearestMode,r,T)};
              ${$l(m,f,o,d,p.length,u.length,b)};
              `;case"linear":return`
              ${wl(f,o,d,p.length,u.length)};
              ${(()=>{if(o.length===2||o.length===4)return`${xl(m,f,o,b,$)}`;if(o.length===3||o.length===5)return`${Tl(m,f,o,b,$)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(o.length===2||o.length===4)return`${Cl(m,f,o,d,p,u,t.cubicCoeffA,b,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${w.registerUniform("output_size","u32").registerUniform("scales","f32",p.length).registerUniform("roi","f32",u.length).declareVariables(m,f)}
      ${w.mainStart()}
        ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${_?"output[global_idx] = input[global_idx];":`
        let output_indices = ${f.offsetToIndices("global_idx")};
        var input_indices: ${m.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${m.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${o.length===2||o.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${p.length>0?t.mode==="cubic"?p:p.length:""}|${a.length>0?a:""}|${u.length>0?u:""}|${_}|${t.mode==="nearest"?o.length:o}`,inputDependencies:["rank"]},getShaderSource:v,getRunData:()=>({outputs:[{dims:d,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:[{type:12,data:g},{type:1,data:p},{type:1,data:u},...Q(o,d)]})}},Sl=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},nf=(e,t)=>{let r=[],i=[],a=[],s=Sl(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");hl(e.inputs,t,s,r,i,a),e.compute(kl(e.inputs[0],t,s,r,i,a),{inputs:[0]})},sf=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,a=e.cubicCoeffA,s=e.excludeOutside!==0,o=e.extrapolationValue,u=e.keepAspectRatioPolicy,d=e.mode,p=e.nearestMode===""?"simple":e.nearestMode;return he({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:a,excludeOutside:s,extrapolationValue:o,keepAspectRatioPolicy:u,mode:d,nearestMode:p})}}),Il,El,of,og=q(()=>{te(),ne(),oe(),Il=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let a=t.dims[t.dims.length-1],s=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==a)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==s)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==a)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let o=e[3];if(o.dims.length!==1)throw new Error("Beta must be 1D");if(o.dims[o.dims.length-1]!==a)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let o=e[4];if(o.dims.length!==1)throw new Error("Bias must be 1D");if(o.dims[o.dims.length-1]!==a)throw new Error("Bias must have the same hidden size as input")}},El=(e,t,r,i)=>{let a=t.simplified,s=e[0].dims,o=A.size(s),u=s,d=o,p=s.slice(-1)[0],f=i?s.slice(0,-1).concat(1):[],m=!a&&e.length>3,g=e.length>4,_=i&&r>1,b=i&&r>2,$=r>3,T=64,v=ve(p),w=[{type:12,data:d},{type:12,data:v},{type:12,data:p},{type:1,data:t.epsilon}],k=S=>{let z=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],E=[N("x",e[0].dataType,e[0].dims,v),N("skip",e[1].dataType,e[1].dims,v),N("gamma",e[2].dataType,e[2].dims,v)];m&&E.push(N("beta",e[3].dataType,e[3].dims,v)),g&&E.push(N("bias",e[4].dataType,e[4].dims,v)),E.push(K("output",e[0].dataType,u,v)),_&&E.push(K("mean_output",1,f)),b&&E.push(K("inv_std_output",1,f)),$&&E.push(K("input_skip_bias_sum",e[0].dataType,u,v));let R=Se(e[0].dataType),U=Se(1,v);return`

      ${S.registerUniforms(z).declareVariables(...E)}
      var<workgroup> sum_shared : array<${U}, ${T}>;
      var<workgroup> sum_squared_shared : array<${U}, ${T}>;

      ${S.mainStart([T,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${T};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${T};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${T-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${g?"bias[offset1d + i]":R+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${$?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${Dt(R,v,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${T};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${ht("sum",v)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${ht("square_sum",v)} / f32(uniforms.hidden_size) ${a?"":"- mean * mean"} + uniforms.epsilon);
        ${_?"mean_output[global_idx] = mean;":""}
        ${b?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${a?"":`- ${R}(mean)`}) *
            ${R}(inv_std_dev) * gamma[offset1d + i]
            ${m?"+ beta[offset1d + i]":""};
        }
      }`},C=[{dims:u,dataType:e[0].dataType}];return r>1&&C.push({dims:f,dataType:1}),r>2&&C.push({dims:f,dataType:1}),r>3&&C.push({dims:s,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${v};${_};${b};${$}`,inputDependencies:e.map((S,z)=>"type")},getShaderSource:k,getRunData:()=>({outputs:C,dispatchGroup:{x:Math.ceil(d/p)},programUniforms:w})}},of=(e,t)=>{Il(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(El(e.inputs,t,e.outputCount,!1),{outputs:r})}}),zl,ii,Al,ua,Ol,Rl,uf,lf,ug=q(()=>{te(),ne(),xe(),oe(),zl=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},ii=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},Al=(e,t)=>{if(e.length>1){let r=ii(e,1),i=ii(e,2),a=ii(e,3);return a.length===0&&(a=[...Array(e[0].dims.length).keys()]),he({starts:r,ends:i,axes:a})}else return t},ua=(e,t,r,i,a)=>{let s=e;return e<0&&(s+=r[i[t]]),a[t]<0?Math.max(0,Math.min(s,r[i[t]]-1)):Math.max(0,Math.min(s,r[i[t]]))},Ol=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length-1}; i >= 0; i--) {
            let input_shape_i = ${Y("uniforms.input_shape","i",r.length)};
            let steps_i = ${Y("uniforms.steps","i",r.length)};
            let signs_i = ${Y("uniforms.signs","i",r.length)};
            let starts_i = ${Y("uniforms.starts","i",r.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,Rl=(e,t)=>{let r=e[0].dims,i=A.size(r),a=t.axes.length>0?A.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],s=ii(e,4);s.forEach(v=>v!==0||(()=>{throw new Error("step cannot be 0")})),s.length===0&&(s=Array(a.length).fill(1));let o=t.starts.map((v,w)=>ua(v,w,r,a,s)),u=t.ends.map((v,w)=>ua(v,w,r,a,s));if(a.length!==o.length||a.length!==u.length)throw new Error("start, ends and axes should have the same number of elements");if(a.length!==r.length)for(let v=0;v<r.length;++v)a.includes(v)||(o.splice(v,0,0),u.splice(v,0,r[v]),s.splice(v,0,1));let d=s.map(v=>Math.sign(v));s.forEach((v,w,k)=>{if(v<0){let C=(u[w]-o[w])/v,S=o[w],z=S+C*s[w];o[w]=z,u[w]=S,k[w]=-v}});let p=r.slice(0);a.forEach((v,w)=>{p[v]=Math.ceil((u[v]-o[v])/s[v])});let f={dims:p,dataType:e[0].dataType},m=K("output",e[0].dataType,p.length),g=N("input",e[0].dataType,e[0].dims.length),_=A.size(p),b=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:o.length},{name:"signs",type:"i32",length:d.length},{name:"steps",type:"u32",length:s.length}],$=[{type:12,data:_},{type:12,data:o},{type:6,data:d},{type:12,data:s},...Q(e[0].dims,p)],T=v=>`
      ${v.registerUniforms(b).declareVariables(g,m)}
        ${Ol(g,m,r)}
        ${v.mainStart()}
          ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${m.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${m.setByOffset("global_idx",g.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${d.length}_${o.length}_${s.length}`,inputDependencies:["rank"]},getShaderSource:T,getRunData:()=>({outputs:[f],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:$})}},uf=(e,t)=>{zl(e.inputs,t);let r=Al(e.inputs,t);e.compute(Rl(e.inputs,r),{inputs:[0]})},lf=e=>{let t=e.starts,r=e.ends,i=e.axes;return he({starts:t,ends:r,axes:i})}}),Bl,Nl,df,pf,lg=q(()=>{te(),ne(),xe(),mt(),oe(),Bl=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},Nl=(e,t)=>{let r=e.inputs[0],i=r.dims,a=A.size(i),s=i.length,o=A.normalizeAxis(t.axis,s),u=o<i.length-1,d,p=[];u?(p=Array.from({length:s},(E,R)=>R),p[o]=s-1,p[s-1]=o,d=e.compute(De(r,p),{inputs:[r],outputs:[-1]})[0]):d=r;let f=d.dims,m=f[s-1],g=a/m,_=ve(m),b=m/_,$=64;g===1&&($=256);let T=(E,R)=>R===4?`max(max(${E}.x, ${E}.y), max(${E}.z, ${E}.w))`:R===2?`max(${E}.x, ${E}.y)`:R===3?`max(max(${E}.x, ${E}.y), ${E}.z)`:E,v=N("x",d.dataType,d.dims,_),w=K("result",d.dataType,d.dims,_),k=v.type.value,C=Se(d.dataType)==="f32"?`var threadMax = ${k}(-3.402823e+38f);`:`var threadMax = ${k}(-65504.0h);`,S=E=>`
      var<workgroup> rowMaxShared : ${k};
      var<workgroup> rowSumShared : ${k};
      var<workgroup> threadShared : array<${k}, ${$}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${k} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${k}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${E.registerUniform("packedCols","i32").declareVariables(v,w)}
      ${E.mainStart($)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${$};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${C}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${k}(${T("threadShared[0]",_)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${k}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${k}(${ht("threadShared[0]",_)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${k}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,z=e.compute({name:"Softmax",shaderCache:{hint:`${_};${$}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:f,dataType:d.dataType}],dispatchGroup:{x:g},programUniforms:[{type:6,data:b}]}),getShaderSource:S},{inputs:[d],outputs:[u?-1:0]})[0];u&&e.compute(De(z,p),{inputs:[z]})},df=(e,t)=>{Bl(e.inputs),Nl(e,t)},pf=e=>he({axis:e.axis})}),la,Dl,Ml,Pl,cf,dg=q(()=>{te(),ne(),oe(),la=e=>Array.from(e.getBigInt64Array(),Number),Dl=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(la(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},Ml=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},Pl=(e,t)=>{let r=e[0].dims,i=t??la(e[1]),a=Ml(r,i),s=A.size(a),o=e[0].dataType,u=N("input",o,r.length),d=K("output",o,a.length),p=f=>`
      const inputShape = ${u.indices(...r)};
      ${f.registerUniform("output_size","u32").declareVariables(u,d)}
      ${f.mainStart()}
      ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${d.offsetToIndices("global_idx")};
      var input_indices: ${u.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${u.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${d.indicesGet("output_indices","i")}  % input_dim_i;

        ${u.indicesSet("input_indices","i","input_dim_value")}
      }
      ${d.setByOffset("global_idx",u.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:[{type:12,data:s},...Q(e[0].dims,a)]}),getShaderSource:p}},cf=e=>{Dl(e.inputs),e.compute(Pl(e.inputs),{inputs:[0]})}}),Ul,ql,ff,pg=q(()=>{te(),ne(),oe(),Ul=(e,t,r,i,a)=>{let s=K("output_data",a,r.length,4),o=N("a_data",t[1].dataType,t[1].dims.length,4),u=N("b_data",t[2].dataType,t[2].dims.length,4),d=N("c_data",t[0].dataType,t[0].dims.length,4),p,f=(m,g,_)=>`select(${g}, ${m}, ${_})`;if(!i)p=s.setByOffset("global_idx",f(o.getByOffset("global_idx"),u.getByOffset("global_idx"),d.getByOffset("global_idx")));else{let m=(g,_,b="")=>{let $=`a_data[index_a${_}][component_a${_}]`,T=`b_data[index_b${_}][component_b${_}]`,v=`bool(c_data[index_c${_}] & (0xffu << (component_c${_} * 8)))`;return`
            let output_indices${_} = ${s.offsetToIndices(`global_idx * 4u + ${_}u`)};
            let offset_a${_} = ${o.broadcastedIndicesToOffset(`output_indices${_}`,s)};
            let offset_b${_} = ${u.broadcastedIndicesToOffset(`output_indices${_}`,s)};
            let offset_c${_} = ${d.broadcastedIndicesToOffset(`output_indices${_}`,s)};
            let index_a${_} = offset_a${_} / 4u;
            let index_b${_} = offset_b${_} / 4u;
            let index_c${_} = offset_c${_} / 4u;
            let component_a${_} = offset_a${_} % 4u;
            let component_b${_} = offset_b${_} % 4u;
            let component_c${_} = offset_c${_} % 4u;
            ${g}[${_}] = ${b}(${f($,T,v)});
          `};a===9?p=`
            var data = vec4<u32>(0);
            ${m("data",0,"u32")}
            ${m("data",1,"u32")}
            ${m("data",2,"u32")}
            ${m("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:p=`
            ${m("output_data[global_idx]",0)}
            ${m("output_data[global_idx]",1)}
            ${m("output_data[global_idx]",2)}
            ${m("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(d,o,u,s)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${p}
      }`},ql=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,a=e[1].dataType,s=!(A.areEqual(t,r)&&A.areEqual(r,i)),o=t,u=A.size(t);if(s){let p=Pt.calcShape(Pt.calcShape(t,r,!1),i,!1);if(!p)throw new Error("Can't perform where op on the given tensors");o=p,u=A.size(o)}let d=Math.ceil(u/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:p=>Ul(p,e,o,s,a),getRunData:()=>({outputs:[{dims:o,dataType:a}],dispatchGroup:{x:Math.ceil(u/64/4)},programUniforms:[{type:12,data:d},...Q(i,t,r,o)]})}},ff=e=>{e.compute(ql(e.inputs))}}),hf,cg=q(()=>{km(),ja(),Sm(),Im(),Em(),zm(),Am(),Dm(),Pm(),Um(),qm(),Wm(),Lm(),Vm(),jm(),Gm(),Hm(),Fm(),Km(),Zm(),Ym(),Xm(),Qm(),Jm(),eg(),Oc(),tg(),ig(),rg(),ag(),ng(),Va(),sg(),Mc(),og(),ug(),lg(),Nc(),dg(),mt(),Ga(),pg(),hf=new Map([["Abs",[sp]],["Acos",[op]],["Acosh",[up]],["Add",[Lp]],["ArgMax",[ip,wa]],["ArgMin",[tp,wa]],["Asin",[lp]],["Asinh",[dp]],["Atan",[pp]],["Atanh",[cp]],["Attention",[rp]],["AveragePool",[Hc,Gc]],["BatchNormalization",[ap]],["BiasAdd",[np]],["BiasSplitGelu",[Wp]],["Cast",[hp,fp]],["Ceil",[gp]],["Clip",[mp]],["Concat",[Qp,Jp]],["Conv",[ka,Ta]],["ConvTranspose",[lc,uc]],["Cos",[_p]],["Cosh",[yp]],["CumSum",[dc,pc]],["DepthToSpace",[cc,fc]],["DequantizeLinear",[Jc,ef]],["Div",[Vp]],["Einsum",[hc,mc]],["Elu",[bp,oi]],["Equal",[jp]],["Erf",[wp]],["Exp",[$p]],["Expand",[gc]],["FastGelu",[_c]],["Floor",[vp]],["FusedConv",[ka,Ta]],["Gather",[bc,yc]],["GatherElements",[Tc,Cc]],["GatherBlockQuantized",[vc,xc]],["GatherND",[wc,$c]],["Gelu",[xp]],["Gemm",[Sc,kc]],["GlobalAveragePool",[Kc,Fc]],["GlobalMaxPool",[Qc,Xc]],["Greater",[Kp]],["GreaterOrEqual",[Yp]],["GridSample",[Ic,Ec]],["GroupQueryAttention",[Pc]],["HardSigmoid",[Ap,zp]],["InstanceNormalization",[Uc]],["LayerNormalization",[qc]],["LeakyRelu",[Cp,oi]],["Less",[Zp]],["LessOrEqual",[Xp]],["Log",[Up]],["MatMul",[Wc]],["MatMulNBits",[Lc,Vc]],["MaxPool",[Zc,Yc]],["Mul",[Gp]],["MultiHeadAttention",[Ac,zc]],["Neg",[kp]],["Not",[Tp]],["Pad",[jc]],["Pow",[Hp]],["QuickGelu",[qp,oi]],["Range",[tf]],["Reciprocal",[Sp]],["ReduceMin",[Yd]],["ReduceMean",[Gd]],["ReduceMax",[Zd]],["ReduceSum",[Qd]],["ReduceProd",[Xd]],["ReduceL1",[Hd]],["ReduceL2",[Fd]],["ReduceLogSum",[ep]],["ReduceLogSumExp",[Kd]],["ReduceSumSquare",[Jd]],["Relu",[Ip]],["Resize",[nf,sf]],["RotaryEmbedding",[Dc]],["ScatterND",[af,rf]],["Sigmoid",[Ep]],["Sin",[Op]],["Sinh",[Rp]],["Slice",[uf,lf]],["SkipLayerNormalization",[of]],["Split",[Rc,Bc]],["Sqrt",[Bp]],["Softmax",[df,pf]],["Sub",[Fp]],["Tan",[Np]],["Tanh",[Dp]],["ThresholdedRelu",[Pp,oi]],["Tile",[cf]],["Transpose",[Rd,Bd]],["Where",[ff]]])}),mf,fg=q(()=>{Ue(),nt(),oe(),mf=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,a){Qe(e.programInfo.name);let s=this.backend.device,o=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let u=[];for(let p of t)u.push({binding:u.length,resource:{buffer:p.buffer}});for(let p of r)u.push({binding:u.length,resource:{buffer:p.buffer}});a&&u.push({binding:u.length,resource:a});let d=s.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:u,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let p={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:d,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(p)}o.setPipeline(e.computePipeline),o.setBindGroup(0,d),o.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),He(e.programInfo.name)}dispose(){}build(e,t){Qe(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(p=>{r.features.has(p.feature)&&i.push(`enable ${p.extension};`)});let a=Od(t,this.backend.device.limits),s=e.getShaderSource(a),o=`${i.join(`
`)}
${a.additionalImplementations}
${s}`,u=r.createShaderModule({code:o,label:e.name});de("verbose",()=>`[WebGPU] ${e.name} shader code: ${o}`);let d=r.createComputePipeline({compute:{module:u,entryPoint:"main"},layout:"auto",label:e.name});return He(e.name),{programInfo:e,computePipeline:d,uniformVariablesInfo:a.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,a=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=a&&r<=a&&i<=a)return[t,r,i];let s=t*r*i,o=Math.ceil(Math.sqrt(s));if(o>a){if(o=Math.ceil(Math.cbrt(s)),o>a)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[o,o,o]}else return[o,o,1]}}}),gf={};qt(gf,{WebGpuBackend:()=>_f});var Wl,Ll,Vl,_f,hg=q(()=>{Ue(),te(),nt(),Sd(),Cm(),cg(),fg(),Wl=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let a=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${a}`);break}case"rank":{let s=e[i].dims.length;r.push(`${a};${s}`);break}case"dims":{let s=e[i].dims.join(",");r.push(`${a};${s}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},Ll=(e,t,r)=>{let i=e.name;return e.shaderCache?.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${Wl(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,i},Vl=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},_f=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},a=s=>t.features.has(s)&&r.push(s)&&!0;a("chromium-experimental-timestamp-query-inside-passes")||a("timestamp-query"),a("shader-f16"),a("subgroups"),this.device=await t.requestDevice(i),this.adapterInfo=new Vl(t.info||await t.requestAdapterInfo()),this.gpuDataManager=zd(this),this.programManager=new mf(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,Ua(e.logLevel,!!e.debug),this.device.onuncapturederror=s=>{s.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${s.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;Qe(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let i=0;i<t.length/2;i++){let a=r[i],s=a.kernelId,o=this.kernels.get(s),u=o.kernelType,d=o.kernelName,p=a.programName,f=a.inputTensorViews,m=a.outputTensorViews,g=t[i*2],_=t[i*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=g);let b=Number(g-this.queryTimeBase),$=Number(_-this.queryTimeBase);if(!Number.isSafeInteger(b)||!Number.isSafeInteger($))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:f.map(T=>({dims:T.dims,dataType:at(T.dataType)})),outputsMetadata:m.map(T=>({dims:T.dims,dataType:at(T.dataType)})),kernelId:s,kernelType:u,kernelName:d,programName:p,startTime:b,endTime:$});else{let T="";f.forEach((w,k)=>{T+=`input[${k}]: [${w.dims}] | ${at(w.dataType)}, `});let v="";m.forEach((w,k)=>{v+=`output[${k}]: [${w.dims}] | ${at(w.dataType)}, `}),console.log(`[profiling] kernel "${s}|${u}|${d}|${p}" ${T}${v}start time: ${b} ns, execution time: ${$-b} ns`)}Pi("GPU",`${p}::${g}::${_}`)}e.unmap(),this.pendingQueries.delete(e)}),He()}run(e,t,r,i,a,s){Qe(e.name);let o=[];for(let w=0;w<t.length;++w){let k=t[w].data;if(k===0)continue;let C=this.gpuDataManager.get(k);if(!C)throw new Error(`no GPU data for input: ${k}`);o.push(C)}let{outputs:u,dispatchGroup:d,programUniforms:p}=e.getRunData(t),f=r.length===0?u.map((w,k)=>k):r;if(f.length!==u.length)throw new Error(`Output size ${f.length} must be equal to ${u.length}.`);let m=[],g=[];for(let w=0;w<u.length;++w){if(!Number.isInteger(f[w])||f[w]<-3||f[w]>=s)throw new Error(`Invalid output index: ${f[w]}`);if(f[w]===-3)continue;let k=f[w]===-1,C=f[w]===-2,S=k||C?a(u[w].dataType,u[w].dims):i(f[w],u[w].dataType,u[w].dims);if(m.push(S),S.data===0)continue;let z=this.gpuDataManager.get(S.data);if(!z)throw new Error(`no GPU data for output: ${S.data}`);if(k&&this.temporaryData.push(z),C){let E=this.kernelPersistentData.get(this.currentKernelId);E||(E=[],this.kernelPersistentData.set(this.currentKernelId,E)),E.push(z)}g.push(z)}if(o.length!==t.length||g.length!==m.length){if(g.length===0)return He(e.name),m;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let _;if(p){let w=0,k=[];p.forEach(E=>{let R=typeof E.data=="number"?[E.data]:E.data;if(R.length===0)return;let U=E.type===10?2:4,V,Z;E.type===10?(Z=R.length>4?16:R.length>2?8:R.length*U,V=R.length>4?16:U*R.length):(Z=R.length<=2?R.length*U:16,V=16),w=Math.ceil(w/Z)*Z,k.push(w);let X=E.type===10?8:4;w+=R.length>4?Math.ceil(R.length/X)*V:R.length*U});let C=16;w=Math.ceil(w/C)*C;let S=new ArrayBuffer(w);p.forEach((E,R)=>{let U=k[R],V=typeof E.data=="number"?[E.data]:E.data;if(E.type===6)new Int32Array(S,U,V.length).set(V);else if(E.type===12)new Uint32Array(S,U,V.length).set(V);else if(E.type===10)new Uint16Array(S,U,V.length).set(V);else if(E.type===1)new Float32Array(S,U,V.length).set(V);else throw new Error(`Unsupported uniform type: ${at(E.type)}`)});let z=this.gpuDataManager.create(w,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(z.buffer,0,S,0,w),this.gpuDataManager.release(z.id),_={offset:0,size:w,buffer:z.buffer}}let b=this.programManager.normalizeDispatchGroupSize(d),$=b[1]===1&&b[2]===1,T=Ll(e,t,$),v=this.programManager.getArtifact(T);if(v||(v=this.programManager.build(e,b),this.programManager.setArtifact(T,v),de("info",()=>`[artifact] key: ${T}, programName: ${e.name}`)),p&&v.uniformVariablesInfo){if(p.length!==v.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${v.uniformVariablesInfo.length}, got ${p.length} in program "${v.programInfo.name}".`);for(let w=0;w<p.length;w++){let k=p[w],C=k.type,S=typeof k.data=="number"?1:k.data.length,[z,E]=v.uniformVariablesInfo[w];if(C!==z||S!==E)throw new Error(`Uniform variable ${w} mismatch: expect type ${z} with size ${E}, got type ${C} with size ${S} in program "${v.programInfo.name}".`)}}if(de("info",()=>`[ProgramManager] run "${e.name}" (key=${T}) with ${b[0]}x${b[1]}x${b[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let w={kernelId:this.currentKernelId,programName:v.programInfo.name,inputTensorViews:t,outputTensorViews:m};this.pendingKernels.push(w),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(w)}return this.programManager.run(v,o,g,b,_),He(e.name),m}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let a=hf.get(e);if(!a)throw new Error(`kernel not implemented: ${e}`);let s={kernelType:e,kernelName:i,kernelEntry:a[0],attributes:[a[1],r]};this.kernels.set(t,s)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let a=i.kernelType,s=i.kernelName,o=i.kernelEntry,u=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${a}] ${s}" is not allowed to be called recursively`);this.currentKernelId=e,u[0]&&(u[1]=u[0](u[1]),u[0]=void 0),de("info",()=>`[WebGPU] Start to run kernel "[${a}] ${s}"...`);let d=this.env.debug;this.temporaryData=[];try{return d&&this.device.pushErrorScope("validation"),o(t,u[1]),0}catch(p){return r.push(Promise.resolve(`[WebGPU] Kernel "[${a}] ${s}" failed. ${p}`)),1}finally{d&&r.push(this.device.popErrorScope().then(p=>p?`GPU validation error for kernel "[${a}] ${s}": ${p.message}`:null));for(let p of this.temporaryData)this.gpuDataManager.release(p.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let a=this.sessionExternalDataMapping.get(e);a||(a=new Map,this.sessionExternalDataMapping.set(e,a));let s=a.get(t),o=this.gpuDataManager.registerExternalBuffer(r,i,s);return a.set(t,[o,r]),o}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await _a(this,e,t);return qa(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){de("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){de("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){de("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let a=this.getComputePassEncoder(),s=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),a.setPipeline(s.computePipeline),a.setBindGroup(0,s.bindGroup),a.dispatchWorkgroups(...s.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),yf={};qt(yf,{init:()=>bf});var Ri,jl,bf,mg=q(()=>{te(),nt(),ne(),xm(),Ri=class wf{constructor(t,r,i,a){this.module=t,this.dataType=r,this.data=i,this.dims=a}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=A.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=A.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=A.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=A.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(A.size(t)!==A.size(this.dims))throw new Error("Invalid new shape");return new wf(this.module,this.dataType,this.data,t)}},jl=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,a=r/e.PTR_SIZE,s=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*a++,s));let o=Number(e.getValue(i*a++,s));this.outputCount=Number(e.getValue(i*a++,s)),this.customDataOffset=Number(e.getValue(i*a++,"*")),this.customDataSize=Number(e.getValue(i*a++,s));let u=[];for(let d=0;d<o;d++){let p=Number(e.getValue(i*a++,s)),f=Number(e.getValue(i*a++,"*")),m=Number(e.getValue(i*a++,s)),g=[];for(let _=0;_<m;_++)g.push(Number(e.getValue(i*a++,s)));u.push(new Ri(e,p,f,g))}this.inputs=u}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(o=>typeof o=="number"?this.inputs[o]:o)??this.inputs,i=t?.outputs??[],a=(o,u,d)=>new Ri(this.module,u,this.output(o,d),d),s=(o,u)=>{let d=Tt(o,u);if(!d)throw new Error(`Unsupported data type: ${o}`);let p=d>0?this.backend.gpuDataManager.create(d).id:0;return new Ri(this.module,o,p,u)};return this.backend.run(e,r,i,a,s,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,a=i===4?"i32":"i64",s=this.module.stackAlloc((1+t.length)*i);this.module.setValue(s,t.length,a);for(let o=0;o<t.length;o++)this.module.setValue(s+i*(o+1),t[o],a);return this.module._JsepOutput(this.opKernelContext,e,s)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},bf=async(e,t,r,i)=>{let a=t.jsepInit;if(!a)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let s=(hg(),di(gf)).WebGpuBackend,o=new s;await o.initialize(r,i),a("webgpu",[o,u=>o.alloc(Number(u)),u=>o.free(u),(u,d,p,f=!1)=>{if(f)de("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(u)}, dst=${Number(d)}, size=${Number(p)}`),o.memcpy(Number(u),Number(d));else{de("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(u)}, gpuDataId=${Number(d)}, size=${Number(p)}`);let m=t.HEAPU8.subarray(Number(u>>>0),Number(u>>>0)+Number(p));o.upload(Number(d),m)}},async(u,d,p)=>{de("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${u}, dataOffset=${d}, size=${p}`),await o.download(Number(u),()=>t.HEAPU8.subarray(Number(d)>>>0,Number(d+p)>>>0))},(u,d,p)=>o.createKernel(u,Number(d),p,t.UTF8ToString(t._JsepGetNodeName(Number(d)))),u=>o.releaseKernel(u),(u,d,p,f)=>{de("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${p}, kernel=${u}, contextDataOffset=${d}`);let m=new jl(t,o,Number(d));return o.computeKernel(Number(u),m,f)},()=>o.captureBegin(),()=>o.captureEnd(),()=>o.replay()])}else{let s=new Ed(r);a("webnn",[s,()=>s.reserveTensorId(),o=>s.releaseTensorId(o),async(o,u,d,p,f)=>s.ensureTensor(o,u,d,p,f),(o,u)=>{s.uploadTensor(o,u)},async(o,u)=>s.downloadTensor(o,u),(o,u)=>s.registerMLContext(o,u),!!r.trace])}}}),Gl,Xa,Qa,ct,Hl,da,Gi,Ja,en,pa,tn,rn,an,$f=q(()=>{Ue(),wm(),$m(),te(),At(),Na(),xd(),Gl=(e,t)=>{ye()._OrtInit(e,t)!==0&&me("Can't initialize onnxruntime.")},Xa=async e=>{Gl(e.wasm.numThreads,qi(e.logLevel))},Qa=async(e,t)=>{ye().asyncInit?.();let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let i=e.webgpu.powerPreference;if(i!==void 0&&i!=="low-power"&&i!=="high-performance")throw new Error(`Invalid powerPreference setting: "${i}"`);let a=e.webgpu.forceFallbackAdapter;if(a!==void 0&&typeof a!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${a}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:i,forceFallbackAdapter:a}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let i=(mg(),di(yf)).init;t==="webgpu"&&await i("webgpu",ye(),e,r),t==="webnn"&&await i("webnn",ye(),e)}},ct=new Map,Hl=e=>{let t=ye(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,a,a+i)!==0&&me("Can't get session input/output count.");let s=i===4?"i32":"i64";return[Number(t.getValue(a,s)),Number(t.getValue(a+i,s))]}finally{t.stackRestore(r)}},da=(e,t)=>{let r=ye(),i=r.stackSave(),a=0;try{let s=r.PTR_SIZE,o=r.stackAlloc(2*s);r._OrtGetInputOutputMetadata(e,t,o,o+s)!==0&&me("Can't get session input/output metadata.");let u=Number(r.getValue(o,"*"));a=Number(r.getValue(o+s,"*"));let d=r.HEAP32[a/4];if(d===0)return[u,0];let p=r.HEAPU32[a/4+1],f=[];for(let m=0;m<p;m++){let g=Number(r.getValue(a+8+m*s,"*"));f.push(g!==0?r.UTF8ToString(g):Number(r.getValue(a+8+(m+p)*s,"*")))}return[u,d,f]}finally{r.stackRestore(i),a!==0&&r._OrtFree(a)}},Gi=e=>{let t=ye(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},Ja=async(e,t)=>{let r,i,a=ye();Array.isArray(e)?[r,i]=e:e.buffer===a.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=Gi(e);let s=0,o=0,u=0,d=[],p=[],f=[];try{if([o,d]=await vd(t),t?.externalData&&a.mountExternalData){let C=[];for(let S of t.externalData){let z=typeof S=="string"?S:S.path;C.push(Pa(typeof S=="string"?S:S.data).then(E=>{a.mountExternalData(z,E)}))}await Promise.all(C)}for(let C of t?.executionProviders??[])if((typeof C=="string"?C:C.name)==="webnn"){if(a.shouldTransferToMLTensor=!1,typeof C!="string"){let S=C,z=S?.context,E=S?.gpuDevice,R=S?.deviceType,U=S?.powerPreference;z?a.currentContext=z:E?a.currentContext=await a.webnnCreateMLContext(E):a.currentContext=await a.webnnCreateMLContext({deviceType:R,powerPreference:U})}else a.currentContext=await a.webnnCreateMLContext();break}s=await a._OrtCreateSession(r,i,o),a.webgpuOnCreateSession?.(s),s===0&&me("Can't create a session."),a.jsepOnCreateSession?.(),a.currentContext&&(a.webnnRegisterMLContext(s,a.currentContext),a.currentContext=void 0,a.shouldTransferToMLTensor=!0);let[m,g]=Hl(s),_=!!t?.enableGraphCapture,b=[],$=[],T=[],v=[],w=[];for(let C=0;C<m;C++){let[S,z,E]=da(s,C);S===0&&me("Can't get an input name."),p.push(S);let R=a.UTF8ToString(S);b.push(R),T.push(z===0?{name:R,isTensor:!1}:{name:R,isTensor:!0,type:at(z),shape:E})}for(let C=0;C<g;C++){let[S,z,E]=da(s,C+m);S===0&&me("Can't get an output name."),f.push(S);let R=a.UTF8ToString(S);$.push(R),v.push(z===0?{name:R,isTensor:!1}:{name:R,isTensor:!0,type:at(z),shape:E});{if(_&&t?.preferredOutputLocation===void 0){w.push("gpu-buffer");continue}let U=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[R]??"cpu",V=a.webnnIsGraphOutput;if(U==="cpu"&&V&&V(s,R)){w.push("ml-tensor-cpu-output");continue}if(U!=="cpu"&&U!=="cpu-pinned"&&U!=="gpu-buffer"&&U!=="ml-tensor")throw new Error(`Not supported preferred output location: ${U}.`);if(_&&U!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${U}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);w.push(U)}}let k=null;return w.some(C=>C==="gpu-buffer"||C==="ml-tensor"||C==="ml-tensor-cpu-output")&&(u=a._OrtCreateBinding(s),u===0&&me("Can't create IO binding."),k={handle:u,outputPreferredLocations:w,outputPreferredLocationsEncoded:w.map(C=>C==="ml-tensor-cpu-output"?"ml-tensor":C).map(C=>ma(C))}),ct.set(s,[s,p,f,k,_,!1]),[s,b,$,T,v]}catch(m){throw p.forEach(g=>a._OrtFree(g)),f.forEach(g=>a._OrtFree(g)),u!==0&&a._OrtReleaseBinding(u)!==0&&me("Can't release IO binding."),s!==0&&a._OrtReleaseSession(s)!==0&&me("Can't release session."),m}finally{a._free(r),o!==0&&a._OrtReleaseSessionOptions(o)!==0&&me("Can't release session options."),d.forEach(m=>a._free(m)),a.unmountExternalData?.()}},en=e=>{let t=ye(),r=ct.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,a,s,o,u]=r;o&&(u&&t._OrtClearBoundOutputs(o.handle)!==0&&me("Can't clear bound outputs."),t._OrtReleaseBinding(o.handle)!==0&&me("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),a.forEach(d=>t._OrtFree(d)),s.forEach(d=>t._OrtFree(d)),t._OrtReleaseSession(i)!==0&&me("Can't release session."),ct.delete(e)},pa=async(e,t,r,i,a,s,o=!1)=>{if(!e){t.push(0);return}let u=ye(),d=u.PTR_SIZE,p=e[0],f=e[1],m=e[3],g=m,_,b;if(p==="string"&&(m==="gpu-buffer"||m==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(o&&m!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${s} when enableGraphCapture is true.`);if(m==="gpu-buffer"){let v=e[2].gpuBuffer;b=Tt(Ct(p),f);{let w=u.jsepRegisterBuffer;if(!w)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');_=w(i,s,v,b)}}else if(m==="ml-tensor"){let v=e[2].mlTensor;b=Tt(Ct(p),f);let w=u.webnnRegisterMLTensor;if(!w)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');_=w(i,v,Ct(p),f)}else{let v=e[2];if(Array.isArray(v)){b=d*v.length,_=u._malloc(b),r.push(_);for(let w=0;w<v.length;w++){if(typeof v[w]!="string")throw new TypeError(`tensor data at index ${w} is not a string`);u.setValue(_+w*d,Ge(v[w],r),"*")}}else{let w=u.webnnIsGraphInput,k=u.webnnIsGraphOutput;if(p!=="string"&&w&&k){let C=u.UTF8ToString(a);if(w(i,C)||k(i,C)){let S=Ct(p);b=Tt(S,f),g="ml-tensor";let z=u.webnnCreateTemporaryTensor,E=u.webnnUploadTensor;if(!z||!E)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let R=await z(i,S,f);E(R,new Uint8Array(v.buffer,v.byteOffset,v.byteLength)),_=R}else b=v.byteLength,_=u._malloc(b),r.push(_),u.HEAPU8.set(new Uint8Array(v.buffer,v.byteOffset,b),_)}else b=v.byteLength,_=u._malloc(b),r.push(_),u.HEAPU8.set(new Uint8Array(v.buffer,v.byteOffset,b),_)}}let $=u.stackSave(),T=u.stackAlloc(4*f.length);try{f.forEach((w,k)=>u.setValue(T+k*d,w,d===4?"i32":"i64"));let v=u._OrtCreateTensor(Ct(p),_,b,T,f.length,ma(g));v===0&&me(`Can't create tensor for input/output. session=${i}, index=${s}.`),t.push(v)}finally{u.stackRestore($)}},tn=async(e,t,r,i,a,s)=>{let o=ye(),u=o.PTR_SIZE,d=ct.get(e);if(!d)throw new Error(`cannot run inference. invalid session id: ${e}`);let p=d[0],f=d[1],m=d[2],g=d[3],_=d[4],b=d[5],$=t.length,T=i.length,v=0,w=[],k=[],C=[],S=[],z=o.stackSave(),E=o.stackAlloc($*u),R=o.stackAlloc($*u),U=o.stackAlloc(T*u),V=o.stackAlloc(T*u);try{[v,w]=$d(s),kt("wasm prepareInputOutputTensor");for(let j=0;j<$;j++)await pa(r[j],k,S,e,f[t[j]],t[j],_);for(let j=0;j<T;j++)await pa(a[j],C,S,e,m[i[j]],$+i[j],_);St("wasm prepareInputOutputTensor");for(let j=0;j<$;j++)o.setValue(E+j*u,k[j],"*"),o.setValue(R+j*u,f[t[j]],"*");for(let j=0;j<T;j++)o.setValue(U+j*u,C[j],"*"),o.setValue(V+j*u,m[i[j]],"*");if(g&&!b){let{handle:j,outputPreferredLocations:se,outputPreferredLocationsEncoded:J}=g;if(f.length!==$)throw new Error(`input count from feeds (${$}) is expected to be always equal to model's input count (${f.length}).`);kt("wasm bindInputsOutputs");for(let H=0;H<$;H++){let ae=t[H];await o._OrtBindInput(j,f[ae],k[H])!==0&&me(`Can't bind input[${H}] for session=${e}.`)}for(let H=0;H<T;H++){let ae=i[H];a[H]?.[3]?o._OrtBindOutput(j,m[ae],C[H],0)!==0&&me(`Can't bind pre-allocated output[${H}] for session=${e}.`):o._OrtBindOutput(j,m[ae],0,J[ae])!==0&&me(`Can't bind output[${H}] to ${se[H]} for session=${e}.`)}St("wasm bindInputsOutputs"),ct.set(e,[p,f,m,g,_,!0])}o.jsepOnRunStart?.(p),o.webnnOnRunStart?.(p);let Z;g?Z=await o._OrtRunWithBinding(p,g.handle,T,U,v):Z=await o._OrtRun(p,R,E,$,V,T,U,v),Z!==0&&me("failed to call OrtRun().");let X=[],re=[];kt("wasm ProcessOutputTensor");for(let j=0;j<T;j++){let se=Number(o.getValue(U+j*u,"*"));if(se===C[j]){X.push(a[j]);continue}let J=o.stackSave(),H=o.stackAlloc(4*u),ae=!1,G,ge=0;try{o._OrtGetTensorData(se,H,H+u,H+2*u,H+3*u)!==0&&me(`Can't access output tensor data on index ${j}.`);let P=u===4?"i32":"i64",L=Number(o.getValue(H,P));ge=o.getValue(H+u,"*");let ie=o.getValue(H+u*2,"*"),pe=Number(o.getValue(H+u*3,P)),D=[];for(let be=0;be<pe;be++)D.push(Number(o.getValue(ie+be*u,P)));o._OrtFree(ie)!==0&&me("Can't free memory for tensor dims.");let le=D.reduce((be,we)=>be*we,1);G=at(L);let Fe=g?.outputPreferredLocations[i[j]];if(G==="string"){if(Fe==="gpu-buffer"||Fe==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let be=[];for(let we=0;we<le;we++){let Ce=o.getValue(ge+we*u,"*"),ci=o.getValue(ge+(we+1)*u,"*"),Wt=we===le-1?void 0:ci-Ce;be.push(o.UTF8ToString(Ce,Wt))}X.push([G,D,be,"cpu"])}else if(Fe==="gpu-buffer"&&le>0){let be=o.jsepGetBuffer;if(!be)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let we=be(ge),Ce=Tt(L,le);if(Ce===void 0||!Da(G))throw new Error(`Unsupported data type: ${G}`);ae=!0,X.push([G,D,{gpuBuffer:we,download:o.jsepCreateDownloader(we,Ce,G),dispose:()=>{o._OrtReleaseTensor(se)!==0&&me("Can't release tensor.")}},"gpu-buffer"])}else if(Fe==="ml-tensor"&&le>0){let be=o.webnnEnsureTensor,we=o.webnnIsGraphInputOutputTypeSupported;if(!be||!we)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Tt(L,le)===void 0||!Ma(G))throw new Error(`Unsupported data type: ${G}`);if(!we(e,G,!1))throw new Error(`preferredLocation "ml-tensor" for ${G} output is not supported by current WebNN Context.`);let Ce=await be(e,ge,L,D,!1);ae=!0,X.push([G,D,{mlTensor:Ce,download:o.webnnCreateMLTensorDownloader(ge,G),dispose:()=>{o.webnnReleaseTensorId(ge),o._OrtReleaseTensor(se)}},"ml-tensor"])}else if(Fe==="ml-tensor-cpu-output"&&le>0){let be=o.webnnCreateMLTensorDownloader(ge,G)(),we=X.length;ae=!0,re.push((async()=>{let Ce=[we,await be];return o.webnnReleaseTensorId(ge),o._OrtReleaseTensor(se),Ce})()),X.push([G,D,[],"cpu"])}else{let be=Hi(G),we=new be(le);new Uint8Array(we.buffer,we.byteOffset,we.byteLength).set(o.HEAPU8.subarray(ge,ge+we.byteLength)),X.push([G,D,we,"cpu"])}}finally{o.stackRestore(J),G==="string"&&ge&&o._free(ge),ae||o._OrtReleaseTensor(se)}}g&&!_&&(o._OrtClearBoundOutputs(g.handle)!==0&&me("Can't clear bound outputs."),ct.set(e,[p,f,m,g,_,!1]));for(let[j,se]of await Promise.all(re))X[j][2]=se;return St("wasm ProcessOutputTensor"),X}finally{o.webnnOnRunEnd?.(p),o.stackRestore(z),k.forEach(Z=>o._OrtReleaseTensor(Z)),C.forEach(Z=>o._OrtReleaseTensor(Z)),S.forEach(Z=>o._free(Z)),v!==0&&o._OrtReleaseRunOptions(v),w.forEach(Z=>o._free(Z))}},rn=e=>{let t=ye(),r=ct.get(e);if(!r)throw new Error("invalid session id");let i=r[0],a=t._OrtEndProfiling(i);a===0&&me("Can't get an profile file name."),t._OrtFree(a)},an=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),ft,Pe,Bt,ri,ai,Bi,ca,Ni,$t,vt,Fl,vf,xf,Cf,Tf,kf,Sf,If,Ef=q(()=>{Ue(),$f(),At(),Ra(),ft=()=>!!_e.wasm.proxy&&typeof document<"u",Bt=!1,ri=!1,ai=!1,Ni=new Map,$t=(e,t)=>{let r=Ni.get(e);r?r.push(t):Ni.set(e,[t])},vt=()=>{if(Bt||!ri||ai||!Pe)throw new Error("worker not ready")},Fl=e=>{switch(e.data.type){case"init-wasm":Bt=!1,e.data.err?(ai=!0,ca[1](e.data.err)):(ri=!0,ca[0]()),Bi&&(URL.revokeObjectURL(Bi),Bi=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Ni.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},vf=async()=>{if(!ri){if(Bt)throw new Error("multiple calls to 'initWasm()' detected.");if(ai)throw new Error("previous call to 'initWasm()' failed.");if(Bt=!0,ft())return new Promise((e,t)=>{Pe?.terminate(),bd().then(([r,i])=>{try{Pe=i,Pe.onerror=s=>t(s),Pe.onmessage=Fl,ca=[e,t];let a={type:"init-wasm",in:_e};!a.in.wasm.wasmPaths&&(r||ha)&&(a.in.wasm.wasmPaths={wasm:new URL(""+new URL("../assets/ort-wasm-simd-threaded.jsep.CLmJQkb_.wasm",import.meta.url).href,import.meta.url).href}),Pe.postMessage(a),Bi=r}catch(a){t(a)}},t)});try{await Ba(_e.wasm),await Xa(_e),ri=!0}catch(e){throw ai=!0,e}finally{Bt=!1}}},xf=async e=>{if(ft())return vt(),new Promise((t,r)=>{$t("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:_e}};Pe.postMessage(i)});await Qa(_e,e)},Cf=async e=>ft()?(vt(),new Promise((t,r)=>{$t("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};Pe.postMessage(i,[e.buffer])})):Gi(e),Tf=async(e,t)=>{if(ft()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return vt(),new Promise((r,i)=>{$t("create",[r,i]);let a={type:"create",in:{model:e,options:{...t}}},s=[];e instanceof Uint8Array&&s.push(e.buffer),Pe.postMessage(a,s)})}else return Ja(e,t)},kf=async e=>{if(ft())return vt(),new Promise((t,r)=>{$t("release",[t,r]);let i={type:"release",in:e};Pe.postMessage(i)});en(e)},Sf=async(e,t,r,i,a,s)=>{if(ft()){if(r.some(o=>o[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(a.some(o=>o))throw new Error("pre-allocated output tensor is not supported for proxy.");return vt(),new Promise((o,u)=>{$t("run",[o,u]);let d=r,p={type:"run",in:{sessionId:e,inputIndices:t,inputs:d,outputIndices:i,options:s}};Pe.postMessage(p,an(d))})}else return tn(e,t,r,i,a,s)},If=async e=>{if(ft())return vt(),new Promise((t,r)=>{$t("end-profiling",[t,r]);let i={type:"end-profiling",in:e};Pe.postMessage(i)});rn(e)}}),fa,Kl,zf,gg=q(()=>{Ue(),Ef(),te(),Oa(),xd(),fa=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Kl=e=>{switch(e[3]){case"cpu":return new Xe(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Da(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:a}=e[2];return Xe.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:a})}case"ml-tensor":{let t=e[0];if(!Ma(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:a}=e[2];return Xe.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:a})}default:throw new Error(`invalid data location: ${e[3]}`)}},zf=class{async fetchModelAndCopyToWasmMemory(e){return Cf(await Pa(e))}async loadModel(e,t){Qe();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await Tf(r,t),He()}async dispose(){return kf(this.sessionId)}async run(e,t,r){Qe();let i=[],a=[];Object.entries(e).forEach(m=>{let g=m[0],_=m[1],b=this.inputNames.indexOf(g);if(b===-1)throw new Error(`invalid input '${g}'`);i.push(_),a.push(b)});let s=[],o=[];Object.entries(t).forEach(m=>{let g=m[0],_=m[1],b=this.outputNames.indexOf(g);if(b===-1)throw new Error(`invalid output '${g}'`);s.push(_),o.push(b)});let u=i.map((m,g)=>fa(m,()=>`input "${this.inputNames[a[g]]}"`)),d=s.map((m,g)=>m?fa(m,()=>`output "${this.outputNames[o[g]]}"`):null),p=await Sf(this.sessionId,a,u,o,d,r),f={};for(let m=0;m<p.length;m++)f[this.outputNames[o[m]]]=s[m]??Kl(p[m]);return He(),f}startProfiling(){}endProfiling(){If(this.sessionId)}}}),Af={};qt(Af,{OnnxruntimeWebAssemblyBackend:()=>Ea,initializeFlags:()=>Ia,wasmBackend:()=>Of});var Ia,Ea,Of,_g=q(()=>{Ue(),Ef(),gg(),Ia=()=>{(typeof _e.wasm.initTimeout!="number"||_e.wasm.initTimeout<0)&&(_e.wasm.initTimeout=0);let e=_e.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),_e.wasm.simd=!1),typeof _e.wasm.proxy!="boolean"&&(_e.wasm.proxy=!1),typeof _e.wasm.trace!="boolean"&&(_e.wasm.trace=!1),typeof _e.wasm.numThreads!="number"||!Number.isInteger(_e.wasm.numThreads)||_e.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)_e.wasm.numThreads=1;else{let t=typeof navigator>"u"?im("node:os").cpus().length:navigator.hardwareConcurrency;_e.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},Ea=class{async init(e){Ia(),await vf(),await xf(e)}async createInferenceSessionHandler(e,t){let r=new zf;return await r.loadModel(e,t),r}},Of=new Ea});Ue();Ue();Ue();var yg="1.23.0";{let e=(_g(),di(Af)).wasmBackend;Nt("webgpu",e,5),Nt("webnn",e,5),Nt("cpu",e,10),Nt("wasm",e,10)}Object.defineProperty(_e.versions,"web",{value:yg,enumerable:!0});/**
* @license
* Copyright 2021 Google LLC. All Rights Reserved.
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* =============================================================================
*//**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 *//**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */_e.wasm.numThreads=1;_e.wasm.wasmPaths={"ort-wasm-simd-threaded.wasm":"/ort-wasm-simd-threaded.wasm"};const bg=640,wg=640;function zg(e){return typeof e=="string"?e:e.url}const $g=Mt({x:"number",y:"number",w:"number",h:"number"}),vg=Mt({x:"number",y:"number",width:"number",height:"number"});Mt({x:"number > 0",y:"number > 0",width:"number > 0",height:"number > 0"});Mt.or($g,vg);function xg({x:e,y:t}){return({x:r,y:i,...a})=>{const[s,o]=[r*e,i*t];return"width"in a&&"height"in a?{x:s,y:o,width:a.width*e,height:a.height*t}:"w"in a&&"h"in a?{x:s,y:o,w:a.w*e,h:a.h*t}:{x:s,y:o,...a}}}const Ag=e=>{if(!e)throw new Error("No protocol was provided");return xg({x:1/(e.crop?.infer?.input?.width??bg),y:1/(e.crop?.infer?.input?.height??wg)})};function Og({x:e,y:t,width:r,height:i}){return{x:e+r/2,y:t+i/2,w:r,h:i}}function Cg({x:e,y:t,w:r,h:i}){return{x:e-r/2,y:t-i/2,width:r,height:i}}function Tg(e){return Mt({x:"number > 0",y:"number > 0"}).and(Mt.or({width:"number > 0",height:"number > 0"},{w:"number > 0",h:"number > 0"})).allows(e)}function Rg(e,{x:t,y:r}){if(!Tg(e))return!1;const{x:i,y:a,width:s,height:o}=e;return t>=i&&t<=i+s&&r>=a&&r<=a+o}function kg(e,t){let r=0;return r+=Math.abs(e.x-t.x),r+=Math.abs(e.y-t.y),r+=Math.abs(("width"in e?e.width:e.w)-("width"in t?t.width:t.w)),r+=Math.abs(("height"in e?e.height:e.h)-("height"in t?t.height:t.h)),r}function Bg(e,t,r=0){return kg(e,t)<=r}function Sg(e){return!("width"in e)||!("height"in e)?Sg(Cg(e)):{topleft:[e.x,e.y],topright:[e.x+e.width,e.y],bottomleft:[e.x,e.y+e.height],bottomright:[e.x+e.width,e.y+e.height]}}export{Sg as a,Tg as b,xg as c,Og as d,Bg as e,Ag as f,zg as m,Cg as t,Rg as w};
