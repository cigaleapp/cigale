import{v as F,w as S,x as q,y as H,z as B,A as Q,C as W,D as _,E as j,F as X,G as I,H as V,I as C,J as R,t as g,K as l,S as A,_ as w}from"./F1c4m1q7.js";function K(t,...e){const r=F.bind(null,e.find(n=>typeof n=="object"));return e.map(r)}function N(t,e){const r=S(t,e==null?void 0:e.in);return r.setHours(0,0,0,0),r}function J(t,e,r){const[n,a]=K(r==null?void 0:r.in,t,e),o=N(n),i=N(a),c=+o-q(o),d=+i-q(i);return Math.round((c-d)/H)}function Z(t){return t instanceof Date||typeof t=="object"&&Object.prototype.toString.call(t)==="[object Date]"}function U(t){return!(!Z(t)&&typeof t!="number"||isNaN(+S(t)))}function z(t,e){const r=S(t,e==null?void 0:e.in);return r.setFullYear(r.getFullYear(),0,1),r.setHours(0,0,0,0),r}function ee(t,e){const r=S(t,e==null?void 0:e.in);return J(r,z(r))+1}function s(t,e){const r=t<0?"-":"",n=Math.abs(t).toString().padStart(e,"0");return r+n}const h={y(t,e){const r=t.getFullYear(),n=r>0?r:1-r;return s(e==="yy"?n%100:n,e.length)},M(t,e){const r=t.getMonth();return e==="M"?String(r+1):s(r+1,2)},d(t,e){return s(t.getDate(),e.length)},a(t,e){const r=t.getHours()/12>=1?"pm":"am";switch(e){case"a":case"aa":return r.toUpperCase();case"aaa":return r;case"aaaaa":return r[0];case"aaaa":default:return r==="am"?"a.m.":"p.m."}},h(t,e){return s(t.getHours()%12||12,e.length)},H(t,e){return s(t.getHours(),e.length)},m(t,e){return s(t.getMinutes(),e.length)},s(t,e){return s(t.getSeconds(),e.length)},S(t,e){const r=e.length,n=t.getMilliseconds(),a=Math.trunc(n*Math.pow(10,r-3));return s(a,e.length)}},M={midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},Y={G:function(t,e,r){const n=t.getFullYear()>0?1:0;switch(e){case"G":case"GG":case"GGG":return r.era(n,{width:"abbreviated"});case"GGGGG":return r.era(n,{width:"narrow"});case"GGGG":default:return r.era(n,{width:"wide"})}},y:function(t,e,r){if(e==="yo"){const n=t.getFullYear(),a=n>0?n:1-n;return r.ordinalNumber(a,{unit:"year"})}return h.y(t,e)},Y:function(t,e,r,n){const a=_(t,n),o=a>0?a:1-a;if(e==="YY"){const i=o%100;return s(i,2)}return e==="Yo"?r.ordinalNumber(o,{unit:"year"}):s(o,e.length)},R:function(t,e){const r=W(t);return s(r,e.length)},u:function(t,e){const r=t.getFullYear();return s(r,e.length)},Q:function(t,e,r){const n=Math.ceil((t.getMonth()+1)/3);switch(e){case"Q":return String(n);case"QQ":return s(n,2);case"Qo":return r.ordinalNumber(n,{unit:"quarter"});case"QQQ":return r.quarter(n,{width:"abbreviated",context:"formatting"});case"QQQQQ":return r.quarter(n,{width:"narrow",context:"formatting"});case"QQQQ":default:return r.quarter(n,{width:"wide",context:"formatting"})}},q:function(t,e,r){const n=Math.ceil((t.getMonth()+1)/3);switch(e){case"q":return String(n);case"qq":return s(n,2);case"qo":return r.ordinalNumber(n,{unit:"quarter"});case"qqq":return r.quarter(n,{width:"abbreviated",context:"standalone"});case"qqqqq":return r.quarter(n,{width:"narrow",context:"standalone"});case"qqqq":default:return r.quarter(n,{width:"wide",context:"standalone"})}},M:function(t,e,r){const n=t.getMonth();switch(e){case"M":case"MM":return h.M(t,e);case"Mo":return r.ordinalNumber(n+1,{unit:"month"});case"MMM":return r.month(n,{width:"abbreviated",context:"formatting"});case"MMMMM":return r.month(n,{width:"narrow",context:"formatting"});case"MMMM":default:return r.month(n,{width:"wide",context:"formatting"})}},L:function(t,e,r){const n=t.getMonth();switch(e){case"L":return String(n+1);case"LL":return s(n+1,2);case"Lo":return r.ordinalNumber(n+1,{unit:"month"});case"LLL":return r.month(n,{width:"abbreviated",context:"standalone"});case"LLLLL":return r.month(n,{width:"narrow",context:"standalone"});case"LLLL":default:return r.month(n,{width:"wide",context:"standalone"})}},w:function(t,e,r,n){const a=Q(t,n);return e==="wo"?r.ordinalNumber(a,{unit:"week"}):s(a,e.length)},I:function(t,e,r){const n=B(t);return e==="Io"?r.ordinalNumber(n,{unit:"week"}):s(n,e.length)},d:function(t,e,r){return e==="do"?r.ordinalNumber(t.getDate(),{unit:"date"}):h.d(t,e)},D:function(t,e,r){const n=ee(t);return e==="Do"?r.ordinalNumber(n,{unit:"dayOfYear"}):s(n,e.length)},E:function(t,e,r){const n=t.getDay();switch(e){case"E":case"EE":case"EEE":return r.day(n,{width:"abbreviated",context:"formatting"});case"EEEEE":return r.day(n,{width:"narrow",context:"formatting"});case"EEEEEE":return r.day(n,{width:"short",context:"formatting"});case"EEEE":default:return r.day(n,{width:"wide",context:"formatting"})}},e:function(t,e,r,n){const a=t.getDay(),o=(a-n.weekStartsOn+8)%7||7;switch(e){case"e":return String(o);case"ee":return s(o,2);case"eo":return r.ordinalNumber(o,{unit:"day"});case"eee":return r.day(a,{width:"abbreviated",context:"formatting"});case"eeeee":return r.day(a,{width:"narrow",context:"formatting"});case"eeeeee":return r.day(a,{width:"short",context:"formatting"});case"eeee":default:return r.day(a,{width:"wide",context:"formatting"})}},c:function(t,e,r,n){const a=t.getDay(),o=(a-n.weekStartsOn+8)%7||7;switch(e){case"c":return String(o);case"cc":return s(o,e.length);case"co":return r.ordinalNumber(o,{unit:"day"});case"ccc":return r.day(a,{width:"abbreviated",context:"standalone"});case"ccccc":return r.day(a,{width:"narrow",context:"standalone"});case"cccccc":return r.day(a,{width:"short",context:"standalone"});case"cccc":default:return r.day(a,{width:"wide",context:"standalone"})}},i:function(t,e,r){const n=t.getDay(),a=n===0?7:n;switch(e){case"i":return String(a);case"ii":return s(a,e.length);case"io":return r.ordinalNumber(a,{unit:"day"});case"iii":return r.day(n,{width:"abbreviated",context:"formatting"});case"iiiii":return r.day(n,{width:"narrow",context:"formatting"});case"iiiiii":return r.day(n,{width:"short",context:"formatting"});case"iiii":default:return r.day(n,{width:"wide",context:"formatting"})}},a:function(t,e,r){const a=t.getHours()/12>=1?"pm":"am";switch(e){case"a":case"aa":return r.dayPeriod(a,{width:"abbreviated",context:"formatting"});case"aaa":return r.dayPeriod(a,{width:"abbreviated",context:"formatting"}).toLowerCase();case"aaaaa":return r.dayPeriod(a,{width:"narrow",context:"formatting"});case"aaaa":default:return r.dayPeriod(a,{width:"wide",context:"formatting"})}},b:function(t,e,r){const n=t.getHours();let a;switch(n===12?a=M.noon:n===0?a=M.midnight:a=n/12>=1?"pm":"am",e){case"b":case"bb":return r.dayPeriod(a,{width:"abbreviated",context:"formatting"});case"bbb":return r.dayPeriod(a,{width:"abbreviated",context:"formatting"}).toLowerCase();case"bbbbb":return r.dayPeriod(a,{width:"narrow",context:"formatting"});case"bbbb":default:return r.dayPeriod(a,{width:"wide",context:"formatting"})}},B:function(t,e,r){const n=t.getHours();let a;switch(n>=17?a=M.evening:n>=12?a=M.afternoon:n>=4?a=M.morning:a=M.night,e){case"B":case"BB":case"BBB":return r.dayPeriod(a,{width:"abbreviated",context:"formatting"});case"BBBBB":return r.dayPeriod(a,{width:"narrow",context:"formatting"});case"BBBB":default:return r.dayPeriod(a,{width:"wide",context:"formatting"})}},h:function(t,e,r){if(e==="ho"){let n=t.getHours()%12;return n===0&&(n=12),r.ordinalNumber(n,{unit:"hour"})}return h.h(t,e)},H:function(t,e,r){return e==="Ho"?r.ordinalNumber(t.getHours(),{unit:"hour"}):h.H(t,e)},K:function(t,e,r){const n=t.getHours()%12;return e==="Ko"?r.ordinalNumber(n,{unit:"hour"}):s(n,e.length)},k:function(t,e,r){let n=t.getHours();return n===0&&(n=24),e==="ko"?r.ordinalNumber(n,{unit:"hour"}):s(n,e.length)},m:function(t,e,r){return e==="mo"?r.ordinalNumber(t.getMinutes(),{unit:"minute"}):h.m(t,e)},s:function(t,e,r){return e==="so"?r.ordinalNumber(t.getSeconds(),{unit:"second"}):h.s(t,e)},S:function(t,e){return h.S(t,e)},X:function(t,e,r){const n=t.getTimezoneOffset();if(n===0)return"Z";switch(e){case"X":return P(n);case"XXXX":case"XX":return y(n);case"XXXXX":case"XXX":default:return y(n,":")}},x:function(t,e,r){const n=t.getTimezoneOffset();switch(e){case"x":return P(n);case"xxxx":case"xx":return y(n);case"xxxxx":case"xxx":default:return y(n,":")}},O:function(t,e,r){const n=t.getTimezoneOffset();switch(e){case"O":case"OO":case"OOO":return"GMT"+L(n,":");case"OOOO":default:return"GMT"+y(n,":")}},z:function(t,e,r){const n=t.getTimezoneOffset();switch(e){case"z":case"zz":case"zzz":return"GMT"+L(n,":");case"zzzz":default:return"GMT"+y(n,":")}},t:function(t,e,r){const n=Math.trunc(+t/1e3);return s(n,e.length)},T:function(t,e,r){return s(+t,e.length)}};function L(t,e=""){const r=t>0?"-":"+",n=Math.abs(t),a=Math.trunc(n/60),o=n%60;return o===0?r+String(a):r+String(a)+e+s(o,2)}function P(t,e){return t%60===0?(t>0?"-":"+")+s(Math.abs(t)/60,2):y(t,e)}function y(t,e=""){const r=t>0?"-":"+",n=Math.abs(t),a=s(Math.trunc(n/60),2),o=s(n%60,2);return r+a+e+o}const te=/[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,ne=/P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,re=/^'([^]*?)'?$/,ae=/''/g,oe=/[a-zA-Z]/;function ie(t,e,r){var b,f,k,T;const n=j(),a=n.locale??X,o=n.firstWeekContainsDate??((f=(b=n.locale)==null?void 0:b.options)==null?void 0:f.firstWeekContainsDate)??1,i=n.weekStartsOn??((T=(k=n.locale)==null?void 0:k.options)==null?void 0:T.weekStartsOn)??0,c=S(t,r==null?void 0:r.in);if(!U(c))throw new RangeError("Invalid time value");let d=e.match(ne).map(m=>{const u=m[0];if(u==="p"||u==="P"){const D=I[u];return D(m,a.formatLong)}return m}).join("").match(te).map(m=>{if(m==="''")return{isToken:!1,value:"'"};const u=m[0];if(u==="'")return{isToken:!1,value:se(m)};if(Y[u])return{isToken:!0,value:m};if(u.match(oe))throw new RangeError("Format string contains an unescaped latin alphabet character `"+u+"`");return{isToken:!1,value:m}});a.localize.preprocessor&&(d=a.localize.preprocessor(c,d));const O={firstWeekContainsDate:o,weekStartsOn:i,locale:a};return d.map(m=>{if(!m.isToken)return m.value;const u=m.value;(V(u)||C(u))&&R(u,e,String(t));const D=Y[u[0]];return D(c,u,a.localize,O)}).join("")}function se(t){const e=t.match(re);return e?e[1].replace(ae,"'"):t}async function ce({subjectId:t,metadataId:e,type:r,value:n,confidence:a,alternatives:o,tx:i=void 0}){o??(o=[]),a??(a=1);const c={value:JSON.stringify(n instanceof Date?ie(n,"yyyy-MM-dd'T'HH:mm:ss"):n),confidence:a,alternatives:Object.fromEntries(o.map(f=>[JSON.stringify(f.value),f.confidence]))};c.alternatives=Object.fromEntries(Object.entries(c.alternatives).filter(([f])=>f!==c.value)),console.log(`Store metadata ${e} in ${t}${i?` using tx ${i.id}`:""}`,c);const d=g.Metadata.state.find(f=>f.id===e);if(!d)throw new Error(`Métadonnée inconnue avec l'ID ${e}`);if(r&&d.type!==r)throw new Error(`Type de métadonnée incorrect: ${d.type} !== ${r}`);const O=i?await i.objectStore("Image").get(t):await g.Image.raw.get(t),b=i?await i.objectStore("Observation").get(t):await g.Observation.raw.get(t);if(O)O.metadata[e]=c,i?i.objectStore("Image").put(O):await g.Image.raw.set(O),w.Image[w.Image.findIndex(f=>f.id.toString()===t)].metadata[e]=A.MetadataValue.assert(c);else if(b)b.metadataOverrides[e]=c,i?i.objectStore("Observation").put(b):await g.Observation.raw.set(b),w.Observation[w.Observation.findIndex(f=>f.id.toString()===t)].metadataOverrides[e]=c;else throw new Error(`Aucune image ou observation avec l'ID ${t}`)}async function $({subjectId:t,metadataId:e,recursive:r=!1,tx:n}){const a=n?await n.objectStore("Image").get(t):await g.Image.raw.get(t),o=n?await n.objectStore("Observation").get(t):await g.Observation.raw.get(t);if(!a&&!o)throw new Error(`Aucune image ou observation avec l'ID ${t}`);if(console.log(`Delete metadata ${e} in ${t}`),a)delete a.metadata[e],n?n.objectStore("Image").put(a):await g.Image.raw.set(a),delete w.Image[w.Image.findIndex(i=>i.id.toString()===t)].metadata[e];else if(o&&(delete o.metadataOverrides[e],n?n.objectStore("Observation").put(o):await g.Observation.raw.set(o),delete w.Observation[w.Observation.findIndex(i=>i.id.toString()===t)].metadataOverrides[e],r))for(const i of o.images)await $({subjectId:i,recursive:!1,metadataId:e,tx:n})}async function ue(t){const e=await g.Image.list().then(n=>n.filter(a=>t.images.includes(a.id)));return{...await E(e.map(n=>n.metadata)),...t.metadataOverrides}}function de(t){return Object.fromEntries(Object.entries(t).map(([e,r])=>{var a,o;const n=g.Metadata.state.find(i=>i.id===e);return n?n.type!=="enum"?[e,r]:[e,{...r,valueLabel:(o=(a=n.options)==null?void 0:a.find(i=>i.key===r.value.toString()))==null?void 0:o.label}]:[e,r]}))}async function fe(t,e){const r=await E(t.map(i=>i.metadata)),n=await E(e.map(i=>i.metadataOverrides)),a=new Set([...Object.keys(r),...Object.keys(n)]),o={};for(const i of a){const c=n[i]??r[i];c&&(o[i]=c)}return o}async function E(t){if(t.length===1)return Object.fromEntries(Object.entries(t[0]).map(n=>({...n,merged:!1})));const e={},r=new Set(t.flatMap(n=>Object.keys(n)));for(const n of r){const a=await g.Metadata.get(n);if(!a){console.warn(`Cannot merge metadata values for unknown key ${n}`);continue}const o=t.flatMap(c=>Object.entries(c).filter(([d])=>d===n).map(([,d])=>d)),i=me(a,o);i!=null&&(e[n]={...i,merged:[...new Set(o.map(c=>JSON.stringify(c.value)))].length>1})}return e}function me(t,e){const r=(n,a)=>Object.fromEntries(a.flatMap(o=>Object.keys(o.alternatives)).map(o=>[o,n(a.flatMap(i=>i.alternatives[o]??null).filter(Boolean))]));switch(t.mergeMethod){case"average":return{value:he(t.type,e.map(n=>n.value)),confidence:x(e.map(n=>n.confidence)),alternatives:r(x,e)};case"max":case"min":return{value:le(t.type,e,t.mergeMethod==="max"?v:ge),confidence:v(e.map(n=>n.confidence)),alternatives:r(v,e)};case"median":return{value:we(t.type,e.map(n=>n.value)),confidence:p(e.map(n=>n.confidence)),alternatives:r(p,e)};case"none":return null}}const v=t=>Math.max(...t),ge=t=>Math.min(...t);function le(t,e,r){const n=Math.max(...e.map(o=>o.confidence)),a=e.filter(o=>o.confidence===n);try{return r(a.map(o=>o.value))}catch(o){return console.error(o),a[0].value}}function x(t){return t.reduce((e,r)=>e+r,0)/t.length}function he(t,e){const r=n=>x(G(t,n));if(t==="boolean")return r(e)>.5;if(t==="integer")return Math.ceil(r(e));if(t==="float")return r(e);if(t==="date")return new Date(r(e));if(t==="location")return{latitude:x(e.map(n=>n.latitude)),longitude:x(e.map(n=>n.longitude))};throw new Error(`Impossible de fusionner en mode moyenne des valeurs de type ${t}`)}const p=t=>{const e=t.sort((n,a)=>n-a),r=Math.floor(e.length/2);return e.length%2===0?(e[r-1]+e[r])/2:e[r]};function we(t,e){const r=n=>p(G(t,n));if(t==="boolean")return r(e)>.5;if(t==="integer")return Math.ceil(r(e));if(t==="float")return r(e);if(t==="date")return new Date(r(e));if(t==="location")return{latitude:p(e.map(n=>n.latitude)),longitude:p(e.map(n=>n.longitude))};throw new Error(`Impossible de fusionner en mode médiane des valeurs de type ${t}`)}function G(t,e){if(t==="integer"||t==="float")return e;if(t==="boolean")return e.map(r=>r?1:0);if(t==="date")return e.map(r=>new Date(r).getTime());throw new Error(`Impossible de convertir des valeurs de type ${t} en nombre`)}function be(t,e){var r,n;switch(t.type){case"boolean":return e?"Oui":"Non";case"date":return e instanceof Date?Intl.DateTimeFormat("fr-FR").format(e):e.toString();case"enum":return((n=(r=t.options)==null?void 0:r.find(a=>a.key===e.toString()))==null?void 0:n.label)??e.toString();case"location":{const{latitude:a,longitude:o}=l({latitude:"number",longitude:"number"}).assert(e);return`${a}, ${o}`}case"boundingbox":{const{x:a,y:o,width:i,height:c}=l({x:"number",y:"number",width:"number",height:"number"}).assert(e);return`Boîte de (${a}, ${o}) à (${a+i}, ${o+c})`}case"float":return Intl.NumberFormat("fr-FR").format(l("number").assert(e));default:return e.toString()}}function ye(t){let e=t.label;switch(t.type){case"location":e+=" (latitude, longitude)"}return e}function Oe(t,e,r){const n=a=>e===t&&(r===void 0||!(a(r)instanceof l.errors));switch(t){case"boolean":return n(l("boolean"));case"integer":case"float":return n(l("number"));case"enum":return n(l("string | number"));case"date":return n(l("Date"));case"location":return n(l({latitude:"number",longitude:"number"}));case"boundingbox":return n(l({x:"number",y:"number",w:"number",h:"number"}));case"string":return n(l("string"));default:throw new Error(`Type inconnu: ${t}`)}}const xe=Object.freeze(Object.defineProperty({__proto__:null,addValueLabels:de,deleteMetadataValue:$,isType:Oe,mergeMetadataFromImagesAndObservations:fe,mergeMetadataValues:E,metadataPrettyKey:ye,metadataPrettyValue:be,observationMetadata:ue,storeMetadataValue:ce},Symbol.toStringTag,{value:"Module"}));export{s as a,de as b,ye as c,$ as d,be as e,ie as f,fe as g,xe as h,Oe as i,E as m,ue as o,ce as s};
