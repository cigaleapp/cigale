const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./MYHm8PO_.js","./CY4eTrAl.js","./C5da3JO5.js","./_d1bhYXs.js","./DC6peMye.js","./BKFKyybL.js"])))=>i.map(i=>d[i]);
import{n as y,a as v}from"./B4fTvO1f.js";import{t as P}from"./C5da3JO5.js";import{s as j}from"./oOm2T-ds.js";import{r as E}from"./DTwrH9wU.js";import{_}from"./C1FmrZbK.js";import{S as u,d as f,B as l,Y as g,s as M,e as T}from"./MYHm8PO_.js";var A=y('<svg><path fill="currentColor" d="M240 136v64a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16v-64a16 16 0 0 1 16-16h40a8 8 0 0 1 0 16H32v64h192v-64h-40a8 8 0 0 1 0-16h40a16 16 0 0 1 16 16m-117.66-2.34a8 8 0 0 0 11.32 0l48-48a8 8 0 0 0-11.32-11.32L136 108.69V24a8 8 0 0 0-16 0v84.69L85.66 74.34a8 8 0 0 0-11.32 11.32ZM200 168a12 12 0 1 0-12 12a12 12 0 0 0 12-12"></path></svg>');function R(t,e){const o=E(e,["$$slots","$$events","$$legacy"]);var n=A();let a;P(()=>a=j(n,a,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...o})),v(t,n)}function O(t){return Object.keys(t)}function D(t){return Object.fromEntries(t)}function L(t){return`${window.location.origin}${t}/protocol.schema.json`}function S(t,e){return e in l?e:(e=e.replace(/^.+__/,""),`${t}__${e}`)}function U(t,e){return e.startsWith(`${t}__`)}const h=u.ProtocolWithoutMetadata.in.and({metadata:{"[string]":u.MetadataWithoutID.describe("Métadonnée du protocole"),...D(O(l).map(t=>{var e,o;return[`${t}?`,['"builtin"',"@",`Métadonnée "${(e=f.find(n=>n.id===t))==null?void 0:e.label}" prédéfinie dans l'application: ${(o=f.find(n=>n.id===t))==null?void 0:o.description}`]]}))}}).pipe(t=>({...t,metadata:Object.fromEntries(Object.entries(t.metadata).map(([e,o])=>[S(t.id,e),o]))}));async function W(t,e,o="json"){const{tables:n}=await _(async()=>{const{tables:i}=await import("./MYHm8PO_.js").then(r=>r.A);return{tables:i}},__vite__mapDeps([0,1,2,3,4,5]),import.meta.url),a=await n.Protocol.raw.get(e);if(!a)throw new Error(`Protocole ${e} introuvable`);w(t,o,{...a,metadata:await n.Metadata.list().then(i=>i.filter(r=>a==null?void 0:a.metadata.includes(r.id))).then(i=>Object.fromEntries(i.map(({id:r,...c})=>[r,r in l?"builtin":c])))})}async function V(t,e){w(t,e,{id:"mon-protocole",name:"Mon protocole",source:"https://github.com/moi/mon-protocole",authors:[{name:"Prénom Nom",email:"prenom.nom@example.com"}],metadata:{"une-metadonnee":{label:"Une métadonnée",description:"Description de la métadonnée",learnMore:"https://example.com",type:"float",required:!1,mergeMethod:"average"}}})}function w(t,e,o){let n=M(e,L(t),o,["id","name","source","authors","metadata"]);T(n,`${o.id}.${e}`,`application/${e}`)}async function H({allowMultiple:t}={}){const{openTransaction:e}=await _(async()=>{const{openTransaction:o}=await import("./MYHm8PO_.js").then(n=>n.A);return{openTransaction:o}},__vite__mapDeps([0,1,2,3,4,5]),import.meta.url);return new Promise((o,n)=>{const a=document.createElement("input");a.type="file",a.multiple=t??!1,a.accept=[".json",".yaml","application/json"].join(","),a.onchange=async()=>{if(!a.files||!a.files[0])return;const i=await Promise.all([...a.files].map(async r=>{const c=new FileReader;return new Promise(b=>{c.onload=async()=>{var m;try{if(!c.result)throw new Error("Fichier vide");if(c.result instanceof ArrayBuffer)throw new Error("Fichier binaire");const s=h.in.assert(g.parse(c.result));await e(["Protocol","Metadata"],{},p=>{p.objectStore("Protocol").put({...s,metadata:Object.keys(s.metadata)}),Object.entries(s.metadata).map(([$,d])=>typeof d=="string"||p.objectStore("Metadata").put({id:$,...d}))}),b(h.assert(s))}catch(s){n(`Protocole ${r.name} invalide: ${((m=s==null?void 0:s.toString())==null?void 0:m.replace(/^Traversal Error: /,""))??"Erreur inattendue"}`)}},c.readAsText(r)})}));o(t?i:i[0])},a.click()})}export{R as D,U as a,V as d,W as e,H as i,L as j};
