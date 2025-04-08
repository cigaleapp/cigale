var nt=e=>{throw TypeError(e)};var jt=(e,t,n)=>t.has(e)||nt("Cannot "+n);var A=(e,t,n)=>(jt(e,t,"read from private field"),n?n.call(e):t.get(e)),x=(e,t,n)=>t.has(e)?nt("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,n);import{a7 as xe,aU as $t,s as C,g as O,b as N,aA as Dt}from"./BJJyANvY.js";import{assets as Ft,base as P}from"./CnxuDH8P.js";import{o as rt}from"./D-ALU6gj.js";const M=[];function Fe(e,t=xe){let n=null;const a=new Set;function r(o){if($t(e,o)&&(e=o,n)){const c=!M.length;for(const l of a)l[1](),M.push(l,e);if(c){for(let l=0;l<M.length;l+=2)M[l][0](M[l+1]);M.length=0}}}function s(o){r(o(e))}function i(o,c=xe){const l=[o,c];return a.add(l),a.size===1&&(n=t(r,s)||xe),o(e),()=>{a.delete(l),a.size===0&&n&&(n(),n=null)}}return{set:r,update:s,subscribe:i}}new URL("sveltekit-internal://");function Vt(e,t){return e==="/"||t==="ignore"?e:t==="never"?e.endsWith("/")?e.slice(0,-1):e:t==="always"&&!e.endsWith("/")?e+"/":e}function Bt(e){return e.split("%25").map(decodeURI).join("%25")}function qt(e){for(const t in e)e[t]=decodeURIComponent(e[t]);return e}function Pe({href:e}){return e.split("#")[0]}function Mt(e,t,n,a=!1){const r=new URL(e);Object.defineProperty(r,"searchParams",{value:new Proxy(r.searchParams,{get(i,o){if(o==="get"||o==="getAll"||o==="has")return l=>(n(l),i[o](l));t();const c=Reflect.get(i,o);return typeof c=="function"?c.bind(i):c}}),enumerable:!0,configurable:!0});const s=["href","pathname","search","toString","toJSON"];a&&s.push("hash");for(const i of s)Object.defineProperty(r,i,{get(){return t(),e[i]},enumerable:!0,configurable:!0});return r}function Gt(...e){let t=5381;for(const n of e)if(typeof n=="string"){let a=n.length;for(;a;)t=t*33^n.charCodeAt(--a)}else if(ArrayBuffer.isView(n)){const a=new Uint8Array(n.buffer,n.byteOffset,n.byteLength);let r=a.length;for(;r;)t=t*33^a[--r]}else throw new TypeError("value must be a string or TypedArray");return(t>>>0).toString(36)}function Ht(e){const t=atob(e),n=new Uint8Array(t.length);for(let a=0;a<t.length;a++)n[a]=t.charCodeAt(a);return n.buffer}const Kt=window.fetch;window.fetch=(e,t)=>((e instanceof Request?e.method:(t==null?void 0:t.method)||"GET")!=="GET"&&z.delete(Ve(e)),Kt(e,t));const z=new Map;function Wt(e,t){const n=Ve(e,t),a=document.querySelector(n);if(a!=null&&a.textContent){let{body:r,...s}=JSON.parse(a.textContent);const i=a.getAttribute("data-ttl");return i&&z.set(n,{body:r,init:s,ttl:1e3*Number(i)}),a.getAttribute("data-b64")!==null&&(r=Ht(r)),Promise.resolve(new Response(r,s))}return window.fetch(e,t)}function Yt(e,t,n){if(z.size>0){const a=Ve(e,n),r=z.get(a);if(r){if(performance.now()<r.ttl&&["default","force-cache","only-if-cached",void 0].includes(n==null?void 0:n.cache))return new Response(r.body,r.init);z.delete(a)}}return window.fetch(t,n)}function Ve(e,t){let a=`script[data-sveltekit-fetched][data-url=${JSON.stringify(e instanceof Request?e.url:e)}]`;if(t!=null&&t.headers||t!=null&&t.body){const r=[];t.headers&&r.push([...new Headers(t.headers)].join(",")),t.body&&(typeof t.body=="string"||ArrayBuffer.isView(t.body))&&r.push(t.body),a+=`[data-hash="${Gt(...r)}"]`}return a}const zt=/^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;function Jt(e){const t=[];return{pattern:e==="/"?/^\/$/:new RegExp(`^${Zt(e).map(a=>{const r=/^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(a);if(r)return t.push({name:r[1],matcher:r[2],optional:!1,rest:!0,chained:!0}),"(?:/(.*))?";const s=/^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(a);if(s)return t.push({name:s[1],matcher:s[2],optional:!0,rest:!1,chained:!0}),"(?:/([^/]+))?";if(!a)return;const i=a.split(/\[(.+?)\](?!\])/);return"/"+i.map((c,l)=>{if(l%2){if(c.startsWith("x+"))return Ce(String.fromCharCode(parseInt(c.slice(2),16)));if(c.startsWith("u+"))return Ce(String.fromCharCode(...c.slice(2).split("-").map(p=>parseInt(p,16))));const h=zt.exec(c),[,u,w,f,m]=h;return t.push({name:f,matcher:m,optional:!!u,rest:!!w,chained:w?l===1&&i[0]==="":!1}),w?"(.*?)":u?"([^/]*)?":"([^/]+?)"}return Ce(c)}).join("")}).join("")}/?$`),params:t}}function Xt(e){return!/^\([^)]+\)$/.test(e)}function Zt(e){return e.slice(1).split("/").filter(Xt)}function Qt(e,t,n){const a={},r=e.slice(1),s=r.filter(o=>o!==void 0);let i=0;for(let o=0;o<t.length;o+=1){const c=t[o];let l=r[o-i];if(c.chained&&c.rest&&i&&(l=r.slice(o-i,o+1).filter(h=>h).join("/"),i=0),l===void 0){c.rest&&(a[c.name]="");continue}if(!c.matcher||n[c.matcher](l)){a[c.name]=l;const h=t[o+1],u=r[o+1];h&&!h.rest&&h.optional&&u&&c.chained&&(i=0),!h&&!u&&Object.keys(a).length===s.length&&(i=0);continue}if(c.optional&&c.chained){i++;continue}return}if(!i)return a}function Ce(e){return e.normalize().replace(/[[\]]/g,"\\$&").replace(/%/g,"%25").replace(/\//g,"%2[Ff]").replace(/\?/g,"%3[Ff]").replace(/#/g,"%23").replace(/[.*+?^${}()|\\]/g,"\\$&")}function en({nodes:e,server_loads:t,dictionary:n,matchers:a}){const r=new Set(t);return Object.entries(n).map(([o,[c,l,h]])=>{const{pattern:u,params:w}=Jt(o),f={id:o,exec:m=>{const p=u.exec(m);if(p)return Qt(p,w,a)},errors:[1,...h||[]].map(m=>e[m]),layouts:[0,...l||[]].map(i),leaf:s(c)};return f.errors.length=f.layouts.length=Math.max(f.errors.length,f.layouts.length),f});function s(o){const c=o<0;return c&&(o=~o),[c,e[o]]}function i(o){return o===void 0?o:[r.has(o),e[o]]}}function mt(e,t=JSON.parse){try{return t(sessionStorage[e])}catch{}}function at(e,t,n=JSON.stringify){const a=n(t);try{sessionStorage[e]=a}catch{}}const tn="b1526e05628499c6cf60090b91c4f1e426020a19",wt="sveltekit:snapshot",yt="sveltekit:scroll",Be="sveltekit:states",_t="sveltekit:pageurl",B="sveltekit:history",K="sveltekit:navigation",F={tap:1,hover:2,viewport:3,eager:4,off:-1,false:-1},de=location.origin;function Ae(e){if(e instanceof URL)return e;let t=document.baseURI;if(!t){const n=document.getElementsByTagName("base");t=n.length?n[0].href:document.URL}return new URL(e,t)}function qe(){return{x:pageXOffset,y:pageYOffset}}function G(e,t){return e.getAttribute(`data-sveltekit-${t}`)}const ot={...F,"":F.hover};function vt(e){let t=e.assignedSlot??e.parentNode;return(t==null?void 0:t.nodeType)===11&&(t=t.host),t}function bt(e,t){for(;e&&e!==t;){if(e.nodeName.toUpperCase()==="A"&&e.hasAttribute("href"))return e;e=vt(e)}}function je(e,t,n){let a;try{if(a=new URL(e instanceof SVGAElement?e.href.baseVal:e.href,document.baseURI),n&&a.hash.match(/^#[^/]/)){const o=location.hash.split("#")[1]||"/";a.hash=`#${o}${a.hash}`}}catch{}const r=e instanceof SVGAElement?e.target.baseVal:e.target,s=!a||!!r||Se(a,t,n)||(e.getAttribute("rel")||"").split(/\s+/).includes("external"),i=(a==null?void 0:a.origin)===de&&e.hasAttribute("download");return{url:a,external:s,target:r,download:i}}function pe(e){let t=null,n=null,a=null,r=null,s=null,i=null,o=e;for(;o&&o!==document.documentElement;)a===null&&(a=G(o,"preload-code")),r===null&&(r=G(o,"preload-data")),t===null&&(t=G(o,"keepfocus")),n===null&&(n=G(o,"noscroll")),s===null&&(s=G(o,"reload")),i===null&&(i=G(o,"replacestate")),o=vt(o);function c(l){switch(l){case"":case"true":return!0;case"off":case"false":return!1;default:return}}return{preload_code:ot[a??"off"],preload_data:ot[r??"off"],keepfocus:c(t),noscroll:c(n),reload:c(s),replace_state:c(i)}}function st(e){const t=Fe(e);let n=!0;function a(){n=!0,t.update(i=>i)}function r(i){n=!1,t.set(i)}function s(i){let o;return t.subscribe(c=>{(o===void 0||n&&c!==o)&&i(o=c)})}return{notify:a,set:r,subscribe:s}}const At={v:()=>{}};function nn(){const{set:e,subscribe:t}=Fe(!1);let n;async function a(){clearTimeout(n);try{const r=await fetch(`${Ft}/_app/version.json`,{headers:{pragma:"no-cache","cache-control":"no-cache"}});if(!r.ok)return!1;const i=(await r.json()).version!==tn;return i&&(e(!0),At.v(),clearTimeout(n)),i}catch{return!1}}return{subscribe:t,check:a}}function Se(e,t,n){return e.origin!==de||!e.pathname.startsWith(t)?!0:n?!(e.pathname===t+"/"||e.pathname===t+"/index.html"||e.protocol==="file:"&&e.pathname.replace(/\/[^/]+\.html?$/,"")===t):!1}function Bn(e){}function it(e){const t=an(e),n=new ArrayBuffer(t.length),a=new DataView(n);for(let r=0;r<n.byteLength;r++)a.setUint8(r,t.charCodeAt(r));return n}const rn="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function an(e){e.length%4===0&&(e=e.replace(/==?$/,""));let t="",n=0,a=0;for(let r=0;r<e.length;r++)n<<=6,n|=rn.indexOf(e[r]),a+=6,a===24&&(t+=String.fromCharCode((n&16711680)>>16),t+=String.fromCharCode((n&65280)>>8),t+=String.fromCharCode(n&255),n=a=0);return a===12?(n>>=4,t+=String.fromCharCode(n)):a===18&&(n>>=2,t+=String.fromCharCode((n&65280)>>8),t+=String.fromCharCode(n&255)),t}const on=-1,sn=-2,cn=-3,ln=-4,fn=-5,un=-6;function dn(e,t){if(typeof e=="number")return r(e,!0);if(!Array.isArray(e)||e.length===0)throw new Error("Invalid input");const n=e,a=Array(n.length);function r(s,i=!1){if(s===on)return;if(s===cn)return NaN;if(s===ln)return 1/0;if(s===fn)return-1/0;if(s===un)return-0;if(i)throw new Error("Invalid input");if(s in a)return a[s];const o=n[s];if(!o||typeof o!="object")a[s]=o;else if(Array.isArray(o))if(typeof o[0]=="string"){const c=o[0],l=t==null?void 0:t[c];if(l)return a[s]=l(r(o[1]));switch(c){case"Date":a[s]=new Date(o[1]);break;case"Set":const h=new Set;a[s]=h;for(let f=1;f<o.length;f+=1)h.add(r(o[f]));break;case"Map":const u=new Map;a[s]=u;for(let f=1;f<o.length;f+=2)u.set(r(o[f]),r(o[f+1]));break;case"RegExp":a[s]=new RegExp(o[1],o[2]);break;case"Object":a[s]=Object(o[1]);break;case"BigInt":a[s]=BigInt(o[1]);break;case"null":const w=Object.create(null);a[s]=w;for(let f=1;f<o.length;f+=2)w[o[f]]=r(o[f+1]);break;case"Int8Array":case"Uint8Array":case"Uint8ClampedArray":case"Int16Array":case"Uint16Array":case"Int32Array":case"Uint32Array":case"Float32Array":case"Float64Array":case"BigInt64Array":case"BigUint64Array":{const f=globalThis[c],m=o[1],p=it(m),d=new f(p);a[s]=d;break}case"ArrayBuffer":{const f=o[1],m=it(f);a[s]=m;break}default:throw new Error(`Unknown type ${c}`)}}else{const c=new Array(o.length);a[s]=c;for(let l=0;l<o.length;l+=1){const h=o[l];h!==sn&&(c[l]=r(h))}}else{const c={};a[s]=c;for(const l in o){const h=o[l];c[l]=r(h)}}return a[s]}return r(0)}const St=new Set(["load","prerender","csr","ssr","trailingSlash","config"]);[...St];const hn=new Set([...St]);[...hn];function pn(e){return e.filter(t=>t!=null)}class Ee{constructor(t,n){this.status=t,typeof n=="string"?this.body={message:n}:n?this.body=n:this.body={message:`Error: ${t}`}}toString(){return JSON.stringify(this.body)}}class Me{constructor(t,n){this.status=t,this.location=n}}class Ge extends Error{constructor(t,n,a){super(a),this.status=t,this.text=n}}const gn="x-sveltekit-invalidated",mn="x-sveltekit-trailing-slash";function ge(e){return e instanceof Ee||e instanceof Ge?e.status:500}function wn(e){return e instanceof Ge?e.text:"Internal Error"}let R,Q,Oe;const yn=rt.toString().includes("$$")||/function \w+\(\) \{\}/.test(rt.toString());var ne,re,ae,oe,se,ie,ce,le,ht,fe,pt,ue,gt;yn?(R={data:{},form:null,error:null,params:{},route:{id:null},state:{},status:-1,url:new URL("https://example.com")},Q={current:null},Oe={current:!1}):(R=new(ht=class{constructor(){x(this,ne,C({}));x(this,re,C(null));x(this,ae,C(null));x(this,oe,C({}));x(this,se,C({id:null}));x(this,ie,C({}));x(this,ce,C(-1));x(this,le,C(new URL("https://example.com")))}get data(){return O(A(this,ne))}set data(t){N(A(this,ne),t)}get form(){return O(A(this,re))}set form(t){N(A(this,re),t)}get error(){return O(A(this,ae))}set error(t){N(A(this,ae),t)}get params(){return O(A(this,oe))}set params(t){N(A(this,oe),t)}get route(){return O(A(this,se))}set route(t){N(A(this,se),t)}get state(){return O(A(this,ie))}set state(t){N(A(this,ie),t)}get status(){return O(A(this,ce))}set status(t){N(A(this,ce),t)}get url(){return O(A(this,le))}set url(t){N(A(this,le),t)}},ne=new WeakMap,re=new WeakMap,ae=new WeakMap,oe=new WeakMap,se=new WeakMap,ie=new WeakMap,ce=new WeakMap,le=new WeakMap,ht),Q=new(pt=class{constructor(){x(this,fe,C(null))}get current(){return O(A(this,fe))}set current(t){N(A(this,fe),t)}},fe=new WeakMap,pt),Oe=new(gt=class{constructor(){x(this,ue,C(!1))}get current(){return O(A(this,ue))}set current(t){N(A(this,ue),t)}},ue=new WeakMap,gt),At.v=()=>Oe.current=!0);function _n(e){Object.assign(R,e)}const vn="/__data.json",bn=".html__data.json";function An(e){return e.endsWith(".html")?e.replace(/\.html$/,bn):e.replace(/\/$/,"")+vn}const Sn=new Set(["icon","shortcut icon","apple-touch-icon"]),q=mt(yt)??{},ee=mt(wt)??{},$={url:st({}),page:st({}),navigating:Fe(null),updated:nn()};function ke(e){q[e]=qe()}function Et(e,t){let n=e+1;for(;q[n];)delete q[n],n+=1;for(n=t+1;ee[n];)delete ee[n],n+=1}function W(e){return location.href=e.href,new Promise(()=>{})}async function kt(){if("serviceWorker"in navigator){const e=await navigator.serviceWorker.getRegistration(P||"/");e&&await e.update()}}function ct(){}let He,$e,me,j,De,S;const we=[],ye=[];let T=null;const he=new Map,Rt=new Set,En=new Set,J=new Set;let v={branch:[],error:null,url:null},Ke=!1,_e=!1,lt=!0,te=!1,Y=!1,We=!1,Ye=!1,ze,E,L,V;const X=new Set;async function Hn(e,t,n){var r,s,i,o;document.URL!==location.href&&(location.href=location.href),S=e,await((s=(r=e.hooks).init)==null?void 0:s.call(r)),He=en(e),j=document.documentElement,De=t,$e=e.nodes[0],me=e.nodes[1],$e(),me(),E=(i=history.state)==null?void 0:i[B],L=(o=history.state)==null?void 0:o[K],E||(E=L=Date.now(),history.replaceState({...history.state,[B]:E,[K]:L},""));const a=q[E];a&&(history.scrollRestoration="manual",scrollTo(a.x,a.y)),n?await On(De,n):await Z({type:"enter",url:Ae(S.hash?jn(new URL(location.href)):location.href),replace_state:!0}),Cn()}function kn(){we.length=0,Ye=!1}function It(e){ye.some(t=>t==null?void 0:t.snapshot)&&(ee[e]=ye.map(t=>{var n;return(n=t==null?void 0:t.snapshot)==null?void 0:n.capture()}))}function Ut(e){var t;(t=ee[e])==null||t.forEach((n,a)=>{var r,s;(s=(r=ye[a])==null?void 0:r.snapshot)==null||s.restore(n)})}function ft(){ke(E),at(yt,q),It(L),at(wt,ee)}async function Je(e,t,n,a){return Z({type:"goto",url:Ae(e),keepfocus:t.keepFocus,noscroll:t.noScroll,replace_state:t.replaceState,state:t.state,redirect_count:n,nav_token:a,accept:()=>{t.invalidateAll&&(Ye=!0),t.invalidate&&t.invalidate.forEach(Pn)}})}async function Rn(e){if(e.id!==(T==null?void 0:T.id)){const t={};X.add(t),T={id:e.id,token:t,promise:xt({...e,preload:t}).then(n=>(X.delete(t),n.type==="loaded"&&n.state.error&&(T=null),n))}}return T.promise}async function Ne(e){var n;const t=(n=await Ie(e,!1))==null?void 0:n.route;t&&await Promise.all([...t.layouts,t.leaf].map(a=>a==null?void 0:a[1]()))}function Lt(e,t,n){var r;v=e.state;const a=document.querySelector("style[data-sveltekit]");if(a&&a.remove(),Object.assign(R,e.props.page),ze=new S.root({target:t,props:{...e.props,stores:$,components:ye},hydrate:n,sync:!1}),Ut(L),n){const s={from:null,to:{params:v.params,route:{id:((r=v.route)==null?void 0:r.id)??null},url:new URL(location.href)},willUnload:!1,type:"enter",complete:Promise.resolve()};J.forEach(i=>i(s))}_e=!0}function ve({url:e,params:t,branch:n,status:a,error:r,route:s,form:i}){let o="never";if(P&&(e.pathname===P||e.pathname===P+"/"))o="always";else for(const f of n)(f==null?void 0:f.slash)!==void 0&&(o=f.slash);e.pathname=Vt(e.pathname,o),e.search=e.search;const c={type:"loaded",state:{url:e,params:t,branch:n,error:r,route:s},props:{constructors:pn(n).map(f=>f.node.component),page:Ue(R)}};i!==void 0&&(c.props.form=i);let l={},h=!R,u=0;for(let f=0;f<Math.max(n.length,v.branch.length);f+=1){const m=n[f],p=v.branch[f];(m==null?void 0:m.data)!==(p==null?void 0:p.data)&&(h=!0),m&&(l={...l,...m.data},h&&(c.props[`data_${u}`]=l),u+=1)}return(!v.url||e.href!==v.url.href||v.error!==r||i!==void 0&&i!==R.form||h)&&(c.props.page={error:r,params:t,route:{id:(s==null?void 0:s.id)??null},state:{},status:a,url:new URL(e),form:i??null,data:h?l:R.data}),c}async function Xe({loader:e,parent:t,url:n,params:a,route:r,server_data_node:s}){var h,u,w;let i=null,o=!0;const c={dependencies:new Set,params:new Set,parent:!1,route:!1,url:!1,search_params:new Set},l=await e();if((h=l.universal)!=null&&h.load){let f=function(...p){for(const d of p){const{href:_}=new URL(d,n);c.dependencies.add(_)}};const m={route:new Proxy(r,{get:(p,d)=>(o&&(c.route=!0),p[d])}),params:new Proxy(a,{get:(p,d)=>(o&&c.params.add(d),p[d])}),data:(s==null?void 0:s.data)??null,url:Mt(n,()=>{o&&(c.url=!0)},p=>{o&&c.search_params.add(p)},S.hash),async fetch(p,d){p instanceof Request&&(d={body:p.method==="GET"||p.method==="HEAD"?void 0:await p.blob(),cache:p.cache,credentials:p.credentials,headers:[...p.headers].length?p.headers:void 0,integrity:p.integrity,keepalive:p.keepalive,method:p.method,mode:p.mode,redirect:p.redirect,referrer:p.referrer,referrerPolicy:p.referrerPolicy,signal:p.signal,...d});const{resolved:_,promise:I}=Tt(p,d,n);return o&&f(_.href),I},setHeaders:()=>{},depends:f,parent(){return o&&(c.parent=!0),t()},untrack(p){o=!1;try{return p()}finally{o=!0}}};i=await l.universal.load.call(null,m)??null}return{node:l,loader:e,server:s,universal:(u=l.universal)!=null&&u.load?{type:"data",data:i,uses:c}:null,data:i??(s==null?void 0:s.data)??null,slash:((w=l.universal)==null?void 0:w.trailingSlash)??(s==null?void 0:s.slash)}}function Tt(e,t,n){let a=e instanceof Request?e.url:e;const r=new URL(a,n);r.origin===n.origin&&(a=r.href.slice(n.origin.length));const s=_e?Yt(a,r.href,t):Wt(a,t);return{resolved:r,promise:s}}function ut(e,t,n,a,r,s){if(Ye)return!0;if(!r)return!1;if(r.parent&&e||r.route&&t||r.url&&n)return!0;for(const i of r.search_params)if(a.has(i))return!0;for(const i of r.params)if(s[i]!==v.params[i])return!0;for(const i of r.dependencies)if(we.some(o=>o(new URL(i))))return!0;return!1}function Ze(e,t){return(e==null?void 0:e.type)==="data"?e:(e==null?void 0:e.type)==="skip"?t??null:null}function In(e,t){if(!e)return new Set(t.searchParams.keys());const n=new Set([...e.searchParams.keys(),...t.searchParams.keys()]);for(const a of n){const r=e.searchParams.getAll(a),s=t.searchParams.getAll(a);r.every(i=>s.includes(i))&&s.every(i=>r.includes(i))&&n.delete(a)}return n}function dt({error:e,url:t,route:n,params:a}){return{type:"loaded",state:{error:e,url:t,route:n,params:a,branch:[]},props:{page:Ue(R),constructors:[]}}}async function xt({id:e,invalidating:t,url:n,params:a,route:r,preload:s}){if((T==null?void 0:T.id)===e)return X.delete(T.token),T.promise;const{errors:i,layouts:o,leaf:c}=r,l=[...o,c];i.forEach(g=>g==null?void 0:g().catch(()=>{})),l.forEach(g=>g==null?void 0:g[1]().catch(()=>{}));let h=null;const u=v.url?e!==be(v.url):!1,w=v.route?r.id!==v.route.id:!1,f=In(v.url,n);let m=!1;const p=l.map((g,y)=>{var D;const b=v.branch[y],k=!!(g!=null&&g[0])&&((b==null?void 0:b.loader)!==g[1]||ut(m,w,u,f,(D=b.server)==null?void 0:D.uses,a));return k&&(m=!0),k});if(p.some(Boolean)){try{h=await Ot(n,p)}catch(g){const y=await H(g,{url:n,params:a,route:{id:e}});return X.has(s)?dt({error:y,url:n,params:a,route:r}):Re({status:ge(g),error:y,url:n,route:r})}if(h.type==="redirect")return h}const d=h==null?void 0:h.nodes;let _=!1;const I=l.map(async(g,y)=>{var Le;if(!g)return;const b=v.branch[y],k=d==null?void 0:d[y];if((!k||k.type==="skip")&&g[1]===(b==null?void 0:b.loader)&&!ut(_,w,u,f,(Le=b.universal)==null?void 0:Le.uses,a))return b;if(_=!0,(k==null?void 0:k.type)==="error")throw k;return Xe({loader:g[1],url:n,params:a,route:r,parent:async()=>{var tt;const et={};for(let Te=0;Te<y;Te+=1)Object.assign(et,(tt=await I[Te])==null?void 0:tt.data);return et},server_data_node:Ze(k===void 0&&g[0]?{type:"skip"}:k??null,g[0]?b==null?void 0:b.server:void 0)})});for(const g of I)g.catch(()=>{});const U=[];for(let g=0;g<l.length;g+=1)if(l[g])try{U.push(await I[g])}catch(y){if(y instanceof Me)return{type:"redirect",location:y.location};if(X.has(s))return dt({error:await H(y,{params:a,url:n,route:{id:r.id}}),url:n,params:a,route:r});let b=ge(y),k;if(d!=null&&d.includes(y))b=y.status??b,k=y.error;else if(y instanceof Ee)k=y.body;else{if(await $.updated.check())return await kt(),await W(n);k=await H(y,{params:a,url:n,route:{id:r.id}})}const D=await Un(g,U,i);return D?ve({url:n,params:a,branch:U.slice(0,D.idx).concat(D.node),status:b,error:k,route:r}):await Ct(n,{id:r.id},k,b)}else U.push(void 0);return ve({url:n,params:a,branch:U,status:200,error:null,route:r,form:t?void 0:null})}async function Un(e,t,n){for(;e--;)if(n[e]){let a=e;for(;!t[a];)a-=1;try{return{idx:a+1,node:{node:await n[e](),loader:n[e],data:{},server:null,universal:null}}}catch{continue}}}async function Re({status:e,error:t,url:n,route:a}){const r={};let s=null;if(S.server_loads[0]===0)try{const o=await Ot(n,[!0]);if(o.type!=="data"||o.nodes[0]&&o.nodes[0].type!=="data")throw 0;s=o.nodes[0]??null}catch{(n.origin!==de||n.pathname!==location.pathname||Ke)&&await W(n)}try{const o=await Xe({loader:$e,url:n,params:r,route:a,parent:()=>Promise.resolve({}),server_data_node:Ze(s)}),c={node:await me(),loader:me,universal:null,server:null,data:null};return ve({url:n,params:r,branch:[o,c],status:e,error:t,route:null})}catch(o){if(o instanceof Me)return Je(new URL(o.location,location.href),{},0);throw o}}async function Ln(e){const t=e.href;if(he.has(t))return he.get(t);let n;try{const a=(async()=>{let r=await S.hooks.reroute({url:new URL(e),fetch:async(s,i)=>Tt(s,i,e).promise})??e;if(typeof r=="string"){const s=new URL(e);S.hash?s.hash=r:s.pathname=r,r=s}return r})();he.set(t,a),n=await a}catch{he.delete(t);return}return n}async function Ie(e,t){if(e&&!Se(e,P,S.hash)){const n=await Ln(e);if(!n)return;const a=Tn(n);for(const r of He){const s=r.exec(a);if(s)return{id:be(e),invalidating:t,route:r,params:qt(s),url:e}}}}function Tn(e){return Bt(S.hash?e.hash.replace(/^#/,"").replace(/[?#].+/,""):e.pathname.slice(P.length))||"/"}function be(e){return(S.hash?e.hash.replace(/^#/,""):e.pathname)+e.search}function Pt({url:e,type:t,intent:n,delta:a}){let r=!1;const s=Qe(v,n,e,t);a!==void 0&&(s.navigation.delta=a);const i={...s.navigation,cancel:()=>{r=!0,s.reject(new Error("navigation cancelled"))}};return te||Rt.forEach(o=>o(i)),r?null:s}async function Z({type:e,url:t,popped:n,keepfocus:a,noscroll:r,replace_state:s,state:i={},redirect_count:o=0,nav_token:c={},accept:l=ct,block:h=ct}){const u=V;V=c;const w=await Ie(t,!1),f=e==="enter"?Qe(v,w,t,e):Pt({url:t,type:e,delta:n==null?void 0:n.delta,intent:w});if(!f){h(),V===c&&(V=u);return}const m=E,p=L;l(),te=!0,_e&&f.navigation.type!=="enter"&&$.navigating.set(Q.current=f.navigation);let d=w&&await xt(w);if(!d){if(Se(t,P,S.hash))return await W(t);d=await Ct(t,{id:null},await H(new Ge(404,"Not Found",`Not found: ${t.pathname}`),{url:t,params:{},route:{id:null}}),404)}if(t=(w==null?void 0:w.url)||t,V!==c)return f.reject(new Error("navigation aborted")),!1;if(d.type==="redirect")if(o>=20)d=await Re({status:500,error:await H(new Error("Redirect loop"),{url:t,params:{},route:{id:null}}),url:t,route:{id:null}});else return await Je(new URL(d.location,t).href,{},o+1,c),!1;else d.props.page.status>=400&&await $.updated.check()&&(await kt(),await W(t));if(kn(),ke(m),It(p),d.props.page.url.pathname!==t.pathname&&(t.pathname=d.props.page.url.pathname),i=n?n.state:i,!n){const g=s?0:1,y={[B]:E+=g,[K]:L+=g,[Be]:i};(s?history.replaceState:history.pushState).call(history,y,"",t),s||Et(E,L)}if(T=null,d.props.page.state=i,_e){v=d.state,d.props.page&&(d.props.page.url=t);const g=(await Promise.all(Array.from(En,y=>y(f.navigation)))).filter(y=>typeof y=="function");if(g.length>0){let y=function(){g.forEach(b=>{J.delete(b)})};g.push(y),g.forEach(b=>{J.add(b)})}ze.$set(d.props),_n(d.props.page),We=!0}else Lt(d,De,!1);const{activeElement:_}=document;await Dt();const I=n?n.scroll:r?qe():null;if(lt){const g=t.hash&&document.getElementById(decodeURIComponent(S.hash?t.hash.split("#")[2]??"":t.hash.slice(1)));I?scrollTo(I.x,I.y):g?g.scrollIntoView():scrollTo(0,0)}const U=document.activeElement!==_&&document.activeElement!==document.body;!a&&!U&&Nn(),lt=!0,d.props.page&&Object.assign(R,d.props.page),te=!1,e==="popstate"&&Ut(L),f.fulfil(void 0),J.forEach(g=>g(f.navigation)),$.navigating.set(Q.current=null)}async function Ct(e,t,n,a){return e.origin===de&&e.pathname===location.pathname&&!Ke?await Re({status:a,error:n,url:e,route:t}):await W(e)}function xn(){let e,t,n;j.addEventListener("mousemove",o=>{const c=o.target;clearTimeout(e),e=setTimeout(()=>{s(c,F.hover)},20)});function a(o){o.defaultPrevented||s(o.composedPath()[0],F.tap)}j.addEventListener("mousedown",a),j.addEventListener("touchstart",a,{passive:!0});const r=new IntersectionObserver(o=>{for(const c of o)c.isIntersecting&&(Ne(new URL(c.target.href)),r.unobserve(c.target))},{threshold:0});async function s(o,c){const l=bt(o,j),h=l===t&&c>=n;if(!l||h)return;const{url:u,external:w,download:f}=je(l,P,S.hash);if(w||f)return;const m=pe(l),p=u&&be(v.url)===be(u);if(!(m.reload||p))if(c<=m.preload_data){t=l,n=F.tap;const d=await Ie(u,!1);if(!d)return;Rn(d)}else c<=m.preload_code&&(t=l,n=c,Ne(u))}function i(){r.disconnect();for(const o of j.querySelectorAll("a")){const{url:c,external:l,download:h}=je(o,P,S.hash);if(l||h)continue;const u=pe(o);u.reload||(u.preload_code===F.viewport&&r.observe(o),u.preload_code===F.eager&&Ne(c))}}J.add(i),i()}function H(e,t){if(e instanceof Ee)return e.body;const n=ge(e),a=wn(e);return S.hooks.handleError({error:e,event:t,status:n,message:a})??{message:a}}function Kn(e,t={}){return e=new URL(Ae(e)),e.origin!==de?Promise.reject(new Error("goto: invalid URL")):Je(e,t,0)}function Pn(e){if(typeof e=="function")we.push(e);else{const{href:t}=new URL(e,location.href);we.push(n=>n.href===t)}}function Wn(e,t){ke(E);const n={[B]:E+=1,[K]:L,[_t]:R.url.href,[Be]:t};history.pushState(n,"",Ae(e)),We=!0,R.state=t,ze.$set({page:Ue(R)}),Et(E,L)}function Cn(){var t;history.scrollRestoration="manual",addEventListener("beforeunload",n=>{let a=!1;if(ft(),!te){const r=Qe(v,void 0,null,"leave"),s={...r.navigation,cancel:()=>{a=!0,r.reject(new Error("navigation cancelled"))}};Rt.forEach(i=>i(s))}a?(n.preventDefault(),n.returnValue=""):history.scrollRestoration="auto"}),addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&ft()}),(t=navigator.connection)!=null&&t.saveData||xn(),j.addEventListener("click",async n=>{if(n.button||n.which!==1||n.metaKey||n.ctrlKey||n.shiftKey||n.altKey||n.defaultPrevented)return;const a=bt(n.composedPath()[0],j);if(!a)return;const{url:r,external:s,target:i,download:o}=je(a,P,S.hash);if(!r)return;if(i==="_parent"||i==="_top"){if(window.parent!==window)return}else if(i&&i!=="_self")return;const c=pe(a);if(!(a instanceof SVGAElement)&&r.protocol!==location.protocol&&!(r.protocol==="https:"||r.protocol==="http:")||o)return;const[h,u]=(S.hash?r.hash.replace(/^#/,""):r.href).split("#"),w=h===Pe(location);if(s||c.reload&&(!w||!u)){Pt({url:r,type:"link"})?te=!0:n.preventDefault();return}if(u!==void 0&&w){const[,f]=v.url.href.split("#");if(f===u){if(n.preventDefault(),u===""||u==="top"&&a.ownerDocument.getElementById("top")===null)window.scrollTo({top:0});else{const m=a.ownerDocument.getElementById(decodeURIComponent(u));m&&(m.scrollIntoView(),m.focus())}return}if(Y=!0,ke(E),e(r),!c.replace_state)return;Y=!1}n.preventDefault(),await new Promise(f=>{requestAnimationFrame(()=>{setTimeout(f,0)}),setTimeout(f,100)}),await Z({type:"link",url:r,keepfocus:c.keepfocus,noscroll:c.noscroll,replace_state:c.replace_state??r.href===location.href})}),j.addEventListener("submit",n=>{if(n.defaultPrevented)return;const a=HTMLFormElement.prototype.cloneNode.call(n.target),r=n.submitter;if(((r==null?void 0:r.formTarget)||a.target)==="_blank"||((r==null?void 0:r.formMethod)||a.method)!=="get")return;const o=new URL((r==null?void 0:r.hasAttribute("formaction"))&&(r==null?void 0:r.formAction)||a.action);if(Se(o,P,!1))return;const c=n.target,l=pe(c);if(l.reload)return;n.preventDefault(),n.stopPropagation();const h=new FormData(c),u=r==null?void 0:r.getAttribute("name");u&&h.append(u,(r==null?void 0:r.getAttribute("value"))??""),o.search=new URLSearchParams(h).toString(),Z({type:"form",url:o,keepfocus:l.keepfocus,noscroll:l.noscroll,replace_state:l.replace_state??o.href===location.href})}),addEventListener("popstate",async n=>{var a;if((a=n.state)!=null&&a[B]){const r=n.state[B];if(V={},r===E)return;const s=q[r],i=n.state[Be]??{},o=new URL(n.state[_t]??location.href),c=n.state[K],l=v.url?Pe(location)===Pe(v.url):!1;if(c===L&&(We||l)){i!==R.state&&(R.state=i),e(o),q[E]=qe(),s&&scrollTo(s.x,s.y),E=r;return}const u=r-E;await Z({type:"popstate",url:o,popped:{state:i,scroll:s,delta:u},accept:()=>{E=r,L=c},block:()=>{history.go(-u)},nav_token:V})}else if(!Y){const r=new URL(location.href);e(r),S.hash&&location.reload()}}),addEventListener("hashchange",()=>{Y&&(Y=!1,history.replaceState({...history.state,[B]:++E,[K]:L},"",location.href))});for(const n of document.querySelectorAll("link"))Sn.has(n.rel)&&(n.href=n.href);addEventListener("pageshow",n=>{n.persisted&&$.navigating.set(Q.current=null)});function e(n){v.url=R.url=n,$.page.set(Ue(R)),$.page.notify()}}async function On(e,{status:t=200,error:n,node_ids:a,params:r,route:s,server_route:i,data:o,form:c}){Ke=!0;const l=new URL(location.href);let h;({params:r={},route:s={id:null}}=await Ie(l,!1)||{}),h=He.find(({id:f})=>f===s.id);let u,w=!0;try{const f=a.map(async(p,d)=>{const _=o[d];return _!=null&&_.uses&&(_.uses=Nt(_.uses)),Xe({loader:S.nodes[p],url:l,params:r,route:s,parent:async()=>{const I={};for(let U=0;U<d;U+=1)Object.assign(I,(await f[U]).data);return I},server_data_node:Ze(_)})}),m=await Promise.all(f);if(h){const p=h.layouts;for(let d=0;d<p.length;d++)p[d]||m.splice(d,0,void 0)}u=ve({url:l,params:r,branch:m,status:t,error:n,form:c,route:h??null})}catch(f){if(f instanceof Me){await W(new URL(f.location,location.href));return}u=await Re({status:ge(f),error:await H(f,{url:l,params:r,route:s}),url:l,route:s}),e.textContent="",w=!1}u.props.page&&(u.props.page.state={}),Lt(u,e,w)}async function Ot(e,t){var s;const n=new URL(e);n.pathname=An(e.pathname),e.pathname.endsWith("/")&&n.searchParams.append(mn,"1"),n.searchParams.append(gn,t.map(i=>i?"1":"0").join(""));const a=window.fetch,r=await a(n.href,{});if(!r.ok){let i;throw(s=r.headers.get("content-type"))!=null&&s.includes("application/json")?i=await r.json():r.status===404?i="Not Found":r.status===500&&(i="Internal Error"),new Ee(r.status,i)}return new Promise(async i=>{var w;const o=new Map,c=r.body.getReader(),l=new TextDecoder;function h(f){return dn(f,{...S.decoders,Promise:m=>new Promise((p,d)=>{o.set(m,{fulfil:p,reject:d})})})}let u="";for(;;){const{done:f,value:m}=await c.read();if(f&&!u)break;for(u+=!m&&u?`
`:l.decode(m,{stream:!0});;){const p=u.indexOf(`
`);if(p===-1)break;const d=JSON.parse(u.slice(0,p));if(u=u.slice(p+1),d.type==="redirect")return i(d);if(d.type==="data")(w=d.nodes)==null||w.forEach(_=>{(_==null?void 0:_.type)==="data"&&(_.uses=Nt(_.uses),_.data=h(_.data))}),i(d);else if(d.type==="chunk"){const{id:_,data:I,error:U}=d,g=o.get(_);o.delete(_),U?g.reject(h(U)):g.fulfil(h(I))}}}})}function Nt(e){return{dependencies:new Set((e==null?void 0:e.dependencies)??[]),params:new Set((e==null?void 0:e.params)??[]),parent:!!(e!=null&&e.parent),route:!!(e!=null&&e.route),url:!!(e!=null&&e.url),search_params:new Set((e==null?void 0:e.search_params)??[])}}function Nn(){const e=document.querySelector("[autofocus]");if(e)e.focus();else{const t=document.body,n=t.getAttribute("tabindex");t.tabIndex=-1,t.focus({preventScroll:!0,focusVisible:!1}),n!==null?t.setAttribute("tabindex",n):t.removeAttribute("tabindex");const a=getSelection();if(a&&a.type!=="None"){const r=[];for(let s=0;s<a.rangeCount;s+=1)r.push(a.getRangeAt(s));setTimeout(()=>{if(a.rangeCount===r.length){for(let s=0;s<a.rangeCount;s+=1){const i=r[s],o=a.getRangeAt(s);if(i.commonAncestorContainer!==o.commonAncestorContainer||i.startContainer!==o.startContainer||i.endContainer!==o.endContainer||i.startOffset!==o.startOffset||i.endOffset!==o.endOffset)return}a.removeAllRanges()}})}}}function Qe(e,t,n,a){var c,l;let r,s;const i=new Promise((h,u)=>{r=h,s=u});return i.catch(()=>{}),{navigation:{from:{params:e.params,route:{id:((c=e.route)==null?void 0:c.id)??null},url:e.url},to:n&&{params:(t==null?void 0:t.params)??null,route:{id:((l=t==null?void 0:t.route)==null?void 0:l.id)??null},url:n},willUnload:!t,type:a,complete:i},fulfil:r,reject:s}}function Ue(e){return{data:e.data,error:e.error,form:e.form,params:e.params,route:e.route,state:e.state,status:e.status,url:e.url}}function jn(e){const t=new URL(e);return t.hash=decodeURIComponent(e.hash),t}export{Ee as H,Wn as a,Hn as b,Kn as g,Bn as l,R as p,$ as s};
