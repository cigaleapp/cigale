var tt=e=>{throw TypeError(e)};var jt=(e,t,n)=>t.has(e)||tt("Cannot "+n);var S=(e,t,n)=>(jt(e,t,"read from private field"),n?n.call(e):t.get(e)),x=(e,t,n)=>t.has(e)?tt("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,n);import{af as Te,aW as $t,s as C,g as O,b as N,aD as Dt}from"./DvvCRPia.js";import{a as Ft,b as P}from"./BV-mlfQC.js";import{o as nt}from"./DT6oxcNg.js";const M=[];function De(e,t=Te){let n=null;const r=new Set;function a(o){if($t(e,o)&&(e=o,n)){const c=!M.length;for(const l of r)l[1](),M.push(l,e);if(c){for(let l=0;l<M.length;l+=2)M[l][0](M[l+1]);M.length=0}}}function s(o){a(o(e))}function i(o,c=Te){const l=[o,c];return r.add(l),r.size===1&&(n=t(a,s)||Te),o(e),()=>{r.delete(l),r.size===0&&n&&(n(),n=null)}}return{set:a,update:s,subscribe:i}}new URL("sveltekit-internal://");function Vt(e,t){return e==="/"||t==="ignore"?e:t==="never"?e.endsWith("/")?e.slice(0,-1):e:t==="always"&&!e.endsWith("/")?e+"/":e}function Bt(e){return e.split("%25").map(decodeURI).join("%25")}function qt(e){for(const t in e)e[t]=decodeURIComponent(e[t]);return e}function xe({href:e}){return e.split("#")[0]}function Mt(e,t,n,r=!1){const a=new URL(e);Object.defineProperty(a,"searchParams",{value:new Proxy(a.searchParams,{get(i,o){if(o==="get"||o==="getAll"||o==="has")return l=>(n(l),i[o](l));t();const c=Reflect.get(i,o);return typeof c=="function"?c.bind(i):c}}),enumerable:!0,configurable:!0});const s=["href","pathname","search","toString","toJSON"];r&&s.push("hash");for(const i of s)Object.defineProperty(a,i,{get(){return t(),e[i]},enumerable:!0,configurable:!0});return a}function Gt(...e){let t=5381;for(const n of e)if(typeof n=="string"){let r=n.length;for(;r;)t=t*33^n.charCodeAt(--r)}else if(ArrayBuffer.isView(n)){const r=new Uint8Array(n.buffer,n.byteOffset,n.byteLength);let a=r.length;for(;a;)t=t*33^r[--a]}else throw new TypeError("value must be a string or TypedArray");return(t>>>0).toString(36)}function Ht(e){const t=atob(e),n=new Uint8Array(t.length);for(let r=0;r<t.length;r++)n[r]=t.charCodeAt(r);return n.buffer}const Kt=window.fetch;window.fetch=(e,t)=>((e instanceof Request?e.method:(t==null?void 0:t.method)||"GET")!=="GET"&&z.delete(Fe(e)),Kt(e,t));const z=new Map;function Wt(e,t){const n=Fe(e,t),r=document.querySelector(n);if(r!=null&&r.textContent){let{body:a,...s}=JSON.parse(r.textContent);const i=r.getAttribute("data-ttl");return i&&z.set(n,{body:a,init:s,ttl:1e3*Number(i)}),r.getAttribute("data-b64")!==null&&(a=Ht(a)),Promise.resolve(new Response(a,s))}return window.fetch(e,t)}function Yt(e,t,n){if(z.size>0){const r=Fe(e,n),a=z.get(r);if(a){if(performance.now()<a.ttl&&["default","force-cache","only-if-cached",void 0].includes(n==null?void 0:n.cache))return new Response(a.body,a.init);z.delete(r)}}return window.fetch(t,n)}function Fe(e,t){let r=`script[data-sveltekit-fetched][data-url=${JSON.stringify(e instanceof Request?e.url:e)}]`;if(t!=null&&t.headers||t!=null&&t.body){const a=[];t.headers&&a.push([...new Headers(t.headers)].join(",")),t.body&&(typeof t.body=="string"||ArrayBuffer.isView(t.body))&&a.push(t.body),r+=`[data-hash="${Gt(...a)}"]`}return r}const zt=/^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;function Jt(e){const t=[];return{pattern:e==="/"?/^\/$/:new RegExp(`^${Zt(e).map(r=>{const a=/^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(r);if(a)return t.push({name:a[1],matcher:a[2],optional:!1,rest:!0,chained:!0}),"(?:/(.*))?";const s=/^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(r);if(s)return t.push({name:s[1],matcher:s[2],optional:!0,rest:!1,chained:!0}),"(?:/([^/]+))?";if(!r)return;const i=r.split(/\[(.+?)\](?!\])/);return"/"+i.map((c,l)=>{if(l%2){if(c.startsWith("x+"))return Pe(String.fromCharCode(parseInt(c.slice(2),16)));if(c.startsWith("u+"))return Pe(String.fromCharCode(...c.slice(2).split("-").map(p=>parseInt(p,16))));const h=zt.exec(c),[,u,y,f,m]=h;return t.push({name:f,matcher:m,optional:!!u,rest:!!y,chained:y?l===1&&i[0]==="":!1}),y?"(.*?)":u?"([^/]*)?":"([^/]+?)"}return Pe(c)}).join("")}).join("")}/?$`),params:t}}function Xt(e){return!/^\([^)]+\)$/.test(e)}function Zt(e){return e.slice(1).split("/").filter(Xt)}function Qt(e,t,n){const r={},a=e.slice(1),s=a.filter(o=>o!==void 0);let i=0;for(let o=0;o<t.length;o+=1){const c=t[o];let l=a[o-i];if(c.chained&&c.rest&&i&&(l=a.slice(o-i,o+1).filter(h=>h).join("/"),i=0),l===void 0){c.rest&&(r[c.name]="");continue}if(!c.matcher||n[c.matcher](l)){r[c.name]=l;const h=t[o+1],u=a[o+1];h&&!h.rest&&h.optional&&u&&c.chained&&(i=0),!h&&!u&&Object.keys(r).length===s.length&&(i=0);continue}if(c.optional&&c.chained){i++;continue}return}if(!i)return r}function Pe(e){return e.normalize().replace(/[[\]]/g,"\\$&").replace(/%/g,"%25").replace(/\//g,"%2[Ff]").replace(/\?/g,"%3[Ff]").replace(/#/g,"%23").replace(/[.*+?^${}()|\\]/g,"\\$&")}function en({nodes:e,server_loads:t,dictionary:n,matchers:r}){const a=new Set(t);return Object.entries(n).map(([o,[c,l,h]])=>{const{pattern:u,params:y}=Jt(o),f={id:o,exec:m=>{const p=u.exec(m);if(p)return Qt(p,y,r)},errors:[1,...h||[]].map(m=>e[m]),layouts:[0,...l||[]].map(i),leaf:s(c)};return f.errors.length=f.layouts.length=Math.max(f.errors.length,f.layouts.length),f});function s(o){const c=o<0;return c&&(o=~o),[c,e[o]]}function i(o){return o===void 0?o:[a.has(o),e[o]]}}function gt(e,t=JSON.parse){try{return t(sessionStorage[e])}catch{}}function rt(e,t,n=JSON.stringify){const r=n(t);try{sessionStorage[e]=r}catch{}}const tn="4bcce6608f3819795d5f13132d99a2486a43901d",mt="sveltekit:snapshot",yt="sveltekit:scroll",Ve="sveltekit:states",wt="sveltekit:pageurl",B="sveltekit:history",K="sveltekit:navigation",F={tap:1,hover:2,viewport:3,eager:4,off:-1,false:-1},ue=location.origin;function Be(e){if(e instanceof URL)return e;let t=document.baseURI;if(!t){const n=document.getElementsByTagName("base");t=n.length?n[0].href:document.URL}return new URL(e,t)}function qe(){return{x:pageXOffset,y:pageYOffset}}function G(e,t){return e.getAttribute(`data-sveltekit-${t}`)}const at={...F,"":F.hover};function _t(e){let t=e.assignedSlot??e.parentNode;return(t==null?void 0:t.nodeType)===11&&(t=t.host),t}function vt(e,t){for(;e&&e!==t;){if(e.nodeName.toUpperCase()==="A"&&e.hasAttribute("href"))return e;e=_t(e)}}function Ne(e,t,n){let r;try{if(r=new URL(e instanceof SVGAElement?e.href.baseVal:e.href,document.baseURI),n&&r.hash.match(/^#[^/]/)){const o=location.hash.split("#")[1]||"/";r.hash=`#${o}${r.hash}`}}catch{}const a=e instanceof SVGAElement?e.target.baseVal:e.target,s=!r||!!a||Se(r,t,n)||(e.getAttribute("rel")||"").split(/\s+/).includes("external"),i=(r==null?void 0:r.origin)===ue&&e.hasAttribute("download");return{url:r,external:s,target:a,download:i}}function pe(e){let t=null,n=null,r=null,a=null,s=null,i=null,o=e;for(;o&&o!==document.documentElement;)r===null&&(r=G(o,"preload-code")),a===null&&(a=G(o,"preload-data")),t===null&&(t=G(o,"keepfocus")),n===null&&(n=G(o,"noscroll")),s===null&&(s=G(o,"reload")),i===null&&(i=G(o,"replacestate")),o=_t(o);function c(l){switch(l){case"":case"true":return!0;case"off":case"false":return!1;default:return}}return{preload_code:at[r??"off"],preload_data:at[a??"off"],keepfocus:c(t),noscroll:c(n),reload:c(s),replace_state:c(i)}}function ot(e){const t=De(e);let n=!0;function r(){n=!0,t.update(i=>i)}function a(i){n=!1,t.set(i)}function s(i){let o;return t.subscribe(c=>{(o===void 0||n&&c!==o)&&i(o=c)})}return{notify:r,set:a,subscribe:s}}const bt={v:()=>{}};function nn(){const{set:e,subscribe:t}=De(!1);let n;async function r(){clearTimeout(n);try{const a=await fetch(`${Ft}/_app/version.json`,{headers:{pragma:"no-cache","cache-control":"no-cache"}});if(!a.ok)return!1;const i=(await a.json()).version!==tn;return i&&(e(!0),bt.v(),clearTimeout(n)),i}catch{return!1}}return{subscribe:t,check:r}}function Se(e,t,n){return e.origin!==ue||!e.pathname.startsWith(t)?!0:n?!(e.pathname===t+"/"||e.pathname===t+"/index.html"||e.protocol==="file:"&&e.pathname.replace(/\/[^/]+\.html?$/,"")===t):!1}function qn(e){}function st(e){const t=an(e),n=new ArrayBuffer(t.length),r=new DataView(n);for(let a=0;a<n.byteLength;a++)r.setUint8(a,t.charCodeAt(a));return n}const rn="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function an(e){e.length%4===0&&(e=e.replace(/==?$/,""));let t="",n=0,r=0;for(let a=0;a<e.length;a++)n<<=6,n|=rn.indexOf(e[a]),r+=6,r===24&&(t+=String.fromCharCode((n&16711680)>>16),t+=String.fromCharCode((n&65280)>>8),t+=String.fromCharCode(n&255),n=r=0);return r===12?(n>>=4,t+=String.fromCharCode(n)):r===18&&(n>>=2,t+=String.fromCharCode((n&65280)>>8),t+=String.fromCharCode(n&255)),t}const on=-1,sn=-2,cn=-3,ln=-4,fn=-5,un=-6;function dn(e,t){if(typeof e=="number")return a(e,!0);if(!Array.isArray(e)||e.length===0)throw new Error("Invalid input");const n=e,r=Array(n.length);function a(s,i=!1){if(s===on)return;if(s===cn)return NaN;if(s===ln)return 1/0;if(s===fn)return-1/0;if(s===un)return-0;if(i)throw new Error("Invalid input");if(s in r)return r[s];const o=n[s];if(!o||typeof o!="object")r[s]=o;else if(Array.isArray(o))if(typeof o[0]=="string"){const c=o[0],l=t==null?void 0:t[c];if(l)return r[s]=l(a(o[1]));switch(c){case"Date":r[s]=new Date(o[1]);break;case"Set":const h=new Set;r[s]=h;for(let f=1;f<o.length;f+=1)h.add(a(o[f]));break;case"Map":const u=new Map;r[s]=u;for(let f=1;f<o.length;f+=2)u.set(a(o[f]),a(o[f+1]));break;case"RegExp":r[s]=new RegExp(o[1],o[2]);break;case"Object":r[s]=Object(o[1]);break;case"BigInt":r[s]=BigInt(o[1]);break;case"null":const y=Object.create(null);r[s]=y;for(let f=1;f<o.length;f+=2)y[o[f]]=a(o[f+1]);break;case"Int8Array":case"Uint8Array":case"Uint8ClampedArray":case"Int16Array":case"Uint16Array":case"Int32Array":case"Uint32Array":case"Float32Array":case"Float64Array":case"BigInt64Array":case"BigUint64Array":{const f=globalThis[c],m=o[1],p=st(m),d=new f(p);r[s]=d;break}case"ArrayBuffer":{const f=o[1],m=st(f);r[s]=m;break}default:throw new Error(`Unknown type ${c}`)}}else{const c=new Array(o.length);r[s]=c;for(let l=0;l<o.length;l+=1){const h=o[l];h!==sn&&(c[l]=a(h))}}else{const c={};r[s]=c;for(const l in o){const h=o[l];c[l]=a(h)}}return r[s]}return a(0)}const St=new Set(["load","prerender","csr","ssr","trailingSlash","config"]);[...St];const hn=new Set([...St]);[...hn];function pn(e){return e.filter(t=>t!=null)}class Ae{constructor(t,n){this.status=t,typeof n=="string"?this.body={message:n}:n?this.body=n:this.body={message:`Error: ${t}`}}toString(){return JSON.stringify(this.body)}}class Me{constructor(t,n){this.status=t,this.location=n}}class Ge extends Error{constructor(t,n,r){super(r),this.status=t,this.text=n}}const gn="x-sveltekit-invalidated",mn="x-sveltekit-trailing-slash";function ge(e){return e instanceof Ae||e instanceof Ge?e.status:500}function yn(e){return e instanceof Ge?e.text:"Internal Error"}let R,Z,Ce;const wn=nt.toString().includes("$$")||/function \w+\(\) \{\}/.test(nt.toString());var te,ne,re,ae,oe,se,ie,ce,dt,le,ht,fe,pt;wn?(R={data:{},form:null,error:null,params:{},route:{id:null},state:{},status:-1,url:new URL("https://example.com")},Z={current:null},Ce={current:!1}):(R=new(dt=class{constructor(){x(this,te,C({}));x(this,ne,C(null));x(this,re,C(null));x(this,ae,C({}));x(this,oe,C({id:null}));x(this,se,C({}));x(this,ie,C(-1));x(this,ce,C(new URL("https://example.com")))}get data(){return O(S(this,te))}set data(t){N(S(this,te),t)}get form(){return O(S(this,ne))}set form(t){N(S(this,ne),t)}get error(){return O(S(this,re))}set error(t){N(S(this,re),t)}get params(){return O(S(this,ae))}set params(t){N(S(this,ae),t)}get route(){return O(S(this,oe))}set route(t){N(S(this,oe),t)}get state(){return O(S(this,se))}set state(t){N(S(this,se),t)}get status(){return O(S(this,ie))}set status(t){N(S(this,ie),t)}get url(){return O(S(this,ce))}set url(t){N(S(this,ce),t)}},te=new WeakMap,ne=new WeakMap,re=new WeakMap,ae=new WeakMap,oe=new WeakMap,se=new WeakMap,ie=new WeakMap,ce=new WeakMap,dt),Z=new(ht=class{constructor(){x(this,le,C(null))}get current(){return O(S(this,le))}set current(t){N(S(this,le),t)}},le=new WeakMap,ht),Ce=new(pt=class{constructor(){x(this,fe,C(!1))}get current(){return O(S(this,fe))}set current(t){N(S(this,fe),t)}},fe=new WeakMap,pt),bt.v=()=>Ce.current=!0);function _n(e){Object.assign(R,e)}const vn="/__data.json",bn=".html__data.json";function Sn(e){return e.endsWith(".html")?e.replace(/\.html$/,bn):e.replace(/\/$/,"")+vn}const An=new Set(["icon","shortcut icon","apple-touch-icon"]),q=gt(yt)??{},Q=gt(mt)??{},$={url:ot({}),page:ot({}),navigating:De(null),updated:nn()};function Ee(e){q[e]=qe()}function At(e,t){let n=e+1;for(;q[n];)delete q[n],n+=1;for(n=t+1;Q[n];)delete Q[n],n+=1}function W(e){return location.href=e.href,new Promise(()=>{})}async function Et(){if("serviceWorker"in navigator){const e=await navigator.serviceWorker.getRegistration(P||"/");e&&await e.update()}}function it(){}let He,je,me,j,$e,A;const ye=[],we=[];let T=null;const de=new Map,kt=new Set,En=new Set,J=new Set;let v={branch:[],error:null,url:null},Ke=!1,_e=!1,ct=!0,ee=!1,Y=!1,We=!1,Ye=!1,ze,E,L,V;const X=new Set;async function Kn(e,t,n){var a,s,i,o;document.URL!==location.href&&(location.href=location.href),A=e,await((s=(a=e.hooks).init)==null?void 0:s.call(a)),He=en(e),j=document.documentElement,$e=t,je=e.nodes[0],me=e.nodes[1],je(),me(),E=(i=history.state)==null?void 0:i[B],L=(o=history.state)==null?void 0:o[K],E||(E=L=Date.now(),history.replaceState({...history.state,[B]:E,[K]:L},""));const r=q[E];r&&(history.scrollRestoration="manual",scrollTo(r.x,r.y)),n?await Nn($e,n):await Pn(A.hash?$n(new URL(location.href)):location.href,{replaceState:!0}),On()}function kn(){ye.length=0,Ye=!1}function Rt(e){we.some(t=>t==null?void 0:t.snapshot)&&(Q[e]=we.map(t=>{var n;return(n=t==null?void 0:t.snapshot)==null?void 0:n.capture()}))}function It(e){var t;(t=Q[e])==null||t.forEach((n,r)=>{var a,s;(s=(a=we[r])==null?void 0:a.snapshot)==null||s.restore(n)})}function lt(){Ee(E),rt(yt,q),Rt(L),rt(mt,Q)}async function Je(e,t,n,r){return he({type:"goto",url:Be(e),keepfocus:t.keepFocus,noscroll:t.noScroll,replace_state:t.replaceState,state:t.state,redirect_count:n,nav_token:r,accept:()=>{t.invalidateAll&&(Ye=!0),t.invalidate&&t.invalidate.forEach(Cn)}})}async function Rn(e){if(e.id!==(T==null?void 0:T.id)){const t={};X.add(t),T={id:e.id,token:t,promise:Tt({...e,preload:t}).then(n=>(X.delete(t),n.type==="loaded"&&n.state.error&&(T=null),n))}}return T.promise}async function Oe(e){var n;const t=(n=await Re(e,!1))==null?void 0:n.route;t&&await Promise.all([...t.layouts,t.leaf].map(r=>r==null?void 0:r[1]()))}function Ut(e,t,n){var s;v=e.state;const r=document.querySelector("style[data-sveltekit]");r&&r.remove(),Object.assign(R,e.props.page),ze=new A.root({target:t,props:{...e.props,stores:$,components:we},hydrate:n,sync:!1}),It(L);const a={from:null,to:{params:v.params,route:{id:((s=v.route)==null?void 0:s.id)??null},url:new URL(location.href)},willUnload:!1,type:"enter",complete:Promise.resolve()};J.forEach(i=>i(a)),_e=!0}function ve({url:e,params:t,branch:n,status:r,error:a,route:s,form:i}){let o="never";if(P&&(e.pathname===P||e.pathname===P+"/"))o="always";else for(const f of n)(f==null?void 0:f.slash)!==void 0&&(o=f.slash);e.pathname=Vt(e.pathname,o),e.search=e.search;const c={type:"loaded",state:{url:e,params:t,branch:n,error:a,route:s},props:{constructors:pn(n).map(f=>f.node.component),page:Ie(R)}};i!==void 0&&(c.props.form=i);let l={},h=!R,u=0;for(let f=0;f<Math.max(n.length,v.branch.length);f+=1){const m=n[f],p=v.branch[f];(m==null?void 0:m.data)!==(p==null?void 0:p.data)&&(h=!0),m&&(l={...l,...m.data},h&&(c.props[`data_${u}`]=l),u+=1)}return(!v.url||e.href!==v.url.href||v.error!==a||i!==void 0&&i!==R.form||h)&&(c.props.page={error:a,params:t,route:{id:(s==null?void 0:s.id)??null},state:{},status:r,url:new URL(e),form:i??null,data:h?l:R.data}),c}async function Xe({loader:e,parent:t,url:n,params:r,route:a,server_data_node:s}){var h,u,y;let i=null,o=!0;const c={dependencies:new Set,params:new Set,parent:!1,route:!1,url:!1,search_params:new Set},l=await e();if((h=l.universal)!=null&&h.load){let f=function(...p){for(const d of p){const{href:_}=new URL(d,n);c.dependencies.add(_)}};const m={route:new Proxy(a,{get:(p,d)=>(o&&(c.route=!0),p[d])}),params:new Proxy(r,{get:(p,d)=>(o&&c.params.add(d),p[d])}),data:(s==null?void 0:s.data)??null,url:Mt(n,()=>{o&&(c.url=!0)},p=>{o&&c.search_params.add(p)},A.hash),async fetch(p,d){p instanceof Request&&(d={body:p.method==="GET"||p.method==="HEAD"?void 0:await p.blob(),cache:p.cache,credentials:p.credentials,headers:[...p.headers].length?p.headers:void 0,integrity:p.integrity,keepalive:p.keepalive,method:p.method,mode:p.mode,redirect:p.redirect,referrer:p.referrer,referrerPolicy:p.referrerPolicy,signal:p.signal,...d});const{resolved:_,promise:I}=Lt(p,d,n);return o&&f(_.href),I},setHeaders:()=>{},depends:f,parent(){return o&&(c.parent=!0),t()},untrack(p){o=!1;try{return p()}finally{o=!0}}};i=await l.universal.load.call(null,m)??null}return{node:l,loader:e,server:s,universal:(u=l.universal)!=null&&u.load?{type:"data",data:i,uses:c}:null,data:i??(s==null?void 0:s.data)??null,slash:((y=l.universal)==null?void 0:y.trailingSlash)??(s==null?void 0:s.slash)}}function Lt(e,t,n){let r=e instanceof Request?e.url:e;const a=new URL(r,n);a.origin===n.origin&&(r=a.href.slice(n.origin.length));const s=_e?Yt(r,a.href,t):Wt(r,t);return{resolved:a,promise:s}}function ft(e,t,n,r,a,s){if(Ye)return!0;if(!a)return!1;if(a.parent&&e||a.route&&t||a.url&&n)return!0;for(const i of a.search_params)if(r.has(i))return!0;for(const i of a.params)if(s[i]!==v.params[i])return!0;for(const i of a.dependencies)if(ye.some(o=>o(new URL(i))))return!0;return!1}function Ze(e,t){return(e==null?void 0:e.type)==="data"?e:(e==null?void 0:e.type)==="skip"?t??null:null}function In(e,t){if(!e)return new Set(t.searchParams.keys());const n=new Set([...e.searchParams.keys(),...t.searchParams.keys()]);for(const r of n){const a=e.searchParams.getAll(r),s=t.searchParams.getAll(r);a.every(i=>s.includes(i))&&s.every(i=>a.includes(i))&&n.delete(r)}return n}function ut({error:e,url:t,route:n,params:r}){return{type:"loaded",state:{error:e,url:t,route:n,params:r,branch:[]},props:{page:Ie(R),constructors:[]}}}async function Tt({id:e,invalidating:t,url:n,params:r,route:a,preload:s}){if((T==null?void 0:T.id)===e)return X.delete(T.token),T.promise;const{errors:i,layouts:o,leaf:c}=a,l=[...o,c];i.forEach(g=>g==null?void 0:g().catch(()=>{})),l.forEach(g=>g==null?void 0:g[1]().catch(()=>{}));let h=null;const u=v.url?e!==be(v.url):!1,y=v.route?a.id!==v.route.id:!1,f=In(v.url,n);let m=!1;const p=l.map((g,w)=>{var D;const b=v.branch[w],k=!!(g!=null&&g[0])&&((b==null?void 0:b.loader)!==g[1]||ft(m,y,u,f,(D=b.server)==null?void 0:D.uses,r));return k&&(m=!0),k});if(p.some(Boolean)){try{h=await Ct(n,p)}catch(g){const w=await H(g,{url:n,params:r,route:{id:e}});return X.has(s)?ut({error:w,url:n,params:r,route:a}):ke({status:ge(g),error:w,url:n,route:a})}if(h.type==="redirect")return h}const d=h==null?void 0:h.nodes;let _=!1;const I=l.map(async(g,w)=>{var Ue;if(!g)return;const b=v.branch[w],k=d==null?void 0:d[w];if((!k||k.type==="skip")&&g[1]===(b==null?void 0:b.loader)&&!ft(_,y,u,f,(Ue=b.universal)==null?void 0:Ue.uses,r))return b;if(_=!0,(k==null?void 0:k.type)==="error")throw k;return Xe({loader:g[1],url:n,params:r,route:a,parent:async()=>{var et;const Qe={};for(let Le=0;Le<w;Le+=1)Object.assign(Qe,(et=await I[Le])==null?void 0:et.data);return Qe},server_data_node:Ze(k===void 0&&g[0]?{type:"skip"}:k??null,g[0]?b==null?void 0:b.server:void 0)})});for(const g of I)g.catch(()=>{});const U=[];for(let g=0;g<l.length;g+=1)if(l[g])try{U.push(await I[g])}catch(w){if(w instanceof Me)return{type:"redirect",location:w.location};if(X.has(s))return ut({error:await H(w,{params:r,url:n,route:{id:a.id}}),url:n,params:r,route:a});let b=ge(w),k;if(d!=null&&d.includes(w))b=w.status??b,k=w.error;else if(w instanceof Ae)k=w.body;else{if(await $.updated.check())return await Et(),await W(n);k=await H(w,{params:r,url:n,route:{id:a.id}})}const D=await Un(g,U,i);return D?ve({url:n,params:r,branch:U.slice(0,D.idx).concat(D.node),status:b,error:k,route:a}):await Pt(n,{id:a.id},k,b)}else U.push(void 0);return ve({url:n,params:r,branch:U,status:200,error:null,route:a,form:t?void 0:null})}async function Un(e,t,n){for(;e--;)if(n[e]){let r=e;for(;!t[r];)r-=1;try{return{idx:r+1,node:{node:await n[e](),loader:n[e],data:{},server:null,universal:null}}}catch{continue}}}async function ke({status:e,error:t,url:n,route:r}){const a={};let s=null;if(A.server_loads[0]===0)try{const o=await Ct(n,[!0]);if(o.type!=="data"||o.nodes[0]&&o.nodes[0].type!=="data")throw 0;s=o.nodes[0]??null}catch{(n.origin!==ue||n.pathname!==location.pathname||Ke)&&await W(n)}try{const o=await Xe({loader:je,url:n,params:a,route:r,parent:()=>Promise.resolve({}),server_data_node:Ze(s)}),c={node:await me(),loader:me,universal:null,server:null,data:null};return ve({url:n,params:a,branch:[o,c],status:e,error:t,route:null})}catch(o){if(o instanceof Me)return Je(new URL(o.location,location.href),{},0);throw o}}async function Ln(e){const t=e.href;if(de.has(t))return de.get(t);let n;try{const r=(async()=>{let a=await A.hooks.reroute({url:new URL(e),fetch:async(s,i)=>Lt(s,i,e).promise})??e;if(typeof a=="string"){const s=new URL(e);A.hash?s.hash=a:s.pathname=a,a=s}return a})();de.set(t,r),n=await r}catch{de.delete(t);return}return n}async function Re(e,t){if(e&&!Se(e,P,A.hash)){const n=await Ln(e);if(!n)return;const r=Tn(n);for(const a of He){const s=a.exec(r);if(s)return{id:be(e),invalidating:t,route:a,params:qt(s),url:e}}}}function Tn(e){return Bt(A.hash?e.hash.replace(/^#/,"").replace(/[?#].+/,""):e.pathname.slice(P.length))||"/"}function be(e){return(A.hash?e.hash.replace(/^#/,""):e.pathname)+e.search}function xt({url:e,type:t,intent:n,delta:r}){let a=!1;const s=Nt(v,n,e,t);r!==void 0&&(s.navigation.delta=r);const i={...s.navigation,cancel:()=>{a=!0,s.reject(new Error("navigation cancelled"))}};return ee||kt.forEach(o=>o(i)),a?null:s}async function he({type:e,url:t,popped:n,keepfocus:r,noscroll:a,replace_state:s,state:i={},redirect_count:o=0,nav_token:c={},accept:l=it,block:h=it}){const u=V;V=c;const y=await Re(t,!1),f=xt({url:t,type:e,delta:n==null?void 0:n.delta,intent:y});if(!f){h(),V===c&&(V=u);return}const m=E,p=L;l(),ee=!0,_e&&$.navigating.set(Z.current=f.navigation);let d=y&&await Tt(y);if(!d){if(Se(t,P,A.hash))return await W(t);d=await Pt(t,{id:null},await H(new Ge(404,"Not Found",`Not found: ${t.pathname}`),{url:t,params:{},route:{id:null}}),404)}if(t=(y==null?void 0:y.url)||t,V!==c)return f.reject(new Error("navigation aborted")),!1;if(d.type==="redirect")if(o>=20)d=await ke({status:500,error:await H(new Error("Redirect loop"),{url:t,params:{},route:{id:null}}),url:t,route:{id:null}});else return await Je(new URL(d.location,t).href,{},o+1,c),!1;else d.props.page.status>=400&&await $.updated.check()&&(await Et(),await W(t));if(kn(),Ee(m),Rt(p),d.props.page.url.pathname!==t.pathname&&(t.pathname=d.props.page.url.pathname),i=n?n.state:i,!n){const g=s?0:1,w={[B]:E+=g,[K]:L+=g,[Ve]:i};(s?history.replaceState:history.pushState).call(history,w,"",t),s||At(E,L)}if(T=null,d.props.page.state=i,_e){v=d.state,d.props.page&&(d.props.page.url=t);const g=(await Promise.all(Array.from(En,w=>w(f.navigation)))).filter(w=>typeof w=="function");if(g.length>0){let w=function(){g.forEach(b=>{J.delete(b)})};g.push(w),g.forEach(b=>{J.add(b)})}ze.$set(d.props),_n(d.props.page),We=!0}else Ut(d,$e,!1);const{activeElement:_}=document;await Dt();const I=n?n.scroll:a?qe():null;if(ct){const g=t.hash&&document.getElementById(decodeURIComponent(A.hash?t.hash.split("#")[2]??"":t.hash.slice(1)));I?scrollTo(I.x,I.y):g?g.scrollIntoView():scrollTo(0,0)}const U=document.activeElement!==_&&document.activeElement!==document.body;!r&&!U&&jn(),ct=!0,d.props.page&&Object.assign(R,d.props.page),ee=!1,e==="popstate"&&It(L),f.fulfil(void 0),J.forEach(g=>g(f.navigation)),$.navigating.set(Z.current=null)}async function Pt(e,t,n,r){return e.origin===ue&&e.pathname===location.pathname&&!Ke?await ke({status:r,error:n,url:e,route:t}):await W(e)}function xn(){let e,t,n;j.addEventListener("mousemove",o=>{const c=o.target;clearTimeout(e),e=setTimeout(()=>{s(c,F.hover)},20)});function r(o){o.defaultPrevented||s(o.composedPath()[0],F.tap)}j.addEventListener("mousedown",r),j.addEventListener("touchstart",r,{passive:!0});const a=new IntersectionObserver(o=>{for(const c of o)c.isIntersecting&&(Oe(new URL(c.target.href)),a.unobserve(c.target))},{threshold:0});async function s(o,c){const l=vt(o,j),h=l===t&&c>=n;if(!l||h)return;const{url:u,external:y,download:f}=Ne(l,P,A.hash);if(y||f)return;const m=pe(l),p=u&&be(v.url)===be(u);if(!(m.reload||p))if(c<=m.preload_data){t=l,n=F.tap;const d=await Re(u,!1);if(!d)return;Rn(d)}else c<=m.preload_code&&(t=l,n=c,Oe(u))}function i(){a.disconnect();for(const o of j.querySelectorAll("a")){const{url:c,external:l,download:h}=Ne(o,P,A.hash);if(l||h)continue;const u=pe(o);u.reload||(u.preload_code===F.viewport&&a.observe(o),u.preload_code===F.eager&&Oe(c))}}J.add(i),i()}function H(e,t){if(e instanceof Ae)return e.body;const n=ge(e),r=yn(e);return A.hooks.handleError({error:e,event:t,status:n,message:r})??{message:r}}function Pn(e,t={}){return e=new URL(Be(e)),e.origin!==ue?Promise.reject(new Error("goto: invalid URL")):Je(e,t,0)}function Cn(e){if(typeof e=="function")ye.push(e);else{const{href:t}=new URL(e,location.href);ye.push(n=>n.href===t)}}function Wn(e,t){Ee(E);const n={[B]:E+=1,[K]:L,[wt]:R.url.href,[Ve]:t};history.pushState(n,"",Be(e)),We=!0,R.state=t,ze.$set({page:Ie(R)}),At(E,L)}function On(){var t;history.scrollRestoration="manual",addEventListener("beforeunload",n=>{let r=!1;if(lt(),!ee){const a=Nt(v,void 0,null,"leave"),s={...a.navigation,cancel:()=>{r=!0,a.reject(new Error("navigation cancelled"))}};kt.forEach(i=>i(s))}r?(n.preventDefault(),n.returnValue=""):history.scrollRestoration="auto"}),addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&lt()}),(t=navigator.connection)!=null&&t.saveData||xn(),j.addEventListener("click",async n=>{if(n.button||n.which!==1||n.metaKey||n.ctrlKey||n.shiftKey||n.altKey||n.defaultPrevented)return;const r=vt(n.composedPath()[0],j);if(!r)return;const{url:a,external:s,target:i,download:o}=Ne(r,P,A.hash);if(!a)return;if(i==="_parent"||i==="_top"){if(window.parent!==window)return}else if(i&&i!=="_self")return;const c=pe(r);if(!(r instanceof SVGAElement)&&a.protocol!==location.protocol&&!(a.protocol==="https:"||a.protocol==="http:")||o)return;const[h,u]=(A.hash?a.hash.replace(/^#/,""):a.href).split("#"),y=h===xe(location);if(s||c.reload&&(!y||!u)){xt({url:a,type:"link"})?ee=!0:n.preventDefault();return}if(u!==void 0&&y){const[,f]=v.url.href.split("#");if(f===u){if(n.preventDefault(),u===""||u==="top"&&r.ownerDocument.getElementById("top")===null)window.scrollTo({top:0});else{const m=r.ownerDocument.getElementById(decodeURIComponent(u));m&&(m.scrollIntoView(),m.focus())}return}if(Y=!0,Ee(E),e(a),!c.replace_state)return;Y=!1}n.preventDefault(),await new Promise(f=>{requestAnimationFrame(()=>{setTimeout(f,0)}),setTimeout(f,100)}),await he({type:"link",url:a,keepfocus:c.keepfocus,noscroll:c.noscroll,replace_state:c.replace_state??a.href===location.href})}),j.addEventListener("submit",n=>{if(n.defaultPrevented)return;const r=HTMLFormElement.prototype.cloneNode.call(n.target),a=n.submitter;if(((a==null?void 0:a.formTarget)||r.target)==="_blank"||((a==null?void 0:a.formMethod)||r.method)!=="get")return;const o=new URL((a==null?void 0:a.hasAttribute("formaction"))&&(a==null?void 0:a.formAction)||r.action);if(Se(o,P,!1))return;const c=n.target,l=pe(c);if(l.reload)return;n.preventDefault(),n.stopPropagation();const h=new FormData(c),u=a==null?void 0:a.getAttribute("name");u&&h.append(u,(a==null?void 0:a.getAttribute("value"))??""),o.search=new URLSearchParams(h).toString(),he({type:"form",url:o,keepfocus:l.keepfocus,noscroll:l.noscroll,replace_state:l.replace_state??o.href===location.href})}),addEventListener("popstate",async n=>{var r;if((r=n.state)!=null&&r[B]){const a=n.state[B];if(V={},a===E)return;const s=q[a],i=n.state[Ve]??{},o=new URL(n.state[wt]??location.href),c=n.state[K],l=v.url?xe(location)===xe(v.url):!1;if(c===L&&(We||l)){i!==R.state&&(R.state=i),e(o),q[E]=qe(),s&&scrollTo(s.x,s.y),E=a;return}const u=a-E;await he({type:"popstate",url:o,popped:{state:i,scroll:s,delta:u},accept:()=>{E=a,L=c},block:()=>{history.go(-u)},nav_token:V})}else if(!Y){const a=new URL(location.href);e(a),A.hash&&location.reload()}}),addEventListener("hashchange",()=>{Y&&(Y=!1,history.replaceState({...history.state,[B]:++E,[K]:L},"",location.href))});for(const n of document.querySelectorAll("link"))An.has(n.rel)&&(n.href=n.href);addEventListener("pageshow",n=>{n.persisted&&$.navigating.set(Z.current=null)});function e(n){v.url=R.url=n,$.page.set(Ie(R)),$.page.notify()}}async function Nn(e,{status:t=200,error:n,node_ids:r,params:a,route:s,server_route:i,data:o,form:c}){Ke=!0;const l=new URL(location.href);let h;({params:a={},route:s={id:null}}=await Re(l,!1)||{}),h=He.find(({id:f})=>f===s.id);let u,y=!0;try{const f=r.map(async(p,d)=>{const _=o[d];return _!=null&&_.uses&&(_.uses=Ot(_.uses)),Xe({loader:A.nodes[p],url:l,params:a,route:s,parent:async()=>{const I={};for(let U=0;U<d;U+=1)Object.assign(I,(await f[U]).data);return I},server_data_node:Ze(_)})}),m=await Promise.all(f);if(h){const p=h.layouts;for(let d=0;d<p.length;d++)p[d]||m.splice(d,0,void 0)}u=ve({url:l,params:a,branch:m,status:t,error:n,form:c,route:h??null})}catch(f){if(f instanceof Me){await W(new URL(f.location,location.href));return}u=await ke({status:ge(f),error:await H(f,{url:l,params:a,route:s}),url:l,route:s}),e.textContent="",y=!1}u.props.page&&(u.props.page.state={}),Ut(u,e,y)}async function Ct(e,t){var s;const n=new URL(e);n.pathname=Sn(e.pathname),e.pathname.endsWith("/")&&n.searchParams.append(mn,"1"),n.searchParams.append(gn,t.map(i=>i?"1":"0").join(""));const r=window.fetch,a=await r(n.href,{});if(!a.ok){let i;throw(s=a.headers.get("content-type"))!=null&&s.includes("application/json")?i=await a.json():a.status===404?i="Not Found":a.status===500&&(i="Internal Error"),new Ae(a.status,i)}return new Promise(async i=>{var y;const o=new Map,c=a.body.getReader(),l=new TextDecoder;function h(f){return dn(f,{...A.decoders,Promise:m=>new Promise((p,d)=>{o.set(m,{fulfil:p,reject:d})})})}let u="";for(;;){const{done:f,value:m}=await c.read();if(f&&!u)break;for(u+=!m&&u?`
`:l.decode(m,{stream:!0});;){const p=u.indexOf(`
`);if(p===-1)break;const d=JSON.parse(u.slice(0,p));if(u=u.slice(p+1),d.type==="redirect")return i(d);if(d.type==="data")(y=d.nodes)==null||y.forEach(_=>{(_==null?void 0:_.type)==="data"&&(_.uses=Ot(_.uses),_.data=h(_.data))}),i(d);else if(d.type==="chunk"){const{id:_,data:I,error:U}=d,g=o.get(_);o.delete(_),U?g.reject(h(U)):g.fulfil(h(I))}}}})}function Ot(e){return{dependencies:new Set((e==null?void 0:e.dependencies)??[]),params:new Set((e==null?void 0:e.params)??[]),parent:!!(e!=null&&e.parent),route:!!(e!=null&&e.route),url:!!(e!=null&&e.url),search_params:new Set((e==null?void 0:e.search_params)??[])}}function jn(){const e=document.querySelector("[autofocus]");if(e)e.focus();else{const t=document.body,n=t.getAttribute("tabindex");t.tabIndex=-1,t.focus({preventScroll:!0,focusVisible:!1}),n!==null?t.setAttribute("tabindex",n):t.removeAttribute("tabindex");const r=getSelection();if(r&&r.type!=="None"){const a=[];for(let s=0;s<r.rangeCount;s+=1)a.push(r.getRangeAt(s));setTimeout(()=>{if(r.rangeCount===a.length){for(let s=0;s<r.rangeCount;s+=1){const i=a[s],o=r.getRangeAt(s);if(i.commonAncestorContainer!==o.commonAncestorContainer||i.startContainer!==o.startContainer||i.endContainer!==o.endContainer||i.startOffset!==o.startOffset||i.endOffset!==o.endOffset)return}r.removeAllRanges()}})}}}function Nt(e,t,n,r){var c,l;let a,s;const i=new Promise((h,u)=>{a=h,s=u});return i.catch(()=>{}),{navigation:{from:{params:e.params,route:{id:((c=e.route)==null?void 0:c.id)??null},url:e.url},to:n&&{params:(t==null?void 0:t.params)??null,route:{id:((l=t==null?void 0:t.route)==null?void 0:l.id)??null},url:n},willUnload:!t,type:r,complete:i},fulfil:a,reject:s}}function Ie(e){return{data:e.data,error:e.error,form:e.form,params:e.params,route:e.route,state:e.state,status:e.status,url:e.url}}function $n(e){const t=new URL(e);return t.hash=decodeURIComponent(e.hash),t}export{Ae as H,Wn as a,Kn as b,Pn as g,qn as l,R as p,$ as s};
