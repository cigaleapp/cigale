import{t as c,a as b,S as y,_ as f}from"./DHljDGmi.js";async function D({subjectId:t,metadataId:e,type:a,value:n,confidence:r,alternatives:o,tx:i=void 0}){o??(o=[]),r??(r=1);const s={value:JSON.stringify(n),confidence:r,alternatives:Object.fromEntries(o.map(m=>[JSON.stringify(m.value),m.confidence]))};console.log(`Store metadata ${e} in ${t}`,s);const l=c.Metadata.state.find(m=>m.id===e);if(!l)throw new Error(`Métadonnée inconnue avec l'ID ${e}`);if(a&&l.type!==a)throw new Error(`Type de métadonnée incorrect: ${l.type} !== ${a}`);const g=i?await i.objectStore("Image").get(t):await c.Image.raw.get(t),w=i?await i.objectStore("Observation").get(t):await c.Observation.raw.get(t);if(g)g.metadata[e]=s,i?i.objectStore("Image").put(g):await c.Image.raw.set(g),f.Image[f.Image.findIndex(m=>m.id.toString()===t)].metadata[e]=y.MetadataValue.assert(s);else if(w)w.metadataOverrides[e]=s,i?i.objectStore("Observation").put(w):await c.Observation.raw.set(w),f.Observation[f.Observation.findIndex(m=>m.id.toString()===t)].metadataOverrides[e]=s;else throw new Error(`Aucune image ou observation avec l'ID ${t}`)}async function j({subjectId:t,metadataId:e,tx:a}){const n=a?await a.objectStore("Image").get(t):await c.Image.raw.get(t),r=a?await a.objectStore("Observation").get(t):await c.Observation.raw.get(t);if(!n&&!r)throw new Error(`Aucune image ou observation avec l'ID ${t}`);console.log(`Delete metadata ${e} in ${t}`),n?(delete n.metadata[e],a?a.objectStore("Image").put(n):await c.Image.raw.set(n),delete f.Image[f.Image.findIndex(o=>o.id.toString()===t)].metadata[e]):r&&(delete r.metadataOverrides[e],a?a.objectStore("Observation").put(r):await c.Observation.raw.set(r),delete f.Observation[f.Observation.findIndex(o=>o.id.toString()===t)].metadataOverrides[e])}async function F(t){const e=await c.Image.list().then(n=>n.filter(r=>t.images.includes(r.id)));return{...await M(e.map(n=>n.metadata)),...t.metadataOverrides}}function N(t){return Object.fromEntries(Object.entries(t).map(([e,a])=>{var r,o;const n=c.Metadata.state.find(i=>i.id===e);return n?n.type!=="enum"?[e,a]:[e,{...a,valueLabel:(o=(r=n.options)==null?void 0:r.find(i=>i.key===a.value.toString()))==null?void 0:o.label}]:[e,a]}))}async function _(t,e){var n,r;const a=c.Metadata.state.find(o=>o.id===t);if(!a)throw new Error(`Métadonnée inconnue avec l'ID ${t}`);if(a.type!=="enum")throw new Error(`Métadonnée ${t} n'est pas de type enum`);return(r=(n=a.options)==null?void 0:n.find(o=>o.key===e))==null?void 0:r.label}async function A(t,e){var n,r;const a=c.Metadata.state.find(o=>o.id===t);if(!a)throw new Error(`Métadonnée inconnue avec l'ID ${t}`);if(a.type!=="enum")throw new Error(`Métadonnée ${t} n'est pas de type enum`);return(r=(n=a.options)==null?void 0:n.find(o=>o.label===e))==null?void 0:r.key}async function M(t){const e={},a=new Set(t.flatMap(n=>Object.keys(n)));for(const n of a){const r=await c.Metadata.get(n);if(!r){console.warn(`Cannot merge metadata values for unknown key ${n}`);continue}const o=S(r,t.flatMap(i=>Object.entries(i).filter(([s])=>s===n).map(([,s])=>s)));o!==null&&(e[n]=o)}return e}function B(t,e){const a=O(e.map(i=>i.metadataOverrides)),n=O(t.map(i=>i.metadata)),r=new Set([...Object.keys(a),...Object.keys(n)]),o={};for(const i of r)o[i]=a[i]??n[i];return o}function O(t){const e={};let a=new Set(t.flatMap(n=>Object.keys(n)));for(const n of a){const r=t.map(s=>s[n]??{value:null,confidence:0,alternatives:{}});if(new Set(r.map(({value:s})=>JSON.stringify(s))).size>1||r.some(({value:s})=>s===null)){e[n]=void 0;continue}const i=[...new Set(r.flatMap(s=>Object.keys(s.alternatives)))];e[n]={value:r[0].value,confidence:u(r.map(s=>s.confidence)),alternatives:Object.fromEntries(i.map(s=>[s,u(r.map(l=>l.alternatives[s]??null).filter(l=>l!==null))]))}}return e}function S(t,e){const a=(n,r)=>Object.fromEntries(r.flatMap(o=>Object.keys(o.alternatives)).map(o=>[o,n(r.flatMap(i=>i.alternatives[o]??null).filter(Boolean))]));switch(t.mergeMethod){case"average":return{value:E(t.type,e.map(n=>n.value)),confidence:u(e.map(n=>n.confidence)),alternatives:a(u,e)};case"max":case"min":return{value:$(t.type,e,t.mergeMethod==="max"?p:v),confidence:p(e.map(n=>n.confidence)),alternatives:a(p,e)};case"median":return{value:k(t.type,e.map(n=>n.value)),confidence:d(e.map(n=>n.confidence)),alternatives:a(d,e)};case"none":return null}}const p=t=>Math.max(...t),v=t=>Math.min(...t);function $(t,e,a){const n=Math.max(...e.map(o=>o.confidence)),r=e.filter(o=>o.confidence===n);try{return a(r.map(o=>o.value))}catch(o){return console.error(o),r[0].value}}function u(t){return t.reduce((e,a)=>e+a,0)/t.length}function E(t,e){const a=n=>u(h(t,n));if(t==="boolean")return a(e)>.5;if(t==="integer")return Math.ceil(a(e));if(t==="float")return a(e);if(t==="date")return new Date(a(e));if(t==="location")return{latitude:u(e.map(n=>n.latitude)),longitude:u(e.map(n=>n.longitude))};throw new Error(`Impossible de fusionner en mode moyenne des valeurs de type ${t}`)}const d=t=>{const e=t.sort((n,r)=>n-r),a=Math.floor(e.length/2);return e.length%2===0?(e[a-1]+e[a])/2:e[a]};function k(t,e){const a=n=>d(h(t,n));if(t==="boolean")return a(e)>.5;if(t==="integer")return Math.ceil(a(e));if(t==="float")return a(e);if(t==="date")return new Date(a(e));if(t==="location")return{latitude:d(e.map(n=>n.latitude)),longitude:d(e.map(n=>n.longitude))};throw new Error(`Impossible de fusionner en mode médiane des valeurs de type ${t}`)}function h(t,e){if(t==="integer"||t==="float")return e;if(t==="boolean")return e.map(a=>a?1:0);if(t==="date")return e.map(a=>new Date(a).getTime());throw new Error(`Impossible de convertir des valeurs de type ${t} en nombre`)}function J(t,e){var a,n;switch(t.type){case"boolean":return e?"Oui":"Non";case"date":return e instanceof Date?Intl.DateTimeFormat("fr-FR").format(e):e.toString();case"enum":return((n=(a=t.options)==null?void 0:a.find(r=>r.key===e.toString()))==null?void 0:n.label)??e.toString();case"location":{const{latitude:r,longitude:o}=b({latitude:"number",longitude:"number"}).assert(e);return`${r}, ${o}`}case"boundingbox":{const{x:r,y:o,width:i,height:s}=b({x:"number",y:"number",width:"number",height:"number"}).assert(e);return`Boîte de (${r}, ${o}) à (${r+i}, ${o+s})`}case"float":return Intl.NumberFormat("fr-FR").format(b("number").assert(e));default:return e.toString()}}function K(t){let e=t.label;switch(t.type){case"location":e+=" (latitude, longitude)"}return e}export{N as addValueLabels,O as combineMetadataValues,B as combineMetadataValuesWithOverrides,j as deleteMetadataValue,A as keyOfEnumLabel,_ as labelOfEnumKey,M as mergeMetadataValues,K as metadataPrettyKey,J as metadataPrettyValue,F as observationMetadata,D as storeMetadataValue};
