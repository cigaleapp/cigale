import{t as c,a as b,S as M,_ as f}from"./r93wQVNZ.js";async function D({subjectId:t,metadataId:e,type:a,value:n,confidence:r,alternatives:i,tx:s=void 0}){i??(i=[]),r??(r=1);const o={value:JSON.stringify(n),confidence:r,alternatives:Object.fromEntries(i.map(m=>[JSON.stringify(m.value),m.confidence]))};console.log(`Store metadata ${e} in ${t}`,o);const l=c.Metadata.state.find(m=>m.id===e);if(!l)throw new Error(`Métadonnée inconnue avec l'ID ${e}`);if(a&&l.type!==a)throw new Error(`Type de métadonnée incorrect: ${l.type} !== ${a}`);const u=s?await s.objectStore("Image").get(t):await c.Image.raw.get(t),g=s?await s.objectStore("Observation").get(t):await c.Observation.raw.get(t);if(u)console.log(`Store metadata ${e} in ${t}: found`,u),u.metadata[e]=o,s?s.objectStore("Image").put(u):await c.Image.raw.set(u),f.Image[f.Image.findIndex(m=>m.id.toString()===t)].metadata[e]=M.MetadataValue.assert(o);else if(g)console.log(`Store metadata ${e} in ${t}: found`,g),g.metadataOverrides[e]=o,s?s.objectStore("Observation").put(g):await c.Observation.raw.set(g),f.Observation[f.Observation.findIndex(m=>m.id.toString()===t)].metadataOverrides[e]=o;else throw new Error(`Aucune image ou observation avec l'ID ${t}`)}async function F({subjectId:t,metadataId:e,tx:a}){const n=a?await a.objectStore("Image").get(t):await c.Image.raw.get(t),r=a?await a.objectStore("Observation").get(t):await c.Observation.raw.get(t);if(!n&&!r)throw new Error(`Aucune image ou observation avec l'ID ${t}`);console.log(`Delete metadata ${e} in ${t}`),n?(delete n.metadata[e],a?a.objectStore("Image").put(n):await c.Image.raw.set(n),delete f.Image[f.Image.findIndex(i=>i.id.toString()===t)].metadata[e]):r&&(delete r.metadataOverrides[e],a?a.objectStore("Observation").put(r):await c.Observation.raw.set(r),delete f.Observation[f.Observation.findIndex(i=>i.id.toString()===t)].metadataOverrides[e])}async function N(t){const e=await c.Image.list().then(n=>n.filter(r=>t.images.includes(r.id)));return{...await h(e.map(n=>n.metadata)),...t.metadataOverrides}}function j(t){return Object.fromEntries(Object.entries(t).map(([e,a])=>{var r,i;const n=c.Metadata.state.find(s=>s.id===e);return n?n.type!=="enum"?[e,a]:[e,{...a,valueLabel:(i=(r=n.options)==null?void 0:r.find(s=>s.key===a.value.toString()))==null?void 0:i.label}]:[e,a]}))}function h(t){const e={},a=new Set(t.flatMap(n=>Object.keys(n)));for(const n of a){const r=c.Metadata.state.find(s=>s.id===n);if(!r){console.warn(`Cannot merge metadata values for unknown key ${n}`);continue}const i=y(r,t.flatMap(s=>Object.entries(s).filter(([o])=>o===n).map(([,o])=>o)));i!==null&&(e[n]=i)}return e}function _(t,e){const a=O(e.map(o=>o.metadataOverrides)),n=O(t.map(o=>o.metadata)),r=h(t.map(o=>o.metadata)),i=new Set([...Object.keys(a),...Object.keys(n)]),s={};for(const o of i)s[o]=a[o]??n[o]??r[o];return s}function O(t){const e={};let a=new Set(t.flatMap(n=>Object.keys(n)));for(const n of a){const r=t.map(o=>o[n]??{value:null,confidence:0,alternatives:{}});if(new Set(r.map(({value:o})=>JSON.stringify(o))).size>1||r.some(({value:o})=>o===null)){e[n]=void 0;continue}const s=[...new Set(r.flatMap(o=>Object.keys(o.alternatives)))];e[n]={value:r[0].value,confidence:d(r.map(o=>o.confidence)),alternatives:Object.fromEntries(s.map(o=>[o,d(r.map(l=>l.alternatives[o]??null).filter(l=>l!==null))]))}}return e}function y(t,e){const a=(n,r)=>Object.fromEntries(r.flatMap(i=>Object.keys(i.alternatives)).map(i=>[i,n(r.flatMap(s=>s.alternatives[i]??null).filter(Boolean))]));switch(t.mergeMethod){case"average":return{value:k(t.type,e.map(n=>n.value)),confidence:d(e.map(n=>n.confidence)),alternatives:a(d,e)};case"max":case"min":return{value:v(t.type,e,t.mergeMethod==="max"?p:$),confidence:p(e.map(n=>n.confidence)),alternatives:a(p,e)};case"median":return{value:V(t.type,e.map(n=>n.value)),confidence:w(e.map(n=>n.confidence)),alternatives:a(w,e)};case"none":return null}}const p=t=>Math.max(...t),$=t=>Math.min(...t);function v(t,e,a){const n=Math.max(...e.map(i=>i.confidence)),r=e.filter(i=>i.confidence===n);try{return a(r.map(i=>i.value))}catch(i){return console.error(i),r[0].value}}function d(t){return t.reduce((e,a)=>e+a,0)/t.length}function k(t,e){const a=n=>d(S(t,n));if(t==="boolean")return a(e)>.5;if(t==="integer")return Math.ceil(a(e));if(t==="float")return a(e);if(t==="date")return new Date(a(e));if(t==="location")return{latitude:d(e.map(n=>n.latitude)),longitude:d(e.map(n=>n.longitude))};throw new Error(`Impossible de fusionner en mode moyenne des valeurs de type ${t}`)}const w=t=>{const e=t.sort((n,r)=>n-r),a=Math.floor(e.length/2);return e.length%2===0?(e[a-1]+e[a])/2:e[a]};function V(t,e){const a=n=>w(S(t,n));if(t==="boolean")return a(e)>.5;if(t==="integer")return Math.ceil(a(e));if(t==="float")return a(e);if(t==="date")return new Date(a(e));if(t==="location")return{latitude:w(e.map(n=>n.latitude)),longitude:w(e.map(n=>n.longitude))};throw new Error(`Impossible de fusionner en mode médiane des valeurs de type ${t}`)}function S(t,e){if(t==="integer"||t==="float")return e;if(t==="boolean")return e.map(a=>a?1:0);if(t==="date")return e.map(a=>new Date(a).getTime());throw new Error(`Impossible de convertir des valeurs de type ${t} en nombre`)}function A(t,e){var a,n;switch(t.type){case"boolean":return e?"Oui":"Non";case"date":return e instanceof Date?Intl.DateTimeFormat("fr-FR").format(e):e.toString();case"enum":return((n=(a=t.options)==null?void 0:a.find(r=>r.key===e.toString()))==null?void 0:n.label)??e.toString();case"location":{const{latitude:r,longitude:i}=b({latitude:"number",longitude:"number"}).assert(e);return`${r}, ${i}`}case"boundingbox":{const{x:r,y:i,width:s,height:o}=b({x:"number",y:"number",width:"number",height:"number"}).assert(e);return`Boîte de (${r}, ${i}) à (${r+s}, ${i+o})`}case"float":return Intl.NumberFormat("fr-FR").format(b("number").assert(e));default:return e.toString()}}function B(t){let e=t.label;switch(t.type){case"location":e+=" (latitude, longitude)"}return e}export{j as a,B as b,A as c,F as d,_ as e,h as m,N as o,D as s};
