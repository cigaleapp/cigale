const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./F1c4m1q7.js","./je5hudcr.js","./nY1Pl_vl.js","./C1FmrZbK.js","./D8lQXoRC.js"])))=>i.map(i=>d[i]);
import{_ as f}from"./C1FmrZbK.js";import{S as d,f as b,k as w,B as p,a as l,Y as _,s as P,b as j}from"./F1c4m1q7.js";function E(e){return`${window.location.origin}${e}/protocol.schema.json`}function y(e,t){return t in l?t:(t=t.replace(/^.+__/,""),`${e}__${t}`)}function A(e,t){return t.startsWith(`${e}__`)}const u=d.ProtocolWithoutMetadata.in.and({metadata:{"[string]":d.MetadataWithoutID.describe("Métadonnée du protocole"),...b(w(l).map(e=>{var t,o;return[`${e}?`,['"builtin"',"@",`Métadonnée "${(t=p.find(a=>a.id===e))==null?void 0:t.label}" prédéfinie dans l'application: ${(o=p.find(a=>a.id===e))==null?void 0:o.description}`]]}))}}).pipe(e=>({...e,metadata:Object.fromEntries(Object.entries(e.metadata).map(([t,o])=>[y(e.id,t),o]))}));async function g(e,t,o="json"){const{tables:a}=await f(async()=>{const{tables:n}=await import("./F1c4m1q7.js").then(r=>r.V);return{tables:n}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),i=await a.Protocol.raw.get(t);if(!i)throw new Error(`Protocole ${t} introuvable`);h(e,o,{...i,metadata:await a.Metadata.list().then(n=>n.filter(r=>i==null?void 0:i.metadata.includes(r.id))).then(n=>Object.fromEntries(n.map(({id:r,...s})=>[r,r in l?"builtin":s])))})}async function O(e,t){h(e,t,{id:"mon-protocole",name:"Mon protocole",source:"https://github.com/moi/mon-protocole",authors:[{name:"Prénom Nom",email:"prenom.nom@example.com"}],metadata:{"une-metadonnee":{label:"Une métadonnée",description:"Description de la métadonnée",learnMore:"https://example.com",type:"float",required:!1,mergeMethod:"average"}}})}function h(e,t,o){let a=P(t,E(e),o,["id","name","source","authors","exports","metadata","inference"]);j(a,`${o.id}.${t}`,`application/${t}`)}async function D({allowMultiple:e}={}){return new Promise((t,o)=>{const a=document.createElement("input");a.type="file",a.multiple=e??!1,a.accept=[".json",".yaml","application/json"].join(","),a.onchange=async()=>{if(!a.files||!a.files[0])return;const i=await Promise.all([...a.files].map(async n=>{const r=new FileReader;return new Promise(s=>{r.onload=async()=>{if(!r.result)throw new Error("Fichier vide");if(r.result instanceof ArrayBuffer)throw new Error("Fichier binaire");T(r.result).then(s).catch(c=>{var m;return o(new Error(`Protocole invalide: ${((m=c==null?void 0:c.toString())==null?void 0:m.replace(/^Traversal Error: /,""))??"Erreur inattendue"}`))})},r.readAsText(n)})}));t(e?i:i[0])},a.click()})}async function T(e){const{openTransaction:t}=await f(async()=>{const{openTransaction:n}=await import("./F1c4m1q7.js").then(r=>r.V);return{openTransaction:n}},__vite__mapDeps([0,1,2,3,4]),import.meta.url);let o=_.parse(e);console.info(`Importing protocol ${o.id}`),console.info(o);const a=Object.entries(o.metadata??{}).filter(([,n])=>n==="builtin").map(([n])=>n);o.metadata=Object.fromEntries(Object.entries(o.metadata??{}).filter(([,n])=>n!=="builtin"));const i=u.in.assert(o);return await t(["Protocol","Metadata"],{},n=>{n.objectStore("Protocol").put({...i,metadata:[...Object.keys(i.metadata),...a]}),Object.entries(i.metadata).map(([r,s])=>typeof s=="string"||n.objectStore("Metadata").put({id:r,...s}))}),u.assert(i)}export{T as a,O as d,g as e,A as i,E as j,D as p};
