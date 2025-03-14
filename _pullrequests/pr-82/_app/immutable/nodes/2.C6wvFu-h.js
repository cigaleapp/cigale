import{$ as Oa,ad as Ca,a8 as ja,aU as Pa,t as ee,ag as Oe,ah as Ce,ai as de,b as Z,s as ne,g as $,f as ge,G as _e,a as b,c as R,M as ve,r as C,af as za}from"../chunks/QTVBrZQz.js";import{t as J,B as Da,o as Fa,u as sa,g as pa}from"../chunks/CDE06Pug.js";import{H as Ua,b as He,g as qe}from"../chunks/C2EP1DF-.js";import{t as Ra}from"../chunks/Ctg6cI1_.js";import{n as he,a as j,b as Ke,t as X,c as Ha}from"../chunks/Yi9iuJrU.js";import{d as qa,h as Ka}from"../chunks/BijaW5W9.js";import{e as Va}from"../chunks/DmiUy1W9.js";import{s as Na}from"../chunks/hHdRsb1p.js";import{s as pe,a as ye,b as wa,c as Za}from"../chunks/DPbpzs5i.js";import{p as We}from"../chunks/DE1d3na4.js";import{r as we,p as ya,s as Ga}from"../chunks/B-Yw5O5m.js";import{p as _a}from"../chunks/3_knRnLD.js";import Ja from"../chunks/CKOhjDWM.js";import Wa from"../chunks/Cs_Y-OCw.js";import{b as $a,e as Qa}from"../chunks/B8uWErjH.js";import{s as Re,g as se}from"../chunks/DXbH9_L6.js";import{u as Y}from"../chunks/BXkCq4b2.js";import{t as $e}from"../chunks/B7je0J6M.js";import{i as fe}from"../chunks/DC0ZX6qe.js";import{c as la}from"../chunks/D_3UiLlf.js";import{b as Xa}from"../chunks/BL_0X1-P.js";import Le from"../chunks/CunoLiUi.js";import Ya from"../chunks/BIWbyXLX.js";import{D as ba}from"../chunks/Njv3zc90.js";import er from"../chunks/fLg7_6BZ.js";import ar from"../chunks/DwFF9zbe.js";import rr from"../chunks/DDPSXZo_.js";import{d as tr,t as nr}from"../chunks/B5yHvB02.js";import{a as or,s as ir,d as sr}from"../chunks/CMIUhhaz.js";import{o as lr,a as ca,b as xe,c as cr}from"../chunks/Dz08DP7w.js";import{b as fr}from"../chunks/C1xk_wGi.js";import fa from"../chunks/afArgixv.js";import va from"../chunks/BHDgoGxT.js";const vr=[];function ur(e,a=!1){return Ie(e,new Map,"",vr)}function Ie(e,a,r,t,n=null){if(typeof e=="object"&&e!==null){var o=a.get(e);if(o!==void 0)return o;if(e instanceof Map)return new Map(e);if(e instanceof Set)return new Set(e);if(Oa(e)){var i=Array(e.length);a.set(e,i),n!==null&&a.set(n,i);for(var s=0;s<e.length;s+=1){var c=e[s];s in e&&(i[s]=Ie(c,a,r,t))}return i}if(Ca(e)===ja){i={},a.set(e,i),n!==null&&a.set(n,i);for(var v in e)i[v]=Ie(e[v],a,r,t);return i}if(e instanceof Date)return structuredClone(e);if(typeof e.toJSON=="function")return Ie(e.toJSON(),a,r,t,e)}if(e instanceof EventTarget)return e;try{return structuredClone(e)}catch{return e}}const dr=Pa;function gr(e,a){throw new Ua(e,a)}new TextEncoder;async function mr(e){const a=await fetch(Ra("class_mapping.txt")).then(r=>r.text()).then(r=>r.split(`
`));await J.Metadata.set({id:e,description:"L'espèce de l'individu",label:"Espèce",mergeMethod:"max",required:!1,type:"enum",options:a.filter(Boolean).map((r,t)=>({key:t.toString(),label:r,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(r)}`}))})}function hr(e){var r,t;if(e===void 0)return;const a=ur((r=J.Metadata.state.find(n=>n.id===Da.species))==null?void 0:r.options);return((t=a==null?void 0:a.find(n=>n.key===(e==null?void 0:e.toString())))==null?void 0:t.label)??(e==null?void 0:e.toString())}async function pr(){try{await J.initialize(),await wr(),await mr("species"),await J.initialize()}catch(e){console.error(e),gr(400,{message:(e==null?void 0:e.toString())??"Erreur inattendue"})}}async function wr(){await Fa(["Metadata","Protocol","Settings"],{},e=>{for(const a of sa)e.objectStore("Metadata").put(a);e.objectStore("Protocol").put({id:"test",metadata:[...sa.map(a=>a.id),"species"],authors:[{name:"Feur",email:"gwenn.elbikergre@gmai.com"},{name:"Incofeurgniote",email:"igriuojgr@fokejofe.com"}],name:"Test",source:"https://gwen.works"}),e.objectStore("Settings").put({id:"defaults",protocols:[],theme:"auto",gridSize:10,language:"fr",showInputHints:!0,showTechnicalMetadata:dr})})}const Rt=Object.freeze(Object.defineProperty({__proto__:null,load:pr},Symbol.toStringTag,{value:"Module"}));var yr=he('<svg><path fill="currentColor" d="m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32"></path></svg>');function Me(e,a){const r=we(a,["$$slots","$$events","$$legacy"]);var t=yr();let n;ee(()=>n=pe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),j(e,t)}var ua={},_r=function(e,a,r,t,n){var o=new Worker(ua[a]||(ua[a]=URL.createObjectURL(new Blob([e+';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'],{type:"text/javascript"}))));return o.onmessage=function(i){var s=i.data,c=s.$e$;if(c){var v=new Error(c[0]);v.code=c[1],v.stack=c[2],n(v,null)}else n(null,s)},o.postMessage(r,t),o},H=Uint8Array,K=Uint16Array,je=Int32Array,Pe=new H([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),ze=new H([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Ve=new H([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),xa=function(e,a){for(var r=new K(31),t=0;t<31;++t)r[t]=a+=1<<e[t-1];for(var n=new je(r[30]),t=1;t<30;++t)for(var o=r[t];o<r[t+1];++o)n[o]=o-r[t]<<5|t;return{b:r,r:n}},Ma=xa(Pe,2),$r=Ma.b,Te=Ma.r;$r[28]=258,Te[258]=28;var br=xa(ze,0),Ne=br.r,ke=new K(32768);for(var B=0;B<32768;++B){var te=(B&43690)>>1|(B&21845)<<1;te=(te&52428)>>2|(te&13107)<<2,te=(te&61680)>>4|(te&3855)<<4,ke[B]=((te&65280)>>8|(te&255)<<8)>>1}var ue=function(e,a,r){for(var t=e.length,n=0,o=new K(a);n<t;++n)e[n]&&++o[e[n]-1];var i=new K(a);for(n=1;n<a;++n)i[n]=i[n-1]+o[n-1]<<1;var s;if(r){s=new K(1<<a);var c=15-a;for(n=0;n<t;++n)if(e[n])for(var v=n<<4|e[n],l=a-e[n],f=i[e[n]-1]++<<l,u=f|(1<<l)-1;f<=u;++f)s[ke[f]>>c]=v}else for(s=new K(t),n=0;n<t;++n)e[n]&&(s[n]=ke[i[e[n]-1]++]>>15-e[n]);return s},oe=new H(288);for(var B=0;B<144;++B)oe[B]=8;for(var B=144;B<256;++B)oe[B]=9;for(var B=256;B<280;++B)oe[B]=7;for(var B=280;B<288;++B)oe[B]=8;var be=new H(32);for(var B=0;B<32;++B)be[B]=5;var Sa=ue(oe,9,0),Ia=ue(be,5,0),Qe=function(e){return(e+7)/8|0},Xe=function(e,a,r){return(a==null||a<0)&&(a=0),(r==null||r>e.length)&&(r=e.length),new H(e.subarray(a,r))},xr=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],me=function(e,a,r){var t=new Error(a||xr[e]);if(t.code=e,Error.captureStackTrace&&Error.captureStackTrace(t,me),!r)throw t;return t},Q=function(e,a,r){r<<=a&7;var t=a/8|0;e[t]|=r,e[t+1]|=r>>8},le=function(e,a,r){r<<=a&7;var t=a/8|0;e[t]|=r,e[t+1]|=r>>8,e[t+2]|=r>>16},Be=function(e,a){for(var r=[],t=0;t<e.length;++t)e[t]&&r.push({s:t,f:e[t]});var n=r.length,o=r.slice();if(!n)return{t:ea,l:0};if(n==1){var i=new H(r[0].s+1);return i[r[0].s]=1,{t:i,l:1}}r.sort(function(S,L){return S.f-L.f}),r.push({s:-1,f:25001});var s=r[0],c=r[1],v=0,l=1,f=2;for(r[0]={s:-1,f:s.f+c.f,l:s,r:c};l!=n-1;)s=r[r[v].f<r[f].f?v++:f++],c=r[v!=l&&r[v].f<r[f].f?v++:f++],r[l++]={s:-1,f:s.f+c.f,l:s,r:c};for(var u=o[0].s,t=1;t<n;++t)o[t].s>u&&(u=o[t].s);var m=new K(u+1),p=Ee(r[l-1],m,0);if(p>a){var t=0,w=0,_=p-a,M=1<<_;for(o.sort(function(L,g){return m[g.s]-m[L.s]||L.f-g.f});t<n;++t){var E=o[t].s;if(m[E]>a)w+=M-(1<<p-m[E]),m[E]=a;else break}for(w>>=_;w>0;){var T=o[t].s;m[T]<a?w-=1<<a-m[T]++-1:++t}for(;t>=0&&w;--t){var y=o[t].s;m[y]==a&&(--m[y],++w)}p=a}return{t:new H(m),l:p}},Ee=function(e,a,r){return e.s==-1?Math.max(Ee(e.l,a,r+1),Ee(e.r,a,r+1)):a[e.s]=r},Ze=function(e){for(var a=e.length;a&&!e[--a];);for(var r=new K(++a),t=0,n=e[0],o=1,i=function(c){r[t++]=c},s=1;s<=a;++s)if(e[s]==n&&s!=a)++o;else{if(!n&&o>2){for(;o>138;o-=138)i(32754);o>2&&(i(o>10?o-11<<5|28690:o-3<<5|12305),o=0)}else if(o>3){for(i(n),--o;o>6;o-=6)i(8304);o>2&&(i(o-3<<5|8208),o=0)}for(;o--;)i(n);o=1,n=e[s]}return{c:r.subarray(0,t),n:a}},ce=function(e,a){for(var r=0,t=0;t<a.length;++t)r+=e[t]*a[t];return r},Ye=function(e,a,r){var t=r.length,n=Qe(a+2);e[n]=t&255,e[n+1]=t>>8,e[n+2]=e[n]^255,e[n+3]=e[n+1]^255;for(var o=0;o<t;++o)e[n+o+4]=r[o];return(n+4+t)*8},Ge=function(e,a,r,t,n,o,i,s,c,v,l){Q(a,l++,r),++n[256];for(var f=Be(n,15),u=f.t,m=f.l,p=Be(o,15),w=p.t,_=p.l,M=Ze(u),E=M.c,T=M.n,y=Ze(w),S=y.c,L=y.n,g=new K(19),h=0;h<E.length;++h)++g[E[h]&31];for(var h=0;h<S.length;++h)++g[S[h]&31];for(var d=Be(g,7),I=d.t,V=d.l,A=19;A>4&&!I[Ve[A-1]];--A);var P=v+5<<3,z=ce(n,oe)+ce(o,be)+i,O=ce(n,u)+ce(o,w)+i+14+3*A+ce(g,I)+2*g[16]+3*g[17]+7*g[18];if(c>=0&&P<=z&&P<=O)return Ye(a,l,e.subarray(c,c+v));var F,k,N,G;if(Q(a,l,1+(O<z)),l+=2,O<z){F=ue(u,m,0),k=u,N=ue(w,_,0),G=w;var x=ue(I,V,0);Q(a,l,T-257),Q(a,l+5,L-1),Q(a,l+10,A-4),l+=14;for(var h=0;h<A;++h)Q(a,l+3*h,I[Ve[h]]);l+=3*A;for(var D=[E,S],ae=0;ae<2;++ae)for(var re=D[ae],h=0;h<re.length;++h){var W=re[h]&31;Q(a,l,x[W]),l+=I[W],W>15&&(Q(a,l,re[h]>>5&127),l+=re[h]>>12)}}else F=Sa,k=oe,N=Ia,G=be;for(var h=0;h<s;++h){var q=t[h];if(q>255){var W=q>>18&31;le(a,l,F[W+257]),l+=k[W+257],W>7&&(Q(a,l,q>>23&31),l+=Pe[W]);var ie=q&31;le(a,l,N[ie]),l+=G[ie],ie>3&&(le(a,l,q>>5&8191),l+=ze[ie])}else le(a,l,F[q]),l+=k[q]}return le(a,l,F[256]),l+k[256]},Ba=new je([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),ea=new H(0),La=function(e,a,r,t,n,o){var i=o.z||e.length,s=new H(t+i+5*(1+Math.ceil(i/7e3))+n),c=s.subarray(t,s.length-n),v=o.l,l=(o.r||0)&7;if(a){l&&(c[0]=o.r>>3);for(var f=Ba[a-1],u=f>>13,m=f&8191,p=(1<<r)-1,w=o.p||new K(32768),_=o.h||new K(p+1),M=Math.ceil(r/3),E=2*M,T=function(Ue){return(e[Ue]^e[Ue+1]<<M^e[Ue+2]<<E)&p},y=new je(25e3),S=new K(288),L=new K(32),g=0,h=0,d=o.i||0,I=0,V=o.w||0,A=0;d+2<i;++d){var P=T(d),z=d&32767,O=_[P];if(w[z]=O,_[P]=z,V<=d){var F=i-d;if((g>7e3||I>24576)&&(F>423||!v)){l=Ge(e,c,0,y,S,L,h,I,A,d-A,l),I=g=h=0,A=d;for(var k=0;k<286;++k)S[k]=0;for(var k=0;k<30;++k)L[k]=0}var N=2,G=0,x=m,D=z-O&32767;if(F>2&&P==T(d-D))for(var ae=Math.min(u,F)-1,re=Math.min(32767,d),W=Math.min(258,F);D<=re&&--x&&z!=O;){if(e[d+N]==e[d+N-D]){for(var q=0;q<W&&e[d+q]==e[d+q-D];++q);if(q>N){if(N=q,G=D,q>ae)break;for(var ie=Math.min(D,q-2),ta=0,k=0;k<ie;++k){var De=d-D+k&32767,Aa=w[De],na=De-Aa&32767;na>ta&&(ta=na,O=De)}}}z=O,O=w[z],D+=z-O&32767}if(G){y[I++]=268435456|Te[N]<<18|Ne[G];var oa=Te[N]&31,ia=Ne[G]&31;h+=Pe[oa]+ze[ia],++S[257+oa],++L[ia],V=d+N,++g}else y[I++]=e[d],++S[e[d]]}}for(d=Math.max(d,V);d<i;++d)y[I++]=e[d],++S[e[d]];l=Ge(e,c,v,y,S,L,h,I,A,d-A,l),v||(o.r=l&7|c[l/8|0]<<3,l-=7,o.h=_,o.p=w,o.i=d,o.w=V)}else{for(var d=o.w||0;d<i+v;d+=65535){var Fe=d+65535;Fe>=i&&(c[l/8|0]=v,Fe=i),l=Ye(c,l+1,e.subarray(d,Fe))}o.i=i}return Xe(s,0,t+Qe(l)+n)},Mr=function(){for(var e=new Int32Array(256),a=0;a<256;++a){for(var r=a,t=9;--t;)r=(r&1&&-306674912)^r>>>1;e[a]=r}return e}(),Sr=function(){var e=-1;return{p:function(a){for(var r=e,t=0;t<a.length;++t)r=Mr[r&255^a[t]]^r>>>8;e=r},d:function(){return~e}}},Ta=function(e,a,r,t,n){if(!n&&(n={l:1},a.dictionary)){var o=a.dictionary.subarray(-32768),i=new H(o.length+e.length);i.set(o),i.set(e,o.length),e=i,n.w=o.length}return La(e,a.level==null?6:a.level,a.mem==null?n.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+a.mem,r,t,n)},aa=function(e,a){var r={};for(var t in e)r[t]=e[t];for(var t in a)r[t]=a[t];return r},da=function(e,a,r){for(var t=e(),n=e.toString(),o=n.slice(n.indexOf("[")+1,n.lastIndexOf("]")).replace(/\s+/g,"").split(","),i=0;i<t.length;++i){var s=t[i],c=o[i];if(typeof s=="function"){a+=";"+c+"=";var v=s.toString();if(s.prototype)if(v.indexOf("[native code]")!=-1){var l=v.indexOf(" ",8)+1;a+=v.slice(l,v.indexOf("(",l))}else{a+=v;for(var f in s.prototype)a+=";"+c+".prototype."+f+"="+s.prototype[f].toString()}else a+=v}else r[c]=s}return a},Se=[],Ir=function(e){var a=[];for(var r in e)e[r].buffer&&a.push((e[r]=new e[r].constructor(e[r])).buffer);return a},Br=function(e,a,r,t){if(!Se[r]){for(var n="",o={},i=e.length-1,s=0;s<i;++s)n=da(e[s],n,o);Se[r]={c:da(e[i],n,o),e:o}}var c=aa({},Se[r].e);return _r(Se[r].c+";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage="+a.toString()+"}",r,c,Ir(c),t)},Lr=function(){return[H,K,je,Pe,ze,Ve,Te,Ne,Sa,oe,Ia,be,ke,Ba,ea,ue,Q,le,Be,Ee,Ze,ce,Ye,Ge,Qe,Xe,La,Ta,ra,ka]},ka=function(e){return postMessage(e,[e.buffer])},Tr=function(e,a,r,t,n,o){var i=Br(r,t,n,function(s,c){i.terminate(),o(s,c)});return i.postMessage([e,a],a.consume?[e.buffer]:[]),function(){i.terminate()}},U=function(e,a,r){for(;r;++a)e[a]=r,r>>>=8};function kr(e,a,r){return r||(r=a,a={}),typeof r!="function"&&me(7),Tr(e,a,[Lr],function(t){return ka(ra(t.data[0],t.data[1]))},0,r)}function ra(e,a){return Ta(e,a||{},0,0)}var Ea=function(e,a,r,t){for(var n in e){var o=e[n],i=a+n,s=t;Array.isArray(o)&&(s=aa(t,o[1]),o=o[0]),o instanceof H?r[i]=[o,s]:(r[i+="/"]=[new H(0),s],Ea(o,i,r,t))}},ga=typeof TextEncoder<"u"&&new TextEncoder,Er=typeof TextDecoder<"u"&&new TextDecoder,Ar=0;try{Er.decode(ea,{stream:!0}),Ar=1}catch{}function Ae(e,a){var r;if(ga)return ga.encode(e);for(var t=e.length,n=new H(e.length+(e.length>>1)),o=0,i=function(v){n[o++]=v},r=0;r<t;++r){if(o+5>n.length){var s=new H(o+8+(t-r<<1));s.set(n),n=s}var c=e.charCodeAt(r);c<128||a?i(c):c<2048?(i(192|c>>6),i(128|c&63)):c>55295&&c<57344?(c=65536+(c&1047552)|e.charCodeAt(++r)&1023,i(240|c>>18),i(128|c>>12&63),i(128|c>>6&63),i(128|c&63)):(i(224|c>>12),i(128|c>>6&63),i(128|c&63))}return Xe(n,0,o)}var Je=function(e){var a=0;if(e)for(var r in e){var t=e[r].length;t>65535&&me(9),a+=t+4}return a},ma=function(e,a,r,t,n,o,i,s){var c=t.length,v=r.extra,l=s&&s.length,f=Je(v);U(e,a,i!=null?33639248:67324752),a+=4,i!=null&&(e[a++]=20,e[a++]=r.os),e[a]=20,a+=2,e[a++]=r.flag<<1|(o<0&&8),e[a++]=n&&8,e[a++]=r.compression&255,e[a++]=r.compression>>8;var u=new Date(r.mtime==null?Date.now():r.mtime),m=u.getFullYear()-1980;if((m<0||m>119)&&me(10),U(e,a,m<<25|u.getMonth()+1<<21|u.getDate()<<16|u.getHours()<<11|u.getMinutes()<<5|u.getSeconds()>>1),a+=4,o!=-1&&(U(e,a,r.crc),U(e,a+4,o<0?-o-2:o),U(e,a+8,r.size)),U(e,a+12,c),U(e,a+14,f),a+=16,i!=null&&(U(e,a,l),U(e,a+6,r.attrs),U(e,a+10,i),a+=14),e.set(t,a),a+=c,f)for(var p in v){var w=v[p],_=w.length;U(e,a,+p),U(e,a+2,_),e.set(w,a+4),a+=4+_}return l&&(e.set(s,a),a+=l),a},Or=function(e,a,r,t,n){U(e,a,101010256),U(e,a+8,r),U(e,a+10,r),U(e,a+12,t),U(e,a+16,n)};function Cr(e,a,r){r||(r=a,a={}),typeof r!="function"&&me(7);var t={};Ea(e,"",t,a);var n=Object.keys(t),o=n.length,i=0,s=0,c=o,v=new Array(o),l=[],f=function(){for(var _=0;_<l.length;++_)l[_]()},u=function(_,M){ha(function(){r(_,M)})};ha(function(){u=r});var m=function(){var _=new H(s+22),M=i,E=s-i;s=0;for(var T=0;T<c;++T){var y=v[T];try{var S=y.c.length;ma(_,s,y,y.f,y.u,S);var L=30+y.f.length+Je(y.extra),g=s+L;_.set(y.c,g),ma(_,i,y,y.f,y.u,S,s,y.m),i+=16+L+(y.m?y.m.length:0),s=g+S}catch(h){return u(h,null)}}Or(_,i,v.length,E,M),u(null,_)};o||m();for(var p=function(_){var M=n[_],E=t[M],T=E[0],y=E[1],S=Sr(),L=T.length;S.p(T);var g=Ae(M),h=g.length,d=y.comment,I=d&&Ae(d),V=I&&I.length,A=Je(y.extra),P=y.level==0?0:8,z=function(O,F){if(O)f(),u(O,null);else{var k=F.length;v[_]=aa(y,{size:L,crc:S.d(),c:F,f:g,m:I,u:h!=M.length||I&&d.length!=V,compression:P}),i+=30+h+A+k,s+=76+2*(h+A)+(V||0)+k,--o||m()}};if(h>65535&&z(me(11,0,1),null),!P)z(null,T);else if(L<16e4)try{z(null,ra(T,y))}catch(O){z(O,null)}else l.push(kr(T,y,z))},w=0;w<c;++w)p(w);return f}var ha=typeof queueMicrotask=="function"?queueMicrotask:typeof setTimeout=="function"?setTimeout:function(e){e()};async function jr(e,a,{include:r="croppedonly",base:t}){const n=Object.fromEntries(await Promise.all(e.map(async v=>[v.id,{label:v.label,metadata:await lr(v).then(ca),images:v.images.map(l=>{const f=J.Image.state.find(u=>u.id===l);if(f)return{...f,metadata:ca(f.metadata)}})}]))),o=[...new Set(e.flatMap(v=>Object.keys(n[v.id].metadata)))],i=Object.fromEntries(J.Metadata.state.map(v=>[v.id,v]));let s=[];if(r!=="metadataonly")for(const v of e.flatMap(l=>l.images)){const l=await J.Image.get(v);if(!l)throw"Image non trouvée";const{contentType:f,filename:u}=l,{cropped:m,original:p}=await Pr(l);s.push({imageId:v,croppedBytes:new Uint8Array(m),originalBytes:r==="full"?new Uint8Array(p):void 0,contentType:f,filename:u})}const c=await new Promise((v,l)=>Cr({"analysis.json":Ae(ir("json",`${window.location.origin}${t}/results.schema.json`,{observations:n,protocol:a},["protocol","observations"])),"metadata.csv":Ae(zr(["Identifiant","Observation",...o.flatMap(f=>[xe(i[f]),`${xe(i[f])}: Confiance`])],e.map(f=>({Identifiant:f.id,Observation:f.label,...Object.fromEntries(Object.entries(n[f.id].metadata).flatMap(([u,{value:m,confidence:p}])=>[[xe(i[u]),cr(i[u],m)],[`${xe(i[u])}: Confiance`,p.toString()]]))})))),...Object.fromEntries(r==="metadataonly"?[]:Object.entries(Object.groupBy(e,f=>{var u;return hr((u=n[f.id].metadata.species)==null?void 0:u.value)??"(Unknown)"})).map(([f,u])=>[f,Object.fromEntries((u??[]).map(m=>[m.label,Object.fromEntries(m.images.flatMap(p=>{const w=s.find(_=>_.imageId===p);if(!w)throw"Image non trouvée";if(r==="full"){const[_,M]=or(w.filename);return[[`${_}_cropped.${M}`,[w.croppedBytes,{level:0}]],[`${_}_original.${M}`,[w.originalBytes,{level:0}]]]}else return[[w.filename,[w.croppedBytes,{level:0}]]]}))]))]))},{comment:`Generated by C.i.g.a.l.e on ${new Date().toISOString()} - ${window.location.origin}`},(f,u)=>{f&&l(f),v(u)}));sr(c,"results.zip","application/zip")}async function Pr(e){var o,i;const a=(o=e.metadata.crop)==null?void 0:o.value;if(!a)throw"L'image n'a pas d'information de recadrage";const r=await pa("ImageFile",$a(e.id)).then(s=>s==null?void 0:s.bytes);if(!r)throw"L'image n'a pas de fichier associé";const t=await createImageBitmap(new Blob([r],{type:e.contentType})),n=tr({x:t.width,y:t.height})(nr(a));try{const s=await createImageBitmap(t,n.x,n.y,n.width,n.height),c=document.createElement("canvas");return c.width=s.width,c.height=s.height,(i=c.getContext("2d"))==null||i.drawImage(s,0,0),{cropped:await new Promise(l=>c.toBlob(l,["image/png","image/jpeg"].includes(e.contentType)?e.contentType:"image/png")).then(l=>l.arrayBuffer()),original:r}}catch(s){$e.warn(`Impossible de recadrer ${e.filename}, l'image sera incluse sans recadrage`),console.error(`Couldn't crop ${e.filename} (id ${e.id}) with `,{boundingBox:n},":",s)}finally{t.close()}return{cropped:r,original:r}}function zr(e,a,r=";"){const t=n=>`"${(n==null?void 0:n.replace(/"/g,'""'))??""}"`;return[e.map(t).join(r),...a.map(n=>e.map(o=>t(n[o])).join(r))].join(`
`)}var Dr=X("<!> results.zip",1);function Fr(e,a){Oe(a,!0);let r=ya(a,"open",15),t=ne(!1),n=ne("croppedonly");async function o(){Z(t,!0);const i=J.Protocol.state.find(s=>s.id===Y.currentProtocol);if(!i){$e.error("Aucun protocole sélectionné"),Z(t,!1);return}try{await Qa(),await jr(J.Observation.state,i,{base:He,include:$(n)})}catch(s){console.error(s),$e.error(`Erreur lors de l'exportation des résultats: ${(s==null?void 0:s.toString())??"Erreur inattendue"}`)}finally{Z(t,!1)}}ar(e,{key:"export-results",title:"Exporter les résultats",get open(){return r()},set open(s){r(s)},footer:s=>{Le(s,{onclick:o,children:(c,v)=>{var l=Dr(),f=ge(l);{var u=p=>{er(p,{})},m=p=>{ba(p,{})};fe(f,p=>{$(t)?p(u):p(m,!1)})}de(),j(c,l)},$$slots:{default:!0}})},children:(s,c)=>{rr(s,{options:[{key:"metadataonly",label:"Métadonnées seulement"},{key:"croppedonly",label:"Métadonnées et images recadrées"},{key:"full",label:"Métadonnées, images recadrées et images originales"}],get value(){return $(n)},set value(v){Z(n,We(v))},children:(v,l)=>{de();var f=Ke("Quoi inclure dans l'export");j(v,f)},$$slots:{default:!0}})},$$slots:{footer:!0,default:!0}}),Ce()}var Ur=he('<svg><path fill="currentColor" d="M128 82a46 46 0 1 0 46 46a46.06 46.06 0 0 0-46-46m0 80a34 34 0 1 1 34-34a34 34 0 0 1-34 34m86-31.16c.06-1.89.06-3.79 0-5.68L229.33 106a6 6 0 0 0 1.11-5.29a105.3 105.3 0 0 0-10.68-25.81a6 6 0 0 0-4.53-3l-24.45-2.71q-1.93-2.07-4-4l-2.72-24.46a6 6 0 0 0-3-4.53a105.7 105.7 0 0 0-25.77-10.66a6 6 0 0 0-5.29 1.14l-19.2 15.37a90 90 0 0 0-5.68 0L106 26.67a6 6 0 0 0-5.29-1.11A105.3 105.3 0 0 0 74.9 36.24a6 6 0 0 0-3 4.53l-2.67 24.45q-2.07 1.94-4 4L40.76 72a6 6 0 0 0-4.53 3a105.7 105.7 0 0 0-10.66 25.77a6 6 0 0 0 1.11 5.23l15.37 19.2a90 90 0 0 0 0 5.68l-15.38 19.17a6 6 0 0 0-1.11 5.29a105.3 105.3 0 0 0 10.68 25.76a6 6 0 0 0 4.53 3l24.45 2.71q1.94 2.07 4 4L72 215.24a6 6 0 0 0 3 4.53a105.7 105.7 0 0 0 25.77 10.66a6 6 0 0 0 5.29-1.11l19.1-15.32c1.89.06 3.79.06 5.68 0l19.21 15.38a6 6 0 0 0 3.75 1.31a6.2 6.2 0 0 0 1.54-.2a105.3 105.3 0 0 0 25.76-10.68a6 6 0 0 0 3-4.53l2.71-24.45q2.07-1.93 4-4l24.46-2.72a6 6 0 0 0 4.53-3a105.5 105.5 0 0 0 10.66-25.77a6 6 0 0 0-1.11-5.29Zm-3.1 41.63l-23.64 2.63a6 6 0 0 0-3.82 2a75 75 0 0 1-6.31 6.31a6 6 0 0 0-2 3.82l-2.63 23.63a94.3 94.3 0 0 1-17.36 7.14l-18.57-14.86a6 6 0 0 0-3.75-1.31h-.36a78 78 0 0 1-8.92 0a6 6 0 0 0-4.11 1.3L100.87 218a94 94 0 0 1-17.34-7.17l-2.63-23.62a6 6 0 0 0-2-3.82a75 75 0 0 1-6.31-6.31a6 6 0 0 0-3.82-2l-23.63-2.63A94.3 94.3 0 0 1 38 155.14l14.86-18.57a6 6 0 0 0 1.3-4.11a78 78 0 0 1 0-8.92a6 6 0 0 0-1.3-4.11L38 100.87a94 94 0 0 1 7.17-17.34l23.62-2.63a6 6 0 0 0 3.82-2a75 75 0 0 1 6.31-6.31a6 6 0 0 0 2-3.82l2.63-23.63A94.3 94.3 0 0 1 100.86 38l18.57 14.86a6 6 0 0 0 4.11 1.3a78 78 0 0 1 8.92 0a6 6 0 0 0 4.11-1.3L155.13 38a94 94 0 0 1 17.34 7.17l2.63 23.64a6 6 0 0 0 2 3.82a75 75 0 0 1 6.31 6.31a6 6 0 0 0 3.82 2l23.63 2.63a94.3 94.3 0 0 1 7.14 17.29l-14.86 18.57a6 6 0 0 0-1.3 4.11a78 78 0 0 1 0 8.92a6 6 0 0 0 1.3 4.11L218 155.13a94 94 0 0 1-7.15 17.34Z"></path></svg>');function Rr(e,a){const r=we(a,["$$slots","$$events","$$legacy"]);var t=Ur();let n;ee(()=>n=pe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),j(e,t)}var Hr=he('<svg><path fill="currentColor" d="M122 40V16a6 6 0 0 1 12 0v24a6 6 0 0 1-12 0m68 88a62 62 0 1 1-62-62a62.07 62.07 0 0 1 62 62m-12 0a50 50 0 1 0-50 50a50.06 50.06 0 0 0 50-50M59.76 68.24a6 6 0 1 0 8.48-8.48l-16-16a6 6 0 0 0-8.48 8.48Zm0 119.52l-16 16a6 6 0 1 0 8.48 8.48l16-16a6 6 0 1 0-8.48-8.48M192 70a6 6 0 0 0 4.24-1.76l16-16a6 6 0 0 0-8.48-8.48l-16 16A6 6 0 0 0 192 70m4.24 117.76a6 6 0 0 0-8.48 8.48l16 16a6 6 0 0 0 8.48-8.48ZM46 128a6 6 0 0 0-6-6H16a6 6 0 0 0 0 12h24a6 6 0 0 0 6-6m82 82a6 6 0 0 0-6 6v24a6 6 0 0 0 12 0v-24a6 6 0 0 0-6-6m112-88h-24a6 6 0 0 0 0 12h24a6 6 0 0 0 0-12"></path></svg>');function qr(e,a){const r=we(a,["$$slots","$$events","$$legacy"]);var t=Hr();let n;ee(()=>n=pe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),j(e,t)}var Kr=he('<svg><path fill="currentColor" d="M88 104H40a8 8 0 0 1-8-8V48a8 8 0 0 1 16 0v28.69l14.63-14.63A95.43 95.43 0 0 1 130 33.94h.53a95.36 95.36 0 0 1 67.07 27.33a8 8 0 0 1-11.18 11.44a79.52 79.52 0 0 0-55.89-22.77h-.45a79.56 79.56 0 0 0-56.14 23.43L59.31 88H88a8 8 0 0 1 0 16m128 48h-48a8 8 0 0 0 0 16h28.69l-14.63 14.63a79.56 79.56 0 0 1-56.13 23.43h-.45a79.52 79.52 0 0 1-55.89-22.77a8 8 0 1 0-11.18 11.44a95.36 95.36 0 0 0 67.07 27.33h.52a95.43 95.43 0 0 0 67.36-28.12L208 179.31V208a8 8 0 0 0 16 0v-48a8 8 0 0 0-8-8"></path></svg>');function Vr(e,a){const r=we(a,["$$slots","$$events","$$legacy"]);var t=Kr();let n;ee(()=>n=pe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),j(e,t)}var Nr=he('<svg><path fill="currentColor" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"></path></svg>');function Zr(e,a){const r=we(a,["$$slots","$$events","$$legacy"]);var t=Nr();let n;ee(()=>n=pe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),j(e,t)}var Gr=he('<svg><path fill="currentColor" d="M164.24 100.24L136.48 128l27.76 27.76a6 6 0 1 1-8.48 8.48L128 136.48l-27.76 27.76a6 6 0 0 1-8.48-8.48L119.52 128l-27.76-27.76a6 6 0 0 1 8.48-8.48L128 119.52l27.76-27.76a6 6 0 0 1 8.48 8.48M230 128A102 102 0 1 1 128 26a102.12 102.12 0 0 1 102 102m-12 0a90 90 0 1 0-90 90a90.1 90.1 0 0 0 90-90"></path></svg>');function Jr(e,a){const r=we(a,["$$slots","$$events","$$legacy"]);var t=Gr();let n;ee(()=>n=pe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),j(e,t)}var Wr=(e,a)=>{Z(a,!1)},Qr=X('<!> <dialog class="container svelte-k25xuh"><div class="listParam svelte-k25xuh"><div class="setting svelte-k25xuh">Thème <!> <!></div> <div class="setting svelte-k25xuh">Mode debug <!></div> <div class="setting svelte-k25xuh"><!></div> <div class="setting svelte-k25xuh"><!></div> <footer>C.i.g.a.l.e vDEV · <a href="#/about">À propos</a></footer></div></dialog>',1);function Xr(e,a){Oe(a,!0);let r=ne(!1),t=ne(void 0);_e(()=>{window.addEventListener("mouseup",({target:g})=>{var h;g!==$(t)&&((h=$(t))!=null&&h.contains(g)||Z(r,!1))})});let n=ne(!0);_e(()=>{window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",g=>{Z(n,!g.matches)})});var o=Qr(),i=ge(o);const s=ve(()=>$(r)?"Fermer":"Réglages");fa(i,{get help(){return $(s)},onclick:()=>{Z(r,!$(r))},children:(g,h)=>{var d=Ha(),I=ge(d);{var V=P=>{Jr(P,{})},A=P=>{Rr(P,{})};fe(I,P=>{$(r)?P(V):P(A,!1)})}j(g,d)}});var c=b(i,2),v=R(c),l=R(v),f=b(R(l));const u=ve(()=>se().theme==="auto"?$(n):se().theme==="light");va(f,{get value(){return $(u)},onchange:async g=>{await Re("theme",g?"light":"dark")},icons:{on:qr,off:Zr}});var m=b(f,2);const p=ve(()=>se().theme==="auto");fa(m,{get disabled(){return $(p)},onclick:async()=>await Re("theme","auto"),help:"Synchroniser avec le thème du système",children:(g,h)=>{Vr(g,{})}}),C(l);var w=b(l,2),_=b(R(w));va(_,{get value(){return se().showTechnicalMetadata},onchange:async g=>{await Re("showTechnicalMetadata",g)}}),C(w);var M=b(w,2),E=R(M);Le(E,{onclick:async()=>{Z(r,!1),await qe("#/protocols")},children:(g,h)=>{de();var d=Ke("Gérer les protocoles");j(g,d)},$$slots:{default:!0}}),C(M);var T=b(M,2),y=R(T);Le(y,{onclick:()=>{var g;(g=a.openKeyboardShortcuts)==null||g.call(a)},children:(g,h)=>{de();var d=Ke("Raccourcis clavier");j(g,d)},$$slots:{default:!0}}),C(T);var S=b(T,2),L=b(R(S));L.__click=[Wr,r],C(S),C(v),C(c),fr(c,g=>Z(t,g),()=>$(t)),ee(g=>{ye(c,"data-theme",g),c.open=$(r)?!0:void 0},[()=>se().theme]),j(e,o),Ce()}qa(["click"]);var Yr=X('<div class="line svelte-14be6r"></div>'),et=X('<div class="line svelte-14be6r"></div>'),at=X('<div class="line svelte-14be6r"></div>'),rt=X('<div class="line svelte-14be6r"></div>'),tt=X("<!> Résultats",1),nt=X('<!> <header><nav class="svelte-14be6r"><a class="logo svelte-14be6r" href="#/"><svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper> C.i.g.a.l.e.</a> <div class="steps svelte-14be6r"><a href="#/" class="svelte-14be6r">Protocole <!></a> <!> <a href="#/import" class="svelte-14be6r">Importer <!></a> <!> <a href="#/crop" class="svelte-14be6r">Recadrer <!></a> <!> <a href="#/classify" class="svelte-14be6r">Classifier <!></a> <!> <!></div> <svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper></nav> <div><div class="completed svelte-14be6r"></div></div></header>',1);function ot(e,a){Oe(a,!0);let r=ya(a,"progress",3,0);const t=ve(()=>_a.url.hash.replace(/^#/,"")),n=ve(()=>J.Image.state.length>0);let o=ne(void 0),i=ne(void 0);_e(()=>{!$(n)&&!Y.currentProtocol&&qe("#/"),$(n)||qe("#/import")});var s=nt(),c=ge(s);Fr(c,{get open(){return $(i)},set open(x){Z(i,We(x))}});var v=b(c,2),l=R(v),f=R(l),u=R(f);la(u,()=>({"--fill":"var(--bg-primary)"})),Ya(u.lastChild,{}),C(u),de(),C(f);var m=b(f,2),p=R(m),w=b(R(p));{var _=x=>{var D=Yr();j(x,D)};fe(w,x=>{$(t)=="/"&&x(_)})}C(p);var M=b(p,2);Me(M,{});var E=b(M,2),T=b(R(E));{var y=x=>{var D=et();j(x,D)};fe(T,x=>{$(t)=="/import"&&x(y)})}C(E);var S=b(E,2);Me(S,{});var L=b(S,2),g=b(R(L));{var h=x=>{var D=at();j(x,D)};fe(g,x=>{$(t)=="/crop"&&x(h)})}C(L);var d=b(L,2);Me(d,{});var I=b(d,2),V=b(R(I));{var A=x=>{var D=rt();j(x,D)};fe(V,x=>{$(t)=="/classify"&&x(A)})}C(I);var P=b(I,2);Me(P,{});var z=b(P,2);Le(z,{get onclick(){return $(i)},children:(x,D)=>{var ae=tt(),re=ge(ae);ba(re,{}),de(),j(x,ae)},$$slots:{default:!0}}),C(m);var O=b(m,2);la(O,()=>({"--navbar-height":`${$(o)??""}px`})),Xr(O.lastChild,{get openKeyboardShortcuts(){return a.openKeyboardShortcuts}}),C(O),C(l);var F=b(l,2);let k;var N=R(F);let G;C(F),C(v),ee(x=>{ye(E,"aria-disabled",!Y.currentProtocol),ye(L,"aria-disabled",!Y.currentProtocol||!$(n)),ye(I,"aria-disabled",!Y.currentProtocol||!$(n)),k=wa(F,1,"global-progress-bar svelte-14be6r",null,k,x),G=Za(N,"",G,{width:`${r()*100}%`})},[()=>({inactive:[0,1].includes(r())})]),Xa(v,"clientHeight",x=>Z(o,x)),j(e,s),Ce()}var it=X("<base>"),st=X('<!> <!> <section class="toasts svelte-fbiwzh"></section> <div><!></div>',1);function Ht(e,a){Oe(a,!0),_e(()=>{for(const f of J.Image.state)Y.previewURLs.has(f.id)||(async()=>{const u=await pa("ImagePreviewFile",$a(f.id));if(!u)return;const m=new Blob([u.bytes],{type:f.contentType});Y.previewURLs.set(f.id,URL.createObjectURL(m))})()});const r=ve(se);_e(()=>{document.documentElement.dataset.theme=$(r).theme});let t=ne(void 0);var n=st();Ka(f=>{var u=it();ye(u,"href",He?`${He}/index.html`:""),j(f,u)});var o=ge(n);ot(o,{get openKeyboardShortcuts(){return $(t)},hasImages:!0,get progress(){return Y.processing.progress}});var i=b(o,2);Ja(i,{preventDefault:!0,get binds(){return Y.keybinds},get openHelp(){return $(t)},set openHelp(f){Z(t,We(f))}});var s=b(i,2);Va(s,21,()=>$e.items,f=>f.id,(f,u)=>{Wa(f,Ga(()=>$(u),{get action(){return $(u).labels.action},get dismiss(){return $(u).labels.close},onaction:()=>{var m,p;(p=(m=$(u).callbacks)==null?void 0:m.action)==null||p.call(m,$(u))},ondismiss:()=>{$e.remove($(u).id)}}))}),C(s);var c=b(s,2);let v;var l=R(c);Na(l,()=>a.children??za),C(c),ee(f=>v=wa(c,1,"contents svelte-fbiwzh",null,v,f),[()=>{var f;return{padded:!((f=_a.route.id)!=null&&f.includes("/(sidepanel)"))}}]),j(e,n),Ce()}export{Ht as component,Rt as universal};
